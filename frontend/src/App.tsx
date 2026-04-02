import { useState } from 'react';
import Dropzone from './components/Dropzone';
import ReviewPanel from './components/ReviewPanel';
import Sidebar from './components/Sidebar';
import ClientsPanel from './components/ClientsPanel';
import HistoryGrid from './components/HistoryGrid';
import LandingPage from './components/LandingPage';
import { FolderDown, Search, Bell } from 'lucide-react';
import axios from 'axios';

type AppState = 'home' | 'upload' | 'processing' | 'review' | 'done' | 'history' | 'clients' | 'reports' | 'settings';

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [appState, setAppState] = useState<AppState>('upload');
  const [filesToProcess, setFilesToProcess] = useState<File[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [finalBatchData, setFinalBatchData] = useState<any[]>([]);

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
       
       const response = await axios.post('http://localhost:8000/api/v1/extract', formData, {
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
      const response = await fetch(`http://localhost:8000/api/v1/export/${endpoint}`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
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

  if (showLanding) {
    return <LandingPage onEnterApp={() => setShowLanding(false)} />;
  }

  return (
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
             <div className="max-w-4xl mx-auto">
               <header className="mb-8 text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl font-extrabold text-brand-navy mb-3 tracking-tight">Ingesta Contable</h2>
                  <p className="text-brand-sage">Arrastra los PDFs o imágenes de facturación local.</p>
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

           {(appState === 'reports' || appState === 'settings') && (
             <div className="text-center mt-20">
                <h3 className="text-xl font-bold text-gray-400">Panel "{appState}" en construcción 🏗️</h3>
             </div>
           )}
        </main>
      </div>

    </div>
  );
}

export default App;
