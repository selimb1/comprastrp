// ============================================================
// ReconciliationPage — Página principal de Conciliación Bancaria
// Orquesta Upload → Processing → Split-View (Conciliación)
// ============================================================
import { useState, useCallback } from 'react';
import { Landmark, Loader2, AlertTriangle } from 'lucide-react';
import ReconciliationUploader from '../components/reconciliation/ReconciliationUploader';
import TransactionList from '../components/reconciliation/TransactionList';
import VoucherList from '../components/reconciliation/VoucherList';
import ReconciliationSummary from '../components/reconciliation/ReconciliationSummary';

import { useReconciliationStore } from '../store/reconciliationStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export default function ReconciliationPage() {
  const {
    session,
    addManualMatch,
    setVouchers,
    resetSession,
  } = useReconciliationStore();

  const [draggingTransactionId, setDraggingTransactionId] = useState<string | null>(null);

  // Load vouchers from the session
  const vouchers = session.vouchers;

  // ── Export handler ──
  const handleExport = async (formato: 'pdf' | 'excel') => {
    if (!session.statement) return;
    try {
      const res = await fetch(`${API_URL}/api/v1/reconciliation/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          client_id: session.client_id,
          formato,
          incluir_detalle: true,
          incluir_pendientes: true,
        }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conciliacion_${session.statement.banco?.replace(/\s/g, '_')}_${session.statement.periodo_desde}.${formato === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
    } catch {
      alert('El reporte estará disponible cuando el backend esté conectado.');
    }
  };

  // ── Drag & Drop handlers ──
  const handleDragStart = useCallback((txId: string) => {
    setDraggingTransactionId(txId);
  }, []);

  const handleDrop = useCallback(
    (transactionId: string, voucherId: string) => {
      setDraggingTransactionId(null);
      addManualMatch(transactionId, [voucherId]);

      // Also update voucher status locally
      const updated = vouchers.map((v) =>
        v.id === voucherId
          ? { ...v, reconciliation_status: 'manual' as const, matched_transaction_ids: [transactionId] }
          : v
      );
      setVouchers(updated);
    },
    [addManualMatch, vouchers, setVouchers]
  );

  // Sin selector de cliente; el nombre se muestra si la sesión lo tiene
  const selectedClient = session.statement?.client_id
    ? { razon_social: 'Cliente', cuit: '' }
    : null;

  // ── RENDER: Upload step ──
  if (session.view === 'upload') {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <ReconciliationUploader />
      </div>
    );
  }

  // ── RENDER: Processing step ──
  if (session.view === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 animate-in fade-in">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full bg-brand-navy/10 flex items-center justify-center">
            <Landmark className="w-10 h-10 text-brand-navy" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-brand-sage border-t-transparent animate-spin" />
        </div>
        <h3 className="text-2xl font-bold text-brand-navy mb-2">Procesando Extracto Bancario</h3>
        <p className="text-gray-500 text-center max-w-sm">
          La IA está extrayendo los movimientos y buscando matches con los comprobantes del cliente...
        </p>
        <div className="mt-6 flex items-center gap-2 text-brand-sage text-sm font-medium">
          <Loader2 size={16} className="animate-spin" />
          Esto puede demorar 15-30 segundos
        </div>
      </div>
    );
  }

  // ── RENDER: Error step ──
  if (session.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24">
        <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
        <h3 className="text-xl font-bold text-red-600">Ocurrió un Error</h3>
        <p className="text-gray-500 mt-2">{session.error}</p>
        <button onClick={resetSession} className="mt-6 px-6 py-2 bg-brand-navy text-white rounded-lg font-bold">
          Reintentar
        </button>
      </div>
    );
  }

  // ── RENDER: Reconcile split-view ──
  const { statement, stats, matches } = session;

  return (
    <div className="flex flex-col h-full gap-5 animate-in fade-in duration-500">
      {/* Summary KPI bar */}
      <ReconciliationSummary
        stats={stats}
        clientName={selectedClient?.razon_social}
        banco={statement?.banco}
        periodo={
          statement
            ? `${statement.periodo_desde.slice(0, 7).replace('-', '/')} — ${statement.periodo_hasta.slice(0, 7).replace('-', '/')}`
            : undefined
        }
        onExport={handleExport}
        onReset={resetSession}
      />

      {/* Split View */}
      <div
        className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-5 overflow-hidden"
        onDragEnd={() => setDraggingTransactionId(null)}
      >
        {/* LEFT: Movimientos Bancarios */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
            <h3 className="font-bold text-brand-navy flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-accent inline-block" />
              Movimientos Bancarios
              <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {statement?.transactions.length ?? 0} mov.
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Arrastrá un movimiento pendiente hacia un comprobante para conciliarlos manualmente.
            </p>
          </div>
          <div className="flex-1 overflow-hidden px-4 pb-4 pt-3">
            <TransactionList
              transactions={statement?.transactions ?? []}
              onDragStart={handleDragStart}
            />
          </div>
        </div>

        {/* RIGHT: Comprobantes del Cliente */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
            <h3 className="font-bold text-brand-navy flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-sage inline-block" />
              Comprobantes del Cliente
              <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {vouchers.length} comp.
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {selectedClient?.razon_social} · {selectedClient?.cuit}
            </p>
          </div>
          <div className="flex-1 overflow-hidden px-4 pb-4 pt-3">
            <VoucherList
              vouchers={vouchers}
              draggingTransactionId={draggingTransactionId}
              onDropOnVoucher={handleDrop}
            />
          </div>
        </div>
      </div>

      {/* Auto-matched summary footer */}
      {matches.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3 flex flex-wrap items-center gap-3 text-sm shrink-0">
          <span className="font-bold text-green-700">
            ✓ {matches.filter((m) => m.tipo === 'automatico').length} matches automáticos encontrados
          </span>
          <span className="text-green-600">
            · {matches.filter((m) => m.tipo === 'manual').length} manuales
          </span>
          <span className="text-green-600">
            · {matches.filter((m) => m.confirmed).length} confirmados
          </span>
          <button
            className="ml-auto text-xs text-green-700 underline hover:no-underline"
            onClick={() => handleExport('excel')}
          >
            Exportar estado actual →
          </button>
        </div>
      )}
    </div>
  );
}
