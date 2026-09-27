# Red Dead Paw II — Cats of Santiago

Juego 3D (three.js r169) de gatos callejeros en dos barrios reales de Santiago de Chile
(Santa María de Maipú y Santa Sofía de Lo Cañas, La Florida), con importación opcional de mapas OSM. Publicado como artifact en
<https://claude.ai/artifact/K1BHtu7xQ84VVPFjc2iSEF>.

## Origen de este código

El repo parte del **build publicado del artifact** (versión `1790460610-f61f`, 26-09-2026),
un único HTML de ~2 MB. Se separó en piezas editables:

| Ruta | Contenido |
| --- | --- |
| `src/game.js` | Todo el JS: three.js + post-procesado + código del juego, empaquetado por esbuild. Los nombres internos vienen **minificados** (el bundle original no traía fuentes); se pasó por Prettier para poder leerlo y editarlo. |
| `src/styles.css` | CSS del juego (HUD, menús, pantallas). |
| `src/fonts.css` + `assets/fonts/` | Bungee, Anton, Barlow Condensed, IBM Plex Mono (woff2). |
| `assets/sounds/` + `manifest.json` | 86 muestras MP3 agrupadas (gatos, perros, pájaros, motor, bocina…). El juego las lee desde `window.__SND`. |
| `src/body.html` | Markup base (`#app`, canvases, capas de UI). |

> Si existen las fuentes originales sin minificar (p. ej. del proyecto en Cowork), conviene
> subirlas al repo y reemplazar `src/game.js` por ellas.

## Desarrollo

```bash
npm install
npm run dev      # build + watch + servidor en http://localhost:5173
npm run build    # genera dist/index.html (un solo archivo, todo inline)
node build.mjs --minify   # igual, con game.js minificado (para publicar el artifact)
npm run check    # sintaxis + build + prueba de humo en Chromium headless
```

`dist/index.html` es autocontenido: es lo que se publica como artifact.

## Novedades respecto del artifact original

- Clima automático (despejado, nublado, lluvia, tormenta) con lluvia y truenos grabados.
- Visión nocturna (`B`) cuando está oscuro; hierba gatera con efecto psicodélico; rascaderos (troncos, sillones botados, poste de sisal) que afilan las garras.
- Almacenes de barrio con almacenero vigilante (luz roja = mira, verde = distraído) y comida para robar.
- Casas con puerta o ventana abierta: interior con sobras, un vaso para botar y sillón para la siesta.
- Marcos estilo WoW con retrato 3D del gato y de quien lo tiene en la mira.
- Flecha de misión (en el suelo, en el minimapa y en pantalla), gente que acaricia/persigue/espanta gatos, autos que frenan por animales chicos, barrio más poblado.
- Árboles, autos y perros rehechos; MSAA en el post-procesado; voces neuronales priorizadas (selector en Ajustes).

Sonidos reales nuevos: ESC-50 (K. J. Piczak, CC BY-NC 3.0) — lluvia, truenos, sirenas, risas, puertas, rasguños, latas, agua, vidrio.

## Voces neuronales pregrabadas

Las frases del juego (misiones, NPCs, modo GTA) se graban offline con [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) y se embeben como MP3 (`assets/voice/`, `voice/manifest.json`). Si cambias o agregas diálogos:

```bash
node scripts/extract-lines.mjs                 # regenera voice/lines.json
pip install kokoro-onnx lameenc soundfile
python scripts/render-voices.py <carpeta con kokoro-v1.0.int8.onnx y voices-v1.0.bin>
```

Las frases que no estén grabadas usan la voz del sistema. En Ajustes se puede elegir otra voz.

## Spotify

El widget (tecla `P`) muestra lo que suena en tu cuenta (carátula, canción, dispositivo) y lo controla vía Web API. Necesita un Client ID propio de developer.spotify.com (el widget muestra la Redirect URI a registrar). Controlar la reproducción requiere Spotify Premium.

## Controles, idioma y guardado

- Idiomas ES/EN (selector arriba a la derecha).
- Ajustes y partida se guardan en `localStorage`.
- Integración opcional con Spotify (embed) — tecla `P`.
