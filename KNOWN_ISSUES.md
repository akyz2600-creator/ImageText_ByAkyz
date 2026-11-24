# KNOWN_ISSUES

## Sin verificar (alta prioridad)
1. **Comportamiento en navegador.** El CI confirma que tipos, pruebas y build pasan, pero nadie ha abierto la app. Riesgos concretos: escalado CSS del lienzo de Fabric con gestos táctiles, `toCanvasElement` con multiplicador alto, descarga de archivos en Android.
2. **Sin `package-lock.json`.** El CI usa `npm install` y las versiones se resuelven por rangos (`^`), así que una compilación futura puede cambiar. Hay que generar y subir el lockfile (requiere acceso a npm) y pasar el CI a `npm ci`.

## Limitaciones conocidas
- Durante el arrastre de una esquina el texto se ve estirado hasta soltar; al soltar se convierte en tamaño de fuente real.
- Exportación limitada a 8192 px de lado largo / 40 MP; imágenes mayores se reducen y la app lo avisa.
- Las fuentes del sistema (Arial, Georgia, Verdana, Impact) dependen del dispositivo; en Android pueden caer a la fuente por defecto.
- Las imágenes con transparencia se exportan con fondo blanco.
- El editor y la UI no tienen pruebas automáticas (solo la lógica pura).
- Cambiar de imagen elimina los textos actuales (la app pide confirmación).
