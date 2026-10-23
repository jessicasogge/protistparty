// The Pond Drop game loop: steer with the arrow keys or by touch, eat
// bacteria to split in two, keep out of the drying edge, and the
// level-complete, win or dried-out pop-up.
import { levelBanner } from './banner.js';
import { makeColony } from './colony.js';
import { GAME, LEVELS } from './config.js';
import { makeDrop } from './drop.js';
import { showFact } from './facts.js';
import { arrowKeys } from './keyboard.js';
import { partyBurst } from './party.js';
import { steer, touchSteering } from './touch.js';
import { track } from './track.js';

// `protistEl` is her drawing in the drop, and `makeFood(wet)` makes the
// bacteria (prey.js), given how much of the drop is still water. `level`
// is which level this is (1 to 7), `target` how many cells it takes to
// beat it, and `dryMs` how fast the drop dries.
export function playGame(protistEl, species, makeFood, {
  level = 1, target = LEVELS[0].target, dryMs = LEVELS[0].dryMs,
} = {}) {
  const dropEl = document.querySelector('.drop');
  const counter = document.querySelector('.cell-count');
  const dropRadius = () => dropEl.clientWidth / 2;

  const drop = makeDrop({ dryMs, el: dropEl });
  const prey = makeFood(drop.wet);

  const playerMover = document.querySelector('.protist-mover');
  playerMover.classList.add('player');
  playerMover.style.width = `${species.size * 100}%`;
  const player = { x: 0, y: 0, facing: 1, mover: playerMover };
  const colony = makeColony({
    player, svg: protistEl, prey, species, target, wet: drop.wet, onChange: () => updateCounter(),
  });

  let finished = false;
  let lastTime = null;
  const keys = arrowKeys();
  // Drag with a finger anywhere on the slide, the glass around the drop
  // included (or hold a mouse button where to go).
  const touch = touchSteering(dropEl, dropEl.closest('.slide') ?? dropEl);

  // The end-of-level pop-up and its button.
  const banner = levelBanner(level);

  function updateCounter() {
    counter.textContent = `Level ${level} · ${colony.size()} / ${target} cells`;
  }

  function step(time) {
    const seconds = lastTime === null ? 0 : Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    const radius = dropRadius();

    drop.tick(seconds);
    if (!finished) {
      steer(player, keys.direction(), touch.target(), GAME.SPEED * radius * seconds, GAME.ARRIVE * radius,
        touch.drag(), GAME.DRAG_SPEED * radius * seconds);
      keepInDrop(player, radius, colony.reach);
    }
    prey.tick(seconds);
    colony.step(seconds, radius, { eat: !finished });

    if (!finished && colony.size() >= target) {
      // Celebrate the moment the colony is big enough, and stop play.
      finish();
      partyBurst(playerMover, { big: level === LEVELS.length });
      setTimeout(showWin, 400);
    } else if (!finished && drop.isDry(player.x / radius, player.y / radius, colony.reach)) {
      // The drying edge has passed her: she's out on the dry glass.
      finish();
      playerMover.classList.add('dried');
      setTimeout(showDried, 600);
    }

    requestAnimationFrame(step);
  }

  function finish() {
    finished = true;
    keys.stop();
    touch.stop();
    prey.stop();
    drop.stop();
  }

  function showWin() {
    const name = protistEl.dataset.name;
    const protist = protistEl.dataset.protist;
    track(`level-complete/${protist}/level-${level}`, `${name} finished level ${level}`);
    if (level === LEVELS.length) track(`won-all-levels/${protist}`, `${name} beat every level`);
    showFact(protist, species);
    if (level < LEVELS.length) {
      banner.show(`Level ${level} complete!`, `${name} grew to ${target} cells!`,
        `Play level ${level + 1}`, { next: level + 1 });
    } else {
      banner.show('You won!', `You beat all ${LEVELS.length} levels: ${name} grew to ${target} cells!`,
        'Play again', { next: 1 });
    }
  }

  function showDried() {
    const name = protistEl.dataset.name;
    const protist = protistEl.dataset.protist;
    track(`dried-out/${protist}/level-${level}`, `${name} dried out on level ${level}`);
    showFact(protist, species);
    banner.show('Dried out!', `The drop dried up around ${name}. Keep away from the drying edge!`,
      'Try again', { next: level });
  }

  // Keep the how-to-play target in step with the real one.
  for (const el of document.querySelectorAll('.target-cells')) el.textContent = target;
  updateCounter();
  requestAnimationFrame(step);
}

// Keep her on the slide, inside the drop's full outline. The drying edge
// doesn't stop her: crossing it is how she dries out. `reach` is how far
// she reaches from her center, in drop radii.
export function keepInDrop(player, radius, reach) {
  const limit = Math.max(0, radius - reach * radius);
  const fromCenter = Math.hypot(player.x, player.y);
  if (fromCenter <= limit) return;
  player.x *= limit / fromCenter;
  player.y *= limit / fromCenter;
}
