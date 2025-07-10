import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

const CACHE_DIR = `${FileSystem.cacheDirectory}image-cache/`;
const MAX_CACHE_SIZE_MB = 100;
const MAX_CACHE_AGE_DAYS = 7;

async function ensureCacheDirExists() {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

async function getCacheFilename(remoteUrl: string): Promise<string> {
  let urlToHash = remoteUrl;

  // Si la URL es de nuestra API, incluir el host en el hash para evitar conflictos
  // cuando cambia la IP del servidor
  if (remoteUrl.includes('/api/v1/files/')) {
    try {
      const parsedUrl = new URL(remoteUrl);
      // Incluir host + pathname para diferenciar entre diferentes servidores
      urlToHash = `${parsedUrl.host}${parsedUrl.pathname}`;
    } catch (e) {
      // Si falla el parseo, usar la URL completa
      urlToHash = remoteUrl;
    }
  }

  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    urlToHash,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  const extensionMatch = remoteUrl.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
  const extension = extensionMatch ? extensionMatch[1] : 'jpg';
  return `${digest}.${extension}`;
}

interface ExistingFileInfo {
  uri: string;
  size: number;
  modificationTime: number;
  exists: true;
}

async function cleanCache() {
  await ensureCacheDirExists();

  try {
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    const fileInfosPromises = files.map(
      async (
        file,
      ): Promise<ExistingFileInfo | { exists: false; uri: string }> => {
        const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`, {
          size: true,
        });
        if (info.exists) {
          return {
            uri: info.uri,
            size: info.size,
            modificationTime: info.modificationTime,
            exists: true,
          };
        } else {
          return {
            exists: false,
            uri: info.uri,
          };
        }
      },
    );

    const allFileInfos = await Promise.all(fileInfosPromises);
    const existingFileInfos: ExistingFileInfo[] = allFileInfos.filter(
      (f): f is ExistingFileInfo => f.exists,
    );

    let totalSize = existingFileInfos.reduce((sum, file) => sum + file.size, 0);
    existingFileInfos.sort((a, b) => {
      // Usar comparación segura sin aritmética directa
      return a.modificationTime < b.modificationTime
        ? -1
        : a.modificationTime > b.modificationTime
          ? 1
          : 0;
    });

    const now = Date.now();
    const maxAgeMillis = MAX_CACHE_AGE_DAYS * 24 * 60 * 60 * 1000;
    const maxSizeInBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

    let filesDeletedCount = 0;
    let sizeDeleted = 0;

    const filesToDeleteByAge = existingFileInfos.filter((file) => {
      const fileAgeMillis = now - Math.floor(file.modificationTime) * 1000;
      return fileAgeMillis > maxAgeMillis;
    });
    for (const file of filesToDeleteByAge) {
      await FileSystem.deleteAsync(file.uri, { idempotent: true });
      totalSize -= file.size;
      sizeDeleted += file.size;
      filesDeletedCount++;
    }

    const remainingFiles = existingFileInfos
      .filter((file) => {
        const fileAgeMillis = now - Math.floor(file.modificationTime) * 1000;
        return fileAgeMillis <= maxAgeMillis;
      })
      .sort((a, b) => {
        // Usar comparación segura sin aritmética directa
        return a.modificationTime < b.modificationTime
          ? -1
          : a.modificationTime > b.modificationTime
            ? 1
            : 0;
      });

    let currentIndex = 0;
    while (totalSize > maxSizeInBytes && currentIndex < remainingFiles.length) {
      const fileToDelete = remainingFiles[currentIndex];
      try {
        await FileSystem.deleteAsync(fileToDelete.uri, { idempotent: true });
        totalSize -= fileToDelete.size;
        sizeDeleted += fileToDelete.size;
        filesDeletedCount++;
      } catch (delError) {}
      currentIndex++;
    }

    if (filesDeletedCount > 0) {
    } else {
    }
  } catch (error) {}
}

export async function getCachedImageUri(
  remoteUrl: string,
): Promise<string | null> {
  if (
    !remoteUrl ||
    typeof remoteUrl !== 'string' ||
    (!remoteUrl.startsWith('http://') && !remoteUrl.startsWith('https://'))
  ) {
    return remoteUrl;
  }

  await ensureCacheDirExists();
  const filename = await getCacheFilename(remoteUrl);
  const localUri = `${CACHE_DIR}${filename}`;
  const fileInfo = await FileSystem.getInfoAsync(localUri);

  if (fileInfo.exists) {
    return localUri;
  } else {
    try {
      const { uri: downloadedUri } = await FileSystem.downloadAsync(
        remoteUrl,
        localUri,
      );
      return downloadedUri;
    } catch (error) {
      const partialFileInfo = await FileSystem.getInfoAsync(localUri);
      if (partialFileInfo.exists) {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
      }
      return null;
    }
  }
}

export async function initImageCache() {
  await ensureCacheDirExists();
  cleanCache().catch((error) => {
    console.error('Error cleaning cache:', error);
  });
}

export async function removeImageFromCache(remoteUrl: string) {
  if (!remoteUrl || typeof remoteUrl !== 'string') return;
  try {
    const filename = await getCacheFilename(remoteUrl);
    const localUri = `${CACHE_DIR}${filename}`;
    await FileSystem.deleteAsync(localUri, { idempotent: true });
  } catch (error) {}
}

export async function clearImageCache() {
  try {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    await ensureCacheDirExists();
  } catch (error) {}
}
