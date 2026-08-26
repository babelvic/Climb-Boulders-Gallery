export const FONT_GRADES = [
  '5a', '5b', '5c',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+'
] as const;

export const V_SCALE_MAP: Record<string, string> = {
  '5a': 'V1',
  '5b': 'V1',
  '5c': 'V2',
  '6a': 'V3',
  '6a+': 'V3/4',
  '6b': 'V4',
  '6b+': 'V4/5',
  '6c': 'V5',
  '6c+': 'V5/6',
  '7a': 'V6',
  '7a+': 'V7',
  '7b': 'V8',
  '7b+': 'V8/9',
  '7c': 'V9',
  '7c+': 'V10',
  '8a': 'V11',
  '8a+': 'V12',
};

export function formatGrade(fontGrade: string, system: 'FONT' | 'VSCALE' = 'FONT'): string {
  const normalized = fontGrade.toLowerCase().trim();
  if (system === 'VSCALE') {
    return V_SCALE_MAP[normalized] || normalized.toUpperCase();
  }
  return normalized;
}

export function compareGrades(a: string, b: string): number {
  const idxA = FONT_GRADES.indexOf(a.toLowerCase() as any);
  const idxB = FONT_GRADES.indexOf(b.toLowerCase() as any);
  if (idxA === -1 && idxB === -1) return a.localeCompare(b);
  if (idxA === -1) return -1;
  if (idxB === -1) return 1;
  return idxA - idxB;
}

export function getMaxGrade(routes: { grade: string; status: string }[]): string {
  const sent = routes.filter(r => r.status === 'Encadenado');
  if (sent.length === 0) return '-';

  let highestIdx = -1;
  let highestGrade = '-';

  sent.forEach(r => {
    const idx = FONT_GRADES.indexOf(r.grade.toLowerCase() as any);
    if (idx > highestIdx) {
      highestIdx = idx;
      highestGrade = r.grade;
    }
  });

  return highestGrade;
}

export const HOLD_TYPE_CONFIG = {
  Start: {
    label: 'Inicio',
    color: '#22c55e',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500',
    icon: '🟢',
    description: 'Presas de salida / inicio'
  },
  Top: {
    label: 'Top',
    color: '#ef4444',
    bgColor: 'bg-rose-500',
    borderColor: 'border-rose-500',
    icon: '🔴',
    description: 'Presa final a dos manos controladas'
  },
  Hold: {
    label: 'Pie / Mano',
    color: '#eab308',
    bgColor: 'bg-yellow-500',
    borderColor: 'border-yellow-500',
    icon: '🟡',
    description: 'Presas intermedias válidas para pies o manos'
  },
  Foot: {
    label: 'Pies libres',
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500',
    icon: '🔵',
    description: 'Pies libres o apoyos habilitados'
  },
  Key: {
    label: 'Zona / Bonus',
    color: '#a855f7',
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-500',
    icon: '🟣',
    description: 'Presa de zona puntuable o bonus'
  }
};
