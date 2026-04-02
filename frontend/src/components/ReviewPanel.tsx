import { FileText, CheckCircle, AlertTriangle, Download, ArrowRight } from 'lucide-react';

interface ExtractedData {
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
  
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        <div className="w-12 h-12 border-4 border-brand-sage border-t-brand-accent rounded-full animate-spin mb-4"></div>
        <h3 className="text-xl font-semibold text-brand-navy">Analizando Comprobante...</h3>
        <p className="text-sm text-brand-sage mt-2">Corriendo OCR, validación Módulo 11 y sumatoria de IVAs.</p>
      </div>
    );
  }

  if (!imagePreviewUrl || !extractedData) return null;

  // Calculo de Módulo 11 en frontend para feedback visual rápido a pesar de validarse en backend
  const isValidCuit = extractedData.cuit_emisor.length === 11;
  const noGravadoExento = (extractedData.importes.no_gravado || 0) + (extractedData.importes.exento || 0);
  const isMathValid = Math.abs((extractedData.importes.neto_gravado_21 + extractedData.importes.iva_21 + noGravadoExento) - extractedData.importes.total) <= 1.0;

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col md:flex-row overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Visualizador de imagen interactivo (Left Panel) */}
      <div className="md:w-1/2 bg-gray-50 p-4 border-r border-gray-100 flex flex-col">
        <div className="flex items-center justify-between mb-3 px-2">
          <h4 className="font-semibold text-brand-navy flex items-center gap-2">
            <FileText size={18} className="text-brand-accent"/> Documento Original
          </h4>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Zoom habilitado</span>
        </div>
        <div className="flex-1 bg-gray-200 rounded-lg overflow-hidden border border-gray-200 relative group cursor-zoom-in min-h-[400px]">
          {/* Mockup del Zoomable Image */}
          <img src={imagePreviewUrl} alt="Comprobante" className="w-full h-full object-contain absolute inset-0" />
        </div>
      </div>

      {/* Formulario Magico de Revision (Right Panel) */}
      <div className="md:w-1/2 p-6 flex flex-col bg-white">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
           <div>
             <h3 className="text-xl font-bold text-brand-navy">Estructura Extraída</h3>
             <p className="text-sm text-brand-sage">Modifica los campos si es necesario antes de exportar.</p>
           </div>
           {isMathValid && isValidCuit ? (
             <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium border border-green-200">
               <CheckCircle size={16} /> Todo Válido
             </div>
           ) : (
             <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-medium border border-red-200">
               <AlertTriangle size={16} /> Revisar Error
             </div>
           )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
           {/* Section 1: Cabecera AFIP */}
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo Comp.</label>
                <input type="text" defaultValue={extractedData.tipo_comprobante} className="input-field font-medium text-brand-navy" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fecha</label>
                <input type="date" defaultValue={extractedData.fecha_emision} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Punto Venta</label>
                <input type="text" defaultValue={extractedData.punto_venta} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Número</label>
                <input type="text" defaultValue={extractedData.numero_comprobante} className="input-field" />
              </div>
           </div>

           <div className="pt-2">
             <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">CUIT Emisor</label>
             <div className="relative">
                <input type="text" defaultValue={extractedData.cuit_emisor} 
                  className={`input-field font-medium ${isValidCuit ? 'border-gray-200 focus:ring-brand-sage' : 'border-red-400 bg-red-50 text-red-800 focus:ring-red-500'}`} 
                />
                {!isValidCuit && <AlertTriangle size={16} className="absolute right-3 top-2.5 text-red-500" />}
             </div>
           </div>

           <div className="bg-brand-light p-4 rounded-xl mt-4 border border-brand-sage/20 space-y-3">
              <h4 className="font-semibold text-brand-navy border-b border-brand-sage/20 pb-2 flex items-center gap-2">
                 Importes ARS
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase">Neto Gravado</label>
                  <input type="number" defaultValue={extractedData.importes.neto_gravado_21} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm text-right" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase">No Gravado</label>
                  <input type="number" defaultValue={noGravadoExento} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm text-right bg-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase">IVA 21%</label>
                  <input type="number" defaultValue={extractedData.importes.iva_21} className="w-full mt-1 px-2 py-1.5 border border-gray-200 rounded text-sm text-right bg-white" />
                </div>
              </div>
              <div className="pt-2 border-t border-brand-sage/10 flex justify-between items-center">
                 <span className="font-bold text-brand-navy">TOTAL</span>
                 <input type="number" defaultValue={extractedData.importes.total} 
                  className={`w-1/2 px-2 py-1.5 border rounded font-bold text-right text-base ${isMathValid ? 'border-brand-sage bg-transparent' : 'border-red-400 bg-red-50 text-red-700'}`} 
                 />
              </div>
           </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
          <button onClick={() => onApprove(extractedData)} className="flex-1 bg-brand-navy text-white font-semibold py-3 flex-row rounded-lg hover:bg-[#005477] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
             {currentIndex + 1 === totalFiles ? `Aprobar y Confirmar Lote (${currentIndex + 1}/${totalFiles})` : `Aprobar y Siguiente (${currentIndex + 1}/${totalFiles})`} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
