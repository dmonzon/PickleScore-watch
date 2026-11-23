import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type {
  MatchConfig,
  MatchFormat,
  QuickButtonAction,
  ScoringRule,
  TeamId,
} from '../engine/pickleball';

interface MatchSetupModalProps {
  isOpen: boolean;
  initialConfig: MatchConfig;
  onClose: () => void;
  onStartMatch: (config: MatchConfig) => void;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  isOpen,
  initialConfig,
  onClose,
  onStartMatch,
}) => {
  const [teamAName, setTeamAName] = useState(initialConfig.teamAName);
  const [teamBName, setTeamBName] = useState(initialConfig.teamBName);
  const [format, setFormat] = useState<MatchFormat>(initialConfig.format);
  const [scoringRule, setScoringRule] = useState<ScoringRule>(initialConfig.scoringRule);
  const [targetPoints, setTargetPoints] = useState<11 | 15 | 21>(initialConfig.targetPoints);
  const [bestOfSets, setBestOfSets] = useState<1 | 3>(initialConfig.bestOfSets);
  const [quickButtonAction, setQuickButtonAction] = useState<QuickButtonAction>(
    initialConfig.quickButtonAction
  );
  const [initialServingTeam, setInitialServingTeam] = useState<TeamId>(
    initialConfig.initialServingTeam
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTeamAName(initialConfig.teamAName);
    setTeamBName(initialConfig.teamBName);
    setFormat(initialConfig.format);
    setScoringRule(initialConfig.scoringRule);
    setTargetPoints(initialConfig.targetPoints);
    setBestOfSets(initialConfig.bestOfSets);
    setQuickButtonAction(initialConfig.quickButtonAction);
    setInitialServingTeam(initialConfig.initialServingTeam);
    setError(null);
  }, [initialConfig, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedA = teamAName.trim();
    const trimmedB = teamBName.trim();
    if (!trimmedA || !trimmedB) {
      setError('Ingresa un nombre para ambos equipos antes de iniciar el partido.');
      return;
    }
    setError(null);
    onStartMatch({
      matchId: `match-${Date.now()}`,
      teamAName: trimmedA,
      teamBName: trimmedB,
      format,
      scoringRule,
      targetPoints,
      bestOfSets,
      quickButtonAction,
      initialServingTeam,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-new-match-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 id="modal-new-match-title" className="font-display text-lg font-semibold text-slate-900">
            Configurar nuevo partido
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configuración de partido"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="team-a-input" className="block text-xs font-medium text-slate-700">
                Equipo A (Reloj)
              </label>
              <input
                id="team-a-input"
                type="text"
                maxLength={24}
                value={teamAName}
                onChange={(e) => setTeamAName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-orange-600 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="team-b-input" className="block text-xs font-medium text-slate-700">
                Equipo B (Rivales)
              </label>
              <input
                id="team-b-input"
                type="text"
                maxLength={24}
                value={teamBName}
                onChange={(e) => setTeamBName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-orange-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-medium text-slate-700">Modalidad</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setFormat('doubles')}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                    format === 'doubles'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dobles (0-0-2)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('singles')}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                    format === 'singles'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Individuales
                </button>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700">Regla de puntuación</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setScoringRule('traditional')}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                    scoringRule === 'traditional'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Side-Out oficial
                </button>
                <button
                  type="button"
                  onClick={() => setScoringRule('rally')}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                    scoringRule === 'rally'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Rally Scoring
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-medium text-slate-700">Puntos por set</span>
              <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                {([11, 15, 21] as const).map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setTargetPoints(pts)}
                    className={`rounded-md py-1.5 text-xs font-medium tabular-nums transition-colors ${
                      targetPoints === pts
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    A {pts}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700">Formato de sets</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                {([1, 3] as const).map((sets) => (
                  <button
                    key={sets}
                    type="button"
                    onClick={() => setBestOfSets(sets)}
                    className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                      bestOfSets === sets
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mejor de {sets}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-medium text-slate-700">Primer saque</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setInitialServingTeam('A')}
                  className={`truncate rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    initialServingTeam === 'A'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {teamAName.trim() || 'Equipo A'}
                </button>
                <button
                  type="button"
                  onClick={() => setInitialServingTeam('B')}
                  className={`truncate rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    initialServingTeam === 'B'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {teamBName.trim() || 'Equipo B'}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="quick-button-select" className="block text-xs font-medium text-slate-700">
                Botón Rápido Naranja
              </label>
              <select
                id="quick-button-select"
                value={quickButtonAction}
                onChange={(e) => setQuickButtonAction(e.target.value as QuickButtonAction)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-orange-600 focus:outline-none"
              >
                <option value="point_my_team">Sumar punto a Nosotros</option>
                <option value="side_out">Falta de saque (Side-Out)</option>
                <option value="undo">Deshacer última jugada</option>
              </select>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Iniciar partido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
