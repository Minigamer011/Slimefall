# Slimefall — First Contact (prototype v0.1)

Original Terraria-inspired boss-rush platformer vertical slice. Made with **Phaser 3.86**.

## Phone-first play

After publishing to GitHub Pages, open the site in Safari or Chrome and rotate the phone to landscape. Touch left/right to move, up to jump, star to attack, and arrows to switch between melee and magic. The pause icon is in the top-right. To play on a computer, use A/D or arrow keys, Space to jump, J to attack, K to switch weapons and P to pause.

## Hosting for $0 with GitHub Pages

1. Create a **public** repository called `Slimefall` in GitHub. GitHub Free requires a public repo for free Pages hosting.
2. Upload the **contents** of this folder (`index.html` and `src`) to its default branch, or have ChatGPT commit them with its GitHub connector.
3. Open repository **Settings → Pages**, select **Deploy from a branch**, branch **main**, folder **/(root)**, then Save.
4. GitHub will show your public game's URL on the Pages screen once its first deployment succeeds.

No npm, Replit, paid developer agents, backend, or running PC is needed. The page pulls Phaser from the public cdnjs CDN, so internet access is required. For offline play, replace the CDN link with a self-hosted Phaser file.

## What's implemented
- Actual arcade physics and platform collisions
- Coyote-time and buffered jumping; variable-height jump
- One slime boss with telegraphed jump, impact, twin shockwaves, health and retry loop
- Melee strike and ranged bolts
- Player health, invulnerability frames, hit effects, screen shake, pause/retry
- Landscape touch buttons and desktop keyboard controls
- Original procedural placeholder pixel art; no Terraria assets

## Known limitations / next milestones
- Source has passed JavaScript syntax validation, but device/browser gameplay has not yet been verified here.
- Initial scenery and boss art are placeholder quality, not finished sprites.
- No music; small optional synthesized effects only.
- Improve mobile responsiveness, art, attack collisions and boss balance from playtest feedback before adding additional bosses.

All game content here is original placeholder work and is not affiliated with Terraria or Re-Logic.