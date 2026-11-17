import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialMatchState,
  formatWatchCallout,
  recordServeFault,
  recordTeamRallyWin,
  undoLastAction,
  type MatchConfig,
} from './pickleball';
import {
  buildQueuedFrame,
  decodeStatePacket,
  encodeStatePacket,
  flushOutboxFrames,
} from './bleProtocol';

const doublesConfig: MatchConfig = {
  matchId: 'match-ultra-001',
  teamAName: 'Nosotros',
  teamBName: 'Rivales',
  format: 'doubles',
  scoringRule: 'traditional',
  targetPoints: 11,
  bestOfSets: 1,
  quickButtonAction: 'point_my_team',
};

const singlesConfig: MatchConfig = {
  ...doublesConfig,
  matchId: 'match-singles-001',
  format: 'singles',
};

test('doubles game starts at 0-0-2 on right court', () => {
  const state = createInitialMatchState(doublesConfig, 1000);
  assert.equal(formatWatchCallout(state), '0 - 0 - 2');
  assert.equal(state.servingTeam, 'A');
  assert.equal(state.serverNumber, 2);
  assert.equal(state.serverSide, 'right');
});

test('traditional doubles scoring increments and toggles court side', () => {
  let state = createInitialMatchState(doublesConfig, 1000);
  state = recordTeamRallyWin(state, 'A', 2000);
  assert.equal(state.scoreA, 1);
  assert.equal(state.scoreB, 0);
  assert.equal(state.serverSide, 'left');
  assert.equal(formatWatchCallout(state), '1 - 0 - 2');

  // Receiving team B wins rally -> since Team A was on server 2, immediate side-out to Team B Server 1
  state = recordTeamRallyWin(state, 'B', 3000);
  assert.equal(state.scoreA, 1);
  assert.equal(state.scoreB, 0);
  assert.equal(state.servingTeam, 'B');
  assert.equal(state.serverNumber, 1);
  assert.equal(state.serverSide, 'right');
  assert.equal(formatWatchCallout(state), '0 - 1 - 1');

  // Team B Server 1 faults -> Team B Server 2 on left side
  state = recordServeFault(state, 4000);
  assert.equal(state.servingTeam, 'B');
  assert.equal(state.serverNumber, 2);
  assert.equal(state.serverSide, 'left');
  assert.equal(formatWatchCallout(state), '0 - 1 - 2');
});

test('win by 2 rule prevents winning at 11-10 and awards match at 12-10', () => {
  let state = createInitialMatchState(doublesConfig, 1000);
  for (let i = 0; i < 10; i++) {
    state = recordTeamRallyWin(state, 'A', 1000 + i * 100);
  }
  state = recordServeFault(state, 2500); // side-out to B
  for (let i = 0; i < 10; i++) {
    state = recordTeamRallyWin(state, 'B', 3000 + i * 100);
  }
  // Now 10-10, B serving
  state = recordTeamRallyWin(state, 'B', 4500); // 10-11
  assert.equal(state.isMatchOver, false);

  state = recordTeamRallyWin(state, 'B', 5000); // 10-12
  assert.equal(state.isMatchOver, true);
  assert.equal(state.winner, 'B');
});

test('undo restores exact previous score, serving team, and court side', () => {
  let state = createInitialMatchState(doublesConfig, 1000);
  state = recordTeamRallyWin(state, 'A', 2000);
  state = recordServeFault(state, 3000); // side out to B
  assert.equal(state.servingTeam, 'B');
  assert.equal(state.scoreA, 1);

  state = undoLastAction(state, 4000);
  assert.equal(state.servingTeam, 'A');
  assert.equal(state.serverNumber, 2);
  assert.equal(state.scoreA, 1);
  assert.equal(state.serverSide, 'left');

  state = undoLastAction(state, 5000);
  assert.equal(state.scoreA, 0);
  assert.equal(state.serverSide, 'right');
});

test('singles court side follows even=right and odd=left rule', () => {
  let state = createInitialMatchState(singlesConfig, 1000);
  assert.equal(state.serverSide, 'right');
  state = recordTeamRallyWin(state, 'A', 2000); // 1-0
  assert.equal(state.serverSide, 'left');
  state = recordTeamRallyWin(state, 'A', 3000); // 2-0
  assert.equal(state.serverSide, 'right');
});

test('BLE 12-byte binary protocol roundtrips state and detects CRC corruption', () => {
  let state = createInitialMatchState(doublesConfig, 1000);
  state = recordTeamRallyWin(state, 'A', 2000);
  state = recordTeamRallyWin(state, 'A', 3000);

  const bytes = encodeStatePacket(state, 'POINT_A');
  assert.equal(bytes.length, 12);

  const decoded = decodeStatePacket(bytes);
  assert.equal(decoded.crcValid, true);
  assert.equal(decoded.scoreA, 2);
  assert.equal(decoded.scoreB, 0);
  assert.equal(decoded.servingTeam, 'A');
  assert.equal(decoded.serverNumber, 2);
  assert.equal(decoded.isDoubles, true);
  assert.equal(decoded.eventType, 'POINT_A');

  // Corrupt a payload byte
  const corrupted = new Uint8Array(bytes);
  corrupted[6] = 99;
  const badDecoded = decodeStatePacket(corrupted);
  assert.equal(badDecoded.crcValid, false);
});

test('offline BLE outbox queues packets when disconnected and flushes on reconnect', () => {
  let state = createInitialMatchState(doublesConfig, 1000);
  state = recordTeamRallyWin(state, 'A', 2000);
  const f1 = buildQueuedFrame(state, 'POINT_A', false, 2000);
  state = recordTeamRallyWin(state, 'A', 3000);
  const f2 = buildQueuedFrame(state, 'POINT_A', false, 3000);

  assert.equal(f1.status, 'queued');
  assert.equal(f2.status, 'queued');

  const { flushedCount, updatedFrames } = flushOutboxFrames([f1, f2]);
  assert.equal(flushedCount, 2);
  assert.equal(updatedFrames.every((f) => f.status === 'acked'), true);
});
