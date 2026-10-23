// @vitest-environment jsdom
// main.js starts the pond drop page from its address, e.g.
// pond-drop.html?protist=prue&level=2. These tests load the real page into
// jsdom, a simulated browser page, and check it picks the right protist and
// level, and copes with addresses that are broken or made up.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME, LEVELS, PREY, SPECIES } from '../public/game/config.js';

// Don't run the real game loop; just record how the game was started.
vi.mock('../public/game/game.js', () => ({ playGame: vi.fn() }));
vi.mock('../public/game/prey.js', () => ({ makePrey: vi.fn(() => 'the bacteria') }));

// (jsdom changes import.meta.url to a web address, so find the file from the project folder.)
const page = readFileSync(resolve(process.cwd(), 'public/pond-drop.html'), 'utf8');
const body = page.slice(page.indexOf('<body'), page.indexOf('</body>'));

// Open the drop page at `search` (like '?level=2') and run main.js.
async function open(search) {
  vi.stubGlobal('location', { search, href: `http://localhost/pond-drop.html${search}` });
  document.body.outerHTML = body;
  vi.resetModules();
  await import('../public/game/main.js');
  const { playGame } = await import('../public/game/game.js');
  const { makePrey } = await import('../public/game/prey.js');
  return { playGame, makePrey };
}

beforeEach(() => {
  document.title = 'ProtistParty | Pond Drop';
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('picking the protist', () => {
  it('shows the chosen protist', async () => {
    await open('?protist=prue');
    const shown = [...document.querySelectorAll('.drop-protist:not([hidden])')];
    expect(shown.map((el) => el.dataset.protist)).toEqual(['prue']);
  });

  it.each(['', '?protist=nobody', '?protist=prue"]'])('picks Prue for %j', async (search) => {
    const { playGame } = await open(search);
    expect(playGame.mock.calls[0][0].dataset.protist).toBe('prue');
  });

  it('puts her name, in her color, and her species above the drop', async () => {
    await open('');
    const name = document.querySelector('.protist-name');
    expect(name.textContent).toBe('Prue');
    // jsdom reports colors as rgb(), so compare against the same color set the same way.
    const expected = document.createElement('span');
    expected.style.color = SPECIES.prue.color;
    expect(name.style.color).toBe(expected.style.color);
    expect(document.querySelector('.species-name').innerHTML).toBe('<i>Amoeba proteus</i>');
    expect(document.querySelector('.prey-name').innerHTML).toBe('<i>E. coli</i>');
  });

  it('names the protist and level in the tab title, and takes the loading card away', async () => {
    await open('?level=3');
    expect(document.title).toBe('ProtistParty | Prue | Level 3');
    expect(document.querySelector('.loading-overlay').hidden).toBe(true);
  });
});

describe('picking the level', () => {
  it.each([
    ['', 1],
    ['?level=4', 4],
    ['?level=0', 1],
    ['?level=99', LEVELS.length],
    ['?level=pie', 1],
  ])('%j plays level %i', async (search, number) => {
    const { playGame } = await open(search);
    const level = LEVELS[number - 1];
    expect(playGame).toHaveBeenCalledWith(expect.anything(), SPECIES.prue, expect.any(Function),
      { level: number, target: level.target, dryMs: level.dryMs });
  });

  it('puts more bacteria in the drop each level', async () => {
    const { playGame, makePrey } = await open('?level=3');
    const wet = () => 0.8;
    expect(playGame.mock.calls[0][2](wet)).toBe('the bacteria');
    expect(makePrey).toHaveBeenCalledWith({ count: PREY.count + 2 * GAME.PREY_PER_LEVEL, wet });
  });
});
