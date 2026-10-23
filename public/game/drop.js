// The drop of pond water under the coverslip, drying from its edge. After
// GAME.DRY_DELAY_MS its edge creeps in, evenly, until only GAME.WET_MIN of
// its radius is still water (it takes the level's `dryMs` to get there),
// and stays there. Outside the water is dry glass.
//
// The water's size is the --wet custom property on the drop (styles.css
// draws it).
import { GAME } from './config.js';

export function makeDrop({ dryMs, el = document.querySelector('.drop') }) {
  let elapsed = 0; // ms since the level started
  let stopped = false;

  const drop = {
    // How much of the drop's radius is still water, from 1 (all of it) down
    // to GAME.WET_MIN.
    wet() {
      const drying = Math.max(0, elapsed - GAME.DRY_DELAY_MS) / dryMs;
      return Math.max(GAME.WET_MIN, 1 - (1 - GAME.WET_MIN) * drying);
    },

    // Move time on by `seconds`.
    tick(seconds) {
      if (!stopped) elapsed += seconds * 1000;
      el.style.setProperty('--wet', drop.wet().toFixed(4));
    },

    // Whether a circle at (fx, fy) reaching `reach` (all in fractions of the
    // drop radius) is out on the dry glass: its middle is more than
    // GAME.DRY_SHARE of its reach past the water's edge.
    isDry(fx, fy, reach) {
      return Math.hypot(fx, fy) > drop.wet() + reach * GAME.DRY_SHARE;
    },

    // Stop drying, once the level is over.
    stop() {
      stopped = true;
    },
  };
  drop.tick(0);
  return drop;
}
