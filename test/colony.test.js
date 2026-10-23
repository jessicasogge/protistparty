// @vitest-environment jsdom
// colony.js is her and her daughters: eating bacteria, food vacuoles, and
// splitting in two. These tests stand in for the bacteria, so each one can
// say exactly what gets eaten.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { daughterMover, makeColony, place } from '../public/game/colony.js';
import { GAME, SPECIES } from '../public/game/config.js';

const RADIUS = 100; // px
const species = SPECIES.prue;

// Stand-in bacteria: `meals` says how many each next eatNear call eats.
function fakePrey(meals = []) {
  return { eatNear: vi.fn(() => meals.shift() ?? 0) };
}

let player;
let svg;
beforeEach(() => {
  document.body.innerHTML = '<div class="drop"><div class="protist-mover player"></div></div>';
  svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Prue');
  svg.setAttribute('hidden', '');
  player = { x: 0, y: 0, facing: 1, mover: document.querySelector('.protist-mover') };
});

const colonyWith = (prey, options = {}) =>
  makeColony({ player, svg, prey, species, target: 64, random: () => 0, ...options });

describe('eating', () => {
  it('eats bacteria where she is, as far as she reaches', () => {
    const prey = fakePrey();
    player.x = 50;
    player.y = -20;
    const colony = colonyWith(prey);
    colony.step(0.016, RADIUS);
    expect(prey.eatNear).toHaveBeenCalledWith(0.5, -0.2, species.size * GAME.REACH_SHARE);
  });

  it('shows a meal waiting in a food vacuole, then splits on the next', () => {
    const onChange = vi.fn();
    const colony = colonyWith(fakePrey([1, 0, 1]), { onChange });
    colony.step(0.016, RADIUS);
    expect(player.mover.dataset.meals).toBe('1');
    expect(colony.size()).toBe(1);
    colony.step(0.016, RADIUS); // nothing to eat
    expect(colony.size()).toBe(1);
    colony.step(0.016, RADIUS);
    expect(colony.size()).toBe(2);
    expect(player.mover.dataset.meals).toBe('0');
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('waits a moment between splits, however much she eats', () => {
    const colony = colonyWith(fakePrey([2, 2]));
    colony.step(0.016, RADIUS);
    expect(colony.size()).toBe(2);
    colony.step(0.016, RADIUS);
    // She's eaten enough again, but it's too soon (and her daughter ate nothing).
    expect(colony.size()).toBe(2);
    expect(player.mover.dataset.meals).toBe(String(GAME.MEALS_PER_DIVISION - 1));
    colony.step(GAME.DIVIDE_MS / 1000, RADIUS);
    expect(colony.size()).toBe(3);
  });

  it('stops splitting once the colony reaches the target', () => {
    const colony = colonyWith(fakePrey([2, 2, 2, 2]), { target: 2 });
    colony.step(0.016, RADIUS);
    colony.step(1, RADIUS);
    expect(colony.size()).toBe(2);
  });

  it("doesn't eat once the level is over", () => {
    const prey = fakePrey([2]);
    const colony = colonyWith(prey);
    colony.step(0.016, RADIUS, { eat: false });
    expect(prey.eatNear).not.toHaveBeenCalled();
    expect(colony.size()).toBe(1);
  });
});

describe('her daughters', () => {
  it('are smaller, faceless copies of her drawing, hidden from screen readers', () => {
    const colony = colonyWith(fakePrey([2]));
    colony.step(0.016, RADIUS);
    const [daughter] = colony.daughters;
    expect(daughter.mover.className).toBe('protist-mover daughter');
    expect(daughter.mover.style.width).toBe(`${species.size * GAME.DAUGHTER_SCALE * 100}%`);
    const art = daughter.mover.querySelector('svg');
    expect(art.getAttribute('aria-hidden')).toBe('true');
    expect(art.hasAttribute('role') || art.hasAttribute('aria-label') || art.hasAttribute('hidden')).toBe(false);
    expect(document.querySelectorAll('.drop .protist-mover')).toHaveLength(2);
  });

  it('eat and split on their own', () => {
    // Her split, then her daughter eats twice (she eats nothing in between).
    const prey = fakePrey([2, 0, 2]);
    const colony = colonyWith(prey);
    colony.step(0.016, RADIUS);
    colony.step(GAME.DIVIDE_MS / 1000, RADIUS);
    expect(colony.size()).toBe(3);
    expect(prey.eatNear).toHaveBeenLastCalledWith(
      expect.any(Number), expect.any(Number), species.size * GAME.REACH_SHARE * GAME.DAUGHTER_SCALE);
  });

  it('slide off after a split, then slow to a crawl', () => {
    const colony = colonyWith(fakePrey([2]));
    colony.step(0.016, RADIUS);
    const [daughter] = colony.daughters;
    colony.step(0.1, RADIUS);
    const early = daughter.x;
    expect(early).toBeGreaterThan(0); // random() = 0: she slides off to the right
    for (let i = 0; i < 50; i++) colony.step(0.1, RADIUS);
    expect(Math.hypot(daughter.vx, daughter.vy)).toBeLessThan(0.01);
    expect(daughter.mover.style.transform).toBe(`translate(${daughter.x}px, ${daughter.y}px)`);
  });

  it('stay in the water as the drop dries', () => {
    let wet = 1;
    const colony = colonyWith(fakePrey([2]), { wet: () => wet, random: Math.random });
    colony.step(0.016, RADIUS);
    const [daughter] = colony.daughters;
    daughter.x = 90;
    daughter.y = 0;
    wet = 0.5;
    colony.step(0.016, RADIUS);
    const limit = (0.5 - species.size * GAME.REACH_SHARE * GAME.DAUGHTER_SCALE) * RADIUS;
    expect(Math.hypot(daughter.x, daughter.y)).toBeCloseTo(limit);
    expect(daughter.vx).toBe(0);
    // Even if there's barely any water at all.
    wet = 0;
    colony.step(0.016, RADIUS);
    expect(Math.hypot(daughter.x, daughter.y)).toBe(0);
  });
});

describe('place and daughterMover', () => {
  it('moves a mover to its cell', () => {
    const mover = document.createElement('div');
    place({ x: 3, y: -4, mover });
    expect(mover.style.transform).toBe('translate(3px, -4px)');
  });

  it('adds a new mover to the drop', () => {
    const mover = daughterMover(svg, '5%');
    expect(mover.parentElement.className).toBe('drop');
    expect(mover.style.width).toBe('5%');
  });
});
