# KNOWN_ISSUES

## Sin verificar (alta prioridad)
1. **Nada se ha compilado ni ejecutado.** Puede haber errores de tipos, sobre todo en llamadas a Fabric 6 (`setDimensions` con `cssOnly`, `toCanvasElement`, `backgroundImage`, opciones de `Textbox`). Lo revelará el primer CI.
2. **Sin `package-lock.json`.** El CI usa `npm install`; las versiones se resuelven por rangos (`^`). Hay que generar y subir el lockfile.
3. **Gestos táctiles** (mover/escalar con el lienzo escalado por CSS) sin probar en Android.

## Limitaciones conocidas
- Durante el arrastre de una esquina el texto se ve estirado hasta soltar; al soltar se convierte en tamaño de fuente real.
- Exportación limitada a 8192 px de lado largo / 40 MP; imágenes mayores se reducen y la app lo avisa.
- Las fuentes del sistema (Arial, Georgia, Verdana, Impact) dependen del dispositivo; en Android pueden caer a la fuente por defecto.
- Las imágenes con transparencia se exportan con fondo blanco.
- El editor y la UI no tienen pruebas automáticas (solo la lógica pura).
- Cambiar de imagen elimina los textos actuales (la app pide confirmación).
