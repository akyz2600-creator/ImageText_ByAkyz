import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Editor } from './lib/editor';
import type { TextAlign, TextState } from './lib/editor';
import { downloadBlob, isSupportedImage } from './lib/files';
import {
  importFontFile,
  isUserFontFamily,
  loadStoredFonts,
  markFontUsed,
  sortByRecent,
} from './lib/fonts';
import type { StoredFont } from './lib/fonts';

const SYSTEM_FONTS: { label: string; family: string }[] = [
  { label: 'Sans-serif', family: 'sans-serif' },
  { label: 'Serif', family: 'serif' },
  { label: 'Monoespaciada', family: 'monospace' },
  { label: 'Cursiva', family: 'cursive' },
  { label: 'Arial', family: 'Arial' },
  { label: 'Georgia', family: 'Georgia' },
  { label: 'Verdana', family: 'Verdana' },
  { label: 'Impact', family: 'Impact' },
];

const ALIGNS: { value: TextAlign; label: string; icon: string }[] = [
  { value: 'left', label: 'Alinear a la izquierda', icon: '⯇' },
  { value: 'center', label: 'Centrar', icon: '≡' },
  { value: 'right', label: 'Alinear a la derecha', icon: '⯈' },
];

export function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const [hasImage, setHasImage] = useState(false);
  const [selected, setSelected] = useState<TextState | null>(null);
  const [textCount, setTextCount] = useState(0);
  const [fonts, setFonts] = useState<StoredFont[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const editor = new Editor(host, { onSelection: setSelected, onTextCount: setTextCount });
    editorRef.current = editor;
    let cancelled = false;
    void loadStoredFonts().then((list) => {
      if (!cancelled) setFonts(list);
    });
    return () => {
      cancelled = true;
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  const onPickImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const editor = editorRef.current;
    if (!file || !editor) return;
    if (!isSupportedImage(file)) {
      showToast('Formato no compatible. Usa JPG, JPEG, PNG o WebP.');
      return;
    }
    if (textCount > 0 && !window.confirm('Se quitarán los textos actuales al cambiar de imagen. ¿Continuar?')) {
      return;
    }
    setBusy('Abriendo imagen…');
    try {
      await editor.loadImage(file);
      setHasImage(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo abrir la imagen.');
    } finally {
      setBusy(null);
    }
  };

  const applyFont = (family: string) => {
    editorRef.current?.updateSelected({ fontFamily: family });
    if (isUserFontFamily(family)) {
      const font = fonts.find((f) => f.family === family);
      if (font) {
        void markFontUsed(font).then(() => setFonts((prev) => sortByRecent(prev)));
      }
    }
  };

  const onPickFonts = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setBusy('Importando fuente…');
    let last: StoredFont | null = null;
    let notPersisted = false;
    const errors: string[] = [];
    for (const file of files) {
      try {
        const { font, persisted } = await importFontFile(file);
        last = font;
        if (!persisted) notPersisted = true;
        setFonts((prev) => sortByRecent([font, ...prev.filter((f) => f.id !== font.id)]));
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `No se pudo importar "${file.name}".`);
      }
    }
    setBusy(null);
    if (last && editorRef.current && selected) applyFont(last.family);
    if (errors.length > 0) showToast(errors[0]);
    else if (notPersisted) showToast('Fuente lista, pero este navegador no permite guardarla para después.');
    else if (last) showToast(`Fuente "${last.displayName}" importada.`);
  };

  const runExport = async (kind: 'jpeg' | 'pdf') => {
    const editor = editorRef.current;
    if (!editor || !editor.hasImage) return;
    setBusy(kind === 'jpeg' ? 'Generando JPEG…' : 'Generando PDF…');
    // Cede un frame para que se pinte el aviso antes del trabajo pesado.
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    try {
      const res = kind === 'jpeg' ? await editor.exportJpeg() : await editor.exportPdf();
      downloadBlob(res.blob, res.fileName);
      showToast(
        res.reduced
          ? `Exportado a ${res.width}×${res.height}px (reducido por límite de memoria).`
          : `Exportado: ${res.fileName} (${res.width}×${res.height}px).`,
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo exportar.');
    } finally {
      setBusy(null);
    }
  };

  const ed = editorRef.current;

  return (
    <div className="app">
      <header className="topbar">
        <h1>ImageText</h1>
        <div className="topbar-actions">
          <button type="button" onClick={() => imageInputRef.current?.click()}>
            Imagen
          </button>
          <button type="button" disabled={!hasImage || !!busy} onClick={() => void runExport('jpeg')}>
            JPEG
          </button>
          <button type="button" disabled={!hasImage || !!busy} onClick={() => void runExport('pdf')}>
            PDF
          </button>
        </div>
      </header>

      <main className="stage">
        <div ref={hostRef} className={hasImage ? 'canvas-host' : 'canvas-host hidden'} />
        {!hasImage && (
          <div className="empty">
            <p>Importa una imagen para empezar</p>
            <button type="button" className="primary" onClick={() => imageInputRef.current?.click()}>
              Elegir imagen
            </button>
            <small>JPG, PNG o WebP · todo se procesa en tu dispositivo</small>
          </div>
        )}
      </main>

      <section className="panel" aria-label="Controles de texto">
        <div className="panel-row">
          <button type="button" className="primary" disabled={!hasImage} onClick={() => ed?.addText()}>
            + Añadir texto
          </button>
          <button type="button" onClick={() => fontInputRef.current?.click()}>
            Importar fuente
          </button>
          {selected && (
            <button type="button" className="danger" onClick={() => ed?.deleteSelected()}>
              Eliminar
            </button>
          )}
        </div>

        {selected ? (
          <div className="controls">
            <label className="field">
              <span>Texto</span>
              <textarea
                rows={2}
                value={selected.text}
                onChange={(e) => ed?.updateSelected({ text: e.target.value })}
              />
            </label>

            <label className="field">
              <span>Fuente</span>
              <select value={selected.fontFamily} onChange={(e) => applyFont(e.target.value)}>
                {fonts.length > 0 && (
                  <optgroup label="Mis fuentes (recientes)">
                    {fonts.map((f) => (
                      <option key={f.id} value={f.family}>
                        {f.displayName}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Del sistema">
                  {SYSTEM_FONTS.map((f) => (
                    <option key={f.family} value={f.family}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            {fonts.length > 0 && (
              <div className="chips" role="list" aria-label="Fuentes recientes">
                {fonts.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="listitem"
                    className={f.family === selected.fontFamily ? 'chip active' : 'chip'}
                    style={{ fontFamily: `"${f.family}", sans-serif` }}
                    onClick={() => applyFont(f.family)}
                  >
                    {f.displayName}
                  </button>
                ))}
              </div>
            )}

            <div className="field-row">
              <label className="field grow">
                <span>Tamaño: {selected.fontSize}</span>
                <input
                  type="range"
                  min={6}
                  max={600}
                  value={Math.min(600, selected.fontSize)}
                  onChange={(e) => ed?.updateSelected({ fontSize: Number(e.target.value) })}
                />
              </label>
              <label className="field color">
                <span>Color</span>
                <input
                  type="color"
                  value={selected.fill}
                  onChange={(e) => ed?.updateSelected({ fill: e.target.value })}
                />
              </label>
            </div>

            <div className="align" role="group" aria-label="Alineación">
              {ALIGNS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  aria-label={a.label}
                  aria-pressed={selected.textAlign === a.value}
                  className={selected.textAlign === a.value ? 'active' : ''}
                  onClick={() => ed?.updateSelected({ textAlign: a.value })}
                >
                  {a.icon}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="hint">
            {hasImage
              ? 'Toca un texto para editarlo, arrástralo para moverlo o usa las esquinas para cambiar su tamaño.'
              : 'Primero importa una imagen.'}
          </p>
        )}
      </section>

      <input
        ref={imageInputRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        onChange={(e) => void onPickImage(e)}
      />
      <input
        ref={fontInputRef}
        type="file"
        hidden
        multiple
        accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
        onChange={(e) => void onPickFonts(e)}
      />

      {busy && (
        <div className="busy" role="status">
          {busy}
        </div>
      )}
      {toast && (
        <div className="toast" role="alert">
          {toast}
        </div>
      )}
    </div>
  );
}
