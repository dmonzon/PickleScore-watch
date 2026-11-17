import { useCallback, useEffect, useState } from 'react';
import { Header, type AppSection } from './components/Header';
import { WatchUltraSimulator } from './components/WatchUltraSimulator';
import { SmartphoneCompanion } from './components/SmartphoneCompanion';
import { MatchSetupModal } from './components/MatchSetupModal';
import { ArchitectureView } from './components/ArchitectureView';
import { KotlinCodeView } from './components/KotlinCodeView';
import { HistoryView } from './components/HistoryView';
import {
  INITIAL_MATCH_HISTORY,
  type SavedMatchRecord,
} from './data/architectureData';
import {
  buildQueuedFrame,
  flushOutboxFrames,
  type QueuedBleFrame,
} from './engine/bleProtocol';
import {
  createInitialMatchState,
  recordServeFault,
  recordTeamRallyWin,
  undoLastAction,
  type MatchConfig,
  type MatchEventType,
  type PickleballMatchState,
  type TeamId,
} from './engine/pickleball';

const DEFAULT_CONFIG: MatchConfig = {
  matchId: 'match-ultra-live',
  teamAName: 'Nosotros',
  teamBName: 'Rivales',
  format: 'doubles',
  scoringRule: 'traditional',
  targetPoints: 11,
  bestOfSets: 1,
  quickButtonAction: 'point_my_team',
};

const HISTORY_STORAGE_KEY = 'rallyultra_match_history_v1';

function loadInitialHistory(): SavedMatchRecord[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return INITIAL_MATCH_HISTORY;
    const parsed = JSON.parse(raw) as SavedMatchRecord[];
    return Array.isArray(parsed) ? parsed : INITIAL_MATCH_HISTORY;
  } catch {
    return INITIAL_MATCH_HISTORY;
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('simulator');
  const [watchState, setWatchState] = useState<PickleballMatchState>(() =>
    createInitialMatchState(DEFAULT_CONFIG)
  );
  const [phoneSyncedState, setPhoneSyncedState] = useState<PickleballMatchState>(
    () => watchState
  );
  const [bleConnected, setBleConnected] = useState<boolean>(true);
  const [isFlushing, setIsFlushing] = useState<boolean>(false);
  const [frames, setFrames] = useState<QueuedBleFrame[]>(() => [
    buildQueuedFrame(watchState, 'INIT', true),
  ]);
  const [hapticPulseTick, setHapticPulseTick] = useState<number>(0);
  const [lastHapticLabel, setLastHapticLabel] = useState<string>('');
  const [isSetupOpen, setIsSetupOpen] = useState<boolean>(false);
  const [matchSaved, setMatchSaved] = useState<boolean>(false);
  const [matchHistory, setMatchHistory] = useState<SavedMatchRecord[]>(
    loadInitialHistory
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(matchHistory)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [matchHistory]);

  const commitWatchTransition = useCallback(
    (
      nextState: PickleballMatchState,
      eventType: MatchEventType,
      hapticLabel: string
    ) => {
      if (nextState === watchState) return;
      setWatchState(nextState);
      setHapticPulseTick((prev) => prev + 1);
      setLastHapticLabel(hapticLabel);

      const frame = buildQueuedFrame(nextState, eventType, bleConnected);
      setFrames((prev) => [frame, ...prev]);

      if (bleConnected) {
        setPhoneSyncedState(nextState);
      }
    },
    [bleConnected, watchState]
  );

  const handleScoreTeam = useCallback(
    (team: TeamId) => {
      const next = recordTeamRallyWin(watchState, team);
      if (next === watchState) return;
      const latestEvent = next.timeline[0]?.eventType ?? 'POINT_A';
      const label =
        latestEvent === 'MATCH_WON'
          ? 'Victoria (doble pulso largo)'
          : latestEvent === 'SIDE_OUT' || latestEvent === 'NEXT_SERVER'
            ? 'Cambio de saque (pulso corto)'
            : `Punto (${next.scoreA}-${next.scoreB})`;
      commitWatchTransition(next, latestEvent, label);
    },
    [commitWatchTransition, watchState]
  );

  const handleServeFault = useCallback(() => {
    const next = recordServeFault(watchState);
    if (next === watchState) return;
    const latestEvent = next.timeline[0]?.eventType ?? 'SIDE_OUT';
    commitWatchTransition(
      next,
      latestEvent,
      latestEvent === 'NEXT_SERVER' ? 'Servidor 2 (pulso corto)' : 'Side-Out (pulso doble)'
    );
  }, [commitWatchTransition, watchState]);

  const handleUndo = useCallback(() => {
    const next = undoLastAction(watchState);
    if (next === watchState) return;
    commitWatchTransition(next, 'UNDO', 'Deshacer jugada');
  }, [commitWatchTransition, watchState]);

  const handleQuickButton = useCallback(() => {
    const action = watchState.config.quickButtonAction;
    if (action === 'point_my_team') {
      handleScoreTeam('A');
    } else if (action === 'side_out') {
      handleServeFault();
    } else {
      handleUndo();
    }
  }, [handleScoreTeam, handleServeFault, handleUndo, watchState.config.quickButtonAction]);

  const handleToggleBle = useCallback(() => {
    if (bleConnected) {
      setBleConnected(false);
      return;
    }

    // Reconnecting: flush offline outbox frames to smartphone
    setBleConnected(true);
    setIsFlushing(true);
    const { updatedFrames } = flushOutboxFrames(frames);
    setFrames(updatedFrames);
    setPhoneSyncedState(watchState);

    window.setTimeout(() => {
      setIsFlushing(false);
    }, 350);
  }, [bleConnected, frames, watchState]);

  const startFreshMatch = useCallback(
    (config: MatchConfig) => {
      const fresh = createInitialMatchState(config);
      setWatchState(fresh);
      setMatchSaved(false);
      setHapticPulseTick((p) => p + 1);
      setLastHapticLabel('Nuevo partido iniciado');
      const initFrame = buildQueuedFrame(fresh, 'INIT', bleConnected);
      setFrames([initFrame]);
      if (bleConnected) {
        setPhoneSyncedState(fresh);
      }
      setIsSetupOpen(false);
      setActiveSection('simulator');
    },
    [bleConnected]
  );

  const handleSaveMatch = useCallback(() => {
    if (!watchState.isMatchOver || matchSaved) return;
    const elapsedMin = Math.max(
      1,
      Math.round((Date.now() - watchState.startedAt) / 60000)
    );
    const newRecord: SavedMatchRecord = {
      id: watchState.config.matchId,
      playedAt: 'Recién finalizado',
      durationMinutes: elapsedMin,
      format: watchState.config.format,
      scoringRule: watchState.config.scoringRule,
      teamAName: watchState.config.teamAName,
      teamBName: watchState.config.teamBName,
      scoreA: watchState.scoreA,
      scoreB: watchState.scoreB,
      setScores:
        watchState.setScores.length > 0
          ? watchState.setScores
          : [{ a: watchState.scoreA, b: watchState.scoreB }],
      winner: watchState.winner ?? 'A',
      totalRallies: watchState.ralliesPlayed,
      blePacketsSynced: frames.length,
    };
    setMatchHistory((prev) => [newRecord, ...prev]);
    setMatchSaved(true);
  }, [frames.length, matchSaved, watchState]);

  const handleDeleteMatch = useCallback((id: string) => {
    setMatchHistory((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Keyboard shortcuts for rapid simulator testing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isSetupOpen || activeSection !== 'simulator') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      if (key === 'a') {
        e.preventDefault();
        handleScoreTeam('A');
      } else if (key === 'b') {
        e.preventDefault();
        handleScoreTeam('B');
      } else if (key === 'f') {
        e.preventDefault();
        handleServeFault();
      } else if (key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSection, handleScoreTeam, handleServeFault, handleUndo, isSetupOpen]);

  const pendingOutboxCount = frames.filter((f) => f.status === 'queued').length;

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-900">
      <Header
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        onOpenNewMatch={() => setIsSetupOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeSection === 'simulator' && (
          <div className="space-y-8">
            <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
              <div>
                <p className="text-xs font-semibold text-orange-600">
                  Simulador en tiempo real · Wear OS + Bluetooth Low Energy
                </p>
                <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-slate-950 [text-wrap:balance]">
                  Control de Pickleball en Galaxy Watch Ultra y sincronización móvil
                </h1>
              </div>
              <div className="text-xs text-slate-500">
                {watchState.config.format === 'doubles' ? 'Dobles (0-0-2)' : 'Individuales'} ·{' '}
                {watchState.config.scoringRule === 'traditional'
                  ? 'Side-Out oficial'
                  : 'Rally Scoring'}{' '}
                · Meta {watchState.config.targetPoints} pts
              </div>
            </section>

            <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12">
              <div className="xl:col-span-5">
                <WatchUltraSimulator
                  matchState={watchState}
                  bleConnected={bleConnected}
                  pendingOutboxCount={pendingOutboxCount}
                  hapticPulseTick={hapticPulseTick}
                  lastHapticLabel={lastHapticLabel}
                  onScoreTeam={handleScoreTeam}
                  onServeFault={handleServeFault}
                  onUndo={handleUndo}
                  onQuickButton={handleQuickButton}
                  onSaveMatch={handleSaveMatch}
                  onRematch={() =>
                    startFreshMatch({
                      ...watchState.config,
                      matchId: `match-${Date.now()}`,
                    })
                  }
                  matchSaved={matchSaved}
                />
              </div>

              <div className="xl:col-span-7">
                <SmartphoneCompanion
                  phoneSyncedState={phoneSyncedState}
                  watchState={watchState}
                  bleConnected={bleConnected}
                  isFlushing={isFlushing}
                  frames={frames}
                  onToggleBle={handleToggleBle}
                  onSaveMatch={handleSaveMatch}
                  matchSaved={matchSaved}
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'architecture' && <ArchitectureView />}
        {activeSection === 'kotlin' && <KotlinCodeView />}
        {activeSection === 'history' && (
          <HistoryView
            matches={matchHistory}
            onDeleteMatch={handleDeleteMatch}
            onStartNewMatch={() => setIsSetupOpen(true)}
          />
        )}
      </main>

      <MatchSetupModal
        isOpen={isSetupOpen}
        initialConfig={watchState.config}
        onClose={() => setIsSetupOpen(false)}
        onStartMatch={startFreshMatch}
      />
    </div>
  );
}
