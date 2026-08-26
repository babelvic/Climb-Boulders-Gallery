import { Route, Rocodromo, UserProfile } from '../types';

export interface DriveSyncResult {
  success: boolean;
  message: string;
  folderId?: string;
  folderUrl?: string;
  syncedAt?: string;
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

/**
 * Searches for a folder with the given name in Google Drive
 */
export async function findDriveFolder(token: string, folderName: string): Promise<string | null> {
  try {
    const cleanName = folderName.replace(/'/g, "\\'");
    const q = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and trashed = false and name = '${cleanName}'`);
    const res = await fetch(`${DRIVE_API_URL}?q=${q}&fields=files(id,name,webViewLink)&spaces=drive`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('Drive folder search failed:', err);
      return null;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
    return null;
  } catch (e) {
    console.error('Error finding drive folder:', e);
    return null;
  }
}

/**
 * Creates a new folder in Google Drive with the specified name
 */
export async function createDriveFolder(token: string, folderName: string): Promise<string | null> {
  try {
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'ClimbU Climbing Journal Private Storage & Backup'
    };

    const res = await fetch(DRIVE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Drive folder creation failed:', err);
      return null;
    }

    const data = await res.json();
    return data.id || null;
  } catch (e) {
    console.error('Error creating drive folder:', e);
    return null;
  }
}

/**
 * Uploads or updates a file inside a specific Google Drive folder
 */
async function uploadOrUpdateFile(
  token: string, 
  folderId: string, 
  fileName: string, 
  content: string,
  contentType: string = 'application/json'
): Promise<boolean> {
  try {
    const cleanName = fileName.replace(/'/g, "\\'");
    // 1. Check if file already exists in folder
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false and name = '${cleanName}'`);
    const searchRes = await fetch(`${DRIVE_API_URL}?q=${q}&fields=files(id,name)&spaces=drive`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    let existingFileId: string | null = null;
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        existingFileId = searchData.files[0].id;
      }
    }

    if (existingFileId) {
      // Update existing file content
      const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `${contentType}; charset=UTF-8`
        },
        body: content
      });
      return updateRes.ok;
    } else {
      // Create new multipart file
      const boundary = '-------ClimbUBoundary' + Math.random().toString(36).substring(2);
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const metadata = {
        name: fileName,
        mimeType: contentType,
        parents: [folderId]
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${contentType}; charset=UTF-8\r\n\r\n` +
        content +
        closeDelim;

      const createRes = await fetch(DRIVE_UPLOAD_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: multipartRequestBody
      });

      return createRes.ok;
    }
  } catch (e) {
    console.error(`Error uploading ${fileName} to Drive:`, e);
    return false;
  }
}

/**
 * Executes a full backup sync to Google Drive
 */
export async function syncAllToGoogleDrive(
  token: string,
  folderName: string,
  routes: Route[],
  rocodromos: Rocodromo[],
  user: UserProfile
): Promise<DriveSyncResult> {
  if (!token) {
    return { success: false, message: 'No se encontró la autorización de Google Drive.' };
  }

  try {
    // Step 1: Find or create target folder in Drive
    const cleanFolderName = folderName?.trim() || `ClimbU_${user.userName || 'Journal'}`;
    let folderId = await findDriveFolder(token, cleanFolderName);
    
    if (!folderId) {
      folderId = await createDriveFolder(token, cleanFolderName);
      if (!folderId) {
        return { 
          success: false, 
          message: `No se pudo crear la carpeta "${cleanFolderName}" en Google Drive. Comprueba los permisos.` 
        };
      }
    }

    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

    // Step 2: Prepare backup payloads
    const nowIso = new Date().toISOString();
    const manifest = {
      version: '3.3',
      app: 'ClimbU Boulder Journal',
      userName: user.userName,
      email: user.email,
      gradeSystem: user.gradeSystem,
      lastSync: nowIso,
      routesCount: routes.length,
      rocodromosCount: rocodromos.length,
      folderName: cleanFolderName,
      folderId
    };

    const fullBackup = {
      manifest,
      routes,
      rocodromos,
      exportedAt: nowIso
    };

    const readmeText = `=====================================================
CLIMBU - DIARIO DIGITAL DE ESCALADA Y BOULDER
=====================================================
Usuario: ${user.userName} (${user.email || 'Sesión Google'})
Última Sincronización: ${new Date().toLocaleString()}
Total de Bloques / Vías: ${routes.length}
Total de Rocódromos: ${rocodromos.length}

Archivos sincronizados en esta carpeta de Google Drive:
- manifest.json: Metadatos y fecha de sincronización
- routes.json: Todos tus bloques con coordenadas de presas y notas
- rocodromos.json: Lista de rocódromos y sectores
- climbu_backup_completo.json: Copia de seguridad completa lista para restaurar
=====================================================`;

    // Step 3: Upload files
    const manifestOk = await uploadOrUpdateFile(token, folderId, 'manifest.json', JSON.stringify(manifest, null, 2));
    const routesOk = await uploadOrUpdateFile(token, folderId, 'routes.json', JSON.stringify(routes, null, 2));
    const rocosOk = await uploadOrUpdateFile(token, folderId, 'rocodromos.json', JSON.stringify(rocodromos, null, 2));
    const fullBackupOk = await uploadOrUpdateFile(token, folderId, 'climbu_backup_completo.json', JSON.stringify(fullBackup, null, 2));
    await uploadOrUpdateFile(token, folderId, 'LEEME_CLIMBU.txt', readmeText, 'text/plain');

    if (manifestOk && routesOk && rocosOk && fullBackupOk) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        success: true,
        message: `Sincronización completada (${now}) en la carpeta "${cleanFolderName}" de tu Google Drive.`,
        folderId,
        folderUrl,
        syncedAt: nowIso
      };
    } else {
      return {
        success: false,
        message: 'Algunos archivos no se pudieron escribir en Google Drive. Intenta de nuevo.',
        folderId,
        folderUrl
      };
    }
  } catch (e: any) {
    console.error('Sync Drive error:', e);
    return {
      success: false,
      message: `Error al sincronizar con Google Drive: ${e.message || 'Error de red o permisos'}`
    };
  }
}

/**
 * Deletes the ClimbU folder from Google Drive
 */
export async function deleteDriveFolderById(token: string, folderId: string): Promise<boolean> {
  if (!token || !folderId) return false;
  try {
    const res = await fetch(`${DRIVE_API_URL}/${folderId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok || res.status === 404;
  } catch (e) {
    console.error('Error deleting drive folder:', e);
    return false;
  }
}
