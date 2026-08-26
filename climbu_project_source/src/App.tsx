import React, { useState, useEffect, useCallback } from 'react';
import { 
  ActiveTab, 
  Route, 
  Rocodromo, 
  FriendRoute, 
  UserProfile, 
  ToastMessage 
} from './types';
import { 
  initStorage, 
  setLocalData, 
  exportToZip, 
  importFromZip,
  restoreMissingSamples,
  removeSampleData
} from './utils/storage';
import { syncAllToGoogleDrive, deleteDriveFolderById } from './utils/driveSync';
import { initAuth, googleSignIn, setCachedAccessToken, logout as firebaseLogout } from './utils/firebaseAuth';
import { Navbar } from './components/Navbar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CatalogTab } from './components/CatalogTab';
import { HoldEditorTab } from './components/HoldEditorTab';
import { RocodromosTab } from './components/RocodromosTab';
import { FriendsTab } from './components/FriendsTab';
import { StatsTab } from './components/StatsTab';
import { ProfileTab } from './components/ProfileTab';
import { DetailModal } from './components/DetailModal';
import { RocodromoModal } from './components/RocodromoModal';
import { ToastContainer } from './components/Toast';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [rocodromos, setRocodromos] = useState<Rocodromo[]>([]);
  const [friendRoutes, setFriendRoutes] = useState<FriendRoute[]>([]);
  const [user, setUser] = useState<UserProfile>({
    userName: 'Víctor',
    email: 'victor@climbu.local',
    avatarUrl: 'https://ui-avatars.com/api/?name=Victor&background=10b981&color=0f172a&bold=true',
    folderName: 'ClimbU_Victor',
    isLoggedIn: true,
    gradeSystem: 'FONT',
    autoSync: false,
    syncMode: 'local'
  });

  const [currentTab, setCurrentTab] = useState<ActiveTab>('catalog');
  const [selectedRouteForModal, setSelectedRouteForModal] = useState<Route | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  
  const [isRocoModalOpen, setIsRocoModalOpen] = useState(false);
  const [editingRocodromo, setEditingRocodromo] = useState<Rocodromo | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  // Load from local storage on mount and init Firebase Auth listener
  useEffect(() => {
    const data = initStorage();
    setRoutes(data.routes);
    setRocodromos(data.rocodromos);
    setFriendRoutes(data.friends);
    setUser(data.user);
    setIsInitialized(true);

    const unsubscribe = initAuth((gUser, token) => {
      if (token) {
        setCachedAccessToken(token);
        setUser((prev) => ({
          ...prev,
          userName: gUser.displayName || prev.userName,
          email: gUser.email || prev.email,
          avatarUrl: gUser.photoURL || prev.avatarUrl,
          driveAccessToken: token,
          isLoggedIn: true
        }));
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save changes to local storage
  useEffect(() => {
    if (!isInitialized) return;
    setLocalData('climbu_routes', routes);
  }, [routes, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    setLocalData('climbu_rocodromos', rocodromos);
  }, [rocodromos, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    setLocalData('climbu_friends', friendRoutes);
  }, [friendRoutes, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    setLocalData('climbu_auth_user', user);
  }, [user, isInitialized]);

  // Toast helper
  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Google Drive Connect handler
  const handleConnectDrive = async () => {
    try {
      const res = await googleSignIn();
      if (res && res.user) {
        const name = res.user.displayName || user.userName || 'Víctor';
        const updatedUser: UserProfile = {
          ...user,
          userName: name,
          email: res.user.email || user.email,
          avatarUrl: res.user.photoURL || user.avatarUrl,
          driveAccessToken: res.accessToken,
          syncMode: 'drive',
          folderName: user.folderName || `ClimbU_${name.replace(/\s+/g, '_')}`,
          isLoggedIn: true
        };
        setUser(updatedUser);
        addToast(`Conectado con Google Drive (${res.user.email || name}). Iniciando sincronización...`, 'success');

        // Execute initial backup
        setIsSyncingDrive(true);
        const syncResult = await syncAllToGoogleDrive(
          res.accessToken, 
          updatedUser.folderName, 
          routes, 
          rocodromos, 
          updatedUser
        );

        if (syncResult.success) {
          setUser((prev) => ({
            ...prev,
            lastSyncAt: syncResult.syncedAt || new Date().toISOString(),
            driveFolderId: syncResult.folderId || prev.driveFolderId,
            driveFolderUrl: syncResult.folderUrl || prev.driveFolderUrl
          }));
          addToast(syncResult.message, 'success');
        } else {
          addToast(syncResult.message, 'error');
        }
        setIsSyncingDrive(false);
      }
    } catch (e: any) {
      console.error('Connect drive error:', e);
      addToast(`No se pudo conectar con Google Drive: ${e.message || 'Proceso cancelado'}`, 'error');
    }
  };

  // Google Drive Sync handler
  const handleSyncGoogleDrive = useCallback(async () => {
    let token = user.driveAccessToken;
    let currentUser = user;

    if (!token) {
      // Prompt Google Sign-in to get OAuth token
      try {
        const res = await googleSignIn();
        if (res && res.accessToken) {
          token = res.accessToken;
          currentUser = {
            ...user,
            userName: res.user.displayName || user.userName,
            email: res.user.email || user.email,
            avatarUrl: res.user.photoURL || user.avatarUrl,
            driveAccessToken: res.accessToken,
            syncMode: 'drive'
          };
          setUser(currentUser);
        } else {
          addToast('Se requiere autorización para acceder a Google Drive.', 'info');
          return;
        }
      } catch (e: any) {
        addToast(`Autorización cancelada: ${e.message || 'Error'}`, 'error');
        return;
      }
    }

    setIsSyncingDrive(true);
    try {
      const folderName = currentUser.folderName || `ClimbU_${currentUser.userName || 'Journal'}`;
      const result = await syncAllToGoogleDrive(token, folderName, routes, rocodromos, currentUser);
      if (result.success) {
        setUser((prev) => ({
          ...prev,
          lastSyncAt: result.syncedAt || new Date().toISOString(),
          driveFolderId: result.folderId || prev.driveFolderId,
          driveFolderUrl: result.folderUrl || prev.driveFolderUrl
        }));
        addToast(result.message, 'success');
      } else {
        addToast(result.message, 'error');
      }
    } catch (e: any) {
      addToast(`Error al sincronizar con Google Drive: ${e.message || 'Desconocido'}`, 'error');
    } finally {
      setIsSyncingDrive(false);
    }
  }, [user, routes, rocodromos, addToast]);

  // Google Login
  const handleLogin = (loggedUser: Partial<UserProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...loggedUser,
      isLoggedIn: true
    }));
    addToast(`¡Bienvenido a ClimbU, ${loggedUser.userName || 'Escalador'}!`, 'success');

    if (loggedUser.driveAccessToken) {
      setTimeout(() => {
        handleSyncGoogleDrive();
      }, 600);
    }
  };

  const handleLogout = async () => {
    await firebaseLogout();
    setUser((prev) => ({ 
      ...prev, 
      isLoggedIn: false,
      driveAccessToken: undefined
    }));
    addToast('Sesión cerrada correctamente.', 'info');
  };

  // Unlink Drive handler
  const handleUnlinkDrive = async (deleteDriveFolder: boolean) => {
    if (deleteDriveFolder && user.driveAccessToken && user.driveFolderId) {
      try {
        await deleteDriveFolderById(user.driveAccessToken, user.driveFolderId);
        addToast('Carpeta eliminada de Google Drive.', 'info');
      } catch (e) {
        console.error(e);
      }
    }
    await firebaseLogout();
    setUser((prev) => ({
      ...prev,
      autoSync: false,
      syncMode: 'local',
      driveAccessToken: undefined,
      driveFolderId: undefined,
      driveFolderUrl: undefined,
      lastSyncAt: undefined
    }));
    addToast('Google Drive desvinculado. Modo local activo.', 'info');
  };

  // Non-destructive Sample Data Restore (leaves user routes completely intact)
  const handleRestoreSamples = () => {
    const { routes: newRoutes, rocodromos: newRocos, addedRoutesCount, addedRocosCount } = restoreMissingSamples(routes, rocodromos);
    setRoutes(newRoutes);
    setRocodromos(newRocos);
    if (addedRoutesCount === 0 && addedRocosCount === 0) {
      addToast('Todos los bloques de ejemplo ya están presentes. No se modificó nada.', 'info');
    } else {
      addToast(`Restaurados ${addedRoutesCount} bloques y ${addedRocosCount} rocódromos de ejemplo sin alterar tus creaciones.`, 'success');
    }
  };

  // Quick Remove of only sample data (preserves all user routes)
  const handleRemoveSamples = () => {
    const { routes: cleanRoutes, rocodromos: cleanRocos, removedRoutesCount, removedRocosCount } = removeSampleData(routes, rocodromos);
    setRoutes(cleanRoutes);
    setRocodromos(cleanRocos);
    addToast(`Se eliminaron ${removedRoutesCount} bloques y ${removedRocosCount} rocódromos de ejemplo. Tus vías personales se conservan intactas.`, 'success');
  };

  // Save route from Hold Editor
  const handleSaveRoute = (routeData: Partial<Route>) => {
    if (!routeData.name) return;

    if (editingRoute) {
      // Update existing
      setRoutes((prev) =>
        prev.map((r) => (r.id === routeData.id ? ({ ...r, ...routeData } as Route) : r))
      );
      addToast(`Bloque "${routeData.name}" actualizado correctamente.`, 'success');
    } else {
      // Create new
      const newRoute: Route = {
        id: routeData.id || 'route_' + Date.now(),
        name: routeData.name,
        rocodromoId: routeData.rocodromoId,
        sector: routeData.sector || 'General',
        grade: routeData.grade || '6a',
        status: routeData.status || 'Proyecto',
        createdAt: routeData.createdAt || new Date().toISOString(),
        sentAt: routeData.status === 'Encadenado' ? new Date().toISOString() : undefined,
        imageUrl: routeData.imageUrl,
        holds: routeData.holds || [],
        notes: routeData.notes || '',
        attempts: 1,
        isSample: false
      };
      setRoutes((prev) => [newRoute, ...prev]);
      addToast(`¡Bloque "${newRoute.name}" registrado con éxito!`, 'success');

      // AutoSync if enabled
      if (user.autoSync) {
        setTimeout(() => {
          handleSyncGoogleDrive();
        }, 1000);
      }
    }

    setEditingRoute(null);
    setCurrentTab('catalog');
  };

  // Toggle Sent / Encadenado status
  const handleToggleSent = (routeId: string) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === routeId) {
          const nextStatus = r.status === 'Encadenado' ? 'Proyecto' : 'Encadenado';
          const sentAt = nextStatus === 'Encadenado' ? new Date().toISOString() : undefined;
          addToast(
            nextStatus === 'Encadenado'
              ? `¡Enhorabuena! Bloque "${r.name}" marcado como ENCADENADO.`
              : `Bloque "${r.name}" pasado a PROYECTO.`,
            'success'
          );
          const updated = { ...r, status: nextStatus, sentAt };
          if (selectedRouteForModal && selectedRouteForModal.id === routeId) {
            setSelectedRouteForModal(updated);
          }
          return updated;
        }
        return r;
      })
    );
  };

  // Delete Route (direct & reliable; modal handles confirmation)
  const handleDeleteRoute = (routeId: string) => {
    const route = routes.find((r) => r.id === routeId);
    const routeName = route ? route.name : 'Bloque';
    setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    setSelectedRouteForModal(null);
    addToast(`Bloque "${routeName}" eliminado permanentemente.`, 'info');
  };

  // Start Editing Route
  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setSelectedRouteForModal(null);
    setCurrentTab('new');
  };

  // Gym / Rocódromo Management
  const handleSaveRocodromo = (roco: { name: string; city: string; notes?: string; id?: string }) => {
    if (roco.id) {
      setRocodromos((prev) =>
        prev.map((r) => (r.id === roco.id ? { ...r, ...roco } : r))
      );
      addToast(`Rocódromo "${roco.name}" actualizado.`, 'success');
    } else {
      const newRoco: Rocodromo = {
        id: 'roco_' + Date.now(),
        name: roco.name,
        city: roco.city,
        notes: roco.notes,
        createdAt: new Date().toISOString(),
        isSample: false
      };
      setRocodromos((prev) => [...prev, newRoco]);
      addToast(`Rocódromo "${newRoco.name}" creado con éxito.`, 'success');
    }
    setEditingRocodromo(null);
  };

  const handleDeleteRocodromo = (id: string) => {
    const roco = rocodromos.find((r) => r.id === id);
    const rocoName = roco ? roco.name : 'Rocódromo';
    setRocodromos((prev) => prev.filter((r) => r.id !== id));
    addToast(`Rocódromo "${rocoName}" eliminado.`, 'info');
  };

  // Friend Routes Deletion handlers
  const handleDeleteFriendRoute = (id: string) => {
    const fRoute = friendRoutes.find((r) => r.id === id);
    const name = fRoute ? fRoute.name : 'Vía';
    setFriendRoutes((prev) => prev.filter((r) => r.id !== id));
    if (selectedRouteForModal && selectedRouteForModal.id === id) {
      setSelectedRouteForModal(null);
    }
    addToast(`Vía de amigo "${name}" eliminada.`, 'info');
  };

  const handleClearFriendRoutes = (friendName?: string) => {
    if (friendName) {
      setFriendRoutes((prev) => prev.filter((r) => r.friendName !== friendName));
      addToast(`Vías de "${friendName}" eliminadas.`, 'info');
    } else {
      setFriendRoutes([]);
      addToast('Todas las vías de amigos fueron eliminadas.', 'info');
    }
  };

  // Export ZIP
  const handleExportZip = async () => {
    if (routes.length === 0) {
      addToast('No tienes bloques para exportar.', 'error');
      return;
    }

    try {
      addToast('Empaquetando vías y fotos en ZIP...', 'info');
      const blob = await exportToZip(routes, rocodromos, user);
      
      const exportDate = new Date().toISOString().split('T')[0];
      const fileName = `ClimbU_${user.userName || 'MisBloques'}_${exportDate}.zip`;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('¡Archivo ZIP exportado correctamente!', 'success');
    } catch (err: any) {
      addToast('Error al exportar ZIP: ' + err.message, 'error');
    }
  };

  // Import ZIP
  const handleImportZip = async (file: File) => {
    try {
      addToast('Procesando archivo ZIP...', 'info');
      const { manifest, routes: importedRoutes, rocodromos: importedRocos } = await importFromZip(file);

      const isSameUser =
        manifest.friendName.toLowerCase() === (user.userName || '').toLowerCase() ||
        (manifest.email && manifest.email === user.email);

      if (isSameUser) {
        // Smart merge into main catalog
        let merged = 0;
        let added = 0;

        const currentRoutes = [...routes];
        importedRoutes.forEach((imp) => {
          const idx = currentRoutes.findIndex(
            (r) => r.id === imp.id || (r.name.toLowerCase() === imp.name.toLowerCase() && r.sector === imp.sector)
          );
          if (idx >= 0) {
            currentRoutes[idx] = { ...currentRoutes[idx], ...imp };
            merged++;
          } else {
            currentRoutes.unshift({ ...imp, isSample: false });
            added++;
          }
        });

        // Merge rocodromos
        const currentRocos = [...rocodromos];
        importedRocos.forEach((impR) => {
          if (!currentRocos.some((r) => r.name.toLowerCase() === impR.name.toLowerCase())) {
            currentRocos.push({ ...impR, isSample: false });
          }
        });

        setRoutes(currentRoutes);
        setRocodromos(currentRocos);
        addToast(`¡Copia de seguridad fusionada! ${added} nuevas vías, ${merged} actualizadas.`, 'success');
        setCurrentTab('catalog');
      } else {
        // Add to Friends tab
        const friendEntries: FriendRoute[] = importedRoutes.map((r) => ({
          ...r,
          friendName: manifest.friendName || 'Compañero',
          exportDate: manifest.exportDate || new Date().toLocaleDateString()
        }));

        setFriendRoutes((prev) => [...friendEntries, ...prev]);
        addToast(
          `¡Importados ${friendEntries.length} bloques de ${manifest.friendName || 'tu amigo'}!`,
          'success'
        );
        setCurrentTab('friends');
      }
    } catch (err: any) {
      addToast('Error al importar ZIP: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-slate-950 font-sans pb-20 lg:pb-6">
      
      {/* Google Sign-In / First Run Welcome Overlay */}
      <WelcomeScreen
        isOpen={!user.isLoggedIn}
        onLogin={handleLogin}
      />

      {/* App Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'new') setEditingRoute(null);
          setCurrentTab(tab);
        }}
        user={user}
        onExportZip={handleExportZip}
        onImportZip={handleImportZip}
        routesCount={routes.length}
        friendRoutesCount={friendRoutes.length}
      />

      {/* Main Tab Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        
        {/* Tab 1: Catalog */}
        {currentTab === 'catalog' && (
          <CatalogTab
            routes={routes}
            rocodromos={rocodromos}
            gradeSystem={user.gradeSystem || 'FONT'}
            onSelectRoute={(r) => setSelectedRouteForModal(r)}
            onToggleSent={handleToggleSent}
            onNavigateToNew={() => {
              setEditingRoute(null);
              setCurrentTab('new');
            }}
          />
        )}

        {/* Tab 2: Hold Canvas Editor */}
        {currentTab === 'new' && (
          <HoldEditorTab
            initialRoute={editingRoute}
            rocodromos={rocodromos}
            gradeSystem={user.gradeSystem || 'FONT'}
            onSaveRoute={handleSaveRoute}
            onCancel={() => {
              setEditingRoute(null);
              setCurrentTab('catalog');
            }}
            onOpenNewRocodromoModal={() => {
              setEditingRocodromo(null);
              setIsRocoModalOpen(true);
            }}
          />
        )}

        {/* Tab 3: Rocódromos / Gyms */}
        {currentTab === 'rocodromos' && (
          <RocodromosTab
            rocodromos={rocodromos}
            routes={routes}
            onOpenNewModal={() => {
              setEditingRocodromo(null);
              setIsRocoModalOpen(true);
            }}
            onEditRocodromo={(roco) => {
              setEditingRocodromo(roco);
              setIsRocoModalOpen(true);
            }}
            onDeleteRocodromo={handleDeleteRocodromo}
            onFilterByRocodromo={() => {
              setCurrentTab('catalog');
            }}
          />
        )}

        {/* Tab 4: Friends Boulders */}
        {currentTab === 'friends' && (
          <FriendsTab
            friendRoutes={friendRoutes}
            gradeSystem={user.gradeSystem || 'FONT'}
            onSelectRoute={(r) => setSelectedRouteForModal(r)}
            onTriggerImport={() => {
              const el = document.getElementById('global-zip-input');
              if (el) el.click();
            }}
            onDeleteFriendRoute={handleDeleteFriendRoute}
            onClearFriendRoutes={handleClearFriendRoutes}
          />
        )}

        {/* Tab 5: Statistics & Chart.js */}
        {currentTab === 'stats' && (
          <StatsTab
            routes={routes}
            rocodromos={rocodromos}
            gradeSystem={user.gradeSystem || 'FONT'}
          />
        )}

        {/* Tab 6: Profile & Settings */}
        {currentTab === 'profile' && (
          <ProfileTab
            user={user}
            onUpdateUser={(updated) => {
              setUser((prev) => ({ ...prev, ...updated }));
              addToast('Preferencias guardadas.', 'success');
            }}
            onLogout={handleLogout}
            onRestoreSamples={handleRestoreSamples}
            onRemoveSamples={handleRemoveSamples}
            onExportZip={handleExportZip}
            onSyncDrive={handleSyncGoogleDrive}
            onConnectDrive={handleConnectDrive}
            onUnlinkDrive={handleUnlinkDrive}
            isSyncingDrive={isSyncingDrive}
            onAddToast={addToast}
          />
        )}

      </main>

      {/* Boulder Detail Modal with Fullscreen Zoom & Pan */}
      <DetailModal
        route={selectedRouteForModal}
        gradeSystem={user.gradeSystem || 'FONT'}
        isOpen={Boolean(selectedRouteForModal)}
        onClose={() => setSelectedRouteForModal(null)}
        onToggleSent={handleToggleSent}
        onEdit={handleEditRoute}
        onDelete={handleDeleteRoute}
        isFriendRoute={Boolean((selectedRouteForModal as any)?.friendName)}
        friendName={(selectedRouteForModal as any)?.friendName}
        exportDate={(selectedRouteForModal as any)?.exportDate}
      />

      {/* Gym / Rocódromo Modal */}
      <RocodromoModal
        isOpen={isRocoModalOpen}
        onClose={() => {
          setIsRocoModalOpen(false);
          setEditingRocodromo(null);
        }}
        onSave={handleSaveRocodromo}
        editingRocodromo={editingRocodromo}
      />

      {/* Notification Toasts */}
      <ToastContainer
        toasts={toasts}
        onDismiss={removeToast}
      />

    </div>
  );
}
