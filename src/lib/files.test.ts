import { describe, expect, it } from 'vitest';
import {
  baseName,
  computeExportSize,
  exportFileName,
  getExtension,
  isSupportedFont,
  isSupportedImage,
} from './files';

describe('getExtension / baseName', () => {
  it('extrae la extensión en minúsculas', () => {
    expect(getExtension('Foto.JPG')).toBe('jpg');
    expect(getExtension('a.b.woff2')).toBe('woff2');
  });
  it('devuelve vacío sin extensión', () => {
    expect(getExtension('sinextension')).toBe('');
    expect(getExtension('termina.')).toBe('');
  });
  it('quita la extensión del nombre', () => {
    expect(baseName('mi foto.png')).toBe('mi foto');
    expect(baseName('.oculto')).toBe('.oculto');
  });
});

describe('isSupportedImage', () => {
  it('acepta JPG, JPEG, PNG y WebP por extensión', () => {
    for (const n of ['a.jpg', 'a.jpeg', 'a.PNG', 'a.webp']) {
      expect(isSupportedImage({ name: n, type: '' })).toBe(true);
    }
  });
  it('acepta por tipo MIME cuando falta la extensión', () => {
    expect(isSupportedImage({ name: 'image', type: 'image/webp' })).toBe(true);
  });
  it('rechaza otros formatos', () => {
    expect(isSupportedImage({ name: 'a.gif', type: 'image/gif' })).toBe(false);
    expect(isSupportedImage({ name: 'a.pdf', type: 'application/pdf' })).toBe(false);
  });
});

describe('isSupportedFont', () => {
  it('acepta TTF, OTF, WOFF y WOFF2', () => {
    for (const n of ['a.ttf', 'a.OTF', 'a.woff', 'a.woff2']) {
      expect(isSupportedFont(n)).toBe(true);
    }
  });
  it('rechaza otros archivos', () => {
    expect(isSupportedFont('a.eot')).toBe(false);
    expect(isSupportedFont('a.txt')).toBe(false);
  });
});

describe('exportFileName', () => {
  it('añade el sufijo y la extensión', () => {
    expect(exportFileName('mi foto.png', 'jpg')).toBe('mi_foto-texto.jpg');
    expect(exportFileName('x.jpeg', 'pdf')).toBe('x-texto.pdf');
  });
  it('usa un nombre por defecto', () => {
    expect(exportFileName(undefined, 'jpg')).toBe('imagen-texto.jpg');
    expect(exportFileName('***.png', 'pdf')).toBe('imagen-texto.pdf');
  });
});

describe('computeExportSize', () => {
  it('mantiene el tamaño original dentro de los límites', () => {
    expect(computeExportSize(4000, 3000)).toEqual({ width: 4000, height: 3000, reduced: false });
  });
  it('reduce si el lado largo supera el máximo', () => {
    const r = computeExportSize(16000, 4000, 8000, 1e12);
    expect(r.reduced).toBe(true);
    expect(r.width).toBe(8000);
    expect(r.height).toBe(2000);
  });
  it('reduce si supera el máximo de píxeles', () => {
    const r = computeExportSize(10000, 10000, 1e9, 25_000_000);
    expect(r.reduced).toBe(true);
    expect(r.width * r.height).toBeLessThanOrEqual(25_000_000);
  });
});
