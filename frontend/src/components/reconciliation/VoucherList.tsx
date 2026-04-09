// ============================================================
// VoucherList — Panel derecho: comprobantes del cliente
// Drop target para conciliación manual via drag & drop
// ============================================================
import { useState } from 'react';
import { FileCheck2, Link2Off, ChevronDown } from 'lucide-react';
import type { VoucherSummary } from '../../types/reconciliation';
import { useReconciliationStore } from '../../store/reconciliationStore';

interface VoucherListProps {
  vouchers: VoucherSummary[];
  draggingTransactionId: string | null;
  onDropOnVoucher?: (transactionId: string, voucherId: string) => void;
}

function formatARS(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const TIPO_COLOR: Record<string, string> = {
  A: 'bg-brand-navy text-white',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-gray-100 text-gray-700',
  M: 'bg-orange-100 text-orange-700',
  E: 'bg-pink-100 text-pink-700',
};

export default function VoucherList({ vouchers, draggingTransactionId, onDropOnVoucher }: VoucherListProps) {
  const { removeMatch, session } = useReconciliationStore();
  const [searchVoucher, setSearchVoucher] = useState('');
  const [filterConciliado, setFilterConciliado] = useState(false);
  const [hoveringId, setHoveringId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = vouchers.filter((v) => {
    const s = searchVoucher.toLowerCase();
    const matchSearch =
      !s ||
      (v.razon_social_emisor ?? '').toLowerCase().includes(s) ||
      v.cuit_emisor.includes(s) ||
      v.numero_comprobante.includes(s);
    const matchFilter = !filterConciliado || v.reconciliation_status === 'pendiente';
    return matchSearch && matchFilter;
  });

  const handleDragOver = (e: React.DragEvent, voucherId: string) => {
    e.preventDefault();
    setHoveringId(voucherId);
  };

  const handleDrop = (e: React.DragEvent, voucherId: string) => {
    e.preventDefault();
    setHoveringId(null);
    if (draggingTransactionId) {
      onDropOnVoucher?.(draggingTransactionId, voucherId);
    }
  };

  // Find the match linked to this voucher
  const getMatchForVoucher = (voucherId: string) =>
    session.matches.find((m) => m.voucher_ids.includes(voucherId));

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="pb-3 border-b border-gray-100 shrink-0 space-y-3">
        <input
          type="text"
          placeholder="Buscar por empresa, CUIT, número..."
          value={searchVoucher}
          onChange={(e) => setSearchVoucher(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-sage"
        />
        <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filterConciliado}
            onChange={(e) => setFilterConciliado(e.target.checked)}
            className="w-3.5 h-3.5 rounded accent-brand-sage"
          />
          Solo pendientes de conciliación
        </label>
      </div>

      {/* Drop hint */}
      {draggingTransactionId && (
        <div className="mt-3 py-2 px-4 bg-brand-sage/10 border-2 border-dashed border-brand-sage rounded-xl text-center text-sm font-semibold text-brand-sage animate-pulse">
          ↓ Soltá sobre un comprobante para conciliarlos
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 mt-3 pr-0.5 custom-scrollbar">
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">
            No hay comprobantes para mostrar.{' '}
            {vouchers.length === 0 && (
              <span className="block mt-1 text-xs">
                Los comprobantes se cargan desde el historial del cliente.
              </span>
            )}
          </div>
        )}

        {filtered.map((v) => {
          const isConciliado = v.reconciliation_status === 'conciliado' || v.reconciliation_status === 'manual';
          const isHovering = hoveringId === v.id && !!draggingTransactionId;
          const match = getMatchForVoucher(v.id);
          const isExpanded = expandedId === v.id;

          return (
            <div
              key={v.id}
              onDragOver={(e) => !isConciliado && handleDragOver(e, v.id)}
              onDragLeave={() => setHoveringId(null)}
              onDrop={(e) => !isConciliado && handleDrop(e, v.id)}
              className={`rounded-xl border transition-all duration-150 ${
                isHovering
                  ? 'border-brand-sage bg-brand-sage/10 shadow-lg scale-[1.01]'
                  : isConciliado
                  ? 'border-green-200 bg-green-50/50 opacity-80'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
              } ${!isConciliado && draggingTransactionId ? 'cursor-copy' : 'cursor-default'}`}
            >
              <div
                className="flex items-start gap-3 px-3 py-3"
                onClick={() => setExpandedId(isExpanded ? null : v.id)}
              >
                {/* Tipo badge */}
                <div
                  className={`w-7 h-7 rounded-lg text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                    TIPO_COLOR[v.tipo_comprobante] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {v.tipo_comprobante}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-navy truncate leading-tight">
                    {v.razon_social_emisor ?? v.cuit_emisor}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {v.punto_venta}-{v.numero_comprobante} · {formatDate(v.fecha_emision)}
                  </p>
                </div>

                {/* Importe */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-brand-navy">{formatARS(v.total)}</p>
                  {isConciliado && (
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <FileCheck2 size={10} className="text-green-500" />
                      <span className="text-[10px] text-green-600 font-semibold">OK</span>
                    </div>
                  )}
                </div>

                <ChevronDown
                  size={14}
                  className={`text-gray-300 shrink-0 mt-1 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100 pt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <InfoRow label="CUIT Emisor" value={v.cuit_emisor} />
                    <InfoRow label="Tipo Doc." value={v.tipo_documento} />
                    <InfoRow label="Moneda" value={v.moneda} />
                    <InfoRow label="Estado" value={v.reconciliation_status} />
                  </div>
                  {match && (
                    <button
                      onClick={() => removeMatch(match.id)}
                      className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors mt-1"
                    >
                      <Link2Off size={12} />
                      Deshacer conciliación
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[10px] text-gray-400 block">{label}</span>
      <span className="font-semibold text-gray-700">{value}</span>
    </div>
  );
}
