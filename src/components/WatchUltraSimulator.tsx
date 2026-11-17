import React, { useEffect, useState } from 'react';
import { Lock, RotateCcw, Unlock, SunDim, Bluetooth, BluetoothOff } from 'lucide-react';
import {
  formatWatchCallout,
  type PickleballMatchState,
  type TeamId,
} from '../engine/pickleball';

interface WatchUltraSimulatorProps {
  matchState: PickleballMatchState;
  bleConnected: boolean;
  pendingOutboxCount: number;
  hapticPulseTick: number;
  lastHapticLabel: string;
  onScoreTeam: (team: TeamId) => void;
  onServeFault: () => void;
  onUndo: () => void;
  onQuickButton: () => void;
  onSaveMatch: () => void;
  onRematch: () => void;
  matchSaved: boolean;
}

export const WatchUltraSimulator: React.FC<WatchUltraSimulatorProps> = ({
  matchState,
  bleConnected,
  pendingOutboxCount,
  hapticPulseTick,
  lastHapticLabel,
  onScoreTeam,
  onServeFault,
  onUndo,
  onQuickButton,
  onSaveMatch,
  onRematch,
  matchSaved,
}) => {
  const [sweatLock, setSweatLock] = useState(false);
  const [ambientMode, setAmbientMode] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    if (hapticPulseTick === 0) return;
    setPulseActive(true);
    const timer = window.setTimeout(() => setPulseActive(false), 260);
    return () => window.clearTimeout(timer);
  }, [hapticPulseTick]);

  const callout = formatWatchCallout(matchState);
  const quickActionTitle =
    matchState.config.quickButtonAction === 'point_my_team'
      ? '+1 Nosotros'
      : matchState.config.quickButtonAction === 'undo'
        ? 'Deshacer'
        : 'Falta / Saque';

  return (
    <section
      aria-label="Simulador Samsung Galaxy Watch Ultra"
      className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <div className="mb-6 flex w-full flex-col gap-3 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-slate-900 whitespace-nowrap">
            Galaxy Watch Ultra · 47mm
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAmbientMode((prev) => !prev)}
              aria-pressed={ambientMode}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                ambientMode
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <SunDim className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{ambientMode ? 'AOD Activo' : 'Modo AOD'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSweatLock((prev) => !prev)}
              aria-pressed={sweatLock}
              className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                sweatLock
                  ? 'border-orange-600 bg-orange-50 text-orange-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {sweatLock ? (
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{sweatLock ? 'Bloqueada' : 'Bloqueo sudor'}</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Wear OS 5 · Pantalla AMOLED 480×480px · Botón Rápido activo
        </p>
      </div>

      {/* Watch Hardware Frame */}
      <div className="flex h-[320px] w-full items-center justify-center sm:h-[390px]">
      <div className="relative my-2 flex origin-center scale-[0.80] items-center justify-center sm:scale-100">
        {/* Subtle haptic visual ripple */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-3 rounded-[58px] border-2 border-orange-500/60 transition-all duration-200 ${
            pulseActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        />

        {/* Titanium Cushion Case */}
        <div className="relative flex h-[376px] w-[364px] items-center justify-center rounded-[52px] border border-slate-700 bg-gradient-to-b from-[#3A3F47] via-[#262A30] to-[#1A1D22] p-4 shadow-xl">
          {/* Top & Bottom Lug Hints */}
          <div
            aria-hidden="true"
            className="absolute -top-3 left-1/2 h-3.5 w-36 -translate-x-1/2 rounded-t-xl bg-[#262A30]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-3 left-1/2 h-3.5 w-36 -translate-x-1/2 rounded-b-xl bg-[#1A1D22]"
          />

          {/* Right Side Physical Buttons */}
          {/* Top Home Button -> Toggles AOD */}
          <button
            type="button"
            onClick={() => setAmbientMode((prev) => !prev)}
            aria-label="Botón superior reloj: alternar modo Always-On Display"
            title="Botón superior: Alternar modo AOD"
            className="absolute -right-2.5 top-20 h-11 w-3 rounded-r-md border border-slate-600 bg-slate-400 transition-transform hover:bg-slate-300 active:translate-x-[-1px]"
          />

          {/* Signature Marine Orange Quick Button */}
          <button
            type="button"
            onClick={() => {
              if (!sweatLock) onQuickButton();
            }}
            disabled={sweatLock}
            aria-label={`Botón Rápido Naranja: ${quickActionTitle}`}
            title={`Botón Rápido Naranja (${quickActionTitle})`}
            className="group absolute -right-3.5 top-1/2 flex h-16 w-4 -translate-y-1/2 items-center justify-center rounded-r-lg border border-orange-700 bg-[#FF5A1F] shadow-sm transition-all hover:bg-[#FF6B35] active:translate-x-[-2px] disabled:opacity-45"
          >
            <span className="h-8 w-0.5 rounded-full bg-orange-950/35" />
          </button>

          {/* Bottom Back Button -> Undo */}
          <button
            type="button"
            onClick={() => {
              if (!sweatLock) onUndo();
            }}
            disabled={sweatLock || matchState.historyStack.length === 0}
            aria-label="Botón inferior reloj: deshacer última acción"
            title="Botón inferior: Deshacer"
            className="absolute -right-2.5 bottom-20 h-11 w-3 rounded-r-md border border-slate-600 bg-slate-400 transition-transform hover:bg-slate-300 active:translate-x-[-1px] disabled:opacity-45"
          />

          {/* Circular Bezel & Tick Ring */}
          <div className="relative flex h-[328px] w-[328px] items-center justify-center rounded-full border-4 border-[#111317] bg-[#0B0D10] p-2 shadow-inner">
            {/* Cardinal bezel markers */}
            <span aria-hidden="true" className="absolute top-1.5 left-1/2 h-1.5 w-0.5 -translate-x-1/2 bg-orange-500/80" />
            <span aria-hidden="true" className="absolute bottom-1.5 left-1/2 h-1.5 w-0.5 -translate-x-1/2 bg-slate-600" />
            <span aria-hidden="true" className="absolute left-1.5 top-1/2 h-0.5 w-1.5 -translate-y-1/2 bg-slate-600" />
            <span aria-hidden="true" className="absolute right-1.5 top-1/2 h-0.5 w-1.5 -translate-y-1/2 bg-slate-600" />

            {/* AMOLED Circular Screen */}
            <div
              data-testid="watch-amoled-screen"
              className={`relative flex h-full w-full flex-col items-center justify-between overflow-hidden rounded-full px-5 py-4 text-white transition-opacity duration-200 ${
                ambientMode ? 'bg-black opacity-75' : 'bg-[#090B0E]'
              }`}
            >
              {/* Top Status Row on Watch */}
              <div className="flex flex-col items-center text-center pt-1">
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                  {bleConnected ? (
                    <Bluetooth className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <BluetoothOff className="h-3 w-3 text-amber-400" aria-hidden="true" />
                  )}
                  <span className={bleConnected ? 'text-emerald-400' : 'text-amber-400'}>
                    {bleConnected
                      ? 'BLE Sincronizado'
                      : `Cola Offline (${pendingOutboxCount})`}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400 tabular-nums">
                  Set {matchState.currentSet} de {matchState.config.bestOfSets} ·{' '}
                  {matchState.config.format === 'doubles' ? 'Dobles' : 'Individuales'}
                </div>
              </div>

              {/* Official Callout Pill-Free Header */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-medium text-slate-400">
                  Canto oficial · Lado {matchState.serverSide === 'right' ? 'Derecho' : 'Izquierdo'}
                </span>
                <div
                  data-testid="watch-callout"
                  className="font-display text-2xl font-bold tracking-tight text-white tabular-nums"
                >
                  {callout}
                </div>
              </div>

              {/* Match Over State OR Live Score Quadrants */}
              {matchState.isMatchOver ? (
                <div className="flex w-full flex-col items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-950/50 px-3 py-3 text-center">
                  <div className="text-xs font-semibold text-emerald-300">
                    Victoria ·{' '}
                    {matchState.winner === 'A'
                      ? matchState.config.teamAName
                      : matchState.config.teamBName}
                  </div>
                  <div className="font-display text-2xl font-bold tabular-nums text-white">
                    {matchState.scoreA} - {matchState.scoreB}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onSaveMatch}
                      disabled={matchSaved}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {matchSaved ? 'Guardado' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={onRematch}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-700"
                    >
                      Revancha
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid w-full grid-cols-2 gap-2.5 px-1">
                  {/* Team A Tap Button */}
                  <button
                    type="button"
                    data-testid="watch-score-team-a"
                    onClick={() => onScoreTeam('A')}
                    disabled={sweatLock}
                    aria-label={`Sumar jugada para ${matchState.config.teamAName}, marcador actual ${matchState.scoreA}`}
                    className={`group relative flex min-h-[96px] flex-col items-center justify-center rounded-2xl border p-2 transition-all active:scale-[0.96] disabled:opacity-50 ${
                      matchState.servingTeam === 'A'
                        ? 'border-orange-500/70 bg-orange-500/15'
                        : 'border-slate-700/80 bg-slate-800/60 hover:bg-slate-800'
                    }`}
                  >
                    <span className="max-w-full truncate text-[11px] font-medium text-slate-300">
                      {matchState.config.teamAName}
                    </span>
                    <span
                      data-testid="watch-score-a"
                      className="font-display text-4xl font-extrabold leading-none text-white tabular-nums mt-1"
                    >
                      {matchState.scoreA}
                    </span>
                    <span className="mt-1.5 text-[10px] font-medium text-orange-400">
                      {matchState.servingTeam === 'A'
                        ? `Saca #${matchState.serverNumber}`
                        : matchState.config.scoringRule === 'traditional'
                          ? 'Falta rival'
                          : '+1 y saque'}
                    </span>
                  </button>

                  {/* Team B Tap Button */}
                  <button
                    type="button"
                    data-testid="watch-score-team-b"
                    onClick={() => onScoreTeam('B')}
                    disabled={sweatLock}
                    aria-label={`Sumar jugada para ${matchState.config.teamBName}, marcador actual ${matchState.scoreB}`}
                    className={`group relative flex min-h-[96px] flex-col items-center justify-center rounded-2xl border p-2 transition-all active:scale-[0.96] disabled:opacity-50 ${
                      matchState.servingTeam === 'B'
                        ? 'border-sky-400/70 bg-sky-500/15'
                        : 'border-slate-700/80 bg-slate-800/60 hover:bg-slate-800'
                    }`}
                  >
                    <span className="max-w-full truncate text-[11px] font-medium text-slate-300">
                      {matchState.config.teamBName}
                    </span>
                    <span
                      data-testid="watch-score-b"
                      className="font-display text-4xl font-extrabold leading-none text-white tabular-nums mt-1"
                    >
                      {matchState.scoreB}
                    </span>
                    <span className="mt-1.5 text-[10px] font-medium text-sky-400">
                      {matchState.servingTeam === 'B'
                        ? `Saca #${matchState.serverNumber}`
                        : matchState.config.scoringRule === 'traditional'
                          ? 'Falta rival'
                          : '+1 y saque'}
                    </span>
                  </button>
                </div>
              )}

              {/* Bottom Watch Controls */}
              <div className="flex w-full items-center justify-center gap-2 pb-1">
                <button
                  type="button"
                  data-testid="watch-fault-btn"
                  onClick={onServeFault}
                  disabled={sweatLock || matchState.isMatchOver}
                  className="min-h-[38px] rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-700 active:scale-[0.97] disabled:opacity-40 whitespace-nowrap"
                >
                  Falta de saque
                </button>
                <button
                  type="button"
                  data-testid="watch-undo-btn"
                  onClick={onUndo}
                  disabled={sweatLock || matchState.historyStack.length === 0}
                  aria-label="Deshacer último punto"
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-slate-100 transition-colors hover:bg-slate-700 active:scale-[0.97] disabled:opacity-40 whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Deshacer</span>
                </button>
              </div>

              {/* Sweat Lock Overlay */}
              {sweatLock && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-slate-950/80 px-6 text-center backdrop-blur-[2px]">
                  <Lock className="mb-2 h-7 w-7 text-orange-400" aria-hidden="true" />
                  <p className="text-xs font-semibold text-white">
                    Bloqueo de sudor activo
                  </p>
                  <p className="mt-1 text-[11px] text-slate-300">
                    Desactiva arriba para evitar toques accidentales.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Hardware Legend & Quick Button Guide */}
      <div className="mt-6 grid w-full grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:grid-cols-3">
        <div>
          <span className="font-semibold text-slate-900">Botón Rápido Naranja</span>
          <p className="mt-0.5 text-slate-500">
            Acción asignada: {quickActionTitle} (haz clic en el botón lateral naranja).
          </p>
        </div>
        <div>
          <span className="font-semibold text-slate-900">Feedback háptico</span>
          <p className="mt-0.5 text-slate-500 tabular-nums">
            Último pulso: {lastHapticLabel || 'Listo para partido'}
          </p>
        </div>
        <div>
          <span className="font-semibold text-slate-900">Atajos de teclado</span>
          <p className="mt-0.5 text-slate-500 font-mono text-[11px]">
            [A] Nosotros · [B] Rival · [F] Falta · [Z] Deshacer
          </p>
        </div>
      </div>
    </section>
  );
};
