// Guardado de la imagen/PDF exportados.
// - Web: descarga normal con un enlace.
// - APK (Capacitor): el WebView no descarga blobs, así que se escribe el archivo en la caché
//   de la app y se abre el menú nativo de Compartir/Guardar.

import { Capacitor } from '@capacitor/core';
import { downloadBlob } from './files';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo.'));
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

export async function saveOutput(blob: Blob, fileName: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    downloadBlob(blob, fileName);
    return;
  }
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);
  const data = await blobToBase64(blob);
  const written = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });
  try {
    await Share.share({ title: fileName, url: written.uri });
  } catch (err) {
    // Cerrar el menú de compartir sin elegir nada no es un error.
    if (!(err instanceof Error && /cancel/i.test(err.message))) throw err;
  }
}
