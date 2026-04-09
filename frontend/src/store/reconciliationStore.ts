// ============================================================
// ComproScan AR — Store de Conciliación Bancaria (Zustand)
// ============================================================
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  ReconciliationSession,
  ReconciliationMatch,
  BankStatement,
  VoucherSummary,
  ReconciliationStats,
  ReconciliationStatus,
} from '../types/reconciliation';

// ──────────────────────────────────────────────
// Stats calculator (pure function)
// ──────────────────────────────────────────────
function calcStats(
  statement: BankStatement | null,
  matches: ReconciliationMatch[]
): ReconciliationStats {
  const txs = statement?.transactions ?? [];
  const conciliadas = txs.filter((t) => t.status === 'conciliado').length;
  const pendientes = txs.filter((t) => t.status === 'pendiente').length;
  const excluidas = txs.filter((t) => t.status === 'excluido').length;
  const manuales = txs.filter((t) => t.status === 'manual').length;
  const total = txs.length;
  const diferencia_total = matches.reduce((acc, m) => acc + Math.abs(m.diferencia), 0);
  const total_comprobantes_conciliados = matches.reduce(
    (acc, m) => acc + m.voucher_ids.length,
    0
  );

  return {
    total_transacciones: total,
    conciliadas,
    pendientes,
    excluidas,
    manuales,
    porcentaje_conciliado: total > 0 ? Math.round((conciliadas / total) * 100) : 0,
    diferencia_total,
    total_debitos: statement?.total_debitos ?? 0,
    total_creditos: statement?.total_creditos ?? 0,
    total_comprobantes_conciliados,
  };
}

// ──────────────────────────────────────────────
// Initial state
// ──────────────────────────────────────────────
const EMPTY_STATS: ReconciliationStats = {
  total_transacciones: 0,
  conciliadas: 0,
  pendientes: 0,
  excluidas: 0,
  manuales: 0,
  porcentaje_conciliado: 0,
  diferencia_total: 0,
  total_debitos: 0,
  total_creditos: 0,
  total_comprobantes_conciliados: 0,
};

const INITIAL_SESSION: ReconciliationSession = {
  id: '',
  client_id: '',
  statement: null,
  vouchers: [],
  matches: [],
  stats: EMPTY_STATS,
  view: 'upload',
  isProcessing: false,
};

// ──────────────────────────────────────────────
// Store interface
// ──────────────────────────────────────────────
interface ReconciliationStore {
  session: ReconciliationSession;

  // Actions — Session lifecycle
  startSession: (clientId: string) => void;
  resetSession: () => void;

  // Actions — Data loading
  setStatement: (statement: BankStatement) => void;
  setVouchers: (vouchers: VoucherSummary[]) => void;
  setMatches: (matches: ReconciliationMatch[]) => void;
  setView: (view: ReconciliationSession['view']) => void;
  setProcessing: (v: boolean) => void;
  setError: (e: string | undefined) => void;

  // Actions — Manual reconciliation
  addManualMatch: (transactionId: string, voucherIds: string[]) => void;
  removeMatch: (matchId: string) => void;
  confirmMatch: (matchId: string) => void;
  excludeTransaction: (transactionId: string) => void;
  setTransactionNote: (transactionId: string, note: string) => void;
  setTransactionStatus: (transactionId: string, status: ReconciliationStatus) => void;

  // Derived
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;

  // Filters (UI state, not part of session)
  filterStatus: ReconciliationStatus | 'all';
  setFilterStatus: (s: ReconciliationStatus | 'all') => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
}

// ──────────────────────────────────────────────
// Store implementation
// ──────────────────────────────────────────────
export const useReconciliationStore = create<ReconciliationStore>()(
  devtools(
    (set, get) => ({
      session: { ...INITIAL_SESSION },
      selectedClientId: '',
      filterStatus: 'all',
      searchTerm: '',

      setSelectedClientId: (id) => set({ selectedClientId: id }),
      setFilterStatus: (s) => set({ filterStatus: s }),
      setSearchTerm: (s) => set({ searchTerm: s }),

      startSession: (clientId) =>
        set({
          session: {
            ...INITIAL_SESSION,
            id: `session-${Date.now()}`,
            client_id: clientId,
            view: 'upload',
          },
        }),

      resetSession: () =>
        set({ session: { ...INITIAL_SESSION }, selectedClientId: '' }),

      setStatement: (statement) =>
        set((state) => ({
          session: {
            ...state.session,
            statement,
            stats: calcStats(statement, state.session.matches),
          },
        })),

      setVouchers: (vouchers) =>
        set((state) => ({ session: { ...state.session, vouchers } })),

      setMatches: (matches) =>
        set((state) => ({
          session: {
            ...state.session,
            matches,
            stats: calcStats(state.session.statement, matches),
          },
        })),

      setView: (view) =>
        set((state) => ({ session: { ...state.session, view } })),

      setProcessing: (v) =>
        set((state) => ({ session: { ...state.session, isProcessing: v } })),

      setError: (e) =>
        set((state) => ({ session: { ...state.session, error: e } })),

      addManualMatch: (transactionId, voucherIds) => {
        const { session } = get();
        if (!session.statement) return;

        const newMatch: ReconciliationMatch = {
          id: `match-manual-${Date.now()}`,
          transaction_id: transactionId,
          voucher_ids: voucherIds,
          tipo: 'manual',
          confidence: 'alta', // Manual = el contador lo decidió
          confidence_score: 100,
          diferencia: 0, // Calculable pero omitido en UI por simplicidad
          criterios: [],
          created_at: new Date().toISOString(),
          confirmed: true,
        };

        // Actualizar estado de la transacción
        const updatedTxs = session.statement.transactions.map((t) =>
          t.id === transactionId
            ? { ...t, status: 'manual' as ReconciliationStatus, matched_voucher_ids: voucherIds }
            : t
        );

        const updatedStatement = { ...session.statement, transactions: updatedTxs };
        const updatedMatches = [...session.matches, newMatch];

        set((state) => ({
          session: {
            ...state.session,
            statement: updatedStatement,
            matches: updatedMatches,
            stats: calcStats(updatedStatement, updatedMatches),
          },
        }));
      },

      removeMatch: (matchId) => {
        const { session } = get();
        const match = session.matches.find((m) => m.id === matchId);
        if (!match || !session.statement) return;

        const updatedTxs = session.statement.transactions.map((t) =>
          t.id === match.transaction_id
            ? { ...t, status: 'pendiente' as ReconciliationStatus, matched_voucher_ids: [] }
            : t
        );

        const updatedStatement = { ...session.statement, transactions: updatedTxs };
        const updatedMatches = session.matches.filter((m) => m.id !== matchId);

        set((state) => ({
          session: {
            ...state.session,
            statement: updatedStatement,
            matches: updatedMatches,
            stats: calcStats(updatedStatement, updatedMatches),
          },
        }));
      },

      confirmMatch: (matchId) =>
        set((state) => ({
          session: {
            ...state.session,
            matches: state.session.matches.map((m) =>
              m.id === matchId ? { ...m, confirmed: true } : m
            ),
          },
        })),

      excludeTransaction: (transactionId) => {
        const { session } = get();
        if (!session.statement) return;

        const updatedTxs = session.statement.transactions.map((t) =>
          t.id === transactionId ? { ...t, status: 'excluido' as ReconciliationStatus } : t
        );

        const updatedStatement = { ...session.statement, transactions: updatedTxs };
        set((state) => ({
          session: {
            ...state.session,
            statement: updatedStatement,
            stats: calcStats(updatedStatement, state.session.matches),
          },
        }));
      },

      setTransactionNote: (transactionId, note) => {
        const { session } = get();
        if (!session.statement) return;
        const updatedTxs = session.statement.transactions.map((t) =>
          t.id === transactionId ? { ...t, notas: note } : t
        );
        set((state) => ({
          session: {
            ...state.session,
            statement: { ...state.session.statement!, transactions: updatedTxs },
          },
        }));
      },

      setTransactionStatus: (transactionId, status) => {
        const { session } = get();
        if (!session.statement) return;
        const updatedTxs = session.statement.transactions.map((t) =>
          t.id === transactionId ? { ...t, status } : t
        );
        const updatedStatement = { ...session.statement, transactions: updatedTxs };
        set((state) => ({
          session: {
            ...state.session,
            statement: updatedStatement,
            stats: calcStats(updatedStatement, state.session.matches),
          },
        }));
      },
    }),
    { name: 'ReconciliationStore' }
  )
);
