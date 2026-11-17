import React, { useState } from 'react';
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  CheckCircle2,
  RefreshCw,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import {
  BLE_CHAR_SCORE_STATE_UUID,
  BLE_SERVICE_UUID,
  decodeStatePacket,
  type QueuedBleFrame,
} from '../engine/bleProtocol';
import type { PickleballMatchState } from '../engine/pickleball';

interface SmartphoneCompanionProps {
  phoneSyncedState: PickleballMatchState;
  watchState: PickleballMatchState;
  bleConnected: boolean;
  isFlushing: boolean;
  frames: QueuedBleFrame[];
  onToggleBle: () => void;
  onSaveMatch: () => void;
  matchSaved: boolean;
}

export const SmartphoneCompanion: React.FC<SmartphoneCompanionProps> = ({
  phoneSyncedState,
  watchState,
  bleConnected,
  isFlushing,
  frames,
  onToggleBle,
  onSaveMatch,
  matchSaved,
}) => {
  const [webBleNotice, setWebBleNotice] = useState<string | null>(null);

  const pendingFrames = frames.filter((f) => f.status === 'queued');
  const latestFrame = frames[0] ?? null;
  const decodedLatest = latestFrame ? decodeStatePacket(latestFrame.bytes) : null;
  const isOutOfSync =
    phoneSyncedState.scoreA !== watchState.scoreA ||
    phoneSyncedState.scoreB !== watchState.scoreB ||
    phoneSyncedState.servingTeam !== watchState.servingTeam ||
    phoneSyncedState.serverNumber !== watchState.serverNumber;

  const handleRealWebBluetoothScan = async () => {
    const nav = navigator as Navigator & {
      bluetooth?: {
        requestDevice: (opts: {
          filters: Array<{ services: string[] }>;
          optionalServices?: string[];
        }) => Promise<{ name?: string; gatt?: { connect: () => Promise<unknown> } }>;
      };
    };

    if (!nav.bluetooth) {
      setWebBleNotice(
        'Este navegador no expone la API Web Bluetooth (usa Chrome en Android/Desktop con HTTPS para escanear un reloj físico real).'
      );
      return;
    }

    try {
      setWebBleNotice('Buscando Galaxy Watch Ultra con servicio GATT 0xFE50...');
      const device = await nav.bluetooth.requestDevice({
        filters: [{ services: [BLE_SERVICE_UUID.toLowerCase()] }],
        optionalServices: [BLE_CHAR_SCORE_STATE_UUID.toLowerCase()],
      });
      setWebBleNotice(`Dispositivo encontrado: ${device.name || 'Galaxy Watch Ultra'}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Escaneo cancelado por el usuario.';
      setWebBleNotice(`Escaneo Web Bluetooth finalizado: ${msg}`);
    }
  };

  return (
    <section
      aria-label="Smartphone Companion y Sincronización Bluetooth"
      className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      {/* Header & Bluetooth Link Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800">
            <Smartphone className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Smartphone Companion · Android
            </h2>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
              <span
                data-testid="ble-status-label"
                className={`inline-flex items-center gap-1.5 font-medium ${
                  bleConnected ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {bleConnected ? (
                  <BluetoothConnected className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <BluetoothOff className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {isFlushing
                  ? 'Sincronizando cola pendiente...'
                  : bleConnected
                    ? 'Bluetooth GATT Conectado'
                    : 'Bluetooth Desconectado (Modo Offline)'}
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span
                data-testid="outbox-pending-count"
                className="text-slate-500 tabular-nums"
              >
                {pendingFrames.length} paquetes en cola Outbox
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="toggle-ble-btn"
            onClick={onToggleBle}
            className={`inline-flex min-h-[40px] items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              bleConnected
                ? 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {bleConnected ? (
              <>
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Simular desconexión BLE</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reconectar BLE y sincronizar</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleRealWebBluetoothScan}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <Bluetooth className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Vincular hardware</span>
          </button>
        </div>
      </div>

      {webBleNotice && (
        <div
          role="status"
          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700"
        >
          <span>{webBleNotice}</span>
          <button
            type="button"
            onClick={() => setWebBleNotice(null)}
            className="font-medium text-slate-500 hover:text-slate-900"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Desync Warning Banner when Watch is ahead */}
      {isOutOfSync && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900"
        >
          <span>
            El reloj tiene puntos nuevos almacenados localmente ({watchState.scoreA}-{watchState.scoreB}).
            Reconecta Bluetooth para volcar la cola Outbox al teléfono.
          </span>
        </div>
      )}

      {/* Live Synced Scoreboard + Court Map */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Synced Phone Scoreboard */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-5 lg:col-span-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Marcador recibido en móvil</span>
            <span className="tabular-nums">
              Meta {phoneSyncedState.config.targetPoints} pts ·{' '}
              {phoneSyncedState.config.scoringRule === 'traditional'
                ? 'Side-Out'
                : 'Rally'}
            </span>
          </div>

          <div className="my-5 grid grid-cols-3 items-center text-center">
            <div>
              <div className="text-xs font-semibold text-slate-700 truncate">
                {phoneSyncedState.config.teamAName}
              </div>
              <div
                data-testid="phone-score-a"
                className="font-display text-5xl font-bold text-slate-950 tabular-nums mt-1"
              >
                {phoneSyncedState.scoreA}
              </div>
              <div className="mt-1 text-[11px] font-medium text-orange-600 h-4">
                {phoneSyncedState.servingTeam === 'A'
                  ? `Saca #${phoneSyncedState.serverNumber}`
                  : ''}
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-slate-400">SETS</span>
              <span className="font-display text-xl font-bold text-slate-700 tabular-nums mt-1">
                {phoneSyncedState.setsWonA} : {phoneSyncedState.setsWonB}
              </span>
              <span className="mt-1 text-[11px] text-slate-500 tabular-nums">
                Rallies: {phoneSyncedState.ralliesPlayed}
              </span>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-700 truncate">
                {phoneSyncedState.config.teamBName}
              </div>
              <div
                data-testid="phone-score-b"
                className="font-display text-5xl font-bold text-slate-950 tabular-nums mt-1"
              >
                {phoneSyncedState.scoreB}
              </div>
              <div className="mt-1 text-[11px] font-medium text-sky-600 h-4">
                {phoneSyncedState.servingTeam === 'B'
                  ? `Saca #${phoneSyncedState.serverNumber}`
                  : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs">
            <span className="text-slate-500 tabular-nums">
              Último seq sincronizado: #{phoneSyncedState.seq}
            </span>
            {phoneSyncedState.isMatchOver && (
              <button
                type="button"
                onClick={onSaveMatch}
                disabled={matchSaved}
                className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-60"
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{matchSaved ? 'Guardado en historial' : 'Guardar resultado'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Pickleball Court Position Diagram */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-5 lg:col-span-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <span>Posición de saque en cancha</span>
            <span className="font-medium text-slate-700">
              {phoneSyncedState.servingTeam === 'A'
                ? phoneSyncedState.config.teamAName
                : phoneSyncedState.config.teamBName}{' '}
              ({phoneSyncedState.serverSide === 'right' ? 'Derecha' : 'Izquierda'})
            </span>
          </div>

          <PickleballCourtSvg
            servingTeam={phoneSyncedState.servingTeam}
            serverSide={phoneSyncedState.serverSide}
            teamAName={phoneSyncedState.config.teamAName}
            teamBName={phoneSyncedState.config.teamBName}
          />
        </div>
      </div>

      {/* Bottom Split: BLE Binary Packet Inspector + Live Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Binary GATT Frame Inspector */}
        <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 text-slate-100 lg:col-span-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Última trama GATT (12 bytes · 0xFE51)</span>
            <span className="font-mono text-emerald-400">
              {decodedLatest?.crcValid ? 'CRC-8 OK' : 'CRC-8'}
            </span>
          </div>

          <div
            data-testid="ble-hex-frame"
            className="mt-3 rounded-lg bg-slate-900 px-3 py-2.5 font-mono text-[11px] tracking-normal text-orange-300 tabular-nums whitespace-nowrap overflow-x-auto"
          >
            {latestFrame ? latestFrame.hex : '50 11 00 01 00 00 00 00 02 00 00 00'}
          </div>

          {decodedLatest && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 tabular-nums">
              <span>
                <span className="text-slate-500">Seq:</span> #{decodedLatest.seq}
              </span>
              <span>
                <span className="text-slate-500">Marcador:</span> {decodedLatest.scoreA}-
                {decodedLatest.scoreB}
              </span>
              <span className="whitespace-nowrap">
                <span className="text-slate-500">Evento:</span> {decodedLatest.eventType}
              </span>
            </div>
          )}

          {/* Outbox / Packet Log */}
          <div className="mt-3 max-h-28 overflow-y-auto border-t border-slate-800 pt-2 space-y-1">
            {frames.slice(0, 5).map((frame) => (
              <div
                key={frame.seq}
                className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums"
              >
                <span className="text-slate-400 truncate">
                  #{frame.seq} · {frame.summary}
                </span>
                <span
                  className={
                    frame.status === 'acked' ? 'text-emerald-400' : 'text-amber-400'
                  }
                >
                  {frame.status === 'acked' ? 'ACK' : 'EN COLA'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Point-by-Point Synced Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Línea de tiempo sincronizada</span>
            <span className="tabular-nums">{phoneSyncedState.timeline.length} eventos</span>
          </div>
          <ul className="max-h-44 divide-y divide-slate-100 overflow-y-auto pr-1">
            {phoneSyncedState.timeline.slice(0, 12).map((entry) => (
              <li
                key={entry.seq}
                className="flex items-center justify-between gap-3 py-2 text-xs"
              >
                <span className="text-slate-700 truncate">{entry.description}</span>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
                  {entry.scoreA}-{entry.scoreB}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

interface PickleballCourtSvgProps {
  servingTeam: 'A' | 'B';
  serverSide: 'right' | 'left';
  teamAName: string;
  teamBName: string;
}

const PickleballCourtSvg: React.FC<PickleballCourtSvgProps> = ({
  servingTeam,
  serverSide,
  teamAName,
  teamBName,
}) => {
  const highlightABottom = servingTeam === 'A' && serverSide === 'right';
  const highlightATop = servingTeam === 'A' && serverSide === 'left';
  const highlightBTop = servingTeam === 'B' && serverSide === 'right';
  const highlightBBottom = servingTeam === 'B' && serverSide === 'left';

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 320 156"
        className="w-full max-w-[320px] rounded-lg border border-slate-200 bg-[#1B4332]"
        role="img"
        aria-label="Diagrama de cancha de Pickleball mostrando el cuadro de saque activo"
      >
        <rect x="12" y="10" width="296" height="136" fill="#2D6A4F" stroke="#FFFFFF" strokeWidth="2" />

        <rect
          x="12"
          y="10"
          width="98"
          height="68"
          fill={highlightATop ? '#EA580C' : 'transparent'}
          fillOpacity={highlightATop ? 0.55 : 0}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <rect
          x="12"
          y="78"
          width="98"
          height="68"
          fill={highlightABottom ? '#EA580C' : 'transparent'}
          fillOpacity={highlightABottom ? 0.55 : 0}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        <rect x="110" y="10" width="100" height="136" fill="#1B4332" stroke="#FFFFFF" strokeWidth="1.5" />

        <rect
          x="210"
          y="10"
          width="98"
          height="68"
          fill={highlightBTop ? '#0284C7' : 'transparent'}
          fillOpacity={highlightBTop ? 0.55 : 0}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <rect
          x="210"
          y="78"
          width="98"
          height="68"
          fill={highlightBBottom ? '#0284C7' : 'transparent'}
          fillOpacity={highlightBBottom ? 0.55 : 0}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />

        <line x1="160" y1="6" x2="160" y2="150" stroke="#F8FAFC" strokeWidth="3" strokeDasharray="4 2" />

        {highlightATop && <circle cx="61" cy="44" r="7" fill="#FACC15" stroke="#0F172A" strokeWidth="1.5" />}
        {highlightABottom && <circle cx="61" cy="112" r="7" fill="#FACC15" stroke="#0F172A" strokeWidth="1.5" />}
        {highlightBTop && <circle cx="259" cy="44" r="7" fill="#FACC15" stroke="#0F172A" strokeWidth="1.5" />}
        {highlightBBottom && <circle cx="259" cy="112" r="7" fill="#FACC15" stroke="#0F172A" strokeWidth="1.5" />}
      </svg>
      <div className="mt-2 flex w-full max-w-[320px] items-center justify-between text-[11px] font-medium text-slate-600">
        <span className="truncate max-w-[45%]">{teamAName}</span>
        <span className="truncate max-w-[45%] text-right">{teamBName}</span>
      </div>
    </div>
  );
};
