# PROJECT_STATUS

Última actualización: 2026-11-24

## Resumen honesto

El repositorio estaba **vacío** al retomar el trabajo (sin commits ni ramas): el desarrollo de la sesión anterior no se subió y no quedó nada recuperable. En esta sesión se escribió la primera versión completa del código según el objetivo del proyecto.

**Nada de lo siguiente está verificado todavía**: en el entorno de la sesión no hay acceso a npm, por lo que no se pudieron instalar dependencias, compilar ni ejecutar pruebas. La verificación la hará GitHub Actions (`.github/workflows/ci.yml`) en el primer push.

## Qué está escrito (sin verificar)

| Área | Archivos | Estado |
| --- | --- | --- |
| Andamiaje | `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` | Escrito |
| CI | `.github/workflows/ci.yml` (typecheck, test, build) | Escrito, sin ejecutar |
| Editor Fabric | `src/lib/editor.ts` | Escrito |
| Fuentes + IndexedDB | `src/lib/fonts.ts`, `src/lib/db.ts` | Escrito |
| Utilidades | `src/lib/files.ts` | Escrito, con pruebas |
| UI | `src/App.tsx`, `src/styles.css`, `src/main.tsx` | Escrito |
| Pruebas | `src/lib/files.test.ts`, `src/lib/fonts.test.ts` | Escritas, sin ejecutar |

## Objetivos del proyecto

- [ ] Importar imágenes (JPG/PNG/WebP) — escrito, sin verificar
- [ ] Añadir/editar/mover/redimensionar textos — escrito, sin verificar
- [ ] Fuente, tamaño, color, alineación — escrito, sin verificar
- [ ] Importar fuentes TTF/OTF/WOFF/WOFF2 — escrito, sin verificar
- [ ] Fuentes recientes en IndexedDB — escrito, sin verificar
- [ ] Exportar JPEG y PDF — escrito, sin verificar
- [ ] Compilación verificada en CI — **pendiente**
- [ ] Prueba en un Android real — **pendiente**

## Siguiente paso

Revisar el resultado de la primera ejecución de GitHub Actions y corregir lo que falle (lo más probable: diferencias de tipos con la versión instalada de Fabric 6). Después, probar en Android.
