// The colony: the protist the player steers, and every daughter she and
// her daughters have split off. Every cell eats the bacteria it touches.
// Each meal waits in a food vacuole (a dot inside the cell, styles.css),
// and once a cell has eaten GAME.MEALS_PER_DIVISION it splits in two by
// binary fission: the daughter slides off, slows down and crawls about on
// her own, eating as she goes.
//
// Positions are in px from the drop center, like the steering in touch.js.
import { GAME } from './config.js';

// `player` is { x, y, facing, mover }, the protist the player steers. `svg`
// is her drawing, copied for each daughter. `prey` is the bacteria
// (prey.js) and `wet()` how much of the drop is still water (drop.js).
// `target` is the size the colony stops dividing at. `onChange` is called
// with the colony's size whenever a cell divides.
export function makeColony({
  player, svg, prey, species, target, wet = () => 1, random = Math.random, onChange = () => {},
}) {
  const daughters = []; // { x, y, vx, vy, heading, meals, sinceDivision, mover }
  player.meals = 0;
  player.sinceDivision = Infinity;
  // How close counts as touching, for her and for a daughter (drop radii).
  const reach = species.size * GAME.REACH_SHARE;
  const daughterReach = reach * GAME.DAUGHTER_SCALE;
  const daughterWidth = `${species.size * GAME.DAUGHTER_SCALE * 100}%`;

  const colony = {
    player,
    daughters,
    reach,
    // How many cells are in the colony: her and her daughters.
    size: () => 1 + daughters.length,

    // One frame. `eat` is false once the level is over.
    step(seconds, radius, { eat = true } = {}) {
      const before = colony.size();
      for (let i = daughters.length - 1; i >= 0; i--) crawl(daughters[i], seconds, radius);
      for (const cell of [player, ...daughters]) {
        cell.sinceDivision += seconds * 1000;
        if (eat) feed(cell, cell === player ? reach : daughterReach, radius);
      }
      for (const cell of [player, ...daughters]) place(cell);
      if (colony.size() > before) onChange(colony.size());
    },
  };

  // Eat any bacteria the cell touches, and split once it's eaten enough.
  function feed(cell, cellReach, radius) {
    cell.meals += prey.eatNear(cell.x / radius, cell.y / radius, cellReach);
    if (cell.meals >= GAME.MEALS_PER_DIVISION && cell.sinceDivision >= GAME.DIVIDE_MS &&
        colony.size() < target) {
      cell.meals -= GAME.MEALS_PER_DIVISION;
      cell.sinceDivision = 0;
      daughters.push(newDaughter(cell, radius));
    }
    // One dot per meal waiting to go toward the next split.
    cell.mover.dataset.meals = String(Math.min(cell.meals, GAME.MEALS_PER_DIVISION - 1));
  }

  // A new daughter where `mother` is, sliding off in a random direction.
  function newDaughter(mother, radius) {
    const angle = random() * Math.PI * 2;
    const speed = GAME.SPLIT_SPEED * radius;
    const daughter = {
      x: mother.x,
      y: mother.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      heading: angle,
      meals: 0,
      sinceDivision: 0,
      mover: daughterMover(svg, daughterWidth),
    };
    place(daughter);
    return daughter;
  }

  // Slow down from the split, then crawl about, turning a little at random,
  // and stay in the water: the drying edge pushes her inward.
  function crawl(cell, seconds, radius) {
    const slowdown = Math.exp(-GAME.SETTLE_RATE * seconds);
    cell.vx *= slowdown;
    cell.vy *= slowdown;
    cell.heading += (random() - 0.5) * 2 * seconds;
    const pace = GAME.CRAWL_SPEED * radius;
    cell.x += (cell.vx + Math.cos(cell.heading) * pace) * seconds;
    cell.y += (cell.vy + Math.sin(cell.heading) * pace) * seconds;
    const limit = Math.max(0, (wet() - daughterReach) * radius);
    const fromCenter = Math.hypot(cell.x, cell.y);
    if (fromCenter > limit) {
      cell.x *= limit / fromCenter;
      cell.y *= limit / fromCenter;
      cell.vx = 0;
      cell.vy = 0;
      cell.heading = Math.atan2(-cell.y, -cell.x);
    }
  }

  return colony;
}

// Move a mover to where its cell is.
export function place({ x, y, mover }) {
  mover.style.transform = `translate(${x}px, ${y}px)`;
}

// A new daughter's mover, `width` wide (a share of the drop's width), with a
// copy of her drawing, added to the drop.
export function daughterMover(svg, width) {
  const mover = document.createElement('div');
  mover.className = 'protist-mover daughter';
  mover.style.width = width;
  const art = svg.cloneNode(true);
  art.removeAttribute('role');
  art.removeAttribute('aria-label');
  art.removeAttribute('hidden');
  art.setAttribute('aria-hidden', 'true');
  mover.appendChild(art);
  document.querySelector('.drop').appendChild(mover);
  return mover;
}
