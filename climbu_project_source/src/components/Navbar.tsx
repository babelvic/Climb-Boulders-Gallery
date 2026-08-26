import React, { useRef } from 'react';
import { 
  MountainSnow, 
  ListChecks, 
  PlusCircle, 
  Building2, 
  Users2, 
  BarChart3, 
  User, 
  FileUp, 
  FileDown,
  HardDrive
} from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';

interface NavbarProps {
  currentTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: UserProfile;
  onExportZip: () => void;
  onImportZip: (file: File) => void;
  routesCount: number;
  friendRoutesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  onExportZip,
  onImportZip,
  routesCount,
  friendRoutesCount
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportZip(file);
      e.target.value = '';
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: any; count?: number }[] = [
    { id: 'catalog', label: 'Diario / Catálogo', icon: ListChecks, count: routesCount },
    { id: 'new', label: 'Nuevo Bloque', icon: PlusCircle },
    { id: 'rocodromos', label: 'Rocódromos', icon: Building2 },
    { id: 'friends', label: 'Amigos', icon: Users2, count: friendRoutesCount },
    { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div 
            id="brand-logo-container"
            onClick={() => onTabChange('catalog')}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-md flex items-center justify-center font-bold text-slate-950 text-xl tracking-tighter shadow-sm group-hover:bg-emerald-400 transition-colors">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Climb<span className="text-emerald-500">U</span>
            </span>
          </div>

          {/* Desktop Navigation Links (Clean Minimal tab links) */}
          <nav className="hidden lg:flex items-center gap-6 h-16">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`h-full flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-all relative ${
                    isActive
                      ? 'text-emerald-500 border-b-2 border-emerald-500 font-semibold'
                      : 'text-slate-400 hover:text-white border-b-2 border-transparent'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions & Profile */}
          <div className="flex items-center gap-3">
            
            {/* Quick Export ZIP */}
            <button
              id="export-zip-header-btn"
              onClick={onExportZip}
              title="Exportar archivo ZIP"
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Exportar</span>
            </button>

            {/* Quick Import ZIP */}
            <button
              id="import-zip-header-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Importar archivo ZIP"
              className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Importar</span>
            </button>

            {/* Hidden Input for ZIP */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".zip"
              onChange={handleFileChange}
              className="hidden"
              id="global-zip-input"
            />

            {/* Divider */}
            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            {/* User Profile */}
            <div 
              id="avatar-profile-btn"
              onClick={() => onTabChange('profile')}
              className="flex items-center gap-3 cursor-pointer group pl-1"
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                  {user.userName || 'Escalador'}
                </span>
                <span className="text-[10px] text-emerald-500 font-mono">
                  {user.gradeSystem === 'VSCALE' ? 'V-Scale' : 'Escala Font'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userName || 'U')}&background=10b981&color=0f172a&bold=true`}
                  alt={user.userName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

          </div>

        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        id="mobile-bottom-nav"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-40 px-2 py-2 flex justify-around items-center"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`mob-nav-btn-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all relative ${
                isActive ? 'text-emerald-500 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-1 -right-2 bg-emerald-500 text-slate-950 font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">
                {item.id === 'rocodromos' ? 'Rocos' : item.id === 'catalog' ? 'Diario' : item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
