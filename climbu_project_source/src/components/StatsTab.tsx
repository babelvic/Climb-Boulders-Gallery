import React, { useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Trophy, 
  CheckCircle2, 
  Layers, 
  Percent, 
  TrendingUp, 
  Flame,
  Building2
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { Route, Rocodromo } from '../types';
import { FONT_GRADES, getMaxGrade, formatGrade } from '../utils/grades';

Chart.register(...registerables);

interface StatsTabProps {
  routes: Route[];
  rocodromos: Rocodromo[];
  gradeSystem: 'FONT' | 'VSCALE';
}

export const StatsTab: React.FC<StatsTabProps> = ({
  routes,
  rocodromos,
  gradeSystem
}) => {
  const pyramidCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const pyramidChartRef = useRef<Chart | null>(null);
  const statusChartRef = useRef<Chart | null>(null);

  const total = routes.length;
  const sent = routes.filter((r) => r.status === 'Encadenado');
  const sentCount = sent.length;
  const projectCount = total - sentCount;
  const successRate = total > 0 ? Math.round((sentCount / total) * 100) : 0;
  const maxGrade = getMaxGrade(routes);

  // Initialize and update Chart.js
  useEffect(() => {
    // 1. Grade Pyramid Bar Chart
    if (pyramidCanvasRef.current) {
      if (pyramidChartRef.current) {
        pyramidChartRef.current.destroy();
      }

      // Count sent and projects per grade
      const gradeLabels = FONT_GRADES.map((g) => formatGrade(g, gradeSystem).toUpperCase());
      const sentData = FONT_GRADES.map(
        (g) => routes.filter((r) => r.grade.toLowerCase() === g && r.status === 'Encadenado').length
      );
      const projectData = FONT_GRADES.map(
        (g) => routes.filter((r) => r.grade.toLowerCase() === g && r.status === 'Proyecto').length
      );

      const ctx = pyramidCanvasRef.current.getContext('2d');
      if (ctx) {
        pyramidChartRef.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: gradeLabels,
            datasets: [
              {
                label: 'Encadenados (Sent)',
                data: sentData,
                backgroundColor: '#10b981',
                borderRadius: 6,
                borderSkipped: false
              },
              {
                label: 'Proyectos',
                data: projectData,
                backgroundColor: '#f59e0b',
                borderRadius: 6,
                borderSkipped: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: '#94a3b8',
                  font: { weight: 'bold', size: 11 },
                  usePointStyle: true,
                  boxWidth: 8
                }
              },
              tooltip: {
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderWidth: 1,
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1'
              }
            },
            scales: {
              x: {
                stacked: true,
                grid: { display: false },
                ticks: { color: '#94a3b8', font: { size: 10, weight: 'bold' } }
              },
              y: {
                stacked: true,
                grid: { color: '#1e293b' },
                ticks: { color: '#94a3b8', precision: 0 }
              }
            }
          }
        });
      }
    }

    // 2. Sent vs Project Doughnut Chart
    if (statusCanvasRef.current) {
      if (statusChartRef.current) {
        statusChartRef.current.destroy();
      }

      const ctx = statusCanvasRef.current.getContext('2d');
      if (ctx) {
        statusChartRef.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Encadenados (Sent)', 'Proyectos Pendientes'],
            datasets: [
              {
                data: total > 0 ? [sentCount, projectCount] : [1, 0],
                backgroundColor: total > 0 ? ['#10b981', '#f59e0b'] : ['#334155', '#1e293b'],
                borderWidth: 0,
                hoverOffset: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  color: '#cbd5e1',
                  font: { weight: 'bold', size: 12 },
                  usePointStyle: true,
                  boxWidth: 8,
                  padding: 16
                }
              },
              tooltip: {
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderWidth: 1
              }
            }
          }
        });
      }
    }

    return () => {
      if (pyramidChartRef.current) pyramidChartRef.current.destroy();
      if (statusChartRef.current) statusChartRef.current.destroy();
    };
  }, [routes, gradeSystem, sentCount, projectCount, total]);

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Métricas y Estadísticas de Escalada
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Analiza tu progresión de grados, efectividad en bloque y distribución de proyectos.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Boulders */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{total}</div>
            <div className="text-xs text-slate-400 font-medium">Bloques Totales</div>
          </div>
        </div>

        {/* Sent / Encadenados */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{sentCount}</div>
            <div className="text-xs text-slate-400 font-medium">Encadenados</div>
          </div>
        </div>

        {/* Max Grade */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">
              {formatGrade(maxGrade, gradeSystem)}
            </div>
            <div className="text-xs text-slate-400 font-medium">Máximo Grado</div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white font-mono">{successRate}%</div>
            <div className="text-xs text-slate-400 font-medium">Tasa de Éxito</div>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Grade Pyramid */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Pirámide de Grados (Encadenes vs Proyectos)
            </h3>
          </div>
          
          <div className="h-64 w-full relative">
            <canvas ref={pyramidCanvasRef} id="stats-pyramid-canvas" />
          </div>
        </div>

        {/* Sent vs Project Proportion */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-400" />
              Proporción Encadenados / Proyectos
            </h3>
          </div>

          <div className="h-64 w-full relative flex items-center justify-center">
            <canvas ref={statusCanvasRef} id="stats-doughnut-canvas" />
          </div>
        </div>

      </div>

      {/* Gym Activity Breakdown */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Desglose por Rocódromo / Sector
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rocodromos.map((roco) => {
            const rocoRoutes = routes.filter((r) => r.sector === roco.name);
            const rocoSent = rocoRoutes.filter((r) => r.status === 'Encadenado').length;
            const rocoRate = rocoRoutes.length > 0 ? Math.round((rocoSent / rocoRoutes.length) * 100) : 0;

            return (
              <div
                key={roco.id}
                className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white text-xs truncate">{roco.name}</h4>
                  <span className="text-xs text-emerald-400 font-bold font-mono">{rocoRate}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${rocoRate}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{rocoRoutes.length} bloques</span>
                  <span>{rocoSent} encadenados</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
