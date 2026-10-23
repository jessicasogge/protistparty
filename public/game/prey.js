// The bacteria in the drop: the protists' food. Each is an E. coli rod,
// drawn like Colette's offspring in PetriPals, swimming slowly and turning
// a little as it goes, always in the water. One a protist touches is
// eaten, and a new one swims in somewhere else a moment later.
//
// Positions are kept relative to the drop center, as fractions of the drop
// radius (-1 to 1), so they stay put when the window is resized.
import { GAME, PREY } from './config.js';

const SVG = 'http://www.w3.org/2000/svg';
const SPLINES = 'calcMode="spline" keyTimes="0;0.25;0.5;0.75;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"';

// One wavy flagellum, as in PetriPals: from (x, y), pointing `angle`
// degrees, `length` long, waving once every `duration`.
function flagellum(x, y, angle, length, duration) {
  const a = (angle * Math.PI) / 180;
  const [ux, uy] = [Math.cos(a), Math.sin(a)];
  const at = (t, wave) => `${(x + ux * length * t - uy * wave).toFixed(1)} ${(y + uy * length * t + ux * wave).toFixed(1)}`;
  const d = (wave) => `M${x} ${y} C${at(0.33, wave)} ${at(0.66, -wave)} ${at(1, 0)}`;
  const frames = [12, 3, -12, -3, 12].map(d).join(';');
  return `<path d="${d(12)}" stroke="#2e6b0e" stroke-width="3.5" fill="none" stroke-linecap="round">` +
    `<animate attributeName="d" dur="${duration}" repeatCount="indefinite" ${SPLINES} values="${frames}" /></path>`;
}

// A long, slim green-apple rod with flagella all around, and no face: it's
// food, not a friend.
export const ECOLI_ART = [
  [60, 80, -115, 34, '0.7s'],
  [100, 78, -90, 32, '0.64s'],
  [140, 80, -65, 34, '0.74s'],
  [60, 120, 115, 34, '0.72s'],
  [100, 122, 90, 32, '0.68s'],
  [140, 120, 65, 34, '0.7s'],
  [36, 100, 180, 32, '0.6s'],
  [164, 100, 0, 30, '0.66s'],
].map((f) => flagellum(...f)).join('') + `
  <rect x="34" y="78" width="132" height="44" rx="22" fill="#abee64" stroke="#2e6b0e" stroke-width="4" />
  <path d="M118 85 Q136 81 152 88" stroke="#effde0" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.95" />
  <circle cx="148" cy="113" r="2.8" fill="#effde0" />`;

// One bacterium's drawing. Its flagella wave, unless someone has asked for
// less motion (CSS can't pause <animate>).
function rodArt() {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '4 4 192 192');
  svg.innerHTML = ECOLI_ART;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    for (const wave of svg.querySelectorAll('animate')) wave.remove();
  }
  return svg;
}

// `count` is how many bacteria swim in the drop at a time, and `wet()`
// how much of the drop's radius is still water (drop.js).
export function makePrey({ count = PREY.count, wet = () => 1, random = Math.random } = {}) {
  const drop = document.querySelector('.drop');
  // { el, fx, fy, heading }: heading is the way it's swimming, in radians.
  const cells = [];
  // Bacteria that were eaten, each swimming back in `left` ms from now.
  let waiting = [];
  let stopped = false;

  // Somewhere in the water, and at the start, clear of the middle, where
  // she starts.
  function randomSpot(clearOfMiddle) {
    let spot;
    for (let tries = 0; tries < 50; tries++) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * wet() * 0.85;
      spot = { fx: Math.cos(angle) * distance, fy: Math.sin(angle) * distance };
      if (!clearOfMiddle || Math.hypot(spot.fx, spot.fy) >= 0.3) return spot;
    }
    return spot;
  }

  function add(clearOfMiddle = false) {
    const el = document.createElement('div');
    el.className = 'prey';
    el.style.width = `${PREY.size * 100}%`;
    el.append(rodArt());
    el.setAttribute('aria-hidden', 'true');
    // Under the protists, so they're never hidden.
    drop.prepend(el);
    const cell = { el, ...randomSpot(clearOfMiddle), heading: random() * Math.PI * 2 };
    place(cell);
    cells.push(cell);
  }

  // Put a bacterium's drawing where it is, pointing the way it's going.
  function place(cell) {
    cell.el.style.left = `${50 + cell.fx * 50}%`;
    cell.el.style.top = `${50 + cell.fy * 50}%`;
    cell.el.style.setProperty('--angle', `${Math.round((cell.heading * 180) / Math.PI)}deg`);
  }

  // Swim along for `seconds`, turning a little at random. At the water's
  // edge it turns back toward the middle.
  function swim(cell, seconds) {
    cell.heading += (random() - 0.5) * 1.5 * seconds;
    cell.fx += Math.cos(cell.heading) * PREY.speed * seconds;
    cell.fy += Math.sin(cell.heading) * PREY.speed * seconds;
    const edge = wet() - PREY.radius;
    const fromCenter = Math.hypot(cell.fx, cell.fy);
    if (fromCenter > edge) {
      cell.fx *= edge / fromCenter;
      cell.fy *= edge / fromCenter;
      cell.heading = Math.atan2(-cell.fy, -cell.fx) + (random() - 0.5);
    }
    place(cell);
  }

  for (let i = 0; i < count; i++) add(true);

  return {
    // Eat every bacterium touching a circle of radius `reach` at (fx, fy),
    // all in fractions of the drop radius. Returns how many were eaten.
    eatNear(fx, fy, reach) {
      let eaten = 0;
      for (let i = cells.length - 1; i >= 0; i--) {
        const cell = cells[i];
        if (Math.hypot(cell.fx - fx, cell.fy - fy) > reach + PREY.radius) continue;
        cell.el.remove();
        cells.splice(i, 1);
        waiting.push({ left: GAME.PREY_RESPAWN_MS });
        eaten++;
      }
      return eaten;
    },

    // Move time on by `seconds`: bacteria swim, and eaten ones are
    // replaced.
    tick(seconds) {
      if (!stopped) {
        for (const cell of waiting) {
          cell.left -= seconds * 1000;
          if (cell.left <= 0) add();
        }
        waiting = waiting.filter((cell) => cell.left > 0);
      }
      for (const cell of cells) swim(cell, seconds);
    },

    // Where every bacterium is, as { fx, fy }.
    positions() {
      return cells.map(({ fx, fy }) => ({ fx, fy }));
    },

    // No new bacteria once the game is over.
    stop() {
      stopped = true;
    },
  };
}
