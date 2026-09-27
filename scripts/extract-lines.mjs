// Extracts every spoken line of the game into voice/lines.json so they can be pre-rendered with an
// offline neural TTS (scripts/render-voices.py). Keys use the same normalisation as the runtime lookup.
import fs from "node:fs";
const src = fs.readFileSync(new URL("../src/game.js", import.meta.url), "utf8");
const vt = (es, en) => ({ es, en });
// evaluate object literals from the bundle; unknown identifiers resolve to no-op functions
const known = { vt, pe: (a) => a[0], Math, String, Object, Array, JSON, RegExp };
const scope = new Proxy(known, {
  has: () => true,
  get: (t, k) => (k in t ? t[k] : k === Symbol.unscopables ? undefined : () => null),
});
const ev = (code) => new Function("scope", `with (scope) { return (${code}); }`)(scope);
const between = (start, end) => {
  const a = src.indexOf(start);
  return src.slice(a, src.indexOf(end, a));
};
const zeStart = src.indexOf("    ze = {");
const ze = ev(src.slice(zeStart, src.indexOf("\n    },\n", zeStart) + 6).replace(/^\s*ze = /, ""));
const Vd = ev(between("  var Vd = {", "\n    },\n    io = [").replace(/^\s*var Vd = /, "") + "\n    }");
const GTA = (known.GTA = ev(between("  var GTA = {", "\n  // Automatic weather").replace(/^\s*var GTA = /, "").replace(/;\s*$/, "")));
export const norm = (s) =>
  String(s).replace(/\([^)]*\)/g, "").replace(/\{[^}]*\}/g, "").replace(/\s+/g, " ").trim();
const sexOf = { gladys: "f", hugo: "m", canuto: "m", bacteria: "m", rayita: "f", flaqui: "f", iris: "f" };
const female = /^(feeder|feederPet|feederEat)$/;
const out = new Map();
const add = (lang, speaker, text, g) => {
  const t = norm(text);
  if (!t) return;
  const key = `${lang}|${t}`;
  const e = out.get(key) || { key, lang, speaker, text: t, genders: [] };
  for (const x of g) e.genders.includes(x) || e.genders.push(x);
  out.set(key, e);
};
const both = (sp) => (sexOf[sp] ? [sexOf[sp]] : female.test(sp) ? ["f"] : ["m", "f"]);
for (const [qid, q] of Object.entries(ze)) {
  const sp = q.giver || "narrator";
  for (const k of ["offer", "done"])
    if (q[k]) (add("es", sp, q[k].es, both(sp)), add("gta", sp, GTA.say(q[k].en), both(sp)));
  for (const st of q.steps || []) st.txt?.en && q.giver && add("gta", sp, GTA.say(st.txt.en), both(sp));
}
for (const [cat, lines] of Object.entries(Vd))
  for (const [es, en] of lines) (add("es", cat, es, both(cat)), add("gta", cat, GTA.say(en), both(cat)));
for (const [cat, lines] of Object.entries(GTA.lines)) for (const t of lines) add("gta", cat, t, both(cat));
const list = [...out.values()];
fs.mkdirSync(new URL("../voice", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../voice/lines.json", import.meta.url), JSON.stringify(list, null, 1) + "\n");
const clips = list.reduce((a, l) => a + l.genders.length, 0);
console.log(list.length, "lines,", clips, "clips,", list.reduce((a, l) => a + l.text.length * l.genders.length, 0), "chars");
