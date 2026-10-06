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
