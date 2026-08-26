export type HoldType = 'Start' | 'Top' | 'Hold' | 'Foot' | 'Key';

export interface Hold {
  id: string;
  x: number; // 0 to 1 relative coordinate
  y: number; // 0 to 1 relative coordinate
  r: number; // radius relative to canvas width (default ~0.04)
  color: string;
  type: HoldType;
}

export type RouteStatus = 'Proyecto' | 'Encadenado';

export interface Route {
  id: string;
  name: string;
  rocodromoId?: string;
  sector: string;
  grade: string;
  status: RouteStatus;
  createdAt: string;
  sentAt?: string;
  imageUrl?: string;
  holds: Hold[];
  notes: string;
  attempts?: number;
  isSample?: boolean;
}

export interface FriendRoute extends Route {
  friendName: string;
  exportDate: string;
}

export interface Rocodromo {
  id: string;
  name: string;
  city: string;
  notes?: string;
  createdAt: string;
  isSample?: boolean;
}

export interface UserProfile {
  userName: string;
  email: string;
  avatarUrl: string;
  folderName: string;
  isLoggedIn: boolean;
  gradeSystem: 'FONT' | 'VSCALE';
  syncMode?: 'local' | 'drive';
  autoSync?: boolean;
  lastSyncAt?: string;
  driveAccessToken?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
}

export interface ZipManifest {
  friendName: string;
  email?: string;
  exportDate: string;
  totalRoutes: number;
  version: string;
}

export type ActiveTab = 'catalog' | 'new' | 'rocodromos' | 'friends' | 'stats' | 'profile';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
