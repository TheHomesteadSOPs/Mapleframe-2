# Gemhollow

*Shards of the Ember Crown* — a match-3 RPG battler. Open `index.html` in a browser (no build step, no external assets).

Skulls damage, Fire/Air/Water/Earth gems fill mana for spells, stars give XP, 4+ matches grant extra turns.
Music (10 drum & bass tracks, one per player level) and all sound effects are synthesized with Web Audio.

## CrazyGames
- The SDK v3 script is loaded from `sdk.crazygames.com`; the game runs without it (calls are guarded).
- `gameplayStart/Stop` wrap battles; midgame ads run before the next battle and before retrying, with audio muted during ads.
- Store art and a listing draft are in `store/`.
