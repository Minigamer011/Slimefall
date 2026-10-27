# Slimefall — First Contact v0.2

Slimefall is an original, free, mobile-first Phaser 3 boss fight. This is a playable game, not a static mockup. All art is generated in-engine with original shapes; no Terraria assets are copied. No paid builder, npm installation, game server, or Replit credits required.

## Play

GitHub Pages: https://minigamer011.github.io/Slimefall/

- iPhone/Android: open in Safari/Chrome. Landscape gives the best view; portrait remains playable for testing. Touch left/right to move; up to jump; hold the star to attack; ⇄ changes weapon. Top-right buttons pause or mute.
- Keyboard: A/D or Left/Right to move; Space/Up/W to jump; hold J to attack; K changes weapons; P or Escape pauses; Enter starts or resumes.

## v0.2 changes

- Compact, always-visible boss arena (no empty walk to the fight)
- Original, improved procedural pixel character and enemy art with run frames
- Decorative night sky, layered mountains, ruins, glints, and ground detail
- Improved coyote time, buffered/variable jumps, acceleration and knockback
- A close-range sword and longer-range auto-aim star staff, damage numbers and effects
- Crowned Ooze boss cycles readable jump, ground rush and falling slime patterns
- Health hearts, boss meter, invulnerability feedback, restart/pause and victory recap
- More practical phone buttons; portrait no longer hides the game

## Hosting

This is a static project. Configure repository **Settings → Pages → Deploy from a branch → main → /(root)**. The HTML loads Phaser from cdnjs (a network connection is needed). Main sources are `index.html`, `src/style.css`, and `src/game.js`.

## Verification and limits

The JavaScript passes `node --check`. No verified gameplay/browser playtest has been completed in the authoring environment, so phone feedback is still needed to catch device-specific bugs. The gameplay is a limited vertical slice, not the finished multi-boss game. Art is procedural placeholder-quality, and there is no soundtrack. Improve this one fight with direct player testing before growing scope.
