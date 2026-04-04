import { useState, useMemo } from 'react';
import { Search, Plus, Building2, Edit2, Trash2, X } from 'lucide-react';
import type { Client, ClientCreatePayload, TipoContribuyente } from '../types/client';

const MOCK_CLIENTS: Client[] = [
  { id: '1', user_id: 'u1', razon_social: 'Acme SRL', cuit: '30-71111111-2', tipo_contribuyente: 'Responsable Inscripto', condicion_iva: 'General', activo: true, created_at: '2023-01-01' },
  { id: '2', user_id: 'u1', razon_social: 'Juan Perez', cuit: '20-12345678-9', tipo_contribuyente: 'Monotributista', condicion_iva: 'A', activo: true, created_at: '2023-02-15' },
];

export default function ClientsPanel() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<Partial<ClientCreatePayload>>({
    tipo_contribuyente: 'Responsable Inscripto'
  });

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) || c.cuit.includes(searchTerm);
      const matchFilter = filterActive === null ? true : c.activo === filterActive;
      return matchSearch && matchFilter;
    });
  }, [clients, searchTerm, filterActive]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      ...(formData as ClientCreatePayload),
      id: Math.random().toString(),
      user_id: 'u1',
      activo: true,
      created_at: new Date().toISOString()
    };
    setClients([newClient, ...clients]);
    setIsModalOpen(false);
    setFormData({ tipo_contribuyente: 'Responsable Inscripto' });
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-shrink-0">
         <div>
           <h2 className="text-2xl font-extrabold text-brand-navy flex items-center gap-2">
             <Building2 className="text-brand-sage" size={26} /> Mis Clientes
           </h2>
           <p className="text-gray-500 mt-1">Administra los contribuyentes para los cuales procesas facturas.</p>
         </div>
         
         <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
               <Search size={16} className="absolute left-3 top-3 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Buscar por nombre o CUIT..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-64 pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-sage"
               />
            </div>
            <select 
              className="py-2.5 px-3 border border-gray-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-brand-sage"
              onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'active')}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
            </select>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-brand-navy text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0f172a] shadow-sm flex items-center gap-2"
            >
               <Plus size={18} /> Nuevo Cliente
            </button>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm whitespace-nowrap relative">
          <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4">Razón Social</th>
              <th className="px-6 py-4">CUIT</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Teléfono</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {filteredClients.map(client => (
              <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-brand-navy flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                    {client.razon_social.charAt(0)}
                  </div>
                  {client.razon_social}
                </td>
                <td className="px-6 py-4 font-mono text-gray-500">{client.cuit}</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                    {client.tipo_contribuyente}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">{client.telefono || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${client.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {client.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1.5 text-gray-400 hover:text-brand-navy transition-colors rounded hover:bg-gray-100"><Edit2 size={16}/></button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded hover:bg-red-50"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <Building2 size={32} className="mx-auto mb-3 opacity-20" />
                  <p>No se encontraron clientes.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-brand-navy">Crear Nuevo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Razón Social *</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage" 
                    value={formData.razon_social || ''} onChange={e => setFormData({...formData, razon_social: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CUIT *</label>
                  <input required pattern="[0-9]{2}-[0-9]{8}-[0-9]{1}" placeholder="20-12345678-9" type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-brand-sage focus:ring-1 focus:ring-brand-sage"
                    value={formData.cuit || ''} onChange={e => setFormData({...formData, cuit: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Contribuyente *</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none bg-white focus:ring-2 focus:ring-brand-sage"
                     value={formData.tipo_contribuyente} onChange={e => setFormData({...formData, tipo_contribuyente: e.target.value as TipoContribuyente})}>
                    <option>Responsable Inscripto</option>
                    <option>Monotributista</option>
                    <option>Exento</option>
                    <option>Consumidor Final</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-brand-sage text-white font-bold rounded-lg hover:bg-[#68A392]">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
