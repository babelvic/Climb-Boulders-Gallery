import React, { useState, useMemo } from 'react';
import { 
  Users2, 
  FileUp, 
  Search, 
  MapPin, 
  Calendar, 
  CircleDot, 
  Share2, 
  Sparkles,
  UserCheck,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { FriendRoute } from '../types';
import { formatGrade } from '../utils/grades';

interface FriendsTabProps {
  friendRoutes: FriendRoute[];
  gradeSystem: 'FONT' | 'VSCALE';
  onSelectRoute: (route: FriendRoute) => void;
  onTriggerImport: () => void;
  onDeleteFriendRoute: (id: string) => void;
  onClearFriendRoutes: (friendName?: string) => void;
}

export const FriendsTab: React.FC<FriendsTabProps> = ({
  friendRoutes,
  gradeSystem,
  onSelectRoute,
  onTriggerImport,
  onDeleteFriendRoute,
  onClearFriendRoutes
}) => {
  const [search, setSearch] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<string>('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Unique list of friends
  const friendsList = useMemo(() => {
    const set = new Set<string>();
    friendRoutes.forEach((r) => {
      if (r.friendName) set.add(r.friendName);
    });
    return Array.from(set);
  }, [friendRoutes]);

  // Filtered routes
  const filtered = useMemo(() => {
    return friendRoutes.filter((r) => {
      if (selectedFriend !== 'ALL' && r.friendName !== selectedFriend) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = r.name.toLowerCase().includes(q);
        const matchSector = r.sector.toLowerCase().includes(q);
        const matchFriend = r.friendName.toLowerCase().includes(q);
        if (!matchName && !matchSector && !matchFriend) return false;
      }
      return true;
    });
  }, [friendRoutes, selectedFriend, search]);

  const routeToDelete = friendRoutes.find((r) => r.id === confirmDeleteId);

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users2 className="w-5 h-5 text-emerald-400" />
              Bloques de Amigos & Compañeros
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Explora las vías, fotos y secuencias compartidas en archivos ZIP, sin necesidad de servidores externos.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {friendRoutes.length > 0 && (
              <button
                id="btn-clear-friends-tab"
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Eliminar vías de amigos importadas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Amigos</span>
              </button>
            )}

            <button
              id="btn-import-zip-friends-tab"
              onClick={onTriggerImport}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
            >
              <FileUp className="w-4 h-4" />
              <span>Importar ZIP de Amigo</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {friendRoutes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por vía, rocódromo o amigo..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Friend filter */}
            <div>
              <select
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos los Compañeros ({friendRoutes.length} vías)</option>
                {friendsList.map((f) => (
                  <option key={f} value={f}>
                    De: {f} ({friendRoutes.filter((r) => r.friendName === f).length} vías)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* In-app Single Route Delete Confirm Dialog */}
      {confirmDeleteId && routeToDelete && (
        <div 
          id="confirm-delete-friend-route-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar vía de amigo?</h3>
                <p className="text-xs text-slate-400">"{routeToDelete.name}" ({routeToDelete.friendName})</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
              Esta vía compartida se eliminará de tu lista de amigos importados.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-friend-route"
                onClick={() => {
                  onDeleteFriendRoute(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Sí, Eliminar Vía
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app Clear All Friends Routes Confirm */}
      {showClearConfirm && (
        <div 
          id="confirm-clear-friends-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Limpiar vías de amigos?</h3>
                <p className="text-xs text-slate-400">
                  {selectedFriend === 'ALL'
                    ? `Se eliminarán todas las ${friendRoutes.length} vías importadas`
                    : `Se eliminarán las vías de ${selectedFriend}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-clear-all-friends"
                onClick={() => {
                  onClearFriendRoutes(selectedFriend === 'ALL' ? undefined : selectedFriend);
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Eliminar Vías Importadas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Friends Routes */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((route) => {
            const holdsCount = route.holds?.length || 0;

            return (
              <div
                key={route.id}
                id={`friend-route-card-${route.id}`}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:border-slate-700 transition-all flex flex-col group"
              >
                {/* Header Tag: Friend Name & Date */}
                <div className="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-medium text-emerald-400 flex items-center gap-1.5 truncate">
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>De: {route.friendName}</span>
                  </span>
                  <span className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {route.exportDate}
                  </span>
                </div>

                {/* Photo & Badge */}
                <div 
                  onClick={() => onSelectRoute(route)}
                  className="relative h-48 bg-slate-950 overflow-hidden cursor-pointer"
                >
                  {route.imageUrl ? (
                    <img
                      src={route.imageUrl}
                      alt={route.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
                      <Sparkles className="w-8 h-8 mb-1 text-slate-700" />
                      <span className="text-xs">Sin imagen</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Grade badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                    <span className="bg-slate-950/90 border border-emerald-500/50 text-emerald-300 font-bold font-mono px-2 py-0.5 rounded text-xs shadow-sm">
                      {formatGrade(route.grade, gradeSystem)}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase shadow-sm bg-slate-800/90 text-slate-300 border border-slate-700">
                      COMPARTIDO
                    </span>
                  </div>

                  {/* Name and sector */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <h3 className="font-bold text-base leading-snug drop-shadow-md group-hover:text-emerald-300 transition-colors">
                      {route.name}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium flex items-center gap-1 mt-0.5 drop-shadow">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{route.sector}</span>
                    </p>
                  </div>
                </div>

                {/* Footer with holds count & delete action */}
                <div className="px-3.5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{holdsCount} presas</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectRoute(route)}
                      className="text-emerald-400 hover:underline font-medium cursor-pointer"
                    >
                      Ver vía →
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(route.id);
                      }}
                      title="Eliminar vía de amigo"
                      className="p-1 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state */
        <div 
          id="friends-empty-state"
          className="text-center py-14 px-4 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 space-y-4 max-w-lg mx-auto"
        >
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Aún no has importado bloques de amigos</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pide a tus amigos que pulsen en el botón superior <strong>"Exportar"</strong> y te envíen su archivo ZIP. Al seleccionarlo aquí, podrás ver todas sus vías con sus presas marcadas en alta resolución.
            </p>
          </div>
          <button
            onClick={onTriggerImport}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <FileUp className="w-4 h-4" />
            <span>Seleccionar Archivo ZIP</span>
          </button>
        </div>
      )}

    </div>
  );
};
