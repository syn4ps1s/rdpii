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

## Controles, idioma y guardado

- Idiomas ES/EN (selector arriba a la derecha).
- Ajustes y partida se guardan en `localStorage`.
- Integración opcional con Spotify (embed) — tecla `P`.
