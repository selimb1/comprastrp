// ============================================================
// ComproScan AR — Tipos de Conciliación Bancaria
// Contexto: Bancos argentinos (Nación, Galicia, BBVA, Santander,
//           Macro, ICBC, Brubank, Naranja X, Mercado Pago, etc.)
// ============================================================

export type TransactionType = 'debito' | 'credito';

export type ReconciliationStatus =
  | 'conciliado'   // Match automático o manual confirmado
  | 'pendiente'    // Sin match aún
  | 'parcial'      // Match parcial (diferencia de centavos, ajuste)
  | 'excluido'     // Marcado manualmente como "no conciliar" (ej: comisión bancaria)
  | 'manual';      // El contador lo concilió manualmente con drag & drop

export type MatchConfidence = 'alta' | 'media' | 'baja';

// ──────────────────────────────────────────────
// Movimiento individual del extracto bancario
// ──────────────────────────────────────────────
export interface BankTransaction {
  id: string;                        // UUID local (generado al parsear)
  fecha: string;                     // ISO: '2024-03-15'
  fecha_valor?: string;              // Fecha valor del banco (puede diferir)
  descripcion: string;               // Texto crudo del banco
  descripcion_normalizada?: string;  // Post-procesamiento IA: limpia y categoriza
  importe: number;                   // Positivo siempre — el tipo define débito/crédito
  tipo: TransactionType;             // 'debito' | 'credito'
  saldo?: number;                    // Saldo tras el movimiento
  referencia?: string;               // NRO cheque, transferencia, CBU debitante, etc.
  cuit_contraparte?: string;         // Si el banco lo informa (transferencias BBB/DEBIN)
  categoria?: string;                // Clasificación IA: 'pago_proveedor' | 'cobro_cliente' | 'impuesto' | 'comision' | etc.
  banco_origen?: string;             // 'Banco Nación' | 'Galicia' | 'BBVA', etc.
  status: ReconciliationStatus;
  matched_voucher_ids: string[];     // IDs de comprobantes que se asignaron a este mov.
  confidence?: MatchConfidence;      // Confianza del match automático
  confidence_score?: number;         // 0-100
  notas?: string;                    // Anotación del contador
}

// ──────────────────────────────────────────────
// Extracto bancario completo subido por el usuario
// ──────────────────────────────────────────────
export interface BankStatement {
  id: string;
  client_id: string;
  banco: string;                     // Nombre del banco detectado por IA
  cuenta?: string;                   // Número de cuenta / CBU (según lo que exponga el banco)
  periodo_desde: string;             // ISO date
  periodo_hasta: string;             // ISO date
  moneda: string;                    // 'ARS' | 'USD'
  saldo_inicial?: number;
  saldo_final?: number;
  total_debitos: number;
  total_creditos: number;
  transactions: BankTransaction[];
  archivo_nombre: string;
  archivo_tipo: 'pdf' | 'csv' | 'xlsx';
  created_at: string;
}

// ──────────────────────────────────────────────
// Comprobante simplificado para el panel de conciliación
// (subconjunto del ComprobanteAFIP completo)
// ──────────────────────────────────────────────
export interface VoucherSummary {
  id: string;
  tipo_comprobante: string;          // 'A' | 'B' | 'C' | etc.
  tipo_documento: string;            // 'factura' | 'ticket_fiscal' | etc.
  punto_venta: string;
  numero_comprobante: string;
  fecha_emision: string;             // ISO date
  cuit_emisor: string;
  razon_social_emisor?: string;
  total: number;
  moneda: string;
  reconciliation_status: ReconciliationStatus;
  matched_transaction_ids: string[];
}

// ──────────────────────────────────────────────
// Par de conciliación: un movimiento ↔ uno o más comprobantes
// ──────────────────────────────────────────────
export interface ReconciliationMatch {
  id: string;
  transaction_id: string;
  voucher_ids: string[];
  tipo: 'automatico' | 'manual' | 'parcial';
  confidence: MatchConfidence;
  confidence_score: number;          // 0-100
  diferencia: number;                // transaction.importe - sum(vouchers.total); 0 = perfecto
  criterios: MatchCriteria[];        // Qué criterios se usaron para el match
  created_at: string;
  confirmed: boolean;                // El contador lo confirmó
  notas?: string;
}

export type MatchCriteria =
  | 'importe_exacto'
  | 'importe_aproximado'    // ±2% tolerancia (redondeo, IVA, etc.)
  | 'fecha_exacta'
  | 'fecha_proxima'         // ±3 días hábiles
  | 'cuit_coincide'
  | 'referencia_coincide'   // Número de cheque, transferencia, etc.
  | 'descripcion_similar'   // NLP similarity > 0.75
  | 'monto_parcial';        // El mov. cubre varios comprobantes (suma)

// ──────────────────────────────────────────────
// Sesión activa de conciliación (estado global)
// ──────────────────────────────────────────────
export interface ReconciliationSession {
  id: string;
  client_id: string;
  statement: BankStatement | null;
  vouchers: VoucherSummary[];
  matches: ReconciliationMatch[];
  // Métricas calculadas
  stats: ReconciliationStats;
  // UI state
  view: 'upload' | 'processing' | 'reconcile';
  isProcessing: boolean;
  error?: string;
}

export interface ReconciliationStats {
  total_transacciones: number;
  conciliadas: number;
  pendientes: number;
  excluidas: number;
  manuales: number;
  porcentaje_conciliado: number;    // 0-100
  diferencia_total: number;         // Suma de diferencias no cubiertas
  total_debitos: number;
  total_creditos: number;
  total_comprobantes_conciliados: number;
}

// ──────────────────────────────────────────────
// Payload para solicitar el reporte final
// ──────────────────────────────────────────────
export interface ReportRequest {
  session_id: string;
  client_id: string;
  formato: 'pdf' | 'excel';
  incluir_detalle: boolean;
  incluir_pendientes: boolean;
  notas_adicionales?: string;
}

// ──────────────────────────────────────────────
// Respuesta del backend al subir un extracto
// ──────────────────────────────────────────────
export interface StatementUploadResponse {
  statement: BankStatement;
  auto_matches: ReconciliationMatch[];
  stats: ReconciliationStats;
}

// ──────────────────────────────────────────────
// Bancos argentinos conocidos (para UI dropdown)
// ──────────────────────────────────────────────
export const BANCOS_ARGENTINOS = [
  'Banco de la Nación Argentina',
  'Banco de la Provincia de Buenos Aires',
  'Banco Galicia',
  'Banco BBVA Argentina',
  'Banco Santander Argentina',
  'Banco Macro',
  'Banco ICBC',
  'Banco Patagonia',
  'Banco Supervielle',
  'Banco Ciudad de Buenos Aires',
  'Banco Provincia de Córdoba',
  'Banco Credicoop',
  'Banco de la Provincia de Córdoba',
  'Banco Comafi',
  'Brubank',
  'Naranja X',
  'Mercado Pago',
  'Ualá',
  'Lemon Cash',
  'Otro / Desconocido',
] as const;

export type BancoArgentino = (typeof BANCOS_ARGENTINOS)[number];
