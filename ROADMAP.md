# ROADMAP

## Fase 1 — Verificación (siguiente)
- [x] Primer CI en verde (typecheck, pruebas, build) — 2026-11-24.
- [ ] Generar y subir `package-lock.json`; cambiar el CI a `npm ci` con caché.
- [ ] Probar importación de imagen, textos, fuentes y exportación en Android (Chrome) y escritorio.
- [ ] Confirmar que el arrastre/escalado táctil funciona con el escalado CSS del lienzo.

## Fase 2 — Ajustes tras las pruebas
- [ ] Corregir lo que aparezca en la Fase 1.
- [ ] Revisar rendimiento con fotos grandes (12 MP o más).
- [ ] Revisar descarga de archivos en Android (Chrome y navegadores alternativos).

## Fase 3 — Despliegue
- [ ] Publicar en Cloudflare Pages (`npm run build`, salida `dist`).

## Fuera de alcance (por decisión del proyecto)
Login, backend, Firebase, publicidad, edición de imagen (filtros, recortes), formatos distintos a los indicados.
