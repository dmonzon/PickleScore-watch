import React, { useMemo, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import type { SavedMatchRecord } from '../data/architectureData';

interface HistoryViewProps {
  matches: SavedMatchRecord[];
  onDeleteMatch: (id: string) => void;
  onStartNewMatch: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  matches,
  onDeleteMatch,
  onStartNewMatch,
}) => {
  const [formatFilter, setFormatFilter] = useState<'all' | 'doubles' | 'singles'>('all');

  const filteredMatches = useMemo(() => {
    if (formatFilter === 'all') return matches;
    return matches.filter((m) => m.format === formatFilter);
  }, [matches, formatFilter]);

  const totalRallies = matches.reduce((sum, m) => sum + m.totalRallies, 0);
  const totalPackets = matches.reduce((sum, m) => sum + m.blePacketsSynced, 0);
  const teamAWins = matches.filter((m) => m.winner === 'A').length;

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(matches, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rallyultra-historial-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold text-orange-600">
            Almacenamiento en Smartphone Companion
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Historial de partidos sincronizados
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-200/70 p-1">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'doubles', label: 'Dobles' },
                { id: 'singles', label: 'Individuales' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFormatFilter(tab.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  formatFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportJson}
            disabled={matches.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </section>

      {/* Summary KPI Row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-slate-500">Partidos registrados</div>
          <div className="font-display mt-1 text-3xl font-bold text-slate-950 tabular-nums">
            {matches.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 tabular-nums">
            {teamAWins} victorias de tu equipo
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-slate-500">Rallies totales analizados</div>
          <div className="font-display mt-1 text-3xl font-bold text-slate-950 tabular-nums">
            {totalRallies}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Capturados desde Galaxy Watch Ultra
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs text-slate-500">Tramas BLE confirmadas (ACK)</div>
          <div className="font-display mt-1 text-3xl font-bold text-slate-950 tabular-nums">
            {totalPackets}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            12 bytes por evento · CRC-8 verificado
          </div>
        </div>
      </section>

      {/* Match Table or Empty State */}
      {filteredMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            No hay partidos en esta categoría
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-slate-500">
            Completa un partido en el simulador del reloj o inicia uno nuevo para sincronizarlo
            con el smartphone.
          </p>
          <button
            type="button"
            onClick={onStartNewMatch}
            className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Configurar nuevo partido
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-5 py-3">Fecha y formato</th>
                <th className="px-5 py-3">Equipos</th>
                <th className="px-5 py-3">Sets</th>
                <th className="px-5 py-3 text-right">Rallies</th>
                <th className="px-5 py-3 text-right">Duración</th>
                <th className="px-5 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMatches.map((match) => (
                <tr key={match.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{match.playedAt}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {match.format === 'doubles' ? 'Dobles' : 'Individuales'} ·{' '}
                      {match.scoringRule === 'traditional' ? 'Side-Out' : 'Rally'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">
                      {match.teamAName} vs {match.teamBName}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      Ganador:{' '}
                      <span className="font-medium text-slate-700">
                        {match.winner === 'A' ? match.teamAName : match.teamBName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-900 tabular-nums">
                    {match.setScores.map((s) => `${s.a}-${s.b}`).join(' / ')}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-xs text-slate-700 tabular-nums">
                    {match.totalRallies}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-xs text-slate-700 tabular-nums">
                    {match.durationMinutes} min
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteMatch(match.id)}
                      aria-label={`Eliminar partido ${match.teamAName} vs ${match.teamBName}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
