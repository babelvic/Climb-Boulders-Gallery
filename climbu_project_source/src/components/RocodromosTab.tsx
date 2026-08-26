import React, { useState } from 'react';
import { Building2, MapPin, Plus, Edit2, Trash2, Route as RouteIcon, AlertTriangle } from 'lucide-react';
import { Rocodromo, Route } from '../types';

interface RocodromosTabProps {
  rocodromos: Rocodromo[];
  routes: Route[];
  onOpenNewModal: () => void;
  onEditRocodromo: (roco: Rocodromo) => void;
  onDeleteRocodromo: (id: string) => void;
  onFilterByRocodromo: (name: string) => void;
}

export const RocodromosTab: React.FC<RocodromosTabProps> = ({
  rocodromos,
  routes,
  onOpenNewModal,
  onEditRocodromo,
  onDeleteRocodromo,
  onFilterByRocodromo
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const rocoToDelete = rocodromos.find((r) => r.id === confirmDeleteId);

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Mis Rocódromos y Sectores
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Administra los rocódromos y zonas donde entrenas y clasificas tus bloques.
          </p>
        </div>

        <button
          id="btn-add-rocodromo-main"
          onClick={onOpenNewModal}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Rocódromo</span>
        </button>
      </div>

      {/* In-app Confirmation Modal for Rocódromo Deletion */}
      {confirmDeleteId && rocoToDelete && (
        <div 
          id="delete-roco-confirm-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar rocódromo?</h3>
                <p className="text-xs text-slate-400">"{rocoToDelete.name}"</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
              Los bloques asociados a este rocódromo <strong>no se borrarán</strong>, pero dejarán de estar agrupados bajo este nombre.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-roco"
                onClick={() => {
                  onDeleteRocodromo(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                Sí, Eliminar Rocódromo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Gyms */}
      {rocodromos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rocodromos.map((roco) => {
            const boulderCount = routes.filter((r) => r.sector === roco.name).length;
            const sentCount = routes.filter((r) => r.sector === roco.name && r.status === 'Encadenado').length;

            return (
              <div
                key={roco.id}
                id={`roco-card-${roco.id}`}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-base text-white leading-tight">{roco.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{roco.city || 'Sin ubicación'}</span>
                      </p>
                    </div>

                    <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-emerald-400 font-bold font-mono rounded text-xs shrink-0">
                      {boulderCount} {boulderCount === 1 ? 'bloque' : 'bloques'}
                    </span>
                  </div>

                  {roco.notes && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed italic">
                      "{roco.notes}"
                    </p>
                  )}

                  {/* Sent stats */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                    <span className="text-emerald-400 font-medium">{sentCount} encadenados</span>
                    <span>·</span>
                    <span className="text-amber-400 font-medium">{boulderCount - sentCount} proyectos</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => onFilterByRocodromo(roco.name)}
                    className="text-emerald-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <RouteIcon className="w-3.5 h-3.5" />
                    <span>Ver vías ({boulderCount})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditRocodromo(roco)}
                      title="Editar Rocódromo"
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(roco.id)}
                      title="Eliminar Rocódromo"
                      className="p-1.5 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-500/30"
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
        <div className="text-center py-14 px-4 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-slate-700 text-slate-500 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No tienes rocódromos registrados</h3>
            <p className="text-xs text-slate-400">
              Registra los rocódromos donde entrenas para clasificar tus bloques y proyectos.
            </p>
          </div>
          <button
            onClick={onOpenNewModal}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm cursor-pointer active:scale-95"
          >
            + Añadir Primer Rocódromo
          </button>
        </div>
      )}

    </div>
  );
};
