// ============================================================
// ReconciliationSummary — Barra de KPIs en la parte superior
// ============================================================
import { TrendingUp, AlertTriangle, CheckCircle2, Clock, FileDown, RotateCcw } from 'lucide-react';
import type { ReconciliationStats } from '../../types/reconciliation';

interface ReconciliationSummaryProps {
  stats: ReconciliationStats;
  clientName?: string;
  banco?: string;
  periodo?: string;
  onExport?: (formato: 'pdf' | 'excel') => void;
  onReset?: () => void;
}

function formatARS(n: number) {
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
}

export default function ReconciliationSummary({
  stats,
  clientName,
  banco,
  periodo,
  onExport,
  onReset,
}: ReconciliationSummaryProps) {
  const pct = stats.porcentaje_conciliado;
  const barColor =
    pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Top — Client + Banco + Período */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-brand-navy leading-tight">
            {clientName ?? 'Cliente'}
          </h2>
          <p className="text-sm text-gray-500">
            {banco ?? 'Banco'}{periodo ? ` · ${periodo}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RotateCcw size={14} />
              Nuevo
            </button>
          )}
          {onExport && (
            <div className="flex gap-2">
              <button
                onClick={() => onExport('excel')}
                className="flex items-center gap-2 px-3 py-2 border border-brand-accent text-brand-accent rounded-lg text-sm font-semibold hover:bg-brand-accent/5 transition-colors"
              >
                <FileDown size={14} />
                Excel
              </button>
              <button
                onClick={() => onExport('pdf')}
                className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-bold hover:bg-[#0f172a] transition-colors"
              >
                <FileDown size={14} />
                Reporte PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
        <KPICard
          icon={<CheckCircle2 className="text-green-500" size={18} />}
          label="Conciliados"
          value={`${stats.conciliadas} / ${stats.total_transacciones}`}
          sublabel={`${stats.manuales} manuales`}
          accent="green"
        />
        <KPICard
          icon={<Clock className="text-yellow-500" size={18} />}
          label="Pendientes"
          value={String(stats.pendientes)}
          sublabel={`${stats.excluidas} excluidos`}
          accent="yellow"
        />
        <KPICard
          icon={<TrendingUp className="text-brand-accent" size={18} />}
          label="Total Movimientos"
          value={formatARS(stats.total_creditos + stats.total_debitos)}
          sublabel={`Créd: ${formatARS(stats.total_creditos)}`}
          accent="blue"
        />
        <KPICard
          icon={<AlertTriangle className="text-red-500" size={18} />}
          label="Diferencia Acum."
          value={formatARS(stats.diferencia_total)}
          sublabel={stats.diferencia_total === 0 ? '¡Perfecto!' : 'Revisar difs.'}
          accent={stats.diferencia_total === 0 ? 'green' : 'red'}
        />
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Progreso de Conciliación
          </span>
          <span
            className={`text-sm font-extrabold ${
              pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-500'
            }`}
          >
            {pct}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Sub-componente KPI Card ────────────────────
function KPICard({
  icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  accent: 'green' | 'yellow' | 'blue' | 'red';
}) {
  const bg = {
    green: 'bg-green-50',
    yellow: 'bg-yellow-50',
    blue: 'bg-blue-50',
    red: 'bg-red-50',
  }[accent];

  return (
    <div className={`px-5 py-4 flex items-start gap-3 ${bg}/50`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-extrabold text-brand-navy leading-tight mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}
