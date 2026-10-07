# Custom character art

Put square portraits here named after the character: `hero`, `slime`, `goblin`, `wolf`, `bandit`, `orc`,
`skeleton`, `troll`, `golem`, `wraith`, `dragon` (`.webp`, `.png` or `.jpg`, ideally 512×512).
Any character without an image keeps the built-in vector art.

Easiest way to make them with an image model through OpenRouter:

```bash
export OPENROUTER_API_KEY=sk-or-...           # keep your key out of git and out of chat
node scripts/generate-art.mjs --list-models   # find the exact id of the GPT image model you want
node scripts/generate-art.mjs --model <id>    # generates every missing character into art/
node scripts/generate-art.mjs --only goblin --force   # redo one you don't like
```

After running, `index.html` lists the images it found automatically. Run `npm run build` to include `art/` in `dist/` and the zip.
You can also drop in images from any other tool and run `node scripts/generate-art.mjs --sync`.
