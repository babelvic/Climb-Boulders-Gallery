import JSZip from 'jszip';
import { Route, Rocodromo, FriendRoute, UserProfile, ZipManifest } from '../types';

const STORAGE_KEYS = {
  ROUTES: 'climbu_routes',
  ROCODROMOS: 'climbu_rocodromos',
  FRIENDS: 'climbu_friends',
  AUTH: 'climbu_auth_user'
};

// Generador de texturas de pared de escalada SVG con presas estéticas de fondo
export function generateSampleClimbingWallSvg(theme: 'emerald' | 'amber' | 'slate' | 'crimson' = 'emerald'): string {
  const themes = {
    emerald: { bg1: '#0f172a', bg2: '#022c22', holdAccent: '#10b981', panelLine: '#1e293b' },
    amber: { bg1: '#1c1917', bg2: '#292524', holdAccent: '#f59e0b', panelLine: '#332e29' },
    slate: { bg1: '#0b0f19', bg2: '#1e293b', holdAccent: '#38bdf8', panelLine: '#334155' },
    crimson: { bg1: '#18181b', bg2: '#3f1122', holdAccent: '#f43f5e', panelLine: '#27272a' }
  };
  const t = themes[theme];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
    <defs>
      <linearGradient id="wallGrad_${theme}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${t.bg1}" />
        <stop offset="100%" stop-color="${t.bg2}" />
      </linearGradient>
      <pattern id="plywood_${theme}" width="80" height="80" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="2" fill="#334155" opacity="0.4"/>
        <circle cx="60" cy="60" r="2" fill="#334155" opacity="0.4"/>
        <circle cx="20" cy="60" r="2" fill="#334155" opacity="0.4"/>
        <circle cx="60" cy="20" r="2" fill="#334155" opacity="0.4"/>
      </pattern>
      <linearGradient id="holdVol" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#334155" />
        <stop offset="100%" stop-color="#0f172a" />
      </linearGradient>
    </defs>
    
    <!-- Background Panel -->
    <rect width="800" height="1000" fill="url(#wallGrad_${theme})" />
    <rect width="800" height="1000" fill="url(#plywood_${theme})" />

    <!-- Volume 3D Polygon 1 -->
    <polygon points="120,300 380,180 320,480 180,520" fill="url(#holdVol)" stroke="#475569" stroke-width="2" opacity="0.85"/>
    <polygon points="120,300 380,180 250,220" fill="#475569" opacity="0.4"/>
    
    <!-- Volume 3D Polygon 2 -->
    <polygon points="500,550 720,420 680,780 440,700" fill="url(#holdVol)" stroke="#475569" stroke-width="2" opacity="0.9"/>
    <polygon points="720,420 680,780 580,620" fill="#64748b" opacity="0.3"/>

    <!-- Sloper Volume Top -->
    <polygon points="300,80 520,60 480,180 240,160" fill="url(#holdVol)" stroke="#475569" stroke-width="2" opacity="0.85"/>

    <!-- Screw-on T-Nuts Pattern -->
    <g fill="#1e293b" stroke="#0f172a" stroke-width="1">
      ${Array.from({ length: 24 }).map((_, i) => {
        const cx = 100 + (i % 6) * 110 + (Math.sin(i) * 20);
        const cy = 120 + Math.floor(i / 6) * 200 + (Math.cos(i) * 30);
        return `<circle cx="${cx}" cy="${cy}" r="5" />`;
      }).join('')}
    </g>

    <!-- Synthetic Climbing Holds -->
    <!-- Start holds -->
    <path d="M 220 850 Q 240 820 280 840 Q 290 870 250 880 Z" fill="#059669" stroke="#34d399" stroke-width="3"/>
    <path d="M 380 860 Q 420 830 440 860 Q 430 890 390 880 Z" fill="#059669" stroke="#34d399" stroke-width="3"/>
    
    <!-- Middle crimps & pinches -->
    <path d="M 280 680 Q 320 660 340 690 Q 310 720 270 700 Z" fill="#2563eb" stroke="#60a5fa" stroke-width="3"/>
    <path d="M 460 520 Q 500 500 520 540 Q 480 560 450 530 Z" fill="#2563eb" stroke="#60a5fa" stroke-width="3"/>
    <path d="M 250 420 Q 300 400 320 440 Q 280 460 230 440 Z" fill="#7c3aed" stroke="#c084fc" stroke-width="3"/>
    <path d="M 520 340 Q 560 310 580 350 Q 550 380 500 360 Z" fill="#ca8a04" stroke="#fde047" stroke-width="3"/>
    <path d="M 360 260 Q 400 240 430 270 Q 390 300 340 280 Z" fill="#2563eb" stroke="#60a5fa" stroke-width="3"/>
    
    <!-- Top Jug -->
    <path d="M 380 120 Q 440 90 480 130 Q 450 160 390 150 Z" fill="#dc2626" stroke="#f87171" stroke-width="4"/>

    <!-- Aesthetic Wall Shadows -->
    <line x1="0" y1="0" x2="800" y2="1000" stroke="${t.panelLine}" stroke-width="1" opacity="0.3"/>
    <line x1="800" y1="0" x2="0" y2="1000" stroke="${t.panelLine}" stroke-width="1" opacity="0.3"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_ROCODROMOS: Rocodromo[] = [
  {
    id: 'roco_sharma',
    name: 'Sharma Climbing BCN',
    city: 'Barcelona, España',
    notes: 'Muros de competición y desplomes increíbles.',
    createdAt: '2026-01-10T10:00:00.000Z',
    isSample: true
  },
  {
    id: 'roco_sputnik',
    name: 'Sputnik Climbing',
    city: 'Madrid, España',
    notes: 'Zona de campus board, spray wall y moonboard.',
    createdAt: '2026-01-15T12:00:00.000Z',
    isSample: true
  },
  {
    id: 'roco_indoorwall',
    name: 'Indoorwall Boulder Gym',
    city: 'Valencia, España',
    notes: 'Bloques técnicos sobre volúmenes y placas.',
    createdAt: '2026-02-01T09:30:00.000Z',
    isSample: true
  }
];

export const DEFAULT_ROUTES: Route[] = [
  {
    id: 'route_dyno_master',
    name: 'El Vuelo del Halcón (Dyno)',
    rocodromoId: 'roco_sharma',
    sector: 'Sharma Climbing BCN',
    grade: '6c+',
    status: 'Encadenado',
    createdAt: '2026-02-18T14:30:00.000Z',
    sentAt: '2026-02-20T18:45:00.000Z',
    imageUrl: generateSampleClimbingWallSvg('emerald'),
    notes: 'Inicio bajo sentado, talón derecho en volumen y lanzamiento directo a dos manos a la presa morada clave.',
    attempts: 4,
    isSample: true,
    holds: [
      { id: 'h1', x: 0.32, y: 0.86, r: 0.045, color: '#22c55e', type: 'Start' },
      { id: 'h2', x: 0.52, y: 0.86, r: 0.045, color: '#22c55e', type: 'Start' },
      { id: 'h3', x: 0.38, y: 0.69, r: 0.04, color: '#eab308', type: 'Hold' },
      { id: 'h4', x: 0.61, y: 0.53, r: 0.04, color: '#eab308', type: 'Hold' },
      { id: 'h5', x: 0.35, y: 0.43, r: 0.045, color: '#a855f7', type: 'Key' },
      { id: 'h6', x: 0.67, y: 0.35, r: 0.035, color: '#3b82f6', type: 'Foot' },
      { id: 'h7', x: 0.48, y: 0.27, r: 0.04, color: '#eab308', type: 'Hold' },
      { id: 'h8', x: 0.53, y: 0.13, r: 0.05, color: '#ef4444', type: 'Top' },
    ]
  },
  {
    id: 'route_regletas_crimson',
    name: 'Travesía de Micro-Regletas',
    rocodromoId: 'roco_sputnik',
    sector: 'Sputnik Climbing',
    grade: '7a',
    status: 'Proyecto',
    createdAt: '2026-02-22T11:15:00.000Z',
    imageUrl: generateSampleClimbingWallSvg('crimson'),
    notes: 'Mucho arqueo de dedos. Cuidado con el paso al invertido antes de tirar al top.',
    attempts: 7,
    isSample: true,
    holds: [
      { id: 'h1', x: 0.25, y: 0.88, r: 0.045, color: '#22c55e', type: 'Start' },
      { id: 'h2', x: 0.42, y: 0.70, r: 0.04, color: '#eab308', type: 'Hold' },
      { id: 'h3', x: 0.58, y: 0.58, r: 0.045, color: '#a855f7', type: 'Key' },
      { id: 'h4', x: 0.38, y: 0.45, r: 0.035, color: '#3b82f6', type: 'Foot' },
      { id: 'h5', x: 0.52, y: 0.30, r: 0.04, color: '#eab308', type: 'Hold' },
      { id: 'h6', x: 0.50, y: 0.12, r: 0.05, color: '#ef4444', type: 'Top' },
    ]
  },
  {
    id: 'route_volumenes_placa',
    name: 'Equilibrio Puro en Placa',
    rocodromoId: 'roco_indoorwall',
    sector: 'Indoorwall Boulder Gym',
    grade: '6a+',
    status: 'Encadenado',
    createdAt: '2026-02-24T16:00:00.000Z',
    sentAt: '2026-02-24T17:10:00.000Z',
    imageUrl: generateSampleClimbingWallSvg('slate'),
    notes: 'Confianza en pies sobre fricción. Cambio de peso suave sin brusquedades.',
    attempts: 2,
    isSample: true,
    holds: [
      { id: 'h1', x: 0.35, y: 0.85, r: 0.045, color: '#22c55e', type: 'Start' },
      { id: 'h2', x: 0.45, y: 0.65, r: 0.04, color: '#eab308', type: 'Hold' },
      { id: 'h3', x: 0.30, y: 0.50, r: 0.035, color: '#3b82f6', type: 'Foot' },
      { id: 'h4', x: 0.55, y: 0.38, r: 0.045, color: '#a855f7', type: 'Key' },
      { id: 'h5', x: 0.50, y: 0.15, r: 0.05, color: '#ef4444', type: 'Top' },
    ]
  },
  {
    id: 'route_sloper_roof',
    name: 'Techo de Romos y Compresión',
    rocodromoId: 'roco_sharma',
    sector: 'Sharma Climbing BCN',
    grade: '7b',
    status: 'Proyecto',
    createdAt: '2026-02-25T19:00:00.000Z',
    imageUrl: generateSampleClimbingWallSvg('amber'),
    notes: 'Exige tensión corporal máxima y gancho de puntera salvaje en la presa 4.',
    attempts: 12,
    isSample: true,
    holds: [
      { id: 'h1', x: 0.30, y: 0.88, r: 0.045, color: '#22c55e', type: 'Start' },
      { id: 'h2', x: 0.48, y: 0.88, r: 0.045, color: '#22c55e', type: 'Start' },
      { id: 'h3', x: 0.36, y: 0.62, r: 0.045, color: '#a855f7', type: 'Key' },
      { id: 'h4', x: 0.68, y: 0.55, r: 0.035, color: '#3b82f6', type: 'Foot' },
      { id: 'h5', x: 0.42, y: 0.32, r: 0.04, color: '#eab308', type: 'Hold' },
      { id: 'h6', x: 0.52, y: 0.14, r: 0.05, color: '#ef4444', type: 'Top' },
    ]
  }
];

export const DEFAULT_FRIEND_ROUTES: FriendRoute[] = [
  {
    id: 'friend_route_1',
    friendName: 'Alex Megos',
    exportDate: '24/02/2026',
    name: 'Bidedos del Infierno',
    sector: 'Frankenjura Gym',
    grade: '7c+',
    status: 'Encadenado',
    createdAt: '2026-02-20T10:00:00.000Z',
    sentAt: '2026-02-20T11:00:00.000Z',
    imageUrl: generateSampleClimbingWallSvg('crimson'),
    notes: 'Fuerza extrema de dedos, dos bidedos seguidos en desplome de 45 grados.',
    isSample: true,
    holds: [
      { id: 'hf1', x: 0.30, y: 0.85, r: 0.045, color: '#22c55e', type: 'Start' },
      { id: 'hf2', x: 0.45, y: 0.60, r: 0.045, color: '#a855f7', type: 'Key' },
      { id: 'hf3', x: 0.55, y: 0.35, r: 0.04, color: '#eab308', type: 'Hold' },
      { id: 'hf4', x: 0.50, y: 0.12, r: 0.05, color: '#ef4444', type: 'Top' },
    ]
  },
  {
    id: 'friend_route_2',
    friendName: 'Janja Garnbret',
    exportDate: '25/02/2026',
    name: 'Coordinación & Triple Paddle',
    sector: 'Koper World Cup Wall',
    grade: '7b+',
    status: 'Encadenado',
    createdAt: '2026-02-21T15:00:00.000Z',
    sentAt: '2026-02-21T15:30:00.000Z',
    imageUrl: generateSampleClimbingWallSvg('emerald'),
    notes: 'Triple salto coordinado a tres volúmenes planos. Mantén la inercia sin frenar.',
    isSample: true,
    holds: [
      { id: 'hf1', x: 0.20, y: 0.85, r: 0.045, color: '#22c55e', type: 'Start' },
      { id: 'hf2', x: 0.40, y: 0.65, r: 0.04, color: '#eab308', type: 'Hold' },
      { id: 'hf3', x: 0.60, y: 0.50, r: 0.045, color: '#a855f7', type: 'Key' },
      { id: 'hf4', x: 0.50, y: 0.14, r: 0.05, color: '#ef4444', type: 'Top' },
    ]
  }
];

/**
 * Añade solo los ejemplos que falten sin borrar ninguna vía creada por el usuario
 */
export function restoreMissingSamples(
  currentRoutes: Route[],
  currentRocos: Rocodromo[]
): { routes: Route[]; rocodromos: Rocodromo[]; addedRoutesCount: number; addedRocosCount: number } {
  let addedRoutesCount = 0;
  let addedRocosCount = 0;

  const existingRouteIds = new Set(currentRoutes.map((r) => r.id));
  const existingRouteNames = new Set(currentRoutes.map((r) => r.name.toLowerCase()));
  const newRoutes = [...currentRoutes];

  DEFAULT_ROUTES.forEach((sample) => {
    if (!existingRouteIds.has(sample.id) && !existingRouteNames.has(sample.name.toLowerCase())) {
      newRoutes.push({ ...sample, isSample: true });
      addedRoutesCount++;
    }
  });

  const existingRocoIds = new Set(currentRocos.map((r) => r.id));
  const existingRocoNames = new Set(currentRocos.map((r) => r.name.toLowerCase()));
  const newRocos = [...currentRocos];

  DEFAULT_ROCODROMOS.forEach((sampleRoco) => {
    if (!existingRocoIds.has(sampleRoco.id) && !existingRocoNames.has(sampleRoco.name.toLowerCase())) {
      newRocos.push({ ...sampleRoco, isSample: true });
      addedRocosCount++;
    }
  });

  return { routes: newRoutes, rocodromos: newRocos, addedRoutesCount, addedRocosCount };
}

/**
 * Elimina rápidamente solo los bloques y rocódromos de muestra predefinidos
 */
export function removeSampleData(
  currentRoutes: Route[],
  currentRocos: Rocodromo[]
): { routes: Route[]; rocodromos: Rocodromo[]; removedRoutesCount: number; removedRocosCount: number } {
  const sampleRouteIds = new Set(DEFAULT_ROUTES.map((r) => r.id));
  const sampleRocoIds = new Set(DEFAULT_ROCODROMOS.map((r) => r.id));

  const filteredRoutes = currentRoutes.filter((r) => !r.isSample && !sampleRouteIds.has(r.id));
  const filteredRocos = currentRocos.filter((r) => !r.isSample && !sampleRocoIds.has(r.id));

  const removedRoutesCount = currentRoutes.length - filteredRoutes.length;
  const removedRocosCount = currentRocos.length - filteredRocos.length;

  return {
    routes: filteredRoutes,
    rocodromos: filteredRocos,
    removedRoutesCount,
    removedRocosCount
  };
}

export function getLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

export function setLocalData<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export function initStorage(): {
  routes: Route[];
  rocodromos: Rocodromo[];
  friends: FriendRoute[];
  user: UserProfile;
} {
  const routes = getLocalData<Route[]>(STORAGE_KEYS.ROUTES, DEFAULT_ROUTES);
  const rocodromos = getLocalData<Rocodromo[]>(STORAGE_KEYS.ROCODROMOS, DEFAULT_ROCODROMOS);
  const friends = getLocalData<FriendRoute[]>(STORAGE_KEYS.FRIENDS, DEFAULT_FRIEND_ROUTES);
  
  const defaultUser: UserProfile = {
    userName: 'Víctor',
    email: 'victorb.belchi18720@gmail.com',
    avatarUrl: 'https://ui-avatars.com/api/?name=Victor&background=10b981&color=0f172a&bold=true',
    folderName: 'ClimbU_Victor',
    isLoggedIn: true,
    gradeSystem: 'FONT'
  };

  const user = getLocalData<UserProfile>(STORAGE_KEYS.AUTH, defaultUser);

  // Guardar iniciales si estaban vacíos
  if (!localStorage.getItem(STORAGE_KEYS.ROUTES)) setLocalData(STORAGE_KEYS.ROUTES, routes);
  if (!localStorage.getItem(STORAGE_KEYS.ROCODROMOS)) setLocalData(STORAGE_KEYS.ROCODROMOS, rocodromos);
  if (!localStorage.getItem(STORAGE_KEYS.FRIENDS)) setLocalData(STORAGE_KEYS.FRIENDS, friends);
  if (!localStorage.getItem(STORAGE_KEYS.AUTH)) setLocalData(STORAGE_KEYS.AUTH, user);

  return { routes, rocodromos, friends, user };
}

// Exportar paquete ZIP completo con JSZip
export async function exportToZip(
  routes: Route[],
  rocodromos: Rocodromo[],
  user: UserProfile
): Promise<Blob> {
  const zip = new JSZip();
  const exportDate = new Date().toISOString().split('T')[0];

  const manifest: ZipManifest = {
    friendName: user.userName || 'Escalador',
    email: user.email,
    exportDate: exportDate,
    totalRoutes: routes.length,
    version: '3.3'
  };

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('routes.json', JSON.stringify(routes, null, 2));
  zip.file('rocodromos.json', JSON.stringify(rocodromos, null, 2));

  // Carpeta de fotos para portabilidad completa
  const photosFolder = zip.folder('photos');
  if (photosFolder) {
    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      if (r.imageUrl && r.imageUrl.startsWith('data:image')) {
        const base64Data = r.imageUrl.split(',')[1];
        if (base64Data) {
          photosFolder.file(`route_${r.id}.png`, base64Data, { base64: true });
        }
      }
    }
  }

  return await zip.generateAsync({ type: 'blob' });
}

// Importar paquete ZIP con JSZip
export async function importFromZip(file: File): Promise<{
  manifest: ZipManifest;
  routes: Route[];
  rocodromos: Rocodromo[];
}> {
  const zip = await JSZip.loadAsync(file);

  const manifestFile = zip.file('manifest.json');
  const routesFile = zip.file('routes.json');
  const rocodromosFile = zip.file('rocodromos.json');

  if (!manifestFile || !routesFile) {
    throw new Error('El archivo ZIP no contiene la estructura válida de ClimbU (falta manifest.json o routes.json).');
  }

  const manifestTxt = await manifestFile.async('string');
  const routesTxt = await routesFile.async('string');
  const rocodromosTxt = rocodromosFile ? await rocodromosFile.async('string') : '[]';

  const manifest: ZipManifest = JSON.parse(manifestTxt);
  const routes: Route[] = JSON.parse(routesTxt);
  const rocodromos: Rocodromo[] = JSON.parse(rocodromosTxt);

  return { manifest, routes, rocodromos };
}
