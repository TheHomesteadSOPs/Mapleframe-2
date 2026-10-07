// Generates character portraits with an image model through OpenRouter and wires them into the game.
//
//   export OPENROUTER_API_KEY=sk-or-...            (never commit your key)
//   node scripts/generate-art.mjs --list-models     find image-capable model ids (look for gpt / gemini image models)
//   node scripts/generate-art.mjs                   generate every character into art/
//   node scripts/generate-art.mjs --only goblin,wolf --force --model openai/gpt-5-image
//   node scripts/generate-art.mjs --sync            just re-scan art/ and update the list inside index.html
//
// Options: --model <id> (or env ART_MODEL)   --only a,b   --force (overwrite)   --dry-run (print prompts)
//          --no-image-config (skip the aspect-ratio hint if your model rejects it)
// Needs Node 18+. If ffmpeg is installed, images are shrunk to 512px WebP (small download); otherwise PNGs are kept.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";

const BASE = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const KEY = process.env.OPENROUTER_API_KEY;
const args = process.argv.slice(2);
const flag = n => args.includes("--" + n);
const opt = n => { const i = args.indexOf("--" + n); return i >= 0 ? args[i + 1] : undefined; };
const MODEL = opt("model") || process.env.ART_MODEL || "openai/gpt-5-image";

const STYLE = "Stylized fantasy game character portrait for a match-3 RPG. Bold clean outlines, rich saturated colors, soft rim lighting, slightly cartoony proportions, centered chest-up composition that fills a square frame, simple dark moody background with a subtle glow in the character's theme color, high detail, no text, no watermark, no border.";
const CHARACTERS = {
  hero: "A young armored wanderer knight: steel helmet with a red plume and visor, silver breastplate, blue shield with a gold gem emblem, raised longsword, red cape. Heroic, friendly. Theme color blue.",
  slime: "A cute but mischievous green gelatinous slime blob with big glossy eyes and a small smile, translucent with bright highlights, a tiny droplet on top. Theme color emerald green.",
  goblin: "A snarling green goblin with large pointy ears, red slit eyes, jagged fangs, a ragged brown tunic and a small dagger. Theme color green.",
  wolf: "A fierce gray wolf head with a thick fur ruff, glowing yellow eyes, bared fangs and a scar over one eye. Theme color steel blue.",
  bandit: "A hooded masked bandit: dark hood, glowing amber eyes, red cloth mask over the lower face, leather belt with a gold buckle, twin daggers. Theme color crimson.",
  orc: "An imposing orc warlord boss: green skin, huge tusks, spiked steel pauldrons, a battle axe, red eyes, war paint and a scowl. Theme color dark green.",
  skeleton: "An undead skeleton warrior with glowing cyan eyes in the skull, exposed ribcage, a rusty sword and tattered remains. Theme color cyan.",
  troll: "A hulking mountain troll with mossy brown-gray skin, small angry yellow eyes, a big nose and tusks, holding a spiked wooden club. Theme color earthy brown.",
  golem: "A stone golem built from gray boulders with glowing orange rune eyes, patches of moss, massive fists and faintly glowing cracks. Theme color orange.",
  wraith: "A ghostly hooded wraith in tattered violet robes, a void for a face with glowing cyan eyes, wisps of smoke, holding a curved scythe. Theme color purple.",
  dragon: "A fearsome red elder dragon boss: head with golden slit eyes, curved ivory horns, rows of fangs, smoke curling from the nostrils, glowing embers, wings spread behind. Theme color red-orange.",
};

const headers = () => ({ Authorization: "Bearer " + KEY, "Content-Type": "application/json", "HTTP-Referer": "https://github.com/TheHomesteadSOPs/Mapleframe-2", "X-Title": "Gemhollow art" });

async function listModels() {
  const r = await fetch(BASE + "/models", { headers: KEY ? headers() : {} });
  if (!r.ok) throw new Error("models request failed: " + r.status);
  const { data } = await r.json();
  const img = data.filter(m => (m.architecture?.output_modalities || []).includes("image"));
  console.log("Image-capable models:\n" + img.map(m => "  " + m.id + (m.pricing?.image ? "   (image: $" + m.pricing.image + ")" : "")).join("\n"));
}

function extractImage(json) {
  const msg = json.choices?.[0]?.message || {};
  const fromImages = msg.images?.[0]?.image_url?.url || msg.images?.[0]?.url;
  const text = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content || "");
  const m = (fromImages || "").match(/^data:image\/\w+;base64,(.+)$/) || text.match(/data:image\/\w+;base64,([A-Za-z0-9+/=]+)/);
  if (m) return Buffer.from(m[1], "base64");
  const url = fromImages && fromImages.startsWith("http") ? fromImages : null;
  return url;   // a plain URL is downloaded by the caller
}

async function generate(key, desc) {
  const body = { model: MODEL, modalities: ["image", "text"], messages: [{ role: "user", content: `${STYLE}\n\nSubject: ${desc}` }] };
  if (!flag("no-image-config")) body.image_config = { aspect_ratio: "1:1" };
  for (let attempt = 1; attempt <= 3; attempt++) {
    let r = await fetch(BASE + "/chat/completions", { method: "POST", headers: headers(), body: JSON.stringify(body) });
    if (r.status === 400 && body.image_config) { delete body.image_config; r = await fetch(BASE + "/chat/completions", { method: "POST", headers: headers(), body: JSON.stringify(body) }); }
    if (r.ok) {
      const out = extractImage(await r.json());
      if (out instanceof Buffer) return out;
      if (typeof out === "string") return Buffer.from(await (await fetch(out)).arrayBuffer());
      console.log(`  ${key}: response had no image (attempt ${attempt})`);
    } else console.log(`  ${key}: HTTP ${r.status} ${(await r.text()).slice(0, 200)} (attempt ${attempt})`);
    await new Promise(s => setTimeout(s, 1500 * attempt));
  }
  throw new Error("giving up on " + key);
}

function toWebp(png, out) {   // optional shrink: needs ffmpeg with libwebp
  const tmp = out.replace(/\.webp$/, ".src.png"); writeFileSync(tmp, png);
  const r = spawnSync("ffmpeg", ["-y", "-loglevel", "error", "-i", tmp, "-vf", "scale=512:512:flags=lanczos", "-quality", "86", out]);
  rmSync(tmp, { force: true }); return r.status === 0 && existsSync(out);
}

function sync() {   // keep the list of available art inside index.html in step with the art/ folder
  const files = existsSync("art") ? readdirSync("art").filter(f => /\.(webp|png|jpe?g)$/i.test(f)).sort().map(f => "art/" + f) : [];
  const html = readFileSync("index.html", "utf8");
  const next = html.replace(/const ART_FILES=\[[^\]]*\];/, "const ART_FILES=" + JSON.stringify(files) + ";");
  if (next === html && !/const ART_FILES=/.test(html)) throw new Error("ART_FILES line not found in index.html");
  writeFileSync("index.html", next); console.log("index.html now lists " + files.length + " art file(s).");
}

async function main() {
  if (flag("sync")) return sync();
  if (flag("list-models")) return listModels();
  const only = opt("only")?.split(",").map(s => s.trim()).filter(Boolean);
  const todo = Object.entries(CHARACTERS).filter(([k]) => !only || only.includes(k));
  if (flag("dry-run")) { for (const [k, d] of todo) console.log(`# ${k}\n${STYLE}\nSubject: ${d}\n`); return; }
  if (!KEY) { console.error("Set OPENROUTER_API_KEY first (export OPENROUTER_API_KEY=sk-or-...)"); process.exit(1); }
  mkdirSync("art", { recursive: true });
  console.log(`Model: ${MODEL}`);
  for (const [k, d] of todo) {
    const have = ["webp", "png"].some(e => existsSync(`art/${k}.${e}`));
    if (have && !flag("force")) { console.log(`- ${k}: exists (use --force to redo)`); continue; }
    process.stdout.write(`- ${k}: generating... `);
    try {
      const png = await generate(k, d);
      if (toWebp(png, `art/${k}.webp`)) { rmSync(`art/${k}.png`, { force: true }); console.log("saved art/" + k + ".webp"); }
      else { writeFileSync(`art/${k}.png`, png); rmSync(`art/${k}.webp`, { force: true }); console.log("saved art/" + k + ".png"); }
    } catch (e) { console.log("FAILED: " + e.message); }
  }
  sync();
}
main().catch(e => { console.error(e.message); process.exit(1); });
