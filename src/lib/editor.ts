// Controlador imperativo del lienzo (Fabric.js v6). React solo lo orquesta.
//
// Modelo de coordenadas:
//  - El lienzo trabaja a un "tamaño de trabajo" (lado largo <= MAX_WORKING_SIDE) para que
//    arrastrar/redimensionar sea fluido en Android.
//  - El fondo de trabajo es una copia reducida de la imagen; al exportar se cambia
//    temporalmente por la imagen original y se renderiza con un multiplicador, de modo que
//    la salida conserva la resolución original y el texto se dibuja nítido.
//  - La escala a pantalla se hace solo por CSS (setDimensions con cssOnly).

import { Canvas, FabricImage, Textbox, type FabricObject } from 'fabric';
import { computeExportSize, exportFileName } from './files';

export type TextAlign = 'left' | 'center' | 'right';

export interface TextState {
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  textAlign: TextAlign;
}

export interface EditorHandlers {
  onSelection: (state: TextState | null) => void;
  onTextCount: (count: number) => void;
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
  width: number;
  height: number;
  /** true si la imagen se redujo por superar los límites de memoria. */
  reduced: boolean;
}

export const MAX_WORKING_SIDE = 1600;
export const JPEG_QUALITY = 0.95;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function snapshot(t: Textbox): TextState {
  const align = t.textAlign;
  return {
    text: t.text ?? '',
    fontFamily: t.fontFamily ?? 'sans-serif',
    fontSize: Math.round(t.fontSize ?? 32),
    fill: typeof t.fill === 'string' && HEX_COLOR.test(t.fill) ? t.fill : '#000000',
    textAlign: align === 'center' || align === 'right' ? align : 'left',
  };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen (memoria insuficiente).'))),
      type,
      quality,
    );
  });
}

export class Editor {
  private canvasEl: HTMLCanvasElement;
  private canvas: Canvas;
  private resizeObserver: ResizeObserver;
  private objectUrl: string | null = null;
  private natural: { width: number; height: number } | null = null;
  private fullImage: FabricImage | null = null;
  private previewImage: FabricImage | null = null;
  private originalName: string | undefined;

  constructor(
    private host: HTMLElement,
    private handlers: EditorHandlers,
  ) {
    this.canvasEl = document.createElement('canvas');
    host.appendChild(this.canvasEl);
    this.canvas = new Canvas(this.canvasEl, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: false,
      enableRetinaScaling: false,
    });

    const emit = () => this.emitSelection();
    this.canvas.on('selection:created', emit);
    this.canvas.on('selection:updated', emit);
    this.canvas.on('selection:cleared', emit);
    this.canvas.on('text:changed', emit);
    this.canvas.on('object:modified', (e) => {
      this.normalizeScale(e.target);
      emit();
    });
    this.canvas.on('object:added', () => this.emitCount());
    this.canvas.on('object:removed', () => this.emitCount());

    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(host);
  }

  get hasImage(): boolean {
    return this.natural !== null;
  }

  async loadImage(file: File): Promise<void> {
    const url = URL.createObjectURL(file);
    const el = new Image();
    el.src = url;
    try {
      await el.decode();
    } catch {
      URL.revokeObjectURL(url);
      throw new Error('No se pudo abrir la imagen. Prueba con otro archivo JPG, PNG o WebP.');
    }
    const nw = el.naturalWidth;
    const nh = el.naturalHeight;
    if (!nw || !nh) {
      URL.revokeObjectURL(url);
      throw new Error('La imagen no tiene dimensiones válidas.');
    }

    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = url;
    this.originalName = file.name;
    this.natural = { width: nw, height: nh };

    const s = Math.min(1, MAX_WORKING_SIDE / Math.max(nw, nh));
    const w = Math.round(nw * s);
    const h = Math.round(nh * s);

    // Fondo original (se usa solo al exportar), escalado al tamaño de trabajo.
    this.fullImage = new FabricImage(el, {
      left: 0,
      top: 0,
      scaleX: w / nw,
      scaleY: h / nh,
      selectable: false,
      evented: false,
    });

    // Fondo reducido para dibujar rápido en pantalla.
    if (s < 1) {
      const small = document.createElement('canvas');
      small.width = w;
      small.height = h;
      const ctx = small.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(el, 0, 0, w, h);
      }
      this.previewImage = new FabricImage(small, {
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
      });
    } else {
      this.previewImage = this.fullImage;
    }

    this.canvas.discardActiveObject();
    this.canvas.remove(...this.canvas.getObjects());
    this.canvas.setDimensions({ width: w, height: h });
    this.canvas.backgroundImage = this.previewImage;
    this.fit();
    this.canvas.requestRenderAll();
    this.emitSelection();
  }

  addText(): void {
    if (!this.natural) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const text = new Textbox('Texto', {
      left: w * 0.2,
      top: h * 0.4,
      width: w * 0.6,
      fontSize: Math.round(w * 0.06),
      fontFamily: 'sans-serif',
      fill: '#ffffff',
      textAlign: 'center',
      editable: true,
      // Controles grandes para uso táctil
      cornerSize: 22,
      touchCornerSize: 44,
      transparentCorners: false,
      cornerColor: '#4f9cff',
      cornerStrokeColor: '#ffffff',
      borderColor: '#4f9cff',
      padding: 6,
    });
    this.canvas.add(text);
    this.canvas.setActiveObject(text);
    this.canvas.requestRenderAll();
    this.emitSelection();
  }

  updateSelected(patch: Partial<TextState>): void {
    const t = this.activeText();
    if (!t) return;
    const next: Partial<TextState> = { ...patch };
    if (next.fontSize !== undefined) {
      next.fontSize = Math.min(1000, Math.max(6, Math.round(next.fontSize)));
    }
    t.set(next);
    t.initDimensions();
    t.setCoords();
    this.canvas.requestRenderAll();
    this.emitSelection();
  }

  deleteSelected(): void {
    const t = this.activeText();
    if (!t) return;
    this.canvas.discardActiveObject();
    this.canvas.remove(t);
    this.canvas.requestRenderAll();
    this.emitSelection();
  }

  get textCount(): number {
    return this.canvas.getObjects().length;
  }

  async exportJpeg(): Promise<ExportResult> {
    const out = this.renderOutput();
    const blob = await toBlob(out.canvas, 'image/jpeg', JPEG_QUALITY);
    return {
      blob,
      fileName: exportFileName(this.originalName, 'jpg'),
      width: out.canvas.width,
      height: out.canvas.height,
      reduced: out.reduced,
    };
  }

  async exportPdf(): Promise<ExportResult> {
    const out = this.renderOutput();
    const w = out.canvas.width;
    const h = out.canvas.height;
    const dataUrl = out.canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: w >= h ? 'landscape' : 'portrait',
      unit: 'px',
      format: [w, h],
      compress: true,
      hotfixes: ['px_scaling'],
    });
    pdf.addImage(dataUrl, 'JPEG', 0, 0, w, h, undefined, 'FAST');
    const blob = pdf.output('blob');
    return {
      blob,
      fileName: exportFileName(this.originalName, 'pdf'),
      width: w,
      height: h,
      reduced: out.reduced,
    };
  }

  dispose(): void {
    this.resizeObserver.disconnect();
    void this.canvas.dispose();
    this.host.replaceChildren();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }

  // ---------- internos ----------

  /** Renderiza imagen + textos a resolución original (o al máximo permitido). */
  private renderOutput(): { canvas: HTMLCanvasElement; reduced: boolean } {
    if (!this.natural || !this.fullImage || !this.previewImage) {
      throw new Error('Primero importa una imagen.');
    }
    this.canvas.discardActiveObject();
    const size = computeExportSize(this.natural.width, this.natural.height);
    const multiplier = size.width / this.canvas.width;
    this.canvas.backgroundImage = this.fullImage;
    try {
      const canvas = this.canvas.toCanvasElement(multiplier);
      return { canvas, reduced: size.reduced };
    } finally {
      this.canvas.backgroundImage = this.previewImage;
      this.canvas.requestRenderAll();
    }
  }

  private activeText(): Textbox | null {
    const o = this.canvas.getActiveObject();
    return o instanceof Textbox ? o : null;
  }

  private emitSelection(): void {
    const t = this.activeText();
    this.handlers.onSelection(t ? snapshot(t) : null);
  }

  private emitCount(): void {
    this.handlers.onTextCount(this.canvas.getObjects().length);
  }

  /** Convierte el escalado de las esquinas en tamaño de fuente / ancho reales. */
  private normalizeScale(target: FabricObject | undefined): void {
    if (!(target instanceof Textbox)) return;
    const sx = target.scaleX ?? 1;
    const sy = target.scaleY ?? 1;
    if (Math.abs(sx - 1) < 1e-3 && Math.abs(sy - 1) < 1e-3) return;
    target.set({
      fontSize: Math.min(1000, Math.max(6, Math.round((target.fontSize ?? 32) * sy))),
      width: Math.max(20, (target.width ?? 100) * sx),
      scaleX: 1,
      scaleY: 1,
    });
    target.setCoords();
    this.canvas.requestRenderAll();
  }

  /** Ajusta el lienzo (solo CSS) al espacio disponible. */
  private fit(): void {
    if (!this.natural) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const bw = this.host.clientWidth;
    const bh = this.host.clientHeight;
    if (!bw || !bh) return;
    const s = Math.min(bw / w, bh / h);
    this.canvas.setDimensions({ width: w * s, height: h * s }, { cssOnly: true });
  }
}
