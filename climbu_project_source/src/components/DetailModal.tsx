import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  FileText, 
  Trophy, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Move, 
  AlertTriangle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Route } from '../types';
import { HOLD_TYPE_CONFIG, formatGrade } from '../utils/grades';

interface DetailModalProps {
  route: Route | null;
  gradeSystem: 'FONT' | 'VSCALE';
  isOpen: boolean;
  onClose: () => void;
  onToggleSent: (routeId: string) => void;
  onEdit: (route: Route) => void;
  onDelete: (routeId: string) => void;
  isFriendRoute?: boolean;
  friendName?: string;
  exportDate?: string;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  route,
  gradeSystem,
  isOpen,
  onClose,
  onToggleSent,
  onEdit,
  onDelete,
  isFriendRoute = false,
  friendName,
  exportDate
}) => {
  const [showHolds, setShowHolds] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const modalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  // Reset states when opening a route
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setShowDeleteConfirm(false);
      setIsFullscreen(false);
      setShowHolds(true);
    }
  }, [isOpen, route?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
          setZoom(1);
          setPan({ x: 0, y: 0 });
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose]);

  // Render canvas with photo + holds & badges
  const drawRouteOnCanvas = useCallback((canvas: HTMLCanvasElement | null, targetWidth: number) => {
    if (!canvas || !route?.imageUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const safeTargetWidth = Math.max(targetWidth || 600, 320);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = safeTargetWidth / img.naturalWidth;
      canvas.width = safeTargetWidth;
      canvas.height = img.naturalHeight * scale;

      // Draw background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Draw holds if visible
      if (showHolds && route.holds && route.holds.length > 0) {
        route.holds.forEach((hold) => {
          const cfg = HOLD_TYPE_CONFIG[hold.type] || HOLD_TYPE_CONFIG.Hold;
          const color = cfg.color || hold.color;
          const x = hold.x * canvas.width;
          const y = hold.y * canvas.height;
          const r = (hold.r || 0.04) * canvas.width;

          ctx.save();
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;

          // Hold perimeter ring
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.lineWidth = Math.max(3, canvas.width * 0.0075);
          ctx.strokeStyle = color;
          ctx.stroke();

          // Hold fill tint
          ctx.fillStyle = color + '40';
          ctx.fill();

          ctx.shadowBlur = 0;

          // Inner center pin
          ctx.beginPath();
          ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          // Badges for Start, Top and Key (Zone / Bonus)
          if (hold.type === 'Start' || hold.type === 'Top' || hold.type === 'Key') {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(11, Math.round(canvas.width * 0.024))}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const label = hold.type === 'Start' ? 'INICIO' : hold.type === 'Top' ? 'TOP' : 'ZONA';
            
            const textWidth = ctx.measureText(label).width;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            if (ctx.roundRect) {
              ctx.roundRect(x - textWidth / 2 - 6, y - r - 18, textWidth + 12, 16, 4);
            } else {
              ctx.fillRect(x - textWidth / 2 - 6, y - r - 18, textWidth + 12, 16);
            }
            ctx.fill();

            ctx.fillStyle = color;
            ctx.fillText(label, x, y - r - 10);
          }

          ctx.restore();
        });
      }
    };
    img.src = route.imageUrl;
  }, [route, showHolds]);

  // Standard modal canvas redraw
  useEffect(() => {
    if (!isOpen || !route || isFullscreen) return;
    const canvas = modalCanvasRef.current;
    if (!canvas) return;
    const container = modalContainerRef.current;
    const targetWidth = container ? Math.min(container.clientWidth || 640, 680) : 640;
    drawRouteOnCanvas(canvas, targetWidth);
  }, [isOpen, route, showHolds, isFullscreen, drawRouteOnCanvas]);

  // Fullscreen canvas redraw
  useEffect(() => {
    if (!isOpen || !route || !isFullscreen) return;
    const canvas = fullscreenCanvasRef.current;
    if (!canvas) return;
    const targetWidth = Math.min(window.innerWidth * 0.92, 1200);
    drawRouteOnCanvas(canvas, targetWidth);
  }, [isOpen, route, showHolds, isFullscreen, drawRouteOnCanvas]);

  if (!isOpen || !route) return null;

  const isSent = route.status === 'Encadenado';

  const handleSentClick = () => {
    if (!isSent) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#3b82f6', '#f59e0b', '#a855f7']
        });
      } catch (e) {}
    }
    onToggleSent(route.id);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.35, 4));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.35, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleSetZoom2x = () => {
    setZoom(2);
  };

  // Mouse pan drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev + 0.25, 4));
    } else {
      setZoom((prev) => {
        const next = Math.max(prev - 0.25, 1);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    onDelete(route.id);
  };

  // ==========================================
  // 1. FULLSCREEN EXCLUSIVE VIEW
  // ==========================================
  if (isFullscreen) {
    return (
      <div 
        id="route-fullscreen-overlay"
        className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between overflow-hidden select-none animate-in fade-in duration-200"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {/* Fullscreen Top Navigation Bar */}
        <header className="w-full px-4 sm:px-6 py-3 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-30 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="bg-slate-950 border border-emerald-500/60 text-emerald-300 font-bold font-mono px-2.5 py-0.5 rounded text-xs sm:text-sm">
              {formatGrade(route.grade, gradeSystem)}
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
                {route.name}
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{route.sector}</span>
                {isFriendRoute && friendName && (
                  <span className="text-emerald-400 font-medium ml-1">· De {friendName}</span>
                )}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            {/* Toggle Holds */}
            <button
              id="fs-toggle-holds-btn"
              onClick={() => setShowHolds(!showHolds)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              title="Mostrar u ocultar círculos de presas"
            >
              {showHolds ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
              <span className="hidden sm:inline">{showHolds ? 'Presas ON' : 'Presas OFF'}</span>
            </button>

            {/* Exit Fullscreen Button */}
            <button
              id="fs-exit-btn"
              onClick={() => {
                setIsFullscreen(false);
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              title="Volver al detalle del bloque (Esc)"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Cerrar Pantalla Completa</span>
            </button>
          </div>
        </header>

        {/* Fullscreen Interactive Canvas Viewport */}
        <div 
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          className={`w-full flex-1 flex items-center justify-center overflow-hidden relative ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          <div 
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.12s ease-out'
            }}
            className="max-w-full max-h-full flex items-center justify-center p-4"
          >
            <canvas 
              ref={fullscreenCanvasRef} 
              className="rounded-xl shadow-2xl max-w-full max-h-[82vh] object-contain border border-slate-800" 
            />
          </div>

          {/* Hint Overlay when zoomed */}
          {zoom > 1 ? (
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-800 text-xs text-slate-300 px-3 py-1.5 rounded-lg pointer-events-none flex items-center gap-2 shadow-lg">
              <Move className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Arrastra con el ratón o dedo para moverte por la vía</span>
            </div>
          ) : (
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-800 text-[11px] text-slate-400 px-3 py-1 rounded-lg pointer-events-none hidden sm:block">
              Usa la rueda del ratón o los botones inferiores para hacer Zoom
            </div>
          )}
        </div>

        {/* Fullscreen Bottom Zoom Control Toolbar */}
        <footer className="w-full px-4 py-3 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-3 z-30 shadow-lg">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Alejar (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 min-w-[70px] text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Acercar (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
              zoom === 1
                ? 'bg-slate-950 text-slate-500 border-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Restablecer al 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>100%</span>
          </button>

          <button
            onClick={handleSetZoom2x}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              zoom === 2
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Vista de detalle 200%"
          >
            200%
          </button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // 2. STANDARD DETAIL MODAL DIALOG VIEW
  // ==========================================
  return (
    <div 
      id="detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div 
        id="detail-modal-card"
        className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto relative"
      >
        
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Grade badge */}
            <span className="bg-slate-950 border border-emerald-500/60 text-emerald-300 font-bold font-mono px-2.5 py-0.5 rounded text-xs shadow-sm">
              {formatGrade(route.grade, gradeSystem)}
            </span>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {route.name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{route.sector}</span>
                {isFriendRoute && friendName && (
                  <span className="text-emerald-400 font-medium ml-1">· De {friendName}</span>
                )}
              </p>
            </div>
          </div>

          <button
            id="close-detail-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Canvas Box with Controls */}
          <div className="space-y-2" ref={modalContainerRef}>
            <div className="flex items-center justify-between text-xs px-1 text-slate-400">
              <span className="font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Visualizador de la Vía ({route.holds?.length || 0} presas)
              </span>

              <div className="flex items-center gap-2">
                {/* Fullscreen Trigger */}
                <button
                  type="button"
                  id="btn-open-fullscreen"
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-emerald-500/30"
                  title="Abrir a Pantalla Completa para ver en alta resolución y hacer Zoom"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pantalla Completa & Zoom</span>
                </button>

                {/* Toggle Holds */}
                <button
                  type="button"
                  id="toggle-holds-view-btn"
                  onClick={() => setShowHolds(!showHolds)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-700"
                >
                  {showHolds ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ocultar Presas</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mostrar Presas</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div 
              onClick={() => setIsFullscreen(true)}
              className="bg-black rounded-xl overflow-hidden flex justify-center shadow-inner border border-slate-800 relative group cursor-pointer"
            >
              <canvas ref={modalCanvasRef} className="max-w-full h-auto" />
              
              {/* Quick Fullscreen Hover Hint Overlay */}
              <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-colors flex items-end justify-end p-3 pointer-events-none">
                <div className="bg-slate-900/90 text-white px-2.5 py-1.5 rounded-lg backdrop-blur-sm border border-slate-700 text-xs flex items-center gap-1.5 shadow-md group-hover:scale-105 transition-transform">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Toca para Pantalla Completa & Zoom</span>
                </div>
              </div>
            </div>
          </div>

          {/* Route Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block font-medium mb-0.5">Estado:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono ${
                isSent ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
              }`}>
                {isSent ? 'ENCADENADO' : 'PROYECTO'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block font-medium mb-0.5">Fecha Registro:</span>
              <span className="font-medium text-slate-200 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-slate-400" />
                {route.createdAt ? new Date(route.createdAt).toLocaleDateString() : '-'}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-500 block font-medium mb-0.5">Encadenado el:</span>
              <span className="font-medium text-emerald-400 flex items-center gap-1 font-mono">
                <Trophy className="w-3 h-3" />
                {route.sentAt ? new Date(route.sentAt).toLocaleDateString() : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Hold Types Legend */}
          {route.holds && route.holds.length > 0 && (
            <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Presas marcadas en esta vía ({route.holds.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {route.holds.map((h, i) => {
                  const cfg = HOLD_TYPE_CONFIG[h.type] || HOLD_TYPE_CONFIG.Hold;
                  const color = cfg.color || h.color;
                  return (
                    <span
                      key={h.id || i}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-200 border border-slate-700/80 flex items-center gap-1.5 shadow-xs"
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span>{cfg.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes & Beta */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              Notas Técnicas & Beta:
            </h4>
            <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 text-xs sm:text-sm text-slate-300 leading-relaxed italic">
              {route.notes || 'No hay notas registradas para este bloque.'}
            </div>
          </div>

        </div>

        {/* Delete In-App Confirmation Popover */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-950/90 border-t border-rose-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>¿Seguro que deseas eliminar permanentemente el bloque <strong>"{route.name}"</strong>?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="confirm-delete-route-btn"
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shadow-sm cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 z-10">
          
          {/* Quick Sent toggle */}
          {!isFriendRoute && (
            <button
              id="detail-toggle-sent-btn"
              type="button"
              onClick={handleSentClick}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 ${
                isSent
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-sm'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSent ? '¡Encadenado! (Cambiar a Proyecto)' : 'Marcar Encadenado (Sent!)'}</span>
            </button>
          )}

          {/* Edit & Delete actions */}
          <div className="flex items-center gap-2 ml-auto">
            {!isFriendRoute && (
              <button
                id="detail-edit-route-btn"
                type="button"
                onClick={() => onEdit(route)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            )}

            <button
              id="detail-delete-route-btn"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isFriendRoute ? 'Eliminar de Amigos' : 'Eliminar'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
