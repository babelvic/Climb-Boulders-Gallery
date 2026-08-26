import React, { useState } from 'react';
import { 
  User, 
  HardDrive, 
  ShieldCheck, 
  Sliders, 
  FileDown, 
  LogOut, 
  RotateCcw, 
  Check, 
  FolderLock,
  Cloud,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  CheckCircle2,
  Download,
  Package,
  Server,
  Code2
} from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileTabProps {
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
  onRestoreSamples: () => void;
  onRemoveSamples: () => void;
  onExportZip: () => void;
  onSyncDrive: () => Promise<void>;
  onConnectDrive: () => Promise<void>;
  onUnlinkDrive: (deleteDriveFolder: boolean) => Promise<void>;
  isSyncingDrive?: boolean;
  onAddToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  onUpdateUser,
  onLogout,
  onRestoreSamples,
  onRemoveSamples,
  onExportZip,
  onSyncDrive,
  onConnectDrive,
  onUnlinkDrive,
  isSyncingDrive = false,
  onAddToast
}) => {
  const [userName, setUserName] = useState(user.userName || 'Víctor');
  const [folderName, setFolderName] = useState(user.folderName || `ClimbU_${user.userName || 'Journal'}`);
  const [gradeSystem, setGradeSystem] = useState<'FONT' | 'VSCALE'>(user.gradeSystem || 'FONT');
  const [autoSync, setAutoSync] = useState(user.autoSync ?? false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [deleteDriveFolderCheckbox, setDeleteDriveFolderCheckbox] = useState(false);
  const [showRemoveSamplesModal, setShowRemoveSamplesModal] = useState(false);
  
  const [isDownloadingDist, setIsDownloadingDist] = useState(false);
  const [isDownloadingSource, setIsDownloadingSource] = useState(false);

  // Check if running inside Google AI Studio / preview container
  // Only active on Google AI Studio Cloud Run domains to ensure user deployments don't have download buttons
  const isAiStudio = typeof window !== 'undefined' && (
    window.location.hostname.includes('run.app') ||
    window.location.hostname.includes('aistudio') ||
    window.location.hostname.includes('googleusercontent.com')
  );

  const isDriveConnected = Boolean(user.driveAccessToken);

  // Robust client-side binary blob downloader
  const handleDownloadZipPackage = async (type: 'dist' | 'source') => {
    const isDist = type === 'dist';
    const fileName = isDist ? 'climbu_dist_production.zip' : 'climbu_project_source.zip';
    const url = `/${fileName}`;

    if (isDist) setIsDownloadingDist(true);
    else setIsDownloadingSource(true);

    if (onAddToast) {
      onAddToast(`Iniciando descarga de ${fileName}...`, 'info');
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' }
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor al obtener el archivo (${response.status})`);
      }

      const blob = await response.blob();

      // Check if file returned is actually an HTML error
      if (blob.size < 500) {
        const textSample = await blob.slice(0, 100).text();
        if (textSample.includes('<!DOCTYPE') || textSample.includes('<html')) {
          throw new Error('El archivo devuelto no es un ZIP binario válido.');
        }
      }

      // Explicitly enforce application/zip MIME type
      const zipBlob = new Blob([blob], { type: 'application/zip' });
      const objectUrl = URL.createObjectURL(zipBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = objectUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 2500);

      if (onAddToast) {
        onAddToast(`¡${fileName} descargado correctamente! Listo para descomprimir.`, 'success');
      }
    } catch (err: any) {
      console.error('Error al descargar ZIP:', err);
      if (onAddToast) {
        onAddToast(`Error al descargar ZIP: ${err.message || 'Error de red'}`, 'error');
      }

      // Fallback
      const fallbackLink = document.createElement('a');
      fallbackLink.href = url;
      fallbackLink.download = fileName;
      fallbackLink.target = '_blank';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      document.body.removeChild(fallbackLink);
    } finally {
      if (isDist) setIsDownloadingDist(false);
      else setIsDownloadingSource(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      userName: userName.trim(),
      folderName: folderName.trim(),
      gradeSystem,
      autoSync,
      avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName.trim() || 'U')}&background=10b981&color=0f172a&bold=true`
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleToggleAutoSync = () => {
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    onUpdateUser({ autoSync: nextVal });
  };

  const handleConfirmUnlink = async () => {
    setShowUnlinkModal(false);
    await onUnlinkDrive(deleteDriveFolderCheckbox);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8 animate-in fade-in duration-200">
      
      {/* Profile Card Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 relative overflow-hidden">
        <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 bg-slate-800">
          <img
            src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.userName || 'U')}&background=10b981&color=0f172a&bold=true`}
            alt={user.userName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="space-y-3 text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                <span>{user.userName || 'Usuario'}</span>
                {isDriveConnected && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Google Drive Vinculado
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-medium">{user.email || 'Sesión Privada'}</p>
            </div>

            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 self-center sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Espacio Privado Local</span>
            </span>
          </div>

          <div className="pt-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Carpeta de destino en Google Drive: <code className="text-emerald-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded text-xs">{user.folderName || `ClimbU_${user.userName}`}</code></span>
              </div>

              {user.driveFolderId && (
                <a
                  href={`https://drive.google.com/drive/folders/${user.driveFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-medium underline shrink-0"
                >
                  <span>Abrir en Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FolderLock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Privacidad: <strong className="text-white font-medium">100% Privado</strong> (Tus datos y fotos están guardados en tu dispositivo y opcionalmente en tu propio Google Drive)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Synchronization Hub */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400" />
              Sincronización con Google Drive
            </h3>
            <p className="text-xs text-slate-400">
              Guarda copias de seguridad de tus bloques y fotos en tu propia carpeta privada de Google Drive.
            </p>
          </div>

          {/* Sync Status Tag */}
          <div className="flex items-center gap-2">
            {user.lastSyncAt ? (
              <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                Última sync: {new Date(user.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            ) : (
              <span className="text-[11px] font-mono bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-lg">
                Sin sincronizar aún
              </span>
            )}
          </div>
        </div>

        {/* Sync Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Manual Sync / Connect Button */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white block">Sincronización Inmediata</span>
                {isDriveConnected ? (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                    AUTORIZADO
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                    REQUIERE CONEXIÓN
                  </span>
                )}
              </div>
              <p className="text-slate-400 leading-relaxed">
                Comprueba si la carpeta existe en tu Google Drive (si no, la crea automáticamente) y sube todos tus bloques.
              </p>
            </div>

            {isDriveConnected ? (
              <div className="space-y-2">
                <button
                  id="btn-sync-drive-now"
                  type="button"
                  disabled={isSyncingDrive}
                  onClick={onSyncDrive}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDrive ? 'Sincronizando con Drive...' : 'Sincronizar Ahora con Google Drive'}</span>
                </button>

                {user.driveFolderId && (
                  <a
                    href={`https://drive.google.com/drive/folders/${user.driveFolderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <span>Ver Carpeta en Google Drive</span>
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                  </a>
                )}
              </div>
            ) : (
              <button
                id="btn-connect-drive-auth"
                type="button"
                disabled={isSyncingDrive}
                onClick={onConnectDrive}
                className="w-full py-2.5 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-slate-300"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>Conectar Cuenta de Google</span>
              </button>
            )}
          </div>

          {/* Auto-Sync Toggle */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Sincronización Automática</span>
                <button
                  type="button"
                  onClick={handleToggleAutoSync}
                  className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  {autoSync ? (
                    <ToggleRight className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-500" />
                  )}
                </button>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Sincroniza automáticamente en segundo plano cada vez que registres o edites un bloque.
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60">
              <span className="text-slate-400">Estado auto-sync:</span>
              <span className={`font-bold font-mono ${autoSync ? 'text-emerald-400' : 'text-slate-500'}`}>
                {autoSync ? 'ACTIVADA' : 'DESACTIVADA (Manual)'}
              </span>
            </div>
          </div>

        </div>

        {/* Unlink & Delete Drive folder option */}
        {isDriveConnected && (
          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>¿Deseas desvincular Google Drive o borrar la carpeta creada?</span>
            <button
              type="button"
              onClick={() => setShowUnlinkModal(true)}
              className="text-rose-400 hover:underline font-medium cursor-pointer"
            >
              Opciones de desvinculación Drive →
            </button>
          </div>
        )}
      </div>

      {/* Unlink Google Drive In-app Modal */}
      {showUnlinkModal && (
        <div 
          id="unlink-drive-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Desvincular Google Drive</h3>
                <p className="text-xs text-slate-400">Configuración de almacenamiento en la nube</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tus bloques seguirán guardados en tu navegador local. Puedes elegir si además deseas eliminar la carpeta <strong>"{user.folderName || `ClimbU_${user.userName}`}"</strong> de tu Google Drive.
            </p>

            <label className="flex items-center gap-2.5 text-xs text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteDriveFolderCheckbox}
                onChange={(e) => setDeleteDriveFolderCheckbox(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500 cursor-pointer"
              />
              <span>Eliminar también la carpeta de respaldo en Google Drive si existe</span>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-unlink-drive"
                onClick={handleConfirmUnlink}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Desvincular Drive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Configuración & Preferencias
          </h3>
          {savedSuccess && (
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Guardado
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* System Grade */}
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300 block text-xs">
                Sistema de Graduación Preferido
              </label>
              <select
                id="setting-grade-system"
                value={gradeSystem}
                onChange={(e) => setGradeSystem(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="FONT">Escala Francesa / Fontainebleau (5a, 6a, 6b, 7a, 7c+...)</option>
                <option value="VSCALE">Escala Americana V (V0, V1, V3, V6, V10...)</option>
              </select>
            </div>

            {/* User Name */}
            <div className="space-y-1.5">
              <label className="font-medium text-slate-300 block text-xs">
                Nombre de Escalador / Alias
              </label>
              <input
                id="setting-user-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Folder Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="font-medium text-slate-300 block text-xs">
                Nombre de la Carpeta en Google Drive
              </label>
              <input
                id="setting-folder-name"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              id="save-settings-btn"
              type="submit"
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              Guardar Ajustes
            </button>

            <button
              type="button"
              onClick={onExportZip}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium rounded-lg text-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-400" />
              Exportar Mis Datos en ZIP
            </button>
          </div>
        </form>
      </div>

      {/* Direct Project Code Downloads for Private Server - Only available in AI Studio preview */}
      {isAiStudio && (
        <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Descargar Proyecto para tu Servidor
              </h3>
              <p className="text-xs text-slate-400">
                Descarga los archivos verificados sin errores para alojar en tu propio servidor Nginx/Apache, hosting o editar el código fuente.
              </p>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded">
              AI Studio Exclusivo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Option 1: Compiled Production Dist (Ready to Deploy) */}
            <button
              type="button"
              id="download-dist-zip-btn"
              disabled={isDownloadingDist}
              onClick={() => handleDownloadZipPackage('dist')}
              className="p-4 bg-slate-950/70 hover:bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl flex items-center justify-between transition-all group cursor-pointer text-left active:scale-[0.99] disabled:opacity-50"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                  <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Web Compilada (.zip)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Contiene <code className="text-emerald-300 font-mono">index.html</code>, JavaScript y CSS listos para subir a tu hosting o Nginx.
                </p>
                <div className="text-[10px] text-emerald-400/80 font-mono pt-1">
                  climbu_dist_production.zip
                </div>
              </div>
              <div className="ml-3 shrink-0 p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                {isDownloadingDist ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                )}
              </div>
            </button>

            {/* Option 2: Full Source Code (TypeScript + Vite) */}
            <button
              type="button"
              id="download-source-zip-btn"
              disabled={isDownloadingSource}
              onClick={() => handleDownloadZipPackage('source')}
              className="p-4 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 rounded-xl flex items-center justify-between transition-all group cursor-pointer text-left active:scale-[0.99] disabled:opacity-50"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                  <Code2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Código Fuente Completo (.zip)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Proyecto completo con <code className="text-teal-300 font-mono">package.json</code> y <code className="text-teal-300 font-mono">src/</code> para programar localmente.
                </p>
                <div className="text-[10px] text-teal-400/80 font-mono pt-1">
                  climbu_project_source.zip
                </div>
              </div>
              <div className="ml-3 shrink-0 p-2.5 bg-teal-500/10 text-teal-400 rounded-lg group-hover:bg-teal-500 group-hover:text-slate-950 transition-colors">
                {isDownloadingSource ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                )}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Examples & Maintenance */}
      <div className="bg-slate-900 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Gestión de Bloques de Ejemplo & Sesión
        </h3>

        <p className="text-xs text-slate-400">
          Puedes añadir los bloques de ejemplo si faltan (sin sobreescribir tus creaciones) o eliminarlos todos con 1 clic para dejar tu diario limpio.
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-restore-samples-safe"
              onClick={onRestoreSamples}
              title="Añade solo los ejemplos que falten sin borrar tus vías creadas"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restaurar Ejemplos (Sin Borrar Nada)</span>
            </button>

            <button
              id="btn-remove-samples-quick"
              onClick={() => setShowRemoveSamplesModal(true)}
              title="Elimina solo las vías de muestra predefinidas"
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar Bloques de Ejemplo</span>
            </button>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Remove Samples Modal */}
      {showRemoveSamplesModal && (
        <div 
          id="remove-samples-modal"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">¿Eliminar bloques de ejemplo?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Solo se eliminarán los bloques y rocódromos de muestra predefinidos. <strong>Todas las vías creadas por ti se conservarán intactas.</strong>
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRemoveSamplesModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-remove-samples"
                onClick={() => {
                  onRemoveSamples();
                  setShowRemoveSamplesModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Sí, Eliminar Ejemplos
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
