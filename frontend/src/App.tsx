import { useState, useEffect } from 'react';
import Dropzone from './components/Dropzone';
import ReviewPanel from './components/ReviewPanel';
import Sidebar from './components/Sidebar';
import ClientsPanel from './components/ClientsPanel';
import HistoryGrid from './components/HistoryGrid';
import ReconciliationPage from './pages/ReconciliationPage';
import { useReconciliationStore } from './store/reconciliationStore';
import { FolderDown, Search, Bell } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type AppState = 'home' | 'upload' | 'processing' | 'review' | 'done' | 'history' | 'clients' | 'reports' | 'settings' | 'reconciliation';

function App() {
  const [appState, setAppState] = useState<AppState>('upload');
  const [hasPin, setHasPin] = useState(!!localStorage.getItem('app_pin'));
  const [pinInput, setPinInput] = useState('');

  const [selectedClientId] = useState<string>('');
  const [filesToProcess, setFilesToProcess] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [finalBatchData, setFinalBatchData] = useState<any[]>([]);
  const { setVouchers } = useReconciliationStore();

  useEffect(() => {
    if (hasPin) {
      axios.defaults.headers.common['x-api-key'] = localStorage.getItem('app_pin') || '';
    }
  }, [hasPin]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim()) {
      localStorage.setItem('app_pin', pinInput.trim());
      axios.defaults.headers.common['x-api-key'] = pinInput.trim();
      setHasPin(true);
    }
  };

  const handleFilesAdded = async (files: File[]) => {
    if (files.length === 0) return;
    setFilesToProcess(files);
    setCurrentIndex(0);
    setFinalBatchData([]);
    await processFile(files[0]);
  };

  const processFile = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAppState('processing');

    try {
       const formData = new FormData();
       formData.append('file', file);
       if (selectedClientId) {
           formData.append('client_id', selectedClientId);
       }
       
       const response = await axios.post(`${API_URL}/api/v1/extract`, formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
       });
       
       setExtractedData(response.data);
       setAppState('review');
    } catch (error: any) {
       console.error("Error al extraer con el LLM", error);
       alert("Error en el Servidor: " + (error.response?.data?.detail || error.message));
       resetFlow();
    }
  };

  const handleApprove = async (updatedData: any) => {
    const newBatch = [...finalBatchData, updatedData];
    setFinalBatchData(newBatch);

    // Populate reconciliation store with real processed vouchers
    const mappedVouchers = newBatch.map((v, i) => ({
      id: v.id || `vchr-${Date.now()}-${i}`,
      tipo_comprobante: v.tipo_comprobante || 'Factura',
      tipo_documento: v.tipo_documento || 'factura',
      punto_venta: v.punto_venta || '0000',
      numero_comprobante: v.numero_comprobante || '00000000',
      fecha_emision: v.fecha_emision || new Date().toISOString().split('T')[0],
      cuit_emisor: v.cuit_emisor || '00000000000',
      razon_social_emisor: v.razon_social_emisor || 'Consumidor Final',
      total: parseFloat(v.importes?.total || v.total || '0'),
      moneda: 'ARS',
      reconciliation_status: 'pendiente' as const,
      matched_transaction_ids: []
    }));
    setVouchers(mappedVouchers);

    const nextIndex = currentIndex + 1;
    if (nextIndex < filesToProcess.length) {
      setCurrentIndex(nextIndex);
      await processFile(filesToProcess[nextIndex]);
    } else {
      setAppState('done');
    }
  };

  const resetFlow = () => {
    setAppState('upload');
    setPreviewUrl(null);
    setExtractedData(null);
    setFilesToProcess([]);
    setFinalBatchData([]);
  };

  const exportData = async (endpoint: string, filename: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/export/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': localStorage.getItem('app_pin') || ''
          },
          body: JSON.stringify(finalBatchData)
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } catch(e) {
      alert('Error exportando archivo.');
    }
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-[#F5F7F6] font-sans selection:bg-brand-sage selection:text-white flex">
      
      {/* Sidebar Corporativo */}
      <Sidebar currentMenu={appState} setMenu={(m) => setAppState(m as AppState)} />

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header Simple */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
           <div className="flex items-center gap-4 text-gray-400 w-1/2">
              <Search size={18} />
              <input type="text" placeholder="Buscar comprobantes o CUIT..." className="bg-transparent outline-none text-sm w-full font-medium" />
           </div>
           <div className="flex items-center gap-4">
              <button className="relative text-gray-400 hover:text-brand-navy">
                 <Bell size={20} />
                 <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full p-6 lg:p-10">
           {/* Dynamic State Management */}
           {appState === 'home' && (
             <div className="max-w-4xl mx-auto text-center mt-20">
                <h2 className="text-4xl font-extrabold text-brand-navy mb-4">Bienvenido a ComproScan AR</h2>
                <p className="text-gray-500 max-w-xl mx-auto mb-8">El Dashboard está siendo construido. Mientras tanto, presiona "Procesar Lotes" en la barra lateral para escanear facturas.</p>
                <button onClick={() => setAppState('upload')} className="bg-brand-sage text-brand-navy font-bold px-8 py-3 rounded-lg shadow-md hover:bg-[#68A392] transition-colors">Empezar a Escanear</button>
             </div>
           )}

           {appState === 'upload' && (
             <div className="max-w-4xl mx-auto space-y-8">
               <header className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl font-extrabold text-brand-navy mb-3 tracking-tight">Escaner de Tickets & Comprobantes</h2>
                  <p className="text-brand-sage">Foto del celular o PDF. Tickets fiscales, ticket factura, combustible y facturas A/B/C.</p>
               </header>
               <Dropzone onFilesAdded={handleFilesAdded} />
             </div>
           )}

           {(appState === 'processing' || appState === 'review') && (
             <div className="max-w-[1400px] mx-auto">
               <ReviewPanel 
                  imagePreviewUrl={previewUrl} 
                  extractedData={extractedData} 
                  isLoading={appState === 'processing'}
                  currentIndex={currentIndex}
                  totalFiles={filesToProcess.length}
                  onApprove={handleApprove}
               />
             </div>
           )}

           {appState === 'done' && (
             <div className="max-w-3xl mx-auto mt-12 bg-white p-12 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center animate-in zoom-in duration-500">
               <div className="bg-green-100 p-4 rounded-full mb-6 relative">
                  <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                  <FolderDown className="text-green-600 w-12 h-12" />
               </div>
               <h3 className="text-3xl font-bold text-brand-navy mb-3">¡Lote de {finalBatchData.length} Comprobantes Procesado!</h3>
               <p className="text-gray-500 mb-8 text-center max-w-lg">Toda la información fue validada automáticamente y exportada de forma tabular.</p>
               <div className="flex gap-4 w-full justify-center">
                  <button onClick={() => exportData('txt', 'holistor_citi_compras.txt')} className="bg-white border-2 border-brand-navy text-brand-navy font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                    TXT Holistor
                  </button>
                  <button onClick={() => exportData('csv', 'exportacion_general.csv')} className="bg-brand-navy border-2 border-brand-navy text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#003B53] transition-colors flex items-center justify-center gap-2">
                    CSV Excel
                  </button>
               </div>
               <button onClick={resetFlow} className="mt-8 text-brand-sage hover:text-brand-navy font-medium underline transition-colors">
                  Procesar otro lote
               </button>
             </div>
           )}

           {appState === 'history' && (
             <div className="h-full w-full max-w-[1600px] mx-auto">
               <HistoryGrid />
             </div>
           )}

           {appState === 'clients' && (
             <div className="h-full w-full max-w-[1600px] mx-auto">
               <ClientsPanel />
             </div>
           )}

           {appState === 'reconciliation' && (
             <div className="h-full w-full max-w-[1600px] mx-auto">
               <ReconciliationPage />
             </div>
           )}

           {(appState === 'reports' || appState === 'settings') && (
             <div className="text-center mt-20">
                <h3 className="text-xl font-bold text-gray-400">Panel "{appState}" en construcción 🏗️</h3>
             </div>
           )}
        </main>
      </div>

    </div>
  );

  if (!hasPin) {
    return (
      <div className="min-h-screen bg-[#F5F7F6] flex flex-col items-center justify-center font-sans">
         <div className="bg-white p-10 rounded-2xl shadow-xl max-w-sm w-full text-center border border-gray-100">
            <div className="bg-brand-sage/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
            </div>
            <h2 className="text-2xl font-bold text-brand-navy mb-2">Acceso Privado</h2>
            <p className="text-gray-500 text-sm mb-8">Por favor, ingresa el PIN de seguridad para acceder a ComproScan.</p>
            <form onSubmit={handlePinSubmit} className="space-y-4">
               <input 
                 type="password" 
                 value={pinInput}
                 onChange={(e) => setPinInput(e.target.value)}
                 placeholder="PIN de acceso" 
                 autoFocus
                 className="w-full text-center tracking-widest text-lg px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-200 outline-none focus:border-brand-sage focus:bg-white transition-all shadow-inner"
               />
               <button type="submit" className="w-full btn-primary py-3 font-semibold tracking-wide text-lg">
                 Desbloquear
               </button>
            </form>
         </div>
      </div>
    );
  }

  return renderDashboard();
}

export default App;
