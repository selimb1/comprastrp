import { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import type { Client } from '../types/client';

interface ClientSelectorProps {
  clients: Client[];
  selectedClientId?: string;
  onSelect: (clientId: string) => void;
}

export default function ClientSelector({ clients, selectedClientId, onSelect }: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const filteredClients = clients.filter(c => 
    c.razon_social.toLowerCase().includes(search.toLowerCase()) || 
    c.cuit.includes(search)
  ).slice(0, 50);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border border-gray-300 px-4 py-3 rounded-xl text-left text-brand-navy font-semibold hover:border-brand-sage focus:outline-none focus:ring-2 focus:ring-brand-sage shadow-sm transition-all"
      >
        <span>{selectedClient ? `${selectedClient.razon_social} (${selectedClient.cuit})` : 'Seleccionar cliente...'}</span>
        <ChevronsUpDown size={16} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center px-3 border-b border-gray-100">
            <Search size={16} className="text-gray-400" />
            <input
              className="w-full py-3 px-2 outline-none text-sm"
              placeholder="Buscar por Razón Social o CUIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <ul className="max-h-60 overflow-y-auto py-1">
            {filteredClients.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No se encontraron resultados.</div>
            ) : (
              filteredClients.map(client => (
                <li
                  key={client.id}
                  onClick={() => {
                    onSelect(client.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between hover:bg-gray-50 ${selectedClientId === client.id ? 'bg-brand-sage/10 text-brand-sage font-bold' : 'text-gray-700'}`}
                >
                  <div className="flex flex-col">
                    <span>{client.razon_social}</span>
                    <span className="text-xs text-gray-400 font-mono">{client.cuit}</span>
                  </div>
                  {selectedClientId === client.id && <Check size={16} className="text-brand-sage" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
