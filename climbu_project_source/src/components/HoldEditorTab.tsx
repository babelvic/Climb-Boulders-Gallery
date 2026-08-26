import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RotateCcw, 
  Trash2, 
  Save, 
  X, 
  Plus, 
  Sparkles, 
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Hold, HoldType, Route, Rocodromo, RouteStatus } from '../types';
import { FONT_GRADES, HOLD_TYPE_CONFIG, formatGrade } from '../utils/grades';
import { generateSampleClimbingWallSvg } from '../utils/storage';

interface HoldEditorTabProps {
  initialRoute?: Route | null;
  rocodromos: Rocodromo[];
  gradeSystem: 'FONT' | 'VSCALE';
  onSaveRoute: (route: Partial<Route>) => void;
  onCancel: () => void;
  onOpenNewRocodromoModal: () => void;
}

export const HoldEditorTab: React.FC<HoldEditorTabProps> = ({
  initialRoute,
  rocodromos,
  gradeSystem,
  onSaveRoute,
  onCancel,
  onOpenNewRocodromoModal
}) => {
  const [name, setName] = useState(initialRoute?.name || '');
  const [sector, setSector] = useState(initialRoute?.sector || rocodromos[0]?.name || 'General');
  const [grade, setGrade] = useState(initialRoute?.grade || '6a');
  const [status, setStatus] = useState<RouteStatus>(initialRoute?.status || 'Proyecto');
  const [notes, setNotes] = useState(initialRoute?.notes || '');
  
  const [selectedHoldType, setSelectedHoldType] = useState<HoldType>('Start');
  const [holds, setHolds] = useState<Hold[]>(initialRoute?.holds || []);
  const [imageSrc, setImageSrc] = useState<string | null>(initialRoute?.imageUrl || null);
  const [holdRadius, setHoldRadius] = useState<number>(0.04); // Relative to canvas width

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load existing image if editing
  useEffect(() => {
    if (initialRoute) {
      setName(initialRoute.name);
      setSector(initialRoute.sector);
      setGrade(initialRoute.grade);
      setStatus(initialRoute.status);
      setNotes(initialRoute.notes || '');
      setHolds(initialRoute.holds || []);
      if (initialRoute.imageUrl) {
        setImageSrc(initialRoute.imageUrl);
      }
    }
  }, [initialRoute]);

  // Load and render image to canvas
  useEffect(() => {
    if (!imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementRef.current = img;
      redrawCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw when holds or radius change
  useEffect(() => {
    redrawCanvas();
  }, [holds]);

  // Redraw canvas with photo + holds
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageElementRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive width matching parent container (max 750px)
    const container = canvas.parentElement;
    const maxWidth = container ? Math.min(container.clientWidth || 700, 750) : 700;
    const scale = maxWidth / img.naturalWidth;

    canvas.width = maxWidth;
    canvas.height = img.naturalHeight * scale;

    // Draw background image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw holds
    holds.forEach((hold, index) => {
      const x = hold.x * canvas.width;
      const y = hold.y * canvas.height;
      const r = (hold.r || holdRadius) * canvas.width;

      ctx.save();

      // Outer glow/shadow
      ctx.shadowColor = hold.color;
      ctx.shadowBlur = 8;

      // Circle border
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(3, canvas.width * 0.007);
      ctx.strokeStyle = hold.color;
      ctx.stroke();

      // Fill with semi-transparent tint
      ctx.fillStyle = hold.color + '40';
      ctx.fill();

      ctx.shadowBlur = 0;

      // Inner center dot
      ctx.beginPath();
      ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Label Start / Top / Zone
      if (hold.type === 'Start' || hold.type === 'Top' || hold.type === 'Key') {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(10, Math.round(canvas.width * 0.024))}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = hold.type === 'Start' ? 'INICIO' : hold.type === 'Top' ? 'TOP' : 'ZONA';
        
        // Label background badge
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.roundRect 
          ? ctx.roundRect(x - textWidth / 2 - 5, y - r - 16, textWidth + 10, 14, 4)
          : ctx.fillRect(x - textWidth / 2 - 5, y - r - 16, textWidth + 10, 14);
        ctx.fill();

        ctx.fillStyle = hold.color;
        ctx.fillText(label, x, y - r - 9);
      }

      ctx.restore();
    });
  };

  // Handle click or tap on canvas to place / remove hold
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const clickXRel = (clientX - rect.left) / canvas.width;
    const clickYRel = (clientY - rect.top) / canvas.height;

    // Check if clicking existing hold to delete or update
    const existingIndex = holds.findIndex((h) => {
      const dx = (h.x - clickXRel) * canvas.width;
      const dy = (h.y - clickYRel) * canvas.height;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= (h.r || holdRadius) * canvas.width * 1.2;
    });

    if (existingIndex >= 0) {
      // Remove clicked hold
      const newHolds = [...holds];
      newHolds.splice(existingIndex, 1);
      setHolds(newHolds);
    } else {
      // Place new hold
      const config = HOLD_TYPE_CONFIG[selectedHoldType];
      const newHold: Hold = {
        id: 'hold_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        x: clickXRel,
        y: clickYRel,
        r: holdRadius,
        color: config.color,
        type: selectedHoldType
      };
      setHolds([...holds, newHold]);
    }
  };

  // Handle image upload from file or camera
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageSrc(result);
    };
    reader.readAsDataURL(file);
  };

  // Select sample wall template
  const selectSampleWall = (theme: 'emerald' | 'crimson' | 'slate' | 'amber') => {
    const svgUrl = generateSampleClimbingWallSvg(theme);
    setImageSrc(svgUrl);
  };

  const handleUndo = () => {
    if (holds.length === 0) return;
    setHolds(holds.slice(0, -1));
  };

  const handleClear = () => {
    setHolds([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const routeData: Partial<Route> = {
      id: initialRoute ? initialRoute.id : 'route_' + Date.now(),
      name: name.trim(),
      sector: sector || 'General',
      grade,
      status,
      notes: notes.trim(),
      holds,
      imageUrl: imageSrc || generateSampleClimbingWallSvg('emerald'),
      createdAt: initialRoute ? initialRoute.createdAt : new Date().toISOString(),
      sentAt: status === 'Encadenado' ? (initialRoute?.sentAt || new Date().toISOString()) : undefined
    };

    onSaveRoute(routeData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8 animate-in fade-in duration-200">
      
      {/* Header title */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            {initialRoute ? 'Editar Bloque & Secuencia' : 'Registrar Nuevo Bloque'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sube o elige la foto de la pared y marca las presas de la vía tocando la imagen.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-700"
        >
          Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Image & Interactive Hold Canvas */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                1
              </span>
              Foto del Bloque y Marcador Interactivo de Presas
            </h3>
            {imageSrc && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-emerald-400 font-medium hover:underline cursor-pointer flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                Cambiar foto
              </button>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="editor-file-input"
          />

          {!imageSrc ? (
            /* Upload Zone + Presets */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-800/40 hover:bg-slate-800/60 rounded-xl p-8 sm:p-10 text-center transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 mb-3 shadow-sm group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Haz clic para subir o tomar una foto de la pared
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Soporta fotos desde tu móvil, cámara o disco local.
                </p>
              </div>

              {/* Sample Walls Picker */}
              <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¿No tienes una foto ahora mismo? Usa una pared de ejemplo:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => selectSampleWall('emerald')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500 rounded-lg text-xs font-medium text-emerald-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Pared Esmeralda
                  </button>
                  <button
                    type="button"
                    onClick={() => selectSampleWall('crimson')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-rose-500/30 hover:border-rose-500 rounded-lg text-xs font-medium text-rose-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Pared Carmín
                  </button>
                  <button
                    type="button"
                    onClick={() => selectSampleWall('amber')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500 rounded-lg text-xs font-medium text-amber-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    Pared Ámbar
                  </button>
                  <button
                    type="button"
                    onClick={() => selectSampleWall('slate')}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-sky-500/30 hover:border-sky-500 rounded-lg text-xs font-medium text-sky-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    Pared Pizarra
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Interactive Canvas & Tool Palette */
            <div className="space-y-4">
              
              {/* Hold Type Selector Bar */}
              <div className="bg-slate-950/80 p-3 sm:p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Tipo de Presa Activa:
                  </span>
                  
                  {/* Action buttons (Undo, Clear) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={holds.length === 0}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                      title="Deshacer última presa marcada"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Deshacer</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClear}
                      disabled={holds.length === 0}
                      className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-40 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Limpiar todas las presas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpiar ({holds.length})</span>
                    </button>
                  </div>
                </div>

                {/* 5 Hold Color Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(Object.keys(HOLD_TYPE_CONFIG) as HoldType[]).map((type) => {
                    const cfg = HOLD_TYPE_CONFIG[type];
                    const isSelected = selectedHoldType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        id={`btn-hold-${type.toLowerCase()}`}
                        onClick={() => setSelectedHoldType(type)}
                        className={`p-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                          isSelected
                            ? `${cfg.bgColor}/20 ${cfg.borderColor} text-white font-bold ring-1 ring-emerald-500/30`
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: cfg.color }}
                        />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Hold Size Slider */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tamaño del marcador:</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.08"
                    step="0.005"
                    value={holdRadius}
                    onChange={(e) => setHoldRadius(parseFloat(e.target.value))}
                    className="accent-emerald-500 w-32 sm:w-48 cursor-pointer"
                  />
                  <span className="font-mono text-slate-300">{Math.round(holdRadius * 1000)}px</span>
                </div>
              </div>

              {/* Canvas viewport */}
              <div className="bg-black rounded-xl overflow-hidden shadow-md flex justify-center border border-slate-800 relative">
                <canvas
                  ref={canvasRef}
                  id="hold-marking-canvas"
                  onClick={handleCanvasClick}
                  onTouchStart={handleCanvasClick}
                  className="max-w-full h-auto cursor-crosshair touch-none select-none"
                />
              </div>

              {/* Interactive Help Hint */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Tip:</strong> Toca cualquier punto de la foto para añadir una presa. Toca sobre una presa ya marcada para borrarla.
                </span>
              </div>

            </div>
          )}

        </div>

        {/* Step 2: Route Metadata Form */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                2
              </span>
              Información del Bloque & Beta
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Nombre del Bloque *
              </label>
              <input
                id="input-route-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Techo de Romos, El Gran Dyno, La Arista..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Rocódromo / Sector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">
                  Rocódromo / Sector *
                </label>
                <button
                  type="button"
                  onClick={onOpenNewRocodromoModal}
                  className="text-xs text-emerald-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Nuevo Rocódromo
                </button>
              </div>
              <select
                id="select-route-sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {rocodromos.map((roco) => (
                  <option key={roco.id} value={roco.name}>
                    {roco.name} {roco.city ? `(${roco.city})` : ''}
                  </option>
                ))}
                {rocodromos.length === 0 && (
                  <option value="General">General (Sin rocódromo asignado)</option>
                )}
              </select>
            </div>

            {/* Grade */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Grado de Dificultad *
              </label>
              <select
                id="select-route-grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
              >
                {FONT_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g.toUpperCase()} {gradeSystem === 'VSCALE' ? `(${formatGrade(g, 'VSCALE')})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">
                Estado Actual de la Vía *
              </label>
              <select
                id="select-route-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RouteStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
              >
                <option value="Proyecto">🟠 Proyecto (En progreso)</option>
                <option value="Encadenado">🟢 Encadenado (Sent!)</option>
              </select>
            </div>

          </div>

          {/* Notes / Technical Beta */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              Notas Técnicas, Beta y Sensaciones
            </label>
            <textarea
              id="textarea-route-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Empezar con pie izquierdo alto, talón en el volumen azul, cruce dinámico a presa clave..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-sm transition-colors cursor-pointer border border-slate-700"
          >
            Cancelar
          </button>
          <button
            id="save-route-submit-btn"
            type="submit"
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            {initialRoute ? 'Actualizar Bloque' : 'Guardar Bloque'}
          </button>
        </div>

      </form>
    </div>
  );
};
