// Utilidades puras de archivos (sin DOM salvo downloadBlob). Probadas en files.test.ts.

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const FONT_EXTENSIONS = ['ttf', 'otf', 'woff', 'woff2'] as const;

/** Límites de exportación para no agotar la memoria del canvas en móviles. */
export const MAX_EXPORT_SIDE = 8192;
export const MAX_EXPORT_PIXELS = 40_000_000;

export function getExtension(fileName: string): string {
  const i = fileName.lastIndexOf('.');
  if (i < 0 || i === fileName.length - 1) return '';
  return fileName.slice(i + 1).toLowerCase();
}

export function baseName(fileName: string): string {
  const i = fileName.lastIndexOf('.');
  return i > 0 ? fileName.slice(0, i) : fileName;
}

export function isSupportedImage(file: { name: string; type: string }): boolean {
  const ext = getExtension(file.name);
  if ((IMAGE_EXTENSIONS as readonly string[]).includes(ext)) return true;
  return (IMAGE_MIME_TYPES as readonly string[]).includes(file.type.toLowerCase());
}

export function isSupportedFont(fileName: string): boolean {
  return (FONT_EXTENSIONS as readonly string[]).includes(getExtension(fileName));
}

/** Nombre de archivo de salida seguro: "<original>-texto.<ext>". */
export function exportFileName(originalName: string | undefined, ext: 'jpg' | 'pdf'): string {
  const raw = originalName ? baseName(originalName) : '';
  const safe = raw
    .normalize('NFKD')
    .replace(/[^\w\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);
  return `${safe || 'imagen'}-texto.${ext}`;
}

export interface ExportSize {
  width: number;
  height: number;
  /** true si hubo que reducir respecto al tamaño original. */
  reduced: boolean;
}

/** Calcula el tamaño de exportación: original salvo que supere los límites. */
export function computeExportSize(
  width: number,
  height: number,
  maxSide: number = MAX_EXPORT_SIDE,
  maxPixels: number = MAX_EXPORT_PIXELS,
): ExportSize {
  let factor = 1;
  const longSide = Math.max(width, height);
  if (longSide > maxSide) factor = Math.min(factor, maxSide / longSide);
  const pixels = width * height;
  if (pixels > maxPixels) factor = Math.min(factor, Math.sqrt(maxPixels / pixels));
  if (factor >= 1) return { width, height, reduced: false };
  return {
    width: Math.max(1, Math.floor(width * factor)),
    height: Math.max(1, Math.floor(height * factor)),
    reduced: true,
  };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
