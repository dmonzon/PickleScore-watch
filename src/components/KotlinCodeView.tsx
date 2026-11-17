import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { KOTLIN_FILES } from '../data/architectureData';

export const KotlinCodeView: React.FC = () => {
  const [selectedFileId, setSelectedFileId] = useState<string>(KOTLIN_FILES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeFile =
    KOTLIN_FILES.find((f) => f.id === selectedFileId) ?? KOTLIN_FILES[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopiedId(activeFile.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback ignored in restricted clipboard environments
    }
  };

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold text-orange-600">
          Implementación de referencia · Kotlin + Jetpack Compose
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-950 [text-wrap:balance]">
          Código base listo para Android Studio
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Cuatro archivos clave divididos en el proyecto Gradle multi-módulo para compilar
          la app del Galaxy Watch Ultra (<span className="font-mono">:wear-app</span>) y el cliente
          Bluetooth del smartphone (<span className="font-mono">:mobile-app</span>).
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* File Selector Sidebar */}
        <aside aria-label="Archivos Kotlin" className="space-y-2 lg:col-span-4">
          {KOTLIN_FILES.map((file) => {
            const isActive = file.id === activeFile.id;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setSelectedFileId(file.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  isActive
                    ? 'border-slate-900 bg-white shadow-xs'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-900">
                    {file.filename}
                  </span>
                  <span className="font-mono text-[11px] text-orange-700">{file.module}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {file.summary}
                </p>
              </button>
            );
          })}
        </aside>

        {/* Code Display Panel */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 lg:col-span-8">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono font-semibold text-white">{activeFile.filename}</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="font-mono text-slate-400">{activeFile.module}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 whitespace-nowrap"
            >
              {copiedId === activeFile.id ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copiar código</span>
                </>
              )}
            </button>
          </div>
          <pre className="max-h-[600px] overflow-auto p-5 font-mono text-xs leading-relaxed text-slate-200">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
