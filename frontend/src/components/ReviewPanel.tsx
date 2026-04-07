import { useState, useEffect, type FormEvent } from 'react';
import { FileText, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface Importes {
  neto_gravado_21: number;
  neto_gravado_105: number;
  neto_gravado_27: number;
  exento: number;
  no_gravado: number;
  iva_21: number;
  iva_105: number;
  iva_27: number;
  percepcion_iva: number;
  percepcion_iibb: number;
  percepcion_ganancias: number;
  percepcion_suss: number;
  total: number;
}

interface ExtractedData {
  tipo_documento?: string;
  tipo_comprobante: string;
  codigo_afip_sugerido?: number | null;
  punto_venta: string;
  numero_comprobante: string;
  fecha_emision: string;
  cuit_emisor: string;
  razon_social_emisor?: string | null;
  cae?: string | null;
  moneda: string;
  importes: Importes;
}

interface ReviewPanelProps {
  imagePreviewUrl: string | null;
  extractedData: ExtractedData | null;
  isLoading: boolean;
  currentIndex: number;
  totalFiles: number;
  onApprove: (data: ExtractedData) => void;
}

const TIPO_DOC_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  factura:            { label: '📄 Factura Electrónica', color: '#0e4d92', bg: '#e8f0fe', border: '#b8d0f8' },
  ticket_fiscal:      { label: '🧾 Ticket Controlador Fiscal', color: '#1a6b3c', bg: '#d4edda', border: '#a3d4b0' },
  ticket_factura:     { label: '🧾 Ticket Factura (CF)', color: '#7f4f24', bg: '#fff3cd', border: '#f5d88a' },
  ticket_combustible: { label: '⛽ Ticket Combustible', color: '#7b2d00', bg: '#ffe5d0', border: '#f5bc99' },
};

export default function ReviewPanel({
  imagePreviewUrl,
  extractedData,
  isLoading,
  currentIndex,
  totalFiles,
  onApprove,
}: ReviewPanelProps) {
  const [formData, setFormData] = useState<ExtractedData | null>(null);
  const [zoomIn, setZoomIn] = useState(false);

  useEffect(() => {
    if (extractedData) {
      const defaultImportes: Importes = {
        neto_gravado_21: 0, neto_gravado_105: 0, neto_gravado_27: 0,
        exento: 0, no_gravado: 0,
        iva_21: 0, iva_105: 0, iva_27: 0,
        percepcion_iva: 0, percepcion_iibb: 0, percepcion_ganancias: 0, percepcion_suss: 0,
        total: 0,
      };
      setFormData({
        ...extractedData,
        importes: { ...defaultImportes, ...extractedData.importes },
      });
    }
  }, [extractedData]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
        <div className="w-12 h-12 border-4 border-brand-sage border-t-brand-accent rounded-full animate-spin mb-4"></div>
        <h3 className="text-xl font-semibold text-brand-navy">Analizando comprobante...</h3>
        <p className="text-sm text-brand-sage mt-2">Extrayendo datos de ARCA y validando matemáticas.</p>
      </div>
    );
  }

  if (!imagePreviewUrl || !formData) return null;

  // ── Validaciones ──────────────────────────────────────────────
  const validateCuit = (cuit: string) => {
    if (!cuit || cuit.length !== 11) return false;
    const base = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cuit[i]) * base[i];
    let v = 11 - (sum % 11);
    if (v === 11) v = 0;
    if (v === 10) v = 9;
    return v.toString() === cuit[10];
  };

  const im = formData.importes;
  const tipoDoc = formData.tipo_documento || 'factura';
  const tipoComp = (formData.tipo_comprobante || '').toUpperCase().replace(/FACTURA|TIPO|F\./g, '').trim();
  const isSinIva = ['B', 'C', 'E', 'T'].includes(tipoComp) || tipoDoc === 'ticket_fiscal';

  const isValidCuit = validateCuit(formData.cuit_emisor);

  // Suma todos los componentes del total
  const mathSum =
    (im.neto_gravado_21 || 0) + (im.neto_gravado_105 || 0) + (im.neto_gravado_27 || 0) +
    (im.exento || 0) + (im.no_gravado || 0) +
    (im.iva_21 || 0) + (im.iva_105 || 0) + (im.iva_27 || 0) +
    (im.percepcion_iva || 0) + (im.percepcion_iibb || 0) +
    (im.percepcion_ganancias || 0) + (im.percepcion_suss || 0);

  let isMathValid: boolean;
  if (isSinIva && mathSum === 0) {
    // Tickets sin discriminar: solo necesitamos que el total sea > 0
    isMathValid = (im.total || 0) > 0;
  } else if (mathSum === 0 && (im.total || 0) > 0) {
    // Si todo es 0 pero hay total (Factura B) -> ok
    isMathValid = true;
  } else {
    isMathValid = Math.abs(mathSum - (im.total || 0)) <= 1.0;
  }

  const docMeta = TIPO_DOC_META[tipoDoc] || TIPO_DOC_META['factura'];

  // ── Helpers de actualización ──────────────────────────────────
  const updateField = (key: keyof ExtractedData, value: string) =>
    setFormData((prev: any) => ({ ...prev, [key]: value }));

  const updateImporte = (key: keyof Importes, value: string) =>
    setFormData((prev: any) => ({
      ...prev,
      importes: { ...prev.importes, [key]: parseFloat(value) || 0 },
    }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onApprove(formData);
  };

  // ── Componente campo importe ──────────────────────────────────
  const ImporteField = ({
    label, fieldKey, tabIdx, highlight = false
  }: { label: string; fieldKey: keyof Importes; tabIdx: number; highlight?: boolean }) => (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</label>
      <input
        type="number"
        step="0.01"
        min="0"
        value={im[fieldKey] || ''}
        onChange={(e) => updateImporte(fieldKey, e.target.value)}
        placeholder="0.00"
        className={`w-full px-2 py-2 border rounded text-sm text-right font-mono focus:ring-2 focus:ring-brand-sage outline-none shadow-sm transition-all ${
          highlight ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-white'
        }`}
        tabIndex={tabIdx}
      />
    </div>
  );

  return (
    <div className="w-full bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col lg:flex-row overflow-hidden animate-in slide-in-from-bottom-4 duration-500 h-[85vh] min-h-[600px] max-h-[900px]">

      {/* ── PANEL IZQUIERDO: Visor ── */}
      <div className="lg:w-[45%] bg-gray-100 p-4 border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="font-semibold text-brand-navy flex items-center gap-2 text-sm">
            <FileText size={16} className="text-brand-accent" /> Documento Original
          </h4>
          <button
            type="button"
            onClick={() => setZoomIn(!zoomIn)}
            className="text-[10px] uppercase tracking-widest bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-1 rounded font-bold transition-colors cursor-pointer"
          >
            {zoomIn ? 'Zoom OUT' : 'Zoom IN'}
          </button>
        </div>
        <div className="flex-1 bg-white rounded-xl overflow-auto border border-gray-300 relative shadow-inner">
          <img
            src={imagePreviewUrl}
            alt="Comprobante"
            className={`transition-all duration-300 ${zoomIn ? 'w-[200%] max-w-none cursor-zoom-out' : 'w-full h-full object-contain absolute inset-0 py-2 cursor-zoom-in'}`}
            onClick={() => setZoomIn(!zoomIn)}
          />
        </div>
      </div>

      {/* ── PANEL DERECHO: Formulario ── */}
      <form onSubmit={handleSubmit} className="lg:w-[55%] flex flex-col bg-white overflow-y-auto">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold text-brand-navy tracking-tight">Datos Fiscales</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Comprobante {currentIndex + 1} de {totalFiles} · Presioná <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-[10px] font-mono shadow-sm">ENTER</kbd> para aprobar
              </p>
              <span
                className="inline-block mt-2 text-[11px] font-bold px-3 py-1 rounded-full tracking-wide border"
                style={{ color: docMeta.color, background: docMeta.bg, borderColor: docMeta.border }}
              >
                {docMeta.label}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold border shrink-0 ${
              isMathValid && isValidCuit
                ? 'text-green-700 bg-green-50 border-green-200'
                : 'text-red-700 bg-red-50 border-red-200'
            }`}>
              {isMathValid && isValidCuit
                ? <><CheckCircle2 size={16} /> OK</>
                : <><AlertTriangle size={16} /> Revisar</>}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* Fila 1: Tipo Comprobante / Tipo Doc / Punto Venta / Nro */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Identificación del Comprobante</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tipo Doc.</label>
                <select
                  value={tipoDoc}
                  onChange={(e) => updateField('tipo_documento', e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded text-xs font-bold text-brand-navy focus:ring-2 focus:ring-brand-sage outline-none shadow-sm bg-white"
                  tabIndex={1}
                >
                  <option value="factura">Factura Electrónica</option>
                  <option value="ticket_fiscal">Ticket Fiscal</option>
                  <option value="ticket_factura">Ticket Factura</option>
                  <option value="ticket_combustible">Ticket Combustible</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Letra</label>
                <input
                  autoFocus
                  type="text"
                  value={formData.tipo_comprobante}
                  onChange={(e) => updateField('tipo_comprobante', e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded text-sm font-bold text-brand-navy focus:ring-2 focus:ring-brand-sage outline-none shadow-sm"
                  tabIndex={2}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pto Vta</label>
                <input
                  type="text"
                  value={formData.punto_venta}
                  onChange={(e) => updateField('punto_venta', e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded text-sm font-mono text-brand-navy focus:ring-2 focus:ring-brand-sage outline-none shadow-sm"
                  tabIndex={3}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Nro.</label>
                <input
                  type="text"
                  value={formData.numero_comprobante}
                  onChange={(e) => updateField('numero_comprobante', e.target.value)}
                  className="w-full px-2 py-2 border border-gray-200 rounded text-sm font-mono text-brand-navy focus:ring-2 focus:ring-brand-sage outline-none shadow-sm"
                  tabIndex={4}
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Fecha, CUIT, Razón Social, CAE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha Emisión</label>
              <input
                type="date"
                value={formData.fecha_emision}
                onChange={(e) => updateField('fecha_emision', e.target.value)}
                className="w-full px-2 py-2 border border-gray-200 rounded text-sm font-medium focus:ring-2 focus:ring-brand-sage outline-none shadow-sm"
                tabIndex={5}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">CUIT Emisor</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.cuit_emisor}
                  onChange={(e) => updateField('cuit_emisor', e.target.value)}
                  className={`w-full px-2 py-2 pr-7 border rounded text-sm font-mono focus:ring-2 outline-none shadow-sm transition-all ${
                    isValidCuit ? 'border-gray-200 text-brand-navy focus:ring-brand-sage' : 'border-red-400 bg-red-50 text-red-800 focus:ring-red-500'
                  }`}
                  tabIndex={6}
                />
                {!isValidCuit && <AlertTriangle size={14} className="absolute right-2 top-2.5 text-red-500" />}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Razón Social Emisor</label>
              <input
                type="text"
                value={formData.razon_social_emisor || ''}
                onChange={(e) => updateField('razon_social_emisor', e.target.value)}
                placeholder="Ej: COTO S.A., YPF S.A., JUMBO RETAIL ARGENTINA S.A."
                className="w-full px-2 py-2 border border-gray-200 rounded text-sm text-brand-navy focus:ring-2 focus:ring-brand-sage outline-none shadow-sm"
                tabIndex={7}
              />
            </div>
          </div>

          {/* CAE (solo facturas electrónicas) */}
          {tipoDoc === 'factura' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">CAE</label>
              <input
                type="text"
                value={formData.cae || ''}
                onChange={(e) => updateField('cae', e.target.value)}
                placeholder="14 dígitos"
                className="w-full px-2 py-2 border border-gray-200 rounded text-sm font-mono text-brand-navy focus:ring-2 focus:ring-brand-sage outline-none shadow-sm"
                tabIndex={8}
              />
            </div>
          )}

          {/* Importes */}
          <div className="bg-[#f0f4f4] p-4 rounded-xl border border-brand-sage/30 space-y-4">
            <h4 className="font-bold text-brand-navy text-[10px] uppercase tracking-widest border-b border-brand-sage/20 pb-2">
              Desglose de Importes (ARS)
            </h4>

            {/* Alícuota 21% */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">IVA 21%</p>
              <div className="grid grid-cols-2 gap-3">
                <ImporteField label="Neto Gravado 21%" fieldKey="neto_gravado_21" tabIdx={9} />
                <ImporteField label="IVA 21%" fieldKey="iva_21" tabIdx={10} highlight />
              </div>
            </div>

            {/* Alícuota 10.5% */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">IVA 10.5%</p>
              <div className="grid grid-cols-2 gap-3">
                <ImporteField label="Neto Gravado 10.5%" fieldKey="neto_gravado_105" tabIdx={11} />
                <ImporteField label="IVA 10.5%" fieldKey="iva_105" tabIdx={12} highlight />
              </div>
            </div>

            {/* Alícuota 27% */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">IVA 27%</p>
              <div className="grid grid-cols-2 gap-3">
                <ImporteField label="Neto Gravado 27%" fieldKey="neto_gravado_27" tabIdx={13} />
                <ImporteField label="IVA 27%" fieldKey="iva_27" tabIdx={14} highlight />
              </div>
            </div>

            {/* Exento / No Gravado */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Exento / No Gravado</p>
              <div className="grid grid-cols-2 gap-3">
                <ImporteField label="Exento" fieldKey="exento" tabIdx={15} />
                <ImporteField label="No Gravado" fieldKey="no_gravado" tabIdx={16} />
              </div>
            </div>

            {/* Percepciones */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 mb-2 uppercase tracking-wider">Percepciones</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <ImporteField label="Perc. IVA" fieldKey="percepcion_iva" tabIdx={17} />
                <ImporteField label="Perc. IIBB" fieldKey="percepcion_iibb" tabIdx={18} />
                <ImporteField label="Perc. Gcias" fieldKey="percepcion_ganancias" tabIdx={19} />
                <ImporteField label="Perc. SUSS" fieldKey="percepcion_suss" tabIdx={20} />
              </div>
            </div>

            {/* Total */}
            <div className="pt-3 border-t border-brand-sage/20 flex justify-between items-center">
              <div>
                <span className="font-extrabold text-[#1e293b] tracking-widest text-base">TOTAL</span>
                {!isSinIva && mathSum > 0 && (
                  <p className={`text-[10px] mt-0.5 font-semibold ${
                    isMathValid ? 'text-green-600' : 'text-red-500'
                  }`}>
                    Calculado: ${mathSum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={im.total || ''}
                onChange={(e) => updateImporte('total', e.target.value)}
                className={`w-1/2 px-3 py-2 border rounded-lg font-bold text-right text-base focus:ring-2 outline-none transition-all shadow-sm ${
                  isMathValid ? 'border-gray-300 bg-white focus:ring-brand-sage' : 'border-red-400 bg-red-50 text-red-700 focus:ring-red-500 ring-1 ring-red-200'
                }`}
                tabIndex={21}
              />
            </div>
          </div>
        </div>

        {/* Footer: Botón aprobar */}
        <div className="px-6 pb-6 pt-3 border-t border-gray-100 shrink-0">
          <button
            type="submit"
            tabIndex={22}
            className="w-full bg-[#1e293b] text-white font-bold py-3.5 rounded-xl hover:bg-[#0f172a] focus:ring-4 focus:ring-brand-sage/50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
          >
            {currentIndex + 1 === totalFiles
              ? `✅ Finalizar y Exportar (${currentIndex + 1}/${totalFiles})`
              : `Aprobar y Siguiente (${currentIndex + 1}/${totalFiles})`
            }
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </form>
    </div>
  );
}
