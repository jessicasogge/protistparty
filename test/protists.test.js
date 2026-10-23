// @vitest-environment jsdom
// protists.js draws every protist, and config.js holds her settings and the
// levels. These check they agree and stay sensible.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GAME, LEVELS, PREY, SPECIES } from '../public/game/config.js';
import { dropProtist, HOME_PROTISTS, homeProtist, protistById, PROTISTS } from '../public/game/protists.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('the protists', () => {
  it('each have settings in config.js, and every setting has a drawing', () => {
    expect(PROTISTS.map((p) => p.id).sort()).toEqual(Object.keys(SPECIES).sort());
    expect(HOME_PROTISTS).toHaveLength(PROTISTS.length);
  });

  it.each(PROTISTS.map((p) => [p.id, p]))('%s has a name, a description, a motion, frames and a face', (id, protist) => {
    expect(protist.name).toBe(id[0].toUpperCase() + id.slice(1));
    expect(protist.looks.length).toBeGreaterThan(10);
    expect(['bob', 'squish', 'wobble']).toContain(protist.motion);
    for (const frame of [protist.frames.home, protist.frames.drop]) {
      const [, , width, height] = frame.split(' ').map(Number);
      expect(width).toBe(height); // square, so she's never squashed
    }
    expect(protist.art).toContain('<g class="face">');
    expect(protistById(id)).toBe(protist);
  });

  it.each(Object.entries(SPECIES))('%s is bigger than the bacteria she eats', (id, species) => {
    expect(species.size).toBeGreaterThan(PREY.size);
    expect(species.scientific).toMatch(/^\*.+\*$/);
  });
});

describe('her drawings', () => {
  const amy = protistById('amy');

  it('on the home page are named for screen readers', () => {
    const svg = homeProtist(amy);
    expect(svg.getAttribute('class')).toBe(`protist ${amy.motion}`);
    expect(svg.getAttribute('viewBox')).toBe(amy.frames.home);
    expect(svg.getAttribute('aria-label')).toBe(`Amy, ${amy.looks}`);
  });

  it('in the drop start hidden, and say who they are', () => {
    const svg = dropProtist(amy);
    expect(svg.hasAttribute('hidden')).toBe(true);
    expect(svg.dataset.protist).toBe('amy');
    expect(svg.dataset.name).toBe('Amy');
    expect(svg.getAttribute('viewBox')).toBe(amy.frames.drop);
  });

  it('ooze, unless someone asks for less motion', () => {
    expect(homeProtist(amy).querySelector('animate')).not.toBeNull();
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    expect(homeProtist(amy).querySelector('animate')).toBeNull();
  });
});

describe('the levels', () => {
  it('double the colony from 4 cells to 256, over seven levels', () => {
    expect(LEVELS.map((l) => l.target)).toEqual([4, 8, 16, 32, 64, 128, 256]);
  });

  it('dry the drop faster each level', () => {
    for (let i = 1; i < LEVELS.length; i++) expect(LEVELS[i].dryMs).toBeLessThan(LEVELS[i - 1].dryMs);
  });

  it('never dry the drop smaller than she is', () => {
    for (const species of Object.values(SPECIES)) expect(GAME.WET_MIN).toBeGreaterThan(species.size * 2);
  });
});
