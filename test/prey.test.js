// @vitest-environment jsdom
// prey.js is the bacteria in the drop: they swim, get eaten, and new ones
// swim in.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME, PREY } from '../public/game/config.js';
import { ECOLI_ART, makePrey } from '../public/game/prey.js';

beforeEach(() => {
  document.body.innerHTML = '<div class="drop"><div class="protist-mover"></div></div>';
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const drawn = () => document.querySelectorAll('.prey');

describe('the bacteria', () => {
  it('start with `count` of them, clear of the middle where she starts', () => {
    const prey = makePrey({ count: 12 });
    expect(drawn()).toHaveLength(12);
    for (const { fx, fy } of prey.positions()) expect(Math.hypot(fx, fy)).toBeGreaterThanOrEqual(0.3);
  });

  it('start with PREY.count of them unless told otherwise', () => {
    makePrey();
    expect(drawn()).toHaveLength(PREY.count);
  });

  it('are drawn as E. coli under the protists, sized and pointed the way they swim', () => {
    makePrey({ count: 1 });
    const el = drawn()[0];
    expect(el.nextElementSibling.classList.contains('protist-mover')).toBe(true);
    expect(el.style.width).toBe(`${PREY.size * 100}%`);
    expect(el.style.getPropertyValue('--angle')).toMatch(/^-?\d+deg$/);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('svg').innerHTML).toContain('#abee64');
    expect(ECOLI_ART).toContain('<animate');
  });

  it('keep still flagella for anyone who asks for less motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    makePrey({ count: 1 });
    expect(drawn()[0].querySelector('animate')).toBeNull();
  });

  it('settle for anywhere if the middle is all there is', () => {
    // Every spot it tries is dead center.
    const prey = makePrey({ count: 1, random: () => 0 });
    expect(prey.positions()).toEqual([{ fx: 0, fy: 0 }]);
  });

  it('get eaten when touched, and new ones swim in a moment later', () => {
    const prey = makePrey({ count: 3 });
    const [first] = prey.positions();
    expect(prey.eatNear(first.fx, first.fy, 0.01)).toBe(1);
    expect(drawn()).toHaveLength(2);
    expect(prey.eatNear(5, 5, 0.01)).toBe(0); // nothing out there
    prey.tick(GAME.PREY_RESPAWN_MS / 1000 - 0.01);
    expect(drawn()).toHaveLength(2);
    prey.tick(0.02);
    expect(drawn()).toHaveLength(3);
  });

  it("aren't replaced once the game is over", () => {
    const prey = makePrey({ count: 2 });
    const [first] = prey.positions();
    prey.eatNear(first.fx, first.fy, 0.01);
    prey.stop();
    prey.tick(10);
    expect(drawn()).toHaveLength(1);
  });

  it('swim about, but only in the water', () => {
    let wet = 1;
    const prey = makePrey({ count: 10, wet: () => wet });
    const before = prey.positions();
    prey.tick(0.5);
    expect(prey.positions()).not.toEqual(before);
    wet = 0.5;
    for (let i = 0; i < 20; i++) prey.tick(0.1);
    for (const { fx, fy } of prey.positions()) expect(Math.hypot(fx, fy)).toBeLessThanOrEqual(0.5 + 1e-9);
  });
});
