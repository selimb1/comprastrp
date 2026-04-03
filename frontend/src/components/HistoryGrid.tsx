import { useRef, useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Download, Search, CheckSquare, Settings2, SlidersHorizontal } from 'lucide-react';

// Generador de datos falsos para ilustrar virtualización masiva
const generateMockData = (count: number) => {
  const tipos = ['A', 'B', 'C', 'M'];
  const empresas = ['Acme S.A.', 'Tech Solutions SRL', 'Gomez y Asociados', 'Consultora IT', 'Importadora Express'];
  
  return Array.from({ length: count }, (_, i) => {
    const isError = Math.random() < 0.05;
    const isPending = Math.random() < 0.1;
    
    return {
      id: `invoice-${i}`,
      fecha: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toLocaleDateString('es-AR'),
      cuit: `30-${Math.floor(10000000 + Math.random() * 90000000)}-${Math.floor(Math.random() * 9)}`,
      razon_social: empresas[Math.floor(Math.random() * empresas.length)],
      tipo: tipos[Math.floor(Math.random() * tipos.length)],
      pv: String(Math.floor(Math.random() * 1000)).padStart(4, '0'),
      numero: String(Math.floor(Math.random() * 10000000)).padStart(8, '0'),
      total: (Math.random() * 500000).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
      status: isError ? 'error' : isPending ? 'pending' : 'valid',
    };
  });
};

export default function HistoryGrid() {
  const [data] = useState(() => generateMockData(5000)); // 5000 registros!
  const [searchTerm, setSearchTerm] = useState('');
  
  // Ref para el contenedor scrolleable
  const parentRef = useRef<HTMLDivElement>(null);

  // Filtrado simple (en la vida real pasaría en backend)
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item => 
      item.razon_social.toLowerCase().includes(lowerSearch) || 
      item.cuit.includes(lowerSearch) ||
      item.numero.includes(lowerSearch)
    );
  }, [data, searchTerm]);

  // Instancia de react-virtual
  const rowVirtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48, // Altura estimada de cada fila en pixeles
    overscan: 10, // Cuantas filas precargar fuera de vista
  });

  const getStatusBadge = (status: string) => {
    if (status === 'valid') return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">Validado ARCA</span>;
    if (status === 'pending') return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">Pendiente Revisión</span>;
    return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap">Error Matemático</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-[85vh] max-h-[800px] overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Table Header Controls */}
      <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-gray-50/50">
         <div>
            <h2 className="text-xl font-bold text-brand-navy">Historial de Comprobantes</h2>
            <p className="text-sm text-gray-500 mt-1">
              Mostrando {filteredData.length.toLocaleString('es-AR')} registros virtualizados. Navega a <span className="font-bold">60FPS</span>.
            </p>
         </div>
         
         <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
               <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Buscar por CUIT, Empresa o Nro..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-sage focus:border-brand-sage transition-all shadow-sm"
               />
            </div>
            <button className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shadow-sm bg-white" title="Filtros Avanzados">
               <SlidersHorizontal size={18} />
            </button>
            <button className="bg-brand-navy text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#0f172a] transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
               <Download size={16} /> Exportar Filtrados
            </button>
         </div>
      </div>

      {/* Grid Header (Fijeza Manual) */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
         <div className="w-8 shrink-0 flex items-center justify-center">
            <CheckSquare size={16} className="text-gray-400" />
         </div>
         <div className="w-24 shrink-0">Fecha</div>
         <div className="w-28 shrink-0">CUIT</div>
         <div className="flex-1 min-w-[200px]">Razón Social</div>
         <div className="w-16 shrink-0 text-center">Tipo</div>
         <div className="w-32 shrink-0 font-mono text-center">Nro Comp.</div>
         <div className="w-32 shrink-0 text-right">Total</div>
         <div className="w-32 shrink-0 text-center">Estado</div>
      </div>

      {/* Virtualized Body */}
      <div 
         ref={parentRef} 
         className="flex-1 overflow-auto bg-white custom-scrollbar relative"
      >
         <div
            style={{
               height: `${rowVirtualizer.getTotalSize()}px`,
               width: '100%',
               position: 'relative',
            }}
         >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
               const item = filteredData[virtualRow.index];
               const isEven = virtualRow.index % 2 === 0;
               return (
                  <div
                     key={virtualRow.key}
                     className={`absolute top-0 left-0 w-full flex items-center gap-4 px-6 border-b border-gray-100 hover:bg-brand-sage/10 transition-colors group cursor-pointer ${isEven ? 'bg-white' : 'bg-[#fafafe]'}`}
                     style={{
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                     }}
                  >
                     <div className="w-8 shrink-0 flex items-center justify-center">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-brand-sage focus:ring-brand-sage cursor-pointer" />
                     </div>
                     <div className="w-24 shrink-0 text-sm font-medium text-gray-600">{item.fecha}</div>
                     <div className="w-28 shrink-0 text-sm font-mono text-gray-700">{item.cuit}</div>
                     <div className="flex-1 min-w-[200px] text-sm font-bold text-brand-navy truncate">{item.razon_social}</div>
                     <div className="w-16 shrink-0 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-md bg-gray-200 text-brand-navy font-bold text-xs flex items-center justify-center border border-gray-300">{item.tipo}</div>
                     </div>
                     <div className="w-32 shrink-0 text-sm font-mono text-gray-500 text-center">{item.pv}-{item.numero}</div>
                     <div className="w-32 shrink-0 text-sm font-extrabold text-brand-navy text-right">{item.total}</div>
                     <div className="w-32 shrink-0 flex justify-center">
                        {getStatusBadge(item.status)}
                     </div>
                  </div>
               );
            })}
         </div>
         {filteredData.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
               <Settings2 size={48} className="mb-4 opacity-50" />
               <p className="text-lg font-medium text-brand-navy">No hay resultados</p>
               <p className="text-sm">Prueba ajustando el término de búsqueda de CUIT o Empresa.</p>
            </div>
         )}
      </div>

    </div>
  );
}
