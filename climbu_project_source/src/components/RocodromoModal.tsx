import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, FileText, Check } from 'lucide-react';
import { Rocodromo } from '../types';

interface RocodromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roco: { name: string; city: string; notes?: string; id?: string }) => void;
  editingRocodromo?: Rocodromo | null;
}

export const RocodromoModal: React.FC<RocodromoModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRocodromo
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingRocodromo) {
      setName(editingRocodromo.name);
      setCity(editingRocodromo.city || '');
      setNotes(editingRocodromo.notes || '');
    } else {
      setName('');
      setCity('');
      setNotes('');
    }
  }, [editingRocodromo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      city: city.trim(),
      notes: notes.trim(),
      id: editingRocodromo ? editingRocodromo.id : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="rocodromo-modal-container" 
        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingRocodromo ? 'Editar Rocódromo' : 'Nuevo Rocódromo'}
              </h3>
              <p className="text-xs text-slate-400">Organiza tus zonas y sectores de entrenamiento</p>
            </div>
          </div>
          <button
            id="close-roco-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="block text-slate-300 font-medium flex items-center gap-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Nombre del Rocódromo / Sector *
            </label>
            <input
              id="input-roco-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sharma Climbing, Sputnik, Rock & Wall..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-medium flex items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Ciudad o Ubicación
            </label>
            <input
              id="input-roco-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej: Madrid, Barcelona, Valencia, Rodellar..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-300 font-medium flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Notas o Características
            </label>
            <textarea
              id="input-roco-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Muros de hasta 60°, Moonboard 2019, zona de campus..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-xs border border-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="save-roco-btn"
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              {editingRocodromo ? 'Guardar Cambios' : 'Crear Rocódromo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
