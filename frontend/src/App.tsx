import { useState } from 'react';
import Dropzone from './components/Dropzone';
import ReviewPanel from './components/ReviewPanel';
import { Settings, BarChart2, FolderDown } from 'lucide-react';
import axios from 'axios';

function App() {
  const [appState, setAppState] = useState<'upload' | 'processing' | 'review' | 'done'>('upload');
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
       // Llamada real al backend Python montado
       const formData = new FormData();
       formData.append('file', file);
       
       const response = await axios.post('http://localhost:8000/api/v1/extract', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
       });
       
       setExtractedData(response.data);
       setAppState('review');
    } catch (error) {
       console.error("Error al extraer con el LLM", error);
       // Simulamos un error controlado
       setExtractedData({
          tipo_comprobante: "B",
          punto_venta: "0005",
          numero_comprobante: "00009999",
          fecha_emision: "2026-04-01",
          cuit_emisor: "30111111110", // Invalido a proposito
          moneda: "ARS",
          importes: {
             neto_gravado_21: 1000,
             iva_21: 100, // Matematicamente invalido a proposito
             total: 1210
          }
       });
       setAppState('review');
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

  return (
    <div className="min-h-screen bg-[#F5F7F6] font-sans selection:bg-brand-sage selection:text-white pb-12">
      
      {/* Premium Corporate Navbar */}
      <nav className="bg-brand-navy text-white px-8 py-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-brand-accent p-2 rounded-lg">
             <BarChart2 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ComproScan <span className="text-brand-sage ml-1 font-medium">AR</span></h1>
            <p className="text-[10px] text-gray-300 uppercase tracking-widest">Estudio Demo Partners</p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <button className="text-gray-300 hover:text-white transition-colors">
            <FolderDown size={20} />
          </button>
          <button className="text-gray-300 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-brand-sage border-2 border-white flex items-center justify-center font-bold text-sm">
            SB
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 mt-12">
         {/* Headers */}
         <header className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-brand-navy mb-3 tracking-tight">
              Ingesta Contable
            </h2>
            <p className="text-brand-sage">
              La IA extractora de datos de ComproScan transformará las fotos o CDs de tus clientes en exportaciones perfectas para tu ERP fiscal.
            </p>
         </header>

         {/* Dynamic State Management */}
         {appState === 'upload' && (
           <Dropzone onFilesAdded={handleFilesAdded} />
         )}

         {(appState === 'processing' || appState === 'review') && (
           <ReviewPanel 
              imagePreviewUrl={previewUrl} 
              extractedData={extractedData} 
              isLoading={appState === 'processing'}
              currentIndex={currentIndex}
              totalFiles={filesToProcess.length}
              onApprove={handleApprove}
           />
         )}

         {appState === 'done' && (
           <div className="w-full bg-white p-12 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center animate-in zoom-in duration-500">
             <div className="bg-green-100 p-4 rounded-full mb-6 relative">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                <FolderDown className="text-green-600 w-12 h-12" />
             </div>
             <h3 className="text-3xl font-bold text-brand-navy mb-3">¡Lote de {finalBatchData.length} Comprobantes Procesado!</h3>
             <p className="text-gray-500 mb-8 max-w-md text-center">Toda la información fue validada contra los algoritmos matemáticos y está lista para ser ingerida por tu ERP contable favorito.</p>
             <div className="flex gap-4 w-full max-w-md">
                <button onClick={() => exportData('txt', 'holistor_citi_compras.txt')} className="flex-1 bg-white border-2 border-brand-navy text-brand-navy font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  TXT Holistor
                </button>
                <button onClick={() => exportData('csv', 'exportacion_general.csv')} className="flex-1 bg-brand-navy border-2 border-brand-navy text-white font-semibold py-3 rounded-xl hover:bg-[#003B53] transition-colors flex items-center justify-center gap-2">
                  CSV Universal
                </button>
             </div>
             <button onClick={resetFlow} className="mt-8 text-brand-sage hover:text-brand-navy font-medium underline transition-colors">
                Subir otro lote de facturas
             </button>
           </div>
         )}
      </main>

    </div>
  );
}

export default App;
