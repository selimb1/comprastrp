// ============================================================
// ReconciliationUploader — Paso 1: Subir extracto bancario
// Drag & drop nativo (sin react-dropzone) para evitar deps.
// ============================================================
import { useCallback, useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  ArrowRight,
  Building2,
  AlertCircle,
  Landmark,
} from 'lucide-react';


import { BANCOS_ARGENTINOS } from '../../types/reconciliation';
import { useReconciliationStore } from '../../store/reconciliationStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ReconciliationUploaderProps {}


const ACCEPTED_EXTENSIONS = ['.pdf', '.csv', '.xlsx', '.txt'];

function isValidFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some(ext => name.endsWith(ext));
}

export default function ReconciliationUploader(_props: ReconciliationUploaderProps) {
  const { session, setStatement, setView, setProcessing } =
    useReconciliationStore();

  const [files, setFiles] = useState<File[]>([]);
  const [selectedBanco, setSelectedBanco] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter(isValidFile);
    const invalid = incoming.filter(f => !isValidFile(f));
    if (invalid.length > 0) {
      setValidationError(`Archivo no soportado: ${invalid.map(f => f.name).join(', ')}. Usá PDF, CSV o XLSX.`);
    } else {
      setValidationError('');
    }
    setFiles(prev => {
      const combined = [...prev, ...valid];
      return combined.slice(0, 3); // max 3 archivos
    });
  }, []);

  // ── Native drag events ───────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeFile = (idx: number) =>
    setFiles(prev => prev.filter((_, i) => i !== idx));

  const handleProcess = async () => {
    if (files.length === 0) {
      setValidationError('Debes subir al menos un extracto bancario.');
      return;
    }
    setValidationError('');
    setIsUploading(true);
    setProcessing(true);
    setView('processing');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('client_id', '');
      if (selectedBanco) formData.append('banco', selectedBanco);

      const res = await fetch(`${API_URL}/api/v1/reconciliation/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Error al enviar el archivo al servidor.');
      const data = await res.json();
      
      // Step 2: Ejecutar matching automático enviando los comprobantes escaneados
      if (session.vouchers && session.vouchers.length > 0) {
        const matchRes = await fetch(`${API_URL}/api/v1/reconciliation/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: '',
            statement: data.statement,
            vouchers: session.vouchers
          })
        });
        if (matchRes.ok) {
           const matchData = await matchRes.json();
           setStatement(matchData.statement);
           // Nota: setMatches se debe importar y llamar acá, o lo hacemos setStatement que ya calcula
           useReconciliationStore.getState().setMatches(matchData.matches);
        } else {
           setStatement(data.statement);
        }
      } else {
        setStatement(data.statement);
      }
      
      setView('reconcile');
    } catch (err: any) {
      console.error(err);
      setValidationError('Ocurrió un error al procesar el extracto. Por favor, verificá tu conexión e intentá de nuevo.');
      setView('upload');
    } finally {
      setIsUploading(false);
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-navy/10 mb-4">
          <Landmark className="w-8 h-8 text-brand-navy" />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-navy tracking-tight">
          Conciliación Bancaria
        </h2>
        <p className="text-gray-500 mt-2 max-w-md mx-auto">
          Subí el extracto de tu banco (PDF o CSV del home banking) y dejá que la IA haga el
          cruce automático con los comprobantes del cliente.
        </p>
      </div>

      {/* Step 1 — Banco */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
            1
          </span>
          <h3 className="font-bold text-brand-navy">Banco del Extracto</h3>
          <span className="text-xs text-gray-400 ml-1">(Opcional)</span>
        </div>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <select
            value={selectedBanco}
            onChange={e => setSelectedBanco(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-brand-sage focus:border-brand-sage appearance-none"
          >
            <option value="">Detectar automáticamente con IA...</option>
            {BANCOS_ARGENTINOS.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Step 2 — Archivo (Drag & Drop nativo) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-6 h-6 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center shrink-0">
            2
          </span>
          <h3 className="font-bold text-brand-navy">Subir Extracto Bancario</h3>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-brand-sage bg-brand-sage/10 scale-[1.01]'
              : 'border-gray-300 hover:border-brand-sage hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.csv,.xlsx,.txt"
            className="hidden"
            onChange={handleInputChange}
          />
          <UploadCloud
            className={`w-12 h-12 mx-auto mb-3 transition-colors ${
              isDragOver ? 'text-brand-sage' : 'text-gray-300'
            }`}
          />
          {isDragOver ? (
            <p className="font-bold text-brand-sage text-lg">Soltá el archivo aquí...</p>
          ) : (
            <>
              <p className="font-semibold text-gray-700 text-base">
                Arrastrá el extracto o{' '}
                <span className="text-brand-sage underline">hacé click aquí</span>
              </p>
              <p className="text-sm text-gray-400 mt-1">
                PDF, CSV, XLSX o TXT · hasta 3 archivos · máx. 20 MB c/u
              </p>
              <p className="text-xs text-gray-400 mt-3 italic">
                Compatible: Banco Nación, Galicia, BBVA, Santander, Macro, Brubank,
                Naranja X, Mercado Pago y más
              </p>
            </>
          )}
        </div>

        {/* File chips */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-brand-accent shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); removeFile(i); }}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-3 shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          {validationError}
        </div>
      )}

      {/* CTA Button */}
      <button
        id="btn-procesar-extracto"
        onClick={handleProcess}
        disabled={isUploading}
        className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-3 hover:bg-[#0f172a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl group"
      >
        {isUploading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Procesando con IA...
          </>
        ) : (
          <>
            <Landmark size={20} />
            Procesar Extracto y Conciliar
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </button>

      <div className="text-center pb-4 mt-8">
        <p className="text-xs text-gray-400 leading-tight max-w-lg mx-auto">
          Al subir archivos, declaras contar con consentimiento e indicas comprensión de que los datos son procesados temporalmente mediante Inteligencia Artificial (Estados Unidos). No almacenamos de forma permanente tus reportes ni imágenes.
        </p>
      </div>
    </div>
  );
}
