import type { MatchEventType, PickleballMatchState, TeamId } from './pickleball';

export const BLE_SERVICE_UUID = '0000FE50-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_SCORE_STATE_UUID = '0000FE51-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_ACK_SEQ_UUID = '0000FE52-0000-1000-8000-00805F9B34FB';
export const BLE_CHAR_CONFIG_UUID = '0000FE53-0000-1000-8000-00805F9B34FB';

const EVENT_TO_CODE: Record<MatchEventType, number> = {
  INIT: 0,
  POINT_A: 1,
  POINT_B: 2,
  NEXT_SERVER: 3,
  SIDE_OUT: 4,
  UNDO: 5,
  SET_WON: 6,
  MATCH_WON: 7,
};

const CODE_TO_EVENT: Record<number, MatchEventType> = {
  0: 'INIT',
  1: 'POINT_A',
  2: 'POINT_B',
  3: 'NEXT_SERVER',
  4: 'SIDE_OUT',
  5: 'UNDO',
  6: 'SET_WON',
  7: 'MATCH_WON',
};

export interface DecodedBlePacket {
  magic: number;
  version: number;
  isDoubles: boolean;
  isRallyScoring: boolean;
  seq: number;
  matchHash: number;
  scoreA: number;
  scoreB: number;
  servingTeam: TeamId;
  serverNumber: 1 | 2;
  serverSide: 'right' | 'left';
  isMatchOver: boolean;
  winner: TeamId | null;
  setsWonA: number;
  setsWonB: number;
  eventType: MatchEventType;
  crc8: number;
  crcValid: boolean;
}

export interface QueuedBleFrame {
  seq: number;
  timestamp: number;
  bytes: Uint8Array;
  hex: string;
  eventType: MatchEventType;
  summary: string;
  status: 'queued' | 'transmitted' | 'acked';
}

export function hashMatchId(matchId: string): number {
  let hash = 0x811c;
  for (let i = 0; i < matchId.length; i++) {
    hash ^= matchId.charCodeAt(i);
    hash = (hash * 0x0101) & 0xffff;
  }
  return hash;
}

export function computeCrc8(bytes: Uint8Array, length: number): number {
  let crc = 0x00;
  for (let i = 0; i < length; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x80) !== 0) {
        crc = ((crc << 1) ^ 0x07) & 0xff;
      } else {
        crc = (crc << 1) & 0xff;
      }
    }
  }
  return crc;
}

export function encodeStatePacket(
  state: PickleballMatchState,
  eventType: MatchEventType
): Uint8Array {
  const buf = new Uint8Array(12);
  const matchHash = hashMatchId(state.config.matchId);

  buf[0] = 0x50; // 'P' for Pickleball Ultra
  buf[1] =
    0x10 |
    (state.config.format === 'doubles' ? 0x01 : 0x00) |
    (state.config.scoringRule === 'rally' ? 0x02 : 0x00);

  buf[2] = (state.seq >> 8) & 0xff;
  buf[3] = state.seq & 0xff;

  buf[4] = (matchHash >> 8) & 0xff;
  buf[5] = matchHash & 0xff;

  buf[6] = Math.min(255, state.scoreA);
  buf[7] = Math.min(255, state.scoreB);

  const winnerBits = state.winner === 'A' ? 1 : state.winner === 'B' ? 2 : 0;
  buf[8] =
    (state.servingTeam === 'B' ? 0x01 : 0x00) |
    (state.serverNumber === 2 ? 0x02 : 0x00) |
    (state.serverSide === 'left' ? 0x04 : 0x00) |
    (state.isMatchOver ? 0x08 : 0x00) |
    ((winnerBits & 0x03) << 4);

  buf[9] = ((state.setsWonA & 0x0f) << 4) | (state.setsWonB & 0x0f);
  buf[10] = EVENT_TO_CODE[eventType] ?? 0;
  buf[11] = computeCrc8(buf, 11);

  return buf;
}

export function decodeStatePacket(buf: Uint8Array): DecodedBlePacket {
  if (buf.length !== 12) {
    throw new Error(`Invalid packet length: expected 12 bytes, got ${buf.length}`);
  }

  const expectedCrc = computeCrc8(buf, 11);
  const winnerCode = (buf[8] >> 4) & 0x03;

  return {
    magic: buf[0],
    version: (buf[1] >> 4) & 0x0f,
    isDoubles: (buf[1] & 0x01) !== 0,
    isRallyScoring: (buf[1] & 0x02) !== 0,
    seq: (buf[2] << 8) | buf[3],
    matchHash: (buf[4] << 8) | buf[5],
    scoreA: buf[6],
    scoreB: buf[7],
    servingTeam: (buf[8] & 0x01) !== 0 ? 'B' : 'A',
    serverNumber: (buf[8] & 0x02) !== 0 ? 2 : 1,
    serverSide: (buf[8] & 0x04) !== 0 ? 'left' : 'right',
    isMatchOver: (buf[8] & 0x08) !== 0,
    winner: winnerCode === 1 ? 'A' : winnerCode === 2 ? 'B' : null,
    setsWonA: (buf[9] >> 4) & 0x0f,
    setsWonB: buf[9] & 0x0f,
    eventType: CODE_TO_EVENT[buf[10]] ?? 'INIT',
    crc8: buf[11],
    crcValid: buf[0] === 0x50 && buf[11] === expectedCrc,
  };
}

export function formatHexBytes(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

export function buildQueuedFrame(
  state: PickleballMatchState,
  eventType: MatchEventType,
  connected: boolean,
  now = Date.now()
): QueuedBleFrame {
  const bytes = encodeStatePacket(state, eventType);
  return {
    seq: state.seq,
    timestamp: now,
    bytes,
    hex: formatHexBytes(bytes),
    eventType,
    summary: `${state.scoreA}-${state.scoreB} (S${state.serverNumber} · Eq ${state.servingTeam})`,
    status: connected ? 'acked' : 'queued',
  };
}

export function flushOutboxFrames(frames: QueuedBleFrame[]): {
  flushedCount: number;
  updatedFrames: QueuedBleFrame[];
} {
  let flushedCount = 0;
  const updatedFrames = frames.map((frame) => {
    if (frame.status === 'queued') {
      flushedCount += 1;
      return { ...frame, status: 'acked' as const };
    }
    return frame;
  });
  return { flushedCount, updatedFrames };
}
