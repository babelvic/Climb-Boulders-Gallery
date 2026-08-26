import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  FileUp, 
  RotateCcw,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  MapPin,
  ClipboardList
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Route, Rocodromo, RouteStatus } from '../types';
import { formatGrade, compareGrades, getMaxGrade } from '../utils/grades';

interface CatalogTabProps {
  routes: Route[];
  rocodromos: Rocodromo[];
  gradeSystem: 'FONT' | 'VSCALE';
  onSelectRoute: (route: Route) => void;
  onToggleSent: (routeId: string) => void;
  onNavigateToNew: () => void;
}

export const CatalogTab: React.FC<CatalogTabProps> = ({
  routes,
  rocodromos,
  gradeSystem,
  onSelectRoute,
  onToggleSent,
  onNavigateToNew
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RouteStatus>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [rocoFilter, setRocoFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'grade_desc' | 'grade_asc'>('date_desc');

  // Filter and sort routes
  const filteredRoutes = useMemo(() => {
    return routes
      .filter((r) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = r.name.toLowerCase().includes(q);
          const matchSector = r.sector.toLowerCase().includes(q);
          const matchNotes = (r.notes || '').toLowerCase().includes(q);
          const matchGrade = r.grade.toLowerCase().includes(q);
          if (!matchName && !matchSector && !matchNotes && !matchGrade) return false;
        }

        // Status
        if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

        // Rocódromo
        if (rocoFilter !== 'ALL' && r.sector !== rocoFilter) return false;

        // Grade group
        if (gradeFilter !== 'ALL') {
          const g = r.grade.toLowerCase();
          if (gradeFilter === '5' && !g.startsWith('5')) return false;
          if (gradeFilter === '6' && !g.startsWith('6')) return false;
          if (gradeFilter === '7' && !g.startsWith('7')) return false;
          if (gradeFilter === '8' && !g.startsWith('8')) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'grade_desc') return compareGrades(b.grade, a.grade);
        if (sortBy === 'grade_asc') return compareGrades(a.grade, b.grade);
        return 0;
      });
  }, [routes, searchQuery, statusFilter, gradeFilter, rocoFilter, sortBy]);

  // Stats for sidebar/header
  const sentCount = routes.filter((r) => r.status === 'Encadenado').length;
  const successRate = routes.length > 0 ? Math.round((sentCount / routes.length) * 100) : 0;
  const maxGrade = getMaxGrade(routes);

  const handleQuickSent = (e: React.MouseEvent, route: Route) => {
    e.stopPropagation();
    if (route.status !== 'Encadenado') {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#34d399', '#3b82f6']
        });
      } catch (err) {}
    }
    onToggleSent(route.id);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setGradeFilter('ALL');
    setRocoFilter('ALL');
    setSortBy('date_desc');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || gradeFilter !== 'ALL' || rocoFilter !== 'ALL';

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Hoy';
      if (days === 1) return 'Ayer';
      if (days < 7) return `Hace ${days} días`;
      if (days < 30) return `Hace ${Math.floor(days / 7)} sem`;
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-8 animate-in fade-in duration-200">
      
      {/* Clean Minimalism Left Aside / Quick Actions & Filters */}
      <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-6 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        
        {/* Quick Actions */}
        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
            Acciones Rápidas
          </h3>
          <button 
            id="btn-add-beta-sidebar"
            onClick={onNavigateToNew}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 mb-2.5 transition-colors cursor-pointer text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Bloque</span>
          </button>
          <button 
            id="btn-import-session-sidebar"
            onClick={() => {
              const el = document.getElementById('global-zip-input');
              if (el) el.click();
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm border border-slate-700"
          >
            <FileUp className="w-4 h-4 text-slate-400" />
            <span>Importar ZIP</span>
          </button>
        </div>

        {/* Filter Results */}
        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">
            Filtrar por Estado
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Todos los Bloques</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{routes.length}</span>
            </button>

            <button
              onClick={() => setStatusFilter('Proyecto')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                statusFilter === 'Proyecto'
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-medium'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Proyectos</span>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {routes.filter((r) => r.status === 'Proyecto').length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('Encadenado')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                statusFilter === 'Encadenado'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Encadenados</span>
              </div>
              <span className="text-xs font-mono text-slate-500">{sentCount}</span>
            </button>
          </div>
        </div>

        {/* Secondary filters: Rocódromo & Grado */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Rocódromo</label>
            <select
              id="catalog-filter-rocodromo"
              value={rocoFilter}
              onChange={(e) => setRocoFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos los Rocódromos</option>
              {rocodromos.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Grado</label>
            <select
              id="catalog-filter-grade"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Todos los Grados</option>
              <option value="5">Grados 5 (5a - 5c)</option>
              <option value="6">Grados 6 (6a - 6c+)</option>
              <option value="7">Grados 7 (7a - 7c+)</option>
              <option value="8">Grados 8 (8a y sup.)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium pt-1"
            >
              <RotateCcw className="w-3 h-3" />
              Restablecer filtros
            </button>
          )}
        </div>

        {/* Session Stats card */}
        <div className="mt-auto p-4 bg-slate-800/60 rounded-xl border border-slate-700">
          <h4 className="text-xs font-bold text-slate-300 mb-2.5">Métricas de Escalada</h4>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-400">Grado Máximo</span>
            <span className="text-white font-mono font-bold">{formatGrade(maxGrade, gradeSystem)}</span>
          </div>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-slate-400">Tasa de Éxito</span>
            <span className="text-emerald-500 font-mono font-bold">{successRate}%</span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

      </aside>

      {/* Main Journal Section */}
      <section className="flex-1 flex flex-col gap-6 overflow-hidden">
        
        {/* Header & Search */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Diario de Bloques
              <span className="text-slate-500 font-normal text-base ml-2">
                ({filteredRoutes.length} {filteredRoutes.length === 1 ? 'vía' : 'vías'})
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                id="catalog-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por vía, sector..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="date_desc">Recientes</option>
                <option value="date_asc">Antiguos</option>
                <option value="grade_desc">Grado ↑</option>
                <option value="grade_asc">Grado ↓</option>
              </select>
            </div>
          </div>
        </header>

        {/* Grid of Clean Minimal Cards */}
        {filteredRoutes.length > 0 ? (
          <div 
            id="routes-catalog-grid"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {filteredRoutes.map((route) => {
              const isSent = route.status === 'Encadenado';
              const holdsCount = route.holds?.length || 0;

              return (
                <div
                  key={route.id}
                  id={`route-card-${route.id}`}
                  onClick={() => onSelectRoute(route)}
                  className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all flex flex-col group cursor-pointer shadow-sm"
                >
                  {/* Photo area */}
                  <div className="relative h-48 bg-slate-700 flex items-center justify-center overflow-hidden">
                    {route.imageUrl ? (
                      <img
                        src={route.imageUrl}
                        alt={route.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-slate-500 text-xs">Sin imagen</span>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span 
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase ${
                          isSent 
                            ? 'bg-emerald-500 text-slate-950' 
                            : 'bg-orange-500 text-slate-950'
                        }`}
                      >
                        {isSent ? 'SENT' : 'PROJECT'}
                      </span>
                      <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg font-mono">
                        {formatGrade(route.grade, gradeSystem)}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex flex-col gap-1 flex-1 justify-between bg-slate-800">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors leading-tight">
                          {route.name}
                        </h4>
                        <span className="text-xs text-slate-500 shrink-0 ml-2">
                          {formatTimeAgo(route.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{route.sector}</span>
                      </p>
                    </div>

                    {/* Footer Row */}
                    <div className="mt-4 pt-3 border-t border-slate-700/60 flex justify-between items-center text-xs">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                        <span>{holdsCount} {holdsCount === 1 ? 'presa' : 'presas'}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          id={`btn-quick-sent-${route.id}`}
                          onClick={(e) => handleQuickSent(e, route)}
                          className={`text-xs font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                            isSent
                              ? 'text-emerald-400 hover:underline'
                              : 'text-orange-400 hover:text-orange-300'
                          }`}
                        >
                          {isSent ? 'Sent ✓' : 'Marcar Sent'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectRoute(route)}
                          className="text-emerald-400 text-xs font-bold hover:underline"
                        >
                          Ver Beta →
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div 
            id="catalog-empty-state"
            className="text-center py-16 px-4 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 space-y-4 max-w-md mx-auto my-auto"
          >
            <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Flame className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {hasActiveFilters ? 'No se encontraron bloques' : 'No tienes bloques registrados'}
              </h3>
              <p className="text-xs text-slate-400">
                {hasActiveFilters
                  ? 'Prueba a cambiar o restablecer los filtros de búsqueda.'
                  : 'Crea tu primera vía o importa un archivo ZIP.'}
              </p>
            </div>

            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-xs transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            ) : (
              <button
                onClick={onNavigateToNew}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Primer Bloque</span>
              </button>
            )}
          </div>
        )}

        {/* Clean Minimalism Bottom Legend & Info Bar */}
        <div className="mt-auto flex flex-wrap items-center justify-between py-4 border-t border-slate-800 text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-3">
            <p>Almacenamiento Local: {routes.length} vías registradas</p>
            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
              <div 
                className="bg-emerald-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, Math.max(10, routes.length * 8))}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              START
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              TOP
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              HAND/FOOT
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              CRUX
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              PIE SOLO
            </span>
          </div>
        </div>

      </section>

    </div>
  );
};
