// ============================================================
// TransactionList — Panel izquierdo: movimientos del banco
// Soporte drag (draggable) y filtros de estado
// ============================================================
import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, GripVertical, Check, Ban, StickyNote, ChevronDown } from 'lucide-react';
import type { BankTransaction, ReconciliationStatus } from '../../types/reconciliation';
import { useReconciliationStore } from '../../store/reconciliationStore';

interface TransactionListProps {
  transactions: BankTransaction[];
  onDragStart?: (transactionId: string) => void;
}

const STATUS_CONFIG: Record<ReconciliationStatus, { label: string; color: string; dot: string }> = {
  conciliado: { label: 'Conciliado', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  parcial:    { label: 'Parcial',    color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  excluido:   { label: 'Excluido',   color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  manual:     { label: 'Manual',     color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
};

function formatARS(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

function formatDate(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function TransactionList({ transactions, onDragStart }: TransactionListProps) {
  const { filterStatus, setFilterStatus, searchTerm, setSearchTerm, excludeTransaction, setTransactionNote } =
    useReconciliationStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = transactions.filter((t) => {
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const s = searchTerm.toLowerCase();
    const matchSearch =
      !s ||
      t.descripcion.toLowerCase().includes(s) ||
      (t.referencia ?? '').toLowerCase().includes(s) ||
      (t.cuit_contraparte ?? '').includes(s) ||
      formatARS(t.importe).includes(s);
    return matchStatus && matchSearch;
  });

  const STATUS_COUNTS = (Object.keys(STATUS_CONFIG) as ReconciliationStatus[]).reduce(
    (acc, k) => {
      acc[k] = transactions.filter((t) => t.status === k).length;
      return acc;
    },
    {} as Record<ReconciliationStatus, number>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="pb-3 border-b border-gray-100 shrink-0 space-y-3">
        <input
          type="text"
          placeholder="Buscar descripción, referencia, CUIT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-sage"
        />
        <div className="flex flex-wrap gap-1.5">
          {(['all', ...Object.keys(STATUS_CONFIG)] as const).map((s) => {
            const isAll = s === 'all';
            const count = isAll
              ? transactions.length
              : STATUS_COUNTS[s as ReconciliationStatus];
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s as any)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-brand-navy text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isAll ? 'Todos' : STATUS_CONFIG[s as ReconciliationStatus].label}{' '}
                <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 mt-3 pr-0.5 custom-scrollbar">
        {filtered.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">
            No hay movimientos que coincidan con los filtros.
          </div>
        )}
        {filtered.map((tx) => {
          const cfg = STATUS_CONFIG[tx.status];
          const isExpanded = expandedId === tx.id;
          const isDraggable = tx.status === 'pendiente' || tx.status === 'parcial';

          return (
            <div
              key={tx.id}
              draggable={isDraggable}
              onDragStart={() => isDraggable && onDragStart?.(tx.id)}
              className={`rounded-xl border transition-all duration-150 select-none ${
                isDraggable
                  ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-brand-sage/50'
                  : 'cursor-default opacity-80'
              } ${isExpanded ? 'border-brand-sage shadow-sm' : 'border-gray-200 bg-white'}`}
            >
              {/* Main row */}
              <div
                className="flex items-center gap-2 px-3 py-3"
                onClick={() => setExpandedId(isExpanded ? null : tx.id)}
              >
                {isDraggable && (
                  <GripVertical size={14} className="text-gray-300 shrink-0" />
                )}

                {/* Tipo: débito / crédito */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    tx.tipo === 'credito' ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {tx.tipo === 'credito' ? (
                    <ArrowDownLeft size={14} className="text-green-600" />
                  ) : (
                    <ArrowUpRight size={14} className="text-red-500" />
                  )}
                </div>

                {/* Desc + fecha */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-brand-navy truncate leading-tight">
                    {tx.descripcion_normalizada ?? tx.descripcion}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatDate(tx.fecha)}
                    {tx.referencia && (
                      <span className="ml-2 font-mono">{tx.referencia}</span>
                    )}
                  </p>
                </div>

                {/* Importe */}
                <div className="text-right shrink-0">
                  <p
                    className={`text-sm font-extrabold ${
                      tx.tipo === 'credito' ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {tx.tipo === 'credito' ? '+' : '-'} {formatARS(tx.importe)}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}
                >
                  {cfg.label}
                </span>

                <ChevronDown
                  size={14}
                  className={`text-gray-300 shrink-0 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-gray-100 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    {tx.cuit_contraparte && (
                      <InfoRow label="CUIT Contraparte" value={tx.cuit_contraparte} />
                    )}
                    {tx.saldo !== undefined && (
                      <InfoRow label="Saldo posterior" value={formatARS(tx.saldo)} />
                    )}
                    {tx.categoria && (
                      <InfoRow label="Categoría IA" value={tx.categoria} />
                    )}
                    {tx.banco_origen && (
                      <InfoRow label="Banco" value={tx.banco_origen} />
                    )}
                    {tx.confidence_score !== undefined && (
                      <InfoRow
                        label="Confianza match"
                        value={`${tx.confidence_score}%`}
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {tx.status === 'pendiente' && (
                      <button
                        onClick={() => excludeTransaction(tx.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Ban size={12} />
                        Excluir
                      </button>
                    )}
                    <div className="flex-1 flex items-center gap-2">
                      <StickyNote size={12} className="text-gray-400 shrink-0" />
                      <input
                        type="text"
                        placeholder="Agregar nota..."
                        defaultValue={tx.notas ?? ''}
                        onBlur={(e) => setTransactionNote(tx.id, e.target.value)}
                        className="flex-1 text-xs border-b border-gray-200 outline-none pb-0.5 focus:border-brand-sage bg-transparent"
                      />
                    </div>
                  </div>

                  {/* Confirmado badge */}
                  {tx.status === 'conciliado' && (
                    <div className="flex items-center gap-1.5 text-green-600 text-xs font-semibold">
                      <Check size={13} />
                      Conciliado automáticamente
                    </div>
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
