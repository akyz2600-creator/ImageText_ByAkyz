# TECHNICAL_DOCS

## Estructura

```
src/
  main.tsx          punto de entrada (sin StrictMode, ver abajo)
  App.tsx           interfaz React; orquesta Editor y fuentes
  styles.css        diseño móvil-first (panel inferior; lateral en >= 900px)
  lib/
    editor.ts       clase Editor: lienzo Fabric, textos, exportación
    fonts.ts        importar/registrar fuentes, recientes
    db.ts           IndexedDB mínimo (almacén "fonts")
    files.ts        validación de formatos, nombres, tamaño de exportación
```

## Decisiones

- **React solo orquesta; Fabric es imperativo.** `Editor` crea el `<canvas>` por código dentro de un contenedor y lo destruye en `dispose()`. Por eso no se usa `StrictMode` (evita doble inicialización en desarrollo).
- **Tamaño de trabajo.** El lienzo usa un lado largo máximo de 1600 px (`MAX_WORKING_SIDE`) para que mover y escalar sea fluido en Android. La escala a pantalla se hace solo por CSS (`setDimensions(..., { cssOnly: true })`) con un `ResizeObserver`.
- **Exportación a resolución original.** El fondo de pantalla es una copia reducida; al exportar se cambia por la imagen original y se llama a `toCanvasElement(multiplier)`, con `multiplier = ancho original / ancho de trabajo`. Así el texto sale nítido. El tamaño se limita a 8192 px de lado largo y 40 millones de píxeles (`computeExportSize`).
- **JPEG:** calidad 0.95, fondo blanco (las transparencias de PNG/WebP quedan sobre blanco).
- **PDF:** jsPDF con página del mismo tamaño en px que la imagen (`hotfixes: ['px_scaling']`), importado de forma diferida (`import('jspdf')`).
- **Escalado de textos.** Al soltar una esquina (`object:modified`) el escalado se convierte en `fontSize` y `width` reales y `scaleX/scaleY` vuelven a 1.
- **Fuentes propias.** Se validan por extensión (TTF, OTF, WOFF, WOFF2) y se comprueban cargándolas con `FontFace`. Cada una recibe una familia CSS única `userfont-<id>`. Se guardan en IndexedDB (`imagetext-byakyz` v1, almacén `fonts`, clave `id`) con `lastUsedAt`; se conservan las 20 más recientes. Si IndexedDB no está disponible, la fuente funciona solo en la sesión y se avisa.
- **Retina.** `enableRetinaScaling: false` para no multiplicar la memoria del lienzo en pantallas de alta densidad.

## APK (Capacitor)

- `capacitor.config.json` (`com.akyz.imagetext`, `webDir: dist`). La carpeta `android/` no se versiona: el workflow la genera con `npx cap add android` y compila con `./gradlew assembleDebug` (JDK 21).
- `src/lib/save.ts`: en web descarga con enlace; en el APK escribe el archivo en la caché (`@capacitor/filesystem`) y abre Compartir (`@capacitor/share`), porque el WebView no descarga blobs.

## Pruebas

Vitest (entorno node) cubre la lógica pura: `files.test.ts` y `fonts.test.ts`. El editor y la UI dependen del DOM/canvas y **no tienen pruebas automáticas todavía**.

## CI

`.github/workflows/ci.yml`: `npm install` → `npm run typecheck` → `npm test` → `npm run build` → sube `dist` como artefacto.
