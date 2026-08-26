import React, { useState } from 'react';
import { MountainSnow, ShieldCheck, Sparkles, Loader2, HardDrive, Cloud, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { googleSignIn } from '../utils/firebaseAuth';

interface WelcomeScreenProps {
  onLogin: (user: Partial<UserProfile>) => void;
  isOpen: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, isOpen }) => {
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('Víctor');
  const [syncPreference, setSyncPreference] = useState<'local' | 'drive'>('drive');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        const gUser = res.user;
        const name = gUser.displayName || customName.trim() || 'Víctor';
        onLogin({
          userName: name,
          email: gUser.email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
          avatarUrl: gUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=0f172a&bold=true`,
          folderName: `ClimbU_${name.replace(/\s+/g, '_')}`,
          isLoggedIn: true,
          autoSync: true,
          syncMode: 'drive',
          driveAccessToken: res.accessToken
        });
      }
    } catch (e: any) {
      console.error('Google Sign-in failed on welcome:', e);
      setErrorMsg(e.message || 'No se pudo iniciar sesión con Google. Puedes continuar en modo local.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartApp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const name = customName.trim() || 'Víctor';
    setTimeout(() => {
      onLogin({
        userName: name,
        email: `${name.toLowerCase().replace(/\s+/g, '')}@climbu.local`,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=0f172a&bold=true`,
        folderName: `ClimbU_${name.replace(/\s+/g, '_')}`,
        isLoggedIn: true,
        autoSync: syncPreference === 'drive',
        syncMode: syncPreference === 'drive' ? 'drive' : 'local'
      });
      setLoading(false);
    }, 300);
  };

  return (
    <div 
      id="welcome-screen-overlay"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-300 overflow-y-auto"
    >
      <div className="max-w-md w-full space-y-5 bg-slate-900 border border-slate-800 p-6 sm:p-7 rounded-2xl shadow-2xl relative my-auto">
        
        {/* Brand Header */}
        <div className="space-y-2.5">
          <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md">
            <MountainSnow className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
              Climb<span className="text-emerald-400">U</span>
              <span className="text-[10px] font-medium font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                v3.3
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Diario Digital Privado para Escaladores de Bloque
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 text-left">
            {errorMsg}
          </div>
        )}

        {/* Primary Option: Sign in with Google (recommended for Drive Sync) */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            id="btn-google-signin-welcome"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 disabled:opacity-75 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer active:scale-98 border border-slate-300"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            )}
            <span>Conectar con Google (Drive Sync)</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-slate-500 text-[11px] uppercase tracking-wider font-mono">
              o continuar local
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>
        </div>

        <form onSubmit={handleStartApp} className="space-y-4 text-left">
          {/* User Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Nombre de escalador (Modo Local)
            </label>
            <input
              id="welcome-custom-name"
              type="text"
              required
              placeholder="Ej: Víctor Belchí"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Sync Preference Selector */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Local */}
              <button
                type="button"
                onClick={() => setSyncPreference('local')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                  syncPreference === 'local'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Guardado Local</span>
                  </div>
                  {syncPreference === 'local' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  100% en tu navegador. Puedes exportar e importar en ZIP.
                </p>
              </button>

              {/* Option 2: Drive */}
              <button
                type="button"
                onClick={() => setSyncPreference('drive')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                  syncPreference === 'drive'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Cloud className="w-3.5 h-3.5 text-teal-400" />
                    <span>Sincronizar Drive</span>
                  </div>
                  {syncPreference === 'drive' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Crea tu carpeta de respaldo y sincroniza tus vías.
                </p>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            id="welcome-start-app-btn"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-75 text-slate-950 font-bold rounded-lg text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98 mt-2"
          >
            <span>Entrar al Diario Local</span>
          </button>
        </form>

        {/* Badges / Privacy notes */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-left text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Datos 100% privados</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>Exportación ZIP lista</span>
          </div>
        </div>

      </div>
    </div>
  );
};
