import React from 'react';
import {
  ARCHITECTURE_LAYERS,
  GATT_SPEC,
  PACKET_SPEC,
} from '../data/architectureData';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* Intro Header */}
      <section className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold text-orange-600">
          Blueprint de Ingeniería · Wear OS 5 + Android Companion
        </p>
        <h1 className="font-display mt-2 max-w-3xl text-3xl font-bold tracking-tight text-slate-950 [text-wrap:balance]">
          Arquitectura Offline-First y Protocolo Bluetooth Low Energy
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
          El diseño separa la lógica pura de reglas de Pickleball en un módulo compartido,
          ejecuta un servidor GATT ligero directamente en el Samsung Galaxy Watch Ultra y
          mantiene una cola local persistente para garantizar cero pérdida de puntos si te
          alejas del teléfono en la cancha.
        </p>
      </section>

      {/* 01. Three-Module Architecture */}
      <section aria-labelledby="arch-modules-heading" className="space-y-4">
        <h2 id="arch-modules-heading" className="font-display text-xl font-semibold text-slate-900">
          01. Topología de módulos y responsabilidades
        </h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {ARCHITECTURE_LAYERS.map((layer) => (
            <article
              key={layer.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div>
                <div className="text-xs font-medium text-slate-500">{layer.platform}</div>
                <h3 className="font-display mt-1 text-base font-semibold text-slate-950">
                  {layer.module}
                </h3>
                <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
                  {layer.responsibilities.map((item) => (
                    <li key={item} className="leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-3 font-mono text-[11px] text-slate-500">
                {layer.keyApis}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 02. Synchronization Pipeline */}
      <section aria-labelledby="arch-flow-heading" className="space-y-4">
        <h2 id="arch-flow-heading" className="font-display text-xl font-semibold text-slate-900">
          02. Flujo de sincronización tolerante a desconexiones
        </h2>
        <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-4">
          <div className="space-y-1.5 border-b border-slate-100 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <div className="font-mono text-xs font-semibold text-orange-600">Paso 1 · Watch Input</div>
            <h3 className="text-sm font-semibold text-slate-900">Evento háptico instantáneo</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Un toque en pantalla o en el Botón Rápido Naranja actualiza el StateFlow local en &lt;4 ms
              y dispara vibración diferenciada.
            </p>
          </div>
          <div className="space-y-1.5 border-b border-slate-100 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <div className="font-mono text-xs font-semibold text-orange-600">Paso 2 · Room Outbox</div>
            <h3 className="text-sm font-semibold text-slate-900">Persistencia antes de transmitir</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              La trama binaria de 12 bytes se guarda en SQLite/Room con un número de secuencia
              monotónico (seq) antes de intentar enviarla.
            </p>
          </div>
          <div className="space-y-1.5 border-b border-slate-100 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <div className="font-mono text-xs font-semibold text-orange-600">Paso 3 · BLE Notify</div>
            <h3 className="text-sm font-semibold text-slate-900">Notificación GATT sin fragmentación</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              Los 12 bytes caben en el MTU mínimo BLE (23 bytes), evitando latencia y reduciendo
              el consumo de radio del reloj.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="font-mono text-xs font-semibold text-orange-600">Paso 4 · Mobile ACK</div>
            <h3 className="text-sm font-semibold text-slate-900">Confirmación y drenado de cola</h3>
            <p className="text-xs leading-relaxed text-slate-600">
              El smartphone valida el CRC-8, escribe el ACK en 0xFE52 y el reloj elimina de la
              cola todos los paquetes confirmados.
            </p>
          </div>
        </div>
      </section>

      {/* 03. BLE GATT Service & Characteristics */}
      <section aria-labelledby="arch-gatt-heading" className="space-y-4">
        <h2 id="arch-gatt-heading" className="font-display text-xl font-semibold text-slate-900">
          03. Contrato Bluetooth GATT (UUIDs y propiedades)
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-5 py-3">Característica / Servicio</th>
                <th className="px-5 py-3">UUID</th>
                <th className="px-5 py-3">Propiedades</th>
                <th className="px-5 py-3">Propósito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {GATT_SPEC.map((row) => (
                <tr key={row.uuid} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-900">{row.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{row.uuid}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-orange-700">{row.properties}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{row.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 04. 12-Byte Binary Frame Map */}
      <section aria-labelledby="arch-packet-heading" className="space-y-4">
        <h2 id="arch-packet-heading" className="font-display text-xl font-semibold text-slate-900">
          04. Estructura binaria de la trama de estado (12 bytes)
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-5 py-3">Desplazamiento</th>
                <th className="px-5 py-3">Campo</th>
                <th className="px-5 py-3">Tamaño</th>
                <th className="px-5 py-3">Codificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PACKET_SPEC.map((byteRow) => (
                <tr key={byteRow.offset} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-slate-900 tabular-nums">
                    {byteRow.offset}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-orange-700">{byteRow.field}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums">
                    {byteRow.size}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{byteRow.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 05. Galaxy Watch Ultra Hardware Ergonomics */}
      <section aria-labelledby="arch-hw-heading" className="space-y-4">
        <h2 id="arch-hw-heading" className="font-display text-xl font-semibold text-slate-900">
          05. Ergonomía en cancha para Samsung Galaxy Watch Ultra
        </h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">Botón Rápido Naranja</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Intercepta <span className="font-mono">KeyEvent.KEYCODE_STEM_PRIMARY</span> para
              anotar puntos sin mirar la pantalla o incluso con el bloqueo de sudor activado.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">Modo Ambiente (AOD)</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Mediante <span className="font-mono">AmbientLifecycleObserver</span> reduce el brillo
              entre rallies dejando solo el canto oficial en blanco sobre negro puro (#000000).
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">Contraste solar 3.000 nits</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Tipografía numérica tabular de gran escala (36sp+) y zonas táctiles amplias (&gt;48dp)
              para evitar toques erróneos en partidos al aire libre.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
