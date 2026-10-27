# Slimefall — The Verdant Crown (v0.3)

A free original mobile-first side-view pixel-art boss battle made with Phaser 3.86. Not affiliated with Re-Logic or Terraria. No assets, music, UI artwork, or source code are copied from Terraria.

## Play

Open the static GitHub Pages website on your phone and rotate to landscape for the best view. Touch arrows to move, up to jump, star to attack, ⇄ to swap weapons. Desktop: A/D or arrow keys move, Space/W/Up jump, hold J attack, K swap, P pause, Enter starts/retries.

## What's new

- Rebuilt daytime forest with sky, clouds, mountains, layered trees, flowers, pixel-tile soil, and three jumpable one-way wooden bridges.
- Redrawn original small four-frame character, big blue slime boss, baby slime enemies, and combat particles.
- Boss jump rhythm: normal, normal, short, high. Speeds up and shrinks as HP drops, triggers clearly marked teleport moves, splits to spawn mini-slimes at HP thresholds, and creates ground waves after high jumps.
- More responsive variable jump and buffered/coyote jump; melee combo and auto-aim magic, mana resource, breakable minions that can drop hearts, better feedback, pause/win/lose/retry.
- Mobile-first touch controls, sound toggle, landscape support and versioned static assets to avoid older caches.

## Architecture

`index.html` and `src/style.css` implement a responsive page and touch overlay. `src/game.js` has an original Phaser scene with procedurally generated Graphics textures, Arcade physics, UI, boss FSM and sound effects. Pure static hosting: no npm build, paid credits, backend, accounts or persistent PC.

## QA and follow-up

`node --check src/game.js` verifies parsing; actual testing needs browser/device play. Prioritize mobile Safari control tests, balancing jumping onto platforms, boss hit detection, victory and replay before adding more bosses.
