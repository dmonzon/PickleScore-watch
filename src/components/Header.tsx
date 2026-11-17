import React from 'react';
import { Plus } from 'lucide-react';

export type AppSection = 'simulator' | 'architecture' | 'kotlin' | 'history';

interface HeaderProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onOpenNewMatch: () => void;
}

const NAV_ITEMS: Array<{ id: AppSection; label: string }> = [
  { id: 'simulator', label: 'Simulador' },
  { id: 'architecture', label: 'Arquitectura' },
  { id: 'kotlin', label: 'Código Kotlin' },
  { id: 'history', label: 'Historial' },
];

export const Header: React.FC<HeaderProps> = ({
  activeSection,
  onSelectSection,
  onOpenNewMatch,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md md:sticky md:top-0 md:z-30">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:gap-8 sm:px-6 lg:px-8">
        <a
          href="#simulador"
          onClick={(e) => {
            e.preventDefault();
            onSelectSection('simulator');
          }}
          className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-600"
        >
          RallyUltra
        </a>

        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 ${
                  isActive
                    ? 'text-slate-950'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-orange-600"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenNewMatch}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs sm:px-4 sm:text-sm font-medium text-white transition-colors hover:bg-slate-800 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Nuevo partido</span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Navegación móvil"
        className="grid grid-cols-4 border-t border-slate-100 bg-white md:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative py-2.5 text-center text-xs font-medium transition-colors whitespace-nowrap ${
                isActive ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-0.5 bg-orange-600"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
