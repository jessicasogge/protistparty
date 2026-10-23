// @vitest-environment jsdom
// drop.js is the drop of pond water, drying in from its edge.
import { beforeEach, describe, expect, it } from 'vitest';
import { GAME } from '../public/game/config.js';
import { makeDrop } from '../public/game/drop.js';

let el;
beforeEach(() => {
  document.body.innerHTML = '<div class="drop"></div>';
  el = document.querySelector('.drop');
});

describe('the drying drop', () => {
  it('starts full, and says so on the page', () => {
    const drop = makeDrop({ dryMs: 10000 });
    expect(drop.wet()).toBe(1);
    expect(el.style.getPropertyValue('--wet')).toBe('1.0000');
  });

  it("doesn't start drying for a moment", () => {
    const drop = makeDrop({ dryMs: 10000, el });
    drop.tick(GAME.DRY_DELAY_MS / 1000);
    expect(drop.wet()).toBe(1);
  });

  it('then dries evenly, down to WET_MIN over dryMs, and no further', () => {
    const drop = makeDrop({ dryMs: 10000, el });
    drop.tick(GAME.DRY_DELAY_MS / 1000 + 5);
    expect(drop.wet()).toBeCloseTo(1 - (1 - GAME.WET_MIN) / 2);
    expect(el.style.getPropertyValue('--wet')).toBe(drop.wet().toFixed(4));
    drop.tick(5);
    expect(drop.wet()).toBeCloseTo(GAME.WET_MIN);
    drop.tick(100);
    expect(drop.wet()).toBe(GAME.WET_MIN);
  });

  it('stops drying once the level is over', () => {
    const drop = makeDrop({ dryMs: 10000, el });
    drop.tick(GAME.DRY_DELAY_MS / 1000 + 2);
    const wet = drop.wet();
    drop.stop();
    drop.tick(5);
    expect(drop.wet()).toBe(wet);
  });

  it('counts a cell as dried out once its middle is well past the water', () => {
    const drop = makeDrop({ dryMs: 10000, el });
    const reach = 0.1;
    // Brushing the edge is fine.
    expect(drop.isDry(1, 0, reach)).toBe(false);
    expect(drop.isDry(0, 1 + reach * GAME.DRY_SHARE + 0.001, reach)).toBe(true);
    drop.tick(GAME.DRY_DELAY_MS / 1000 + 100); // as dry as it gets
    expect(drop.isDry(GAME.WET_MIN, 0, reach)).toBe(false);
    expect(drop.isDry(0.9, 0, reach)).toBe(true);
  });
});
