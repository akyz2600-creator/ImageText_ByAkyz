# ImageText_ByAkyz

Editor sencillo y profesional de textos sobre imágenes, optimizado para Android y usable en escritorio. Todo se procesa en el dispositivo: sin cuentas, sin backend, sin publicidad.

> **Estado:** código completo de la primera versión, **pendiente de verificar en CI** (ver `PROJECT_STATUS.md`).

## Funciones

- Importar imágenes JPG, JPEG, PNG y WebP.
- Añadir varios textos, moverlos, redimensionarlos (esquinas) y editarlos (cuadro de texto del panel o doble toque sobre el lienzo).
- Fuente, tamaño, color y alineación por texto.
- Importar fuentes propias TTF, OTF, WOFF y WOFF2; las recientes (hasta 20) se guardan en IndexedDB.
- Exportar JPEG (calidad 0.95) y PDF a las dimensiones originales de la imagen (con tope de memoria, ver `KNOWN_ISSUES.md`).

## Stack

React 18 · TypeScript · Vite · Fabric.js 6 · IndexedDB (acceso propio) · jsPDF · Vitest.

## Uso local

```bash
npm install
npm run dev        # servidor de desarrollo
npm run typecheck  # tipos
npm test           # pruebas unitarias
npm run build      # genera dist/
```

## Despliegue en Cloudflare Pages

- Comando de compilación: `npm run build`
- Directorio de salida: `dist`
- Versión de Node: 22

## Documentación

`PROJECT_STATUS.md` · `ROADMAP.md` · `TECHNICAL_DOCS.md` · `SESSION_LOG.md` · `KNOWN_ISSUES.md`
