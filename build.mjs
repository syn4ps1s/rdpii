// Builds dist/index.html: a single self-contained page (fonts, sounds, CSS and JS inlined),
// the same shape as the published claude.ai artifact.
//   node build.mjs            one build
//   node build.mjs --minify   minify game.js with esbuild (smaller artifact)
//   node build.mjs --watch --serve   rebuild on change + serve on http://localhost:5173
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const r = (...p) => path.join(ROOT, ...p);
const args = new Set(process.argv.slice(2));

async function build() {
  const t0 = Date.now();
  const fonts = fs
    .readFileSync(r("src/fonts.css"), "utf8")
    .replace(/url\(\.\.\/assets\/fonts\/([^)]+)\)/g, (_, f) =>
      `url(data:font/woff2;base64,${fs.readFileSync(r("assets/fonts", f)).toString("base64")})`,
    );
  const manifest = JSON.parse(fs.readFileSync(r("assets/sounds/manifest.json"), "utf8"));
  const snd = {};
  for (const [k, files] of Object.entries(manifest))
    snd[k] = files.map((f) => `data:audio/mpeg;base64,${fs.readFileSync(r("assets/sounds", f)).toString("base64")}`);

  let js = fs.readFileSync(r("src/game.js"), "utf8");
  if (args.has("--minify")) {
    const { transform } = await import("esbuild");
    js = (await transform(js, { minify: true, legalComments: "inline" })).code;
  }
  const css = fs.readFileSync(r("src/styles.css"), "utf8");
  const body = fs.readFileSync(r("src/body.html"), "utf8");
  // "</script" inside the JS would close the tag early.
  const safe = (s) => s.replace(/<\/script/gi, "<\\/script");

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Red Dead Paw II</title>
<style>
${fonts}${css}</style>
</head>
<body>
${body}<script>window.__SND=${safe(JSON.stringify(snd))};</script>
<script>
${safe(js)}</script>
</body>
</html>
`;
  fs.mkdirSync(r("dist"), { recursive: true });
  fs.writeFileSync(r("dist/index.html"), html);
  console.log(`dist/index.html ${(html.length / 1048576).toFixed(2)} MB in ${Date.now() - t0} ms`);
}

await build();

if (args.has("--watch")) {
  let timer;
  for (const dir of ["src", "assets"])
    fs.watch(r(dir), { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(() => build().catch((e) => console.error(e)), 150);
    });
  console.log("watching src/ and assets/");
}

if (args.has("--serve")) {
  const port = Number(process.env.PORT) || 5173;
  http
    .createServer((req, res) => {
      const p = decodeURIComponent(req.url.split("?")[0]);
      const file = r("dist", p === "/" ? "index.html" : p);
      if (!file.startsWith(r("dist")) || !fs.existsSync(file)) return res.writeHead(404).end();
      res.writeHead(200, { "content-type": file.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    })
    .listen(port, () => console.log(`http://localhost:${port}`));
}
