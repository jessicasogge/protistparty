// @vitest-environment jsdom
// game.js runs a level of Pond Drop: steer, eat bacteria and split, keep out
// of the drying edge, and show the level-complete, win or dried-out pop-up.
// These tests load the real pond drop page into jsdom and stand in for the
// colony, steering and effects, so each test can say exactly what happens
// ("the colony has 4 cells") and then check what the player sees.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME, LEVELS, SPECIES } from '../public/game/config.js';

const fake = vi.hoisted(() => ({ colony: null, keys: [0, 0] }));

vi.mock('../public/game/colony.js', () => ({ makeColony: vi.fn(() => fake.colony) }));
vi.mock('../public/game/keyboard.js', () => ({
  arrowKeys: vi.fn(() => ({ direction: () => fake.keys, stop: vi.fn() })),
}));
vi.mock('../public/game/touch.js', async (importActual) => ({
  steer: (await importActual()).steer,
  touchSteering: vi.fn(() => ({ target: () => null, drag: () => [0, 0], stop: vi.fn() })),
}));
vi.mock('../public/game/party.js', () => ({ partyBurst: vi.fn() }));
vi.mock('../public/game/track.js', () => ({ track: vi.fn() }));

const { keepInDrop, playGame } = await import('../public/game/game.js');
const { makeColony } = await import('../public/game/colony.js');
const { partyBurst } = await import('../public/game/party.js');
const { track } = await import('../public/game/track.js');

// (jsdom changes import.meta.url to a web address, so find the file from the project folder.)
const page = readFileSync(resolve(process.cwd(), 'public/pond-drop.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));

let frames; // the animation frames waiting to run
let prey;
let location;
let wetGiven; // what the game told the bacteria about the water

function makeFakeColony() {
  let size = 1;
  return {
    size: () => size,
    setSize(n) { size = n; },
    reach: 0.1,
    step: vi.fn(),
  };
}

// Start a level as Amy and return the pop-up.
function start({ level = 1, target = LEVELS[level - 1].target, dryMs = LEVELS[level - 1].dryMs } = {}) {
  const protistEl = document.createElement('div');
  protistEl.dataset.protist = 'amy';
  protistEl.dataset.name = 'Amy';
  const makeFood = (wet) => {
    wetGiven = wet;
    return prey;
  };
  playGame(protistEl, SPECIES.amy, makeFood, { level, target, dryMs });
  return document.querySelector('.win-banner');
}

// Run the waiting animation frames, `seconds` apart.
function runFrames(count = 1, seconds = 0.016) {
  for (let i = 0; i < count; i++) {
    const waiting = frames;
    frames = [];
    const now = (runFrames.time += seconds * 1000);
    for (const frame of waiting) frame(now);
  }
}

beforeEach(() => {
  document.body.outerHTML = body;
  // jsdom has no layout, so give the drop a size: 200px across.
  Object.defineProperty(document.querySelector('.drop'), 'clientWidth', { value: 200 });
  // Fake timers first: they bring their own requestAnimationFrame.
  vi.useFakeTimers();
  frames = [];
  runFrames.time = 0;
  vi.stubGlobal('requestAnimationFrame', (callback) => frames.push(callback));
  location = { href: 'http://localhost/pond-drop.html?level=1' };
  vi.stubGlobal('location', location);
  fake.colony = makeFakeColony();
  fake.keys = [0, 0];
  prey = { tick: vi.fn(), stop: vi.fn() };
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('starting a level', () => {
  it('shows the level and the colony size under the drop', () => {
    start({ level: 3 });
    expect(document.querySelector('.cell-count').textContent).toBe('Level 3 · 1 / 16 cells');
    expect(document.querySelector('.target-cells').textContent).toBe('16');
  });

  it('sizes her, and hands the colony and the bacteria the drying drop', () => {
    start();
    const mover = document.querySelector('.protist-mover');
    expect(mover.classList.contains('player')).toBe(true);
    expect(mover.style.width).toBe(`${SPECIES.amy.size * 100}%`);
    const { wet, target, prey: given } = makeColony.mock.calls[0][0];
    expect(wet()).toBe(1);
    expect(wetGiven()).toBe(1);
    expect(target).toBe(4);
    expect(given).toBe(prey);
  });

  it('updates the count when the colony grows', () => {
    start();
    fake.colony.setSize(2);
    makeColony.mock.calls[0][0].onChange();
    expect(document.querySelector('.cell-count').textContent).toBe('Level 1 · 2 / 4 cells');
  });
});

describe('playing', () => {
  it('moves her with the arrow keys, and moves the bacteria and the colony along', () => {
    start();
    fake.keys = [1, 0];
    runFrames(3);
    const player = makeColony.mock.calls[0][0].player;
    expect(player.x).toBeGreaterThan(0);
    expect(prey.tick).toHaveBeenCalled();
    expect(fake.colony.step).toHaveBeenLastCalledWith(expect.any(Number), 100, { eat: true });
  });

  it('dries the drop as time goes by', () => {
    start();
    runFrames(Math.ceil(GAME.DRY_DELAY_MS / 50) + 40, 0.05);
    expect(wetGiven()).toBeLessThan(1);
    expect(Number(document.querySelector('.drop').style.getPropertyValue('--wet'))).toBeLessThan(1);
  });
});

describe('growing the colony', () => {
  it('celebrates, stops play and says the level is complete', () => {
    const banner = start();
    fake.colony.setSize(4);
    runFrames();
    expect(partyBurst).toHaveBeenCalledWith(document.querySelector('.protist-mover'), { big: false });
    expect(prey.stop).toHaveBeenCalled();
    runFrames();
    expect(fake.colony.step).toHaveBeenLastCalledWith(expect.any(Number), 100, { eat: false });
    expect(banner.hidden).toBe(true);
    vi.advanceTimersByTime(400);
    expect(banner.hidden).toBe(false);
    expect(banner.querySelector('h2').textContent).toBe('Level 1 complete!');
    expect(banner.querySelector('.win-message').textContent).toBe('Amy grew to 4 cells!');
    expect(banner.querySelector('.play-again').textContent).toBe('Play level 2');
    expect(banner.querySelector('.fun-fact').hidden).toBe(false);
    expect(track).toHaveBeenCalledWith('level-complete/amy/level-1', 'Amy finished level 1');
    banner.querySelector('.play-again').click();
    expect(location.href).toBe('http://localhost/pond-drop.html?level=2');
  });

  it('celebrates big after the last level, and starts over from level 1', () => {
    const banner = start({ level: LEVELS.length });
    fake.colony.setSize(256);
    runFrames();
    expect(partyBurst).toHaveBeenCalledWith(expect.anything(), { big: true });
    vi.advanceTimersByTime(400);
    expect(banner.querySelector('h2').textContent).toBe('You won!');
    expect(banner.querySelector('.win-message').textContent)
      .toBe('You beat all 7 levels: Amy grew to 256 cells!');
    expect(track).toHaveBeenCalledWith('won-all-levels/amy', 'Amy beat every level');
    banner.querySelector('.play-again').click();
    expect(location.href).toBe('http://localhost/pond-drop.html?level=1');
  });
});

describe('drying out', () => {
  it('ends the level when the drying edge passes her, and lets her try again', () => {
    const banner = start({ level: 2 });
    const player = makeColony.mock.calls[0][0].player;
    // Sit her right at the rim and let the drop dry past her.
    player.x = 95;
    runFrames(Math.ceil(GAME.DRY_DELAY_MS / 50) + 600, 0.05);
    const mover = document.querySelector('.protist-mover');
    expect(mover.classList.contains('dried')).toBe(true);
    expect(prey.stop).toHaveBeenCalled();
    expect(partyBurst).not.toHaveBeenCalled();
    vi.advanceTimersByTime(600);
    expect(banner.hidden).toBe(false);
    expect(banner.querySelector('h2').textContent).toBe('Dried out!');
    expect(banner.querySelector('.win-message').textContent)
      .toBe('The drop dried up around Amy. Keep away from the drying edge!');
    expect(banner.querySelector('.play-again').textContent).toBe('Try again');
    expect(track).toHaveBeenCalledWith('dried-out/amy/level-2', 'Amy dried out on level 2');
    banner.querySelector('.play-again').click();
    expect(location.href).toBe('http://localhost/pond-drop.html?level=2');
  });

  it("doesn't dry her out in the middle of the drop", () => {
    const banner = start();
    runFrames(Math.ceil(GAME.DRY_DELAY_MS / 50) + 2000, 0.05);
    vi.advanceTimersByTime(1000);
    expect(banner.hidden).toBe(true);
  });
});

describe('keepInDrop', () => {
  it('leaves her alone inside the drop', () => {
    const player = { x: 10, y: 20 };
    keepInDrop(player, 100, 0.1);
    expect(player).toEqual({ x: 10, y: 20 });
  });

  it('slides her back along the rim of the whole drop', () => {
    const player = { x: 300, y: 0 };
    keepInDrop(player, 100, 0.1);
    expect(player.x).toBeCloseTo(90);
    expect(player.y).toBeCloseTo(0);
  });

  it('copes with a protist as big as the drop', () => {
    const player = { x: 5, y: 0 };
    keepInDrop(player, 100, 2);
    expect(player.x).toBe(0);
  });
});
