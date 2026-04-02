import { useState } from 'react';
import { Building2, Plus, Mail, MoreVertical, Activity, Search, Server } from 'lucide-react';

const MOCK_CLIENTS = [
  { id: 1, name: 'Boston Tech S.A.', cuit: '30-71805241-2', erp: 'Tango Gestión', processed: 450, email: 'admin@bostontech.com.ar' },
  { id: 2, name: 'Acme Corporación SRL', cuit: '30-11111111-0', erp: 'Contabilium', processed: 130, email: 'facturacion@acme.com' },
  { id: 3, name: 'Estudio Jurídico Rivas', cuit: '27-00000000-1', erp: 'Holistor TXT', processed: 89, email: 'estudio@rivasabogados.net' },
  { id: 4, name: 'Gómez Ferreterías', cuit: '20-12345678-5', erp: 'Bejerman', processed: 652, email: 'pagos@gomezferr.com.ar' },
  { id: 5, name: 'Consultora Belmotec', cuit: '30-30580202-1', erp: 'Excel AFIP', processed: 25, email: 'info@belmotec.com.ar' },
  { id: 6, name: 'Zapatillas Puma AR', cuit: '30-80000000-3', erp: 'Tango Gestión', processed: 1102, email: 'ar@puma.com' },
];

export default function ClientsPanel() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients] = useState(MOCK_CLIENTS);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cuit.includes(searchTerm)
  );

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <div>
           <h2 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2 tracking-tight">
             <Building2 className="text-brand-sage" size={26} /> Directorio de Clientes
           </h2>
           <p className="text-gray-500 mt-1">Configura las plantillas de exportación por defecto de las empresas que administras.</p>
         </div>
         
         <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
               <Search size={16} className="absolute left-3 top-3 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Buscar cliente..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-sage transition-all shadow-sm"
               />
            </div>
            <button className="bg-brand-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0f172a] transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
               <Plus size={18} /> Nuevo Cliente
            </button>
         </div>
      </div>

      {/* Grid de Tarjetas (Estilo CRM) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-8">
        {filteredClients.map(client => (
           <div key={client.id} className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow overflow-hidden group">
              {/* Card Header */}
              <div className="p-5 border-b border-gray-50 flex items-start justify-between relative">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-100 text-brand-navy font-black text-xl flex items-center justify-center uppercase shadow-inner">
                       {client.name.substring(0, 1)}
                    </div>
                    <div>
                       <h3 className="font-bold text-gray-900 leading-tight">{client.name}</h3>
                       <p className="text-xs text-gray-500 font-mono mt-0.5 font-semibold">CUIT: {client.cuit}</p>
                    </div>
                 </div>
                 <button className="text-gray-400 hover:text-brand-navy p-1 transition-colors">
                    <MoreVertical size={18} />
                 </button>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                 <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <span className="truncate">{client.email}</span>
                 </div>
                 
                 <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 py-2 px-3 rounded-md border border-gray-100">
                    <Server size={16} className="text-brand-sage" />
                    <span className="font-medium text-brand-navy">Exportación:</span>
                    <span className="bg-brand-navy text-white text-[10px] font-bold px-2 py-0.5 rounded ml-auto tracking-wider uppercase">{client.erp}</span>
                 </div>
                 
                 <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Activity size={16} className="text-gray-400" />
                    <span><strong className="text-gray-800">{client.processed}</strong> comprobantes subidos</span>
                 </div>
              </div>

              {/* Card Footer */}
              <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-3">
                 <button className="flex-1 bg-white border border-gray-200 text-brand-navy font-semibold text-xs py-2 rounded-lg hover:border-brand-sage transition-colors shadow-sm">
                   Configurar Reglas
                 </button>
                 <button className="flex-1 bg-brand-navy text-white font-semibold text-xs py-2 rounded-lg hover:bg-[#0f172a] transition-colors shadow-sm">
                   Ver Lotes
                 </button>
              </div>
           </div>
        ))}
        
        {filteredClients.length === 0 && (
           <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              <Building2 size={48} className="mb-4 opacity-30" />
              <p className="text-lg font-bold text-gray-600">No se encontraron clientes</p>
              <p className="text-sm">Agrega tu primera Razón Social para empezar.</p>
           </div>
        )}
      </div>

    </div>
  );
}
