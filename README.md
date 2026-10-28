# Slimefall – Forest Art Pass v0.5

Hand-authored, original pixel art for the mobile boss-rush prototype. No external Terraria sprite assets are used. The existing game logic, physics, controls, and boss behaviors are retained from v0.4.

## What's new visually
- Native PNG pixel-art hero (six expressive animation poses), slime boss (four states), and small slime enemies.
- Full scenic pixel forest with layered blue sky, original deciduous trees, rolling mountains, distant pine forest, atmospheric haze and detailed flora.
- Decorated dirt-and-grass terrain, original textured wooden bridges, foreground leaf layers.
- Squared-off touch controls and a new ornate pixel-art menu color scheme.

## Setup

Static site: commit index.html, src/ and assets/ to the root of the `main` branch; enable GitHub Pages on main / root. No npm or Replit needed. The engine is Phaser 3.86 served by cdnjs.

## Limits

These are intentionally original sprites inspired by 2D pixel-art games, not extracted or copied from Terraria. The generated assets have been visually previewed as assembled art; full touchscreen Safari QA still requires device testing. If assets fail to load, the old procedural fallback sprites remain for characters, and the old scenery still displays.


## v0.6 scale correction
World art now uses a fine 2× pixel grid (8 logical / 16 rendered terrain tile size), slimmer forest trees, terrain detail, a smaller player silhouette, and compact hotbar / life / boss HUD, while preserving v0.5 combat. All sprite and landscape PNGs are independently authored for Slimefall; no Terraria assets are redistributed.
