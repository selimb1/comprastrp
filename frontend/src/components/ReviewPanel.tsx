import { useState, useEffect, type FormEvent } from 'react';
import { FileText, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExtractedData {
  tipo_documento?: string;
  tipo_comprobante: string;
  punto_venta: string;
  numero_comprobante: string;
  fecha_emision: string;
  cuit_emisor: string;
  moneda: string;
  importes: {
    neto_gravado_21: number;
    iva_21: number;
    no_gravado?: number;
    exento?: number;
    total: number;
  };
}

interface ReviewPanelProps {
  imagePreviewUrl: string | null;
  extractedData: ExtractedData | null;
  isLoading: boolean;
  currentIndex: number;
  totalFiles: number;
  onApprove: (data: ExtractedData) => void;
}

export default function ReviewPanel({ imagePreviewUrl, extractedData, isLoading, currentIndex, totalFiles, onApprove }: ReviewPanelProps) {
  
  const [formData, setFormData] = useState<ExtractedData | null>(null);

  useEffect(() => {
    if (extractedData) {
      setFormData(JSON.parse(JSON.stringify(extractedData))); // Deep copy para evitar mutar el origen
    }
  }, [extractedData]);

  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
        <div className="w-12 h-12 border-4 border-brand-sage border-t-brand-accent rounded-full animate-spin mb-4"></div>
        <h3 className="text-xl font-semibold text-brand-navy">Analizando Comprobante con IA...</h3>
        <p className="text-sm text-brand-sage mt-2">Extrayendo datos de ARCA y validando matemáticas.</p>
      </div>
    );
  }

  if (!imagePreviewUrl || !formData) return null;

  const validateCuitModulo11 = (cuit: string) => {
    if (!cuit || cuit.length !== 11) return false;
    const base = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cuit[i]) * base[i];
    }
    let verifier = 11 - (sum % 11);
    if (verifier === 11) verifier = 0;
    if (verifier === 10) verifier = 9;
    return verifier.toString() === cuit[10];
  };

  const isValidCuit = validateCuitModulo11(formData.cuit_emisor);
  const noGravadoExento = (formData.importes.no_gravado || 0) + (formData.importes.exento || 0);
  const mathCalculado = (formData.importes.neto_gravado_21 || 0) + (formData.importes.iva_21 || 0) + noGravadoExento;
  
  const tipo = formData.tipo_comprobante?.toUpperCase().replace(/FACTURA|TIPO|F\./g, '').trim();
  
  // Tickets fiscales y Tickets Factura/Combustible no discriminan IVA (igual que B/C)
  const tipoDoc = formData.tipo_documento || 'factura';
  const isTicket = ['ticket_fiscal', 'ticket_factura', 'ticket_combustible'].includes(tipoDoc);
  const isSinIvaDiscriminado = ['B', 'C', 'E', 'T'].includes(tipo) || isTicket;

  // Badge metadata para el tipo de documento
  const docTypeMeta: Record<string, { label: string; color: string; bg: string }> = {
    factura:           { label: '\uD83D\uDCC4 Factura Electrónica', color: '#0e4d92', bg: '#e8f0fe' },
    ticket_fiscal:     { label: '\uD83E\uDDE7 Ticket Controlador Fiscal', color: '#1a6b3c', bg: '#d4edda' },
    ticket_factura:    { label: '\uD83E\uDDFE Ticket Factura', color: '#7f4f24', bg: '#fff3cd' },
    ticket_combustible:{ label: '\u26FD Ticket Combustible', color: '#7b2d00', bg: '#ffe5d0' },
  };
  const docMeta = docTypeMeta[tipoDoc] || docTypeMeta['factura'];

  let isMathValid = false;
  if (isSinIvaDiscriminado && mathCalculado === 0) {
    isMathValid = (formData.importes.total || 0) > 0;
  } else {
    isMathValid = Math.abs(mathCalculado - (formData.importes.total || 0)) <= 1.0;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); // Evita recargar la pagina si el usuario oprime Enter
    onApprove(formData);
  };

  const updateImportes = (key: keyof ExtractedData['importes'], value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      importes: {
        ...prev.importes,
        [key]: parseFloat(value) || 0
      }
    }));
  };

  const updateField = (key: keyof ExtractedData, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col lg:flex-row overflow-hidden animate-in slide-in-from-bottom-4 duration-500 h-[80vh] min-h-[600px] max-h-[800px]">
      
      {/* PANEL IZQUIERDO: Visor de Documento */}
      <div className="lg:w-1/2 bg-gray-100 p-4 border-r border-gray-200 flex flex-col relative">
        <div className="flex items-center justify-between mb-3 px-2">
          <h4 className="font-semibold text-brand-navy flex items-center gap-2">
            <FileText size={18} className="text-brand-accent"/> Documento Original
          </h4>
          <span className="text-[10px] uppercase tracking-widest bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold">Zoom habilitado</span>
        </div>
        <div className="flex-1 bg-white rounded-xl overflow-hidden border border-gray-300 relative cursor-zoom-in shadow-inner">
          <img src={imagePreviewUrl} alt="Comprobante" className="w-full h-full object-contain absolute inset-0 py-4" />
        </div>
      </div>

      {/* PANEL DERECHO: Formulario Keyboard-First (Productivo) */}
      <form onSubmit={handleSubmit} className="lg:w-1/2 p-6 md:p-8 flex flex-col bg-white overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-gray-100 gap-4">
           <div>
             <h3 className="text-2xl font-extrabold text-brand-navy tracking-tight">Datos Fiscales</h3>
             <p className="text-sm text-gray-500 mt-1">
               Corrobora y oprime <kbd className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-xs font-mono text-gray-600 shadow-sm mx-1">ENTER</kbd> para aprobar.
             </p>
             {/* Badge tipo de documento */}
             <span
               className="inline-block mt-2 text-[11px] font-bold px-3 py-1 rounded-full tracking-wide"
               style={{ color: docMeta.color, background: docMeta.bg }}
             >
               {docMeta.label}
             </span>
           </div>
           {(!isMathValid || !isValidCuit) && (
             <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 text-[13px] font-semibold border border-red-200 shadow-sm">
               <AlertTriangle size={18} className="shrink-0" /> Inconsistencia
             </div>
           )}
        </div>

        <div className="flex-1 space-y-5">
           {/* Seccion: Cabecera ARCA */}
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tipo</label>
                <input 
                  autoFocus 
                  type="text" 
                  value={formData.tipo_comprobante} 
                  onChange={(e) => updateField('tipo_comprobante', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-brand-navy focus:ring-2 focus:ring-brand-sage outline-none transition-all shadow-sm" 
                  tabIndex={1}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Punto Vta</label>
                <input 
                  type="text" 
                  value={formData.punto_venta} 
                  onChange={(e) => updateField('punto_venta', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-brand-navy focus:ring-2 focus:ring-brand-sage outline-none transition-all shadow-sm" 
                  tabIndex={2}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Nro Comprobante</label>
                <input 
                  type="text" 
                  value={formData.numero_comprobante} 
                  onChange={(e) => updateField('numero_comprobante', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-brand-navy focus:ring-2 focus:ring-brand-sage outline-none transition-all shadow-sm" 
                  tabIndex={3}
                />
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Fecha Emisión</label>
                <input 
                  type="date" 
                  value={formData.fecha_emision} 
                  onChange={(e) => updateField('fecha_emision', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-sage outline-none transition-all shadow-sm" 
                  tabIndex={4}
                />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">CUIT Emisor</label>
                 <div className="relative">
                    <input 
                      type="text" 
                      value={formData.cuit_emisor} 
                      onChange={(e) => updateField('cuit_emisor', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 outline-none transition-all shadow-sm ${isValidCuit ? 'border-gray-200 text-brand-navy focus:ring-brand-sage' : 'border-red-400 bg-red-50 text-red-800 focus:ring-red-500'}`} 
                      tabIndex={5}
                    />
                    {!isValidCuit && <AlertTriangle size={16} className="absolute right-3 top-2.5 text-red-500" />}
                 </div>
              </div>
           </div>

           <div className="bg-[#f0f4f4] p-5 rounded-xl border border-brand-sage/30 space-y-4">
              <h4 className="font-bold text-brand-navy text-[11px] uppercase tracking-widest border-b border-brand-sage/20 pb-2 mb-2">
                 Desglose de Importes (ARS)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Neto Grav. 21%</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.importes.neto_gravado_21 || ''} 
                    onChange={(e) => updateImportes('neto_gravado_21', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-200 rounded text-sm text-right font-mono focus:ring-2 focus:ring-brand-sage outline-none shadow-sm" 
                    tabIndex={6}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">IVA 21%</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.importes.iva_21 || ''} 
                    onChange={(e) => updateImportes('iva_21', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-200 rounded text-sm text-right font-mono focus:ring-2 focus:ring-brand-sage outline-none shadow-sm" 
                    tabIndex={7}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 truncate">No Grav / Exento</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={noGravadoExento || ''} 
                    onChange={(e) => updateImportes('no_gravado', e.target.value)}
                    className="w-full px-2 py-2 border border-gray-200 rounded text-sm text-right font-mono focus:ring-2 focus:ring-brand-sage outline-none shadow-sm" 
                    tabIndex={8}
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-brand-sage/20 flex justify-between items-center mt-2">
                 <span className="font-extrabold text-[#1e293b] tracking-widest text-lg">TOTAL FACTURADO</span>
                 <input 
                    type="number" 
                    step="0.01"
                    value={formData.importes.total || ''} 
                    onChange={(e) => updateImportes('total', e.target.value)}
                    className={`w-1/2 px-3 py-2 border rounded-lg font-bold text-right text-lg focus:ring-2 outline-none transition-all shadow-sm ${isMathValid ? 'border-gray-300 bg-white focus:ring-brand-sage' : 'border-red-400 bg-red-50 text-red-700 focus:ring-red-500 ring-2 ring-red-100'}`} 
                    tabIndex={9}
                 />
              </div>
           </div>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 mt-auto">
          <button 
            type="submit" 
            tabIndex={10}
            className="w-full bg-[#1e293b] text-white font-bold py-4 rounded-xl hover:bg-[#0f172a] focus:ring-4 focus:ring-brand-sage/50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 group"
          >
             {currentIndex + 1 === totalFiles ? `Finalizar y Generar Exportación (${currentIndex + 1}/${totalFiles})` : `Aprobar y Siguiente (${currentIndex + 1}/${totalFiles})`} 
             <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
}
