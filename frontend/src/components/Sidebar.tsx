import { Home, UploadCloud, FileSpreadsheet, Settings, Briefcase, BarChart3 } from 'lucide-react';

interface SidebarProps {
  currentMenu: string;
  setMenu: (menu: string) => void;
}

export default function Sidebar({ currentMenu, setMenu }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'upload', label: 'Procesar Lotes', icon: UploadCloud },
    { id: 'history', label: 'Comprobantes', icon: FileSpreadsheet },
    { id: 'clients', label: 'Clientes', icon: Briefcase },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-brand-navy text-gray-300 flex flex-col h-screen sticky top-0 left-0 overflow-y-auto hidden md:flex shrink-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          ComproScan <span className="text-brand-sage font-medium text-lg">AR</span>
        </h1>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Estudio Demo Partners</p>
      </div>

      <div className="px-4 py-6">
         <button className="w-full bg-brand-sage text-brand-navy font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-[#68A392] transition-colors shadow-md mb-8" onClick={() => setMenu('upload')}>
            <UploadCloud size={20} />
            Subir Facturas
         </button>

         <nav className="flex flex-col gap-2">
           {menuItems.map((item) => (
             <button
               key={item.id}
               onClick={() => setMenu(item.id)}
               className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                 currentMenu === item.id || (item.id === 'upload' && currentMenu === 'review') || (item.id === 'upload' && currentMenu === 'processing') || (item.id === 'upload' && currentMenu === 'done')
                   ? 'bg-white/10 text-white' 
                   : 'hover:bg-white/5 hover:text-white'
               }`}
             >
               <item.icon size={18} className={currentMenu === item.id ? 'text-brand-sage' : 'text-gray-400'} />
               {item.label}
             </button>
           ))}
         </nav>
      </div>

      <div className="mt-auto p-4 border-t border-white/10">
         <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-full bg-brand-light text-brand-navy flex items-center justify-center font-bold text-sm">
              SB
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Selim Barcat</p>
              <p className="text-xs text-brand-sage">Plan Premium</p>
            </div>
         </div>
      </div>
    </aside>
  );
}
