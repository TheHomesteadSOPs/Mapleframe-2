# Gemhollow

*Shards of the Ember Crown* — a match-3 RPG battler. Open `index.html` in a browser (no build step, no external assets).

## Gameplay
- Match gems: **skulls** damage the enemy, **Fire / Air / Water / Earth** gems fill mana for spells, **stars** give XP, Earth gems drop coins.
- 4+ matches give an **extra turn**; cascades hit harder.
- 8 spells (Fireball, Heal, Frost, Smite, Wildfire, Cleanse, Stoneskin, Meteor), upgradeable to level 5 in the shop.
- 10 enemies with special moves (steal, mana drain, stun, poison, shield, life drain, fire breath…) and a boss every 5th stage. Enemies telegraph their next special.
- Shop between battles: potions, max HP, skull damage, spell levels.
- Progress (level, XP, coins, stage, upgrades) is saved in `localStorage` and, on CrazyGames, via the SDK data module.
- First battle includes a short contextual tutorial; replay it from Settings.

## Controls
Click/tap or drag to swap. Keyboard: arrows move the cursor, Space/Enter grabs a gem, then an arrow swaps it; `1`–`8` cast spells, `H` health potion, `M` mana potion, `Esc` menu.
Settings: volume sliders, reduce motion & screen shake (also follows `prefers-reduced-motion`), high-contrast HUD text.

## Tech
Single-file HTML/canvas game. Music (10 drum & bass tracks, one per player level) and sound effects are synthesized with Web Audio.

## CrazyGames
- The SDK v3 script is loaded from `sdk.crazygames.com`; the game runs without it (calls are guarded).
- `gameplayStart/Stop` wrap battles and menus; midgame ads run before the next battle / retry, with audio muted during ads.
- Store art and a listing draft are in `store/`.

## Testing hook
Add `?fast` to the URL to skip animation waits (used for automated balance simulation).

## Scripts (`scripts/`)
- `build.mjs` — minifies to `dist/index.html` and `dist/gemhollow.zip` (`npm i --no-save esbuild && node scripts/build.mjs`). Targets Chrome 80+, Edge 88+, Firefox 78+, Safari 15+.
- `edge-cases.cjs` — headless checks: no-move reshuffle, single win/defeat on cascades, input while animating, reload mid-battle, blocked/corrupt storage.
- `balance-sim.cjs <skill 0-1> <runs> <stages>` — bot plays whole runs (uses `?fast`) and prints win rate / lowest HP per stage.
- `display-scales.cjs` — checks the board fills the canvas at several window sizes and display pixel ratios.
- `perf-profile.cjs <cpu-throttle>` — frame-time profile on an emulated phone with CPU throttling.
(Test scripts need `playwright` and Chromium.)

## Performance notes
Gems are pre-rendered sprites, the board background/vignette are cached layers, the board only redraws while something is animating, portraits animate at ~20fps, and the canvas resolution follows the displayed size. If frame times stay slow the game lowers canvas resolution and then drops full-board match effects automatically.
