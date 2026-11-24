// Fuentes propias: validación, registro en el documento y persistencia de recientes.

import { deleteFonts, getAllFonts, putFont } from './db';
import { baseName, isSupportedFont } from './files';

export interface StoredFont {
  id: string;
  /** Nombre de familia CSS único (sin espacios) usado por Fabric/Canvas. */
  family: string;
  /** Nombre legible para mostrar en la interfaz. */
  displayName: string;
  fileName: string;
  data: ArrayBuffer;
  addedAt: number;
  lastUsedAt: number;
}

export const MAX_RECENT_FONTS = 20;
export const USER_FONT_PREFIX = 'userfont-';

export function sortByRecent<T extends { lastUsedAt: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.lastUsedAt - a.lastUsedAt);
}

/** Ids de las fuentes que sobran al superar el máximo de recientes. */
export function pickPrunable<T extends { id: string; lastUsedAt: number }>(
  list: T[],
  max: number = MAX_RECENT_FONTS,
): string[] {
  return sortByRecent(list)
    .slice(max)
    .map((f) => f.id);
}

export function makeFamilyName(id: string): string {
  return `${USER_FONT_PREFIX}${id}`;
}

export function isUserFontFamily(family: string): boolean {
  return family.startsWith(USER_FONT_PREFIX);
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Registra la fuente en document.fonts. Lanza si el archivo no es una fuente válida. */
export async function registerFont(font: StoredFont): Promise<void> {
  const face = new FontFace(font.family, font.data);
  await face.load();
  document.fonts.add(face);
}

export interface ImportResult {
  font: StoredFont;
  /** false si IndexedDB no estuvo disponible: la fuente sirve solo en esta sesión. */
  persisted: boolean;
}

export async function importFontFile(file: File): Promise<ImportResult> {
  if (!isSupportedFont(file.name)) {
    throw new Error(`"${file.name}" no es una fuente compatible (TTF, OTF, WOFF o WOFF2).`);
  }
  const data = await file.arrayBuffer();

  // Misma fuente ya guardada: solo se marca como usada.
  let existing: StoredFont[] = [];
  try {
    existing = await getAllFonts();
  } catch {
    existing = [];
  }
  const dup = existing.find((f) => f.fileName === file.name && f.data.byteLength === data.byteLength);
  if (dup) {
    dup.lastUsedAt = Date.now();
    await registerFont(dup).catch(() => undefined);
    await putFont(dup).catch(() => undefined);
    return { font: dup, persisted: true };
  }

  const id = newId();
  const now = Date.now();
  const font: StoredFont = {
    id,
    family: makeFamilyName(id),
    displayName: baseName(file.name),
    fileName: file.name,
    data,
    addedAt: now,
    lastUsedAt: now,
  };
  try {
    await registerFont(font);
  } catch {
    throw new Error(`No se pudo leer "${file.name}": el archivo no parece una fuente válida.`);
  }

  let persisted = true;
  try {
    await putFont(font);
    await deleteFonts(pickPrunable([...existing, font]));
  } catch {
    persisted = false;
  }
  return { font, persisted };
}

/** Carga las fuentes guardadas, las registra y las devuelve de más a menos reciente. */
export async function loadStoredFonts(): Promise<StoredFont[]> {
  let fonts: StoredFont[];
  try {
    fonts = await getAllFonts();
  } catch {
    return [];
  }
  const ok: StoredFont[] = [];
  for (const f of fonts) {
    try {
      await registerFont(f);
      ok.push(f);
    } catch {
      // fuente dañada: se ignora
    }
  }
  return sortByRecent(ok);
}

export async function markFontUsed(font: StoredFont): Promise<void> {
  font.lastUsedAt = Date.now();
  try {
    await putFont(font);
  } catch {
    // sin persistencia: no es crítico
  }
}
