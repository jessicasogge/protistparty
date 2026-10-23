// Entry point for the pond drop page: find the protist and level in the
// address and start the game with them:
//   pond-drop.html?protist=prue&level=2
// With no protist (or an unknown one), it's Prue, the first one.
import { GAME, LEVELS, PREY, SPECIES } from './config.js';
import { playGame } from './game.js';
import { withItalics } from './italics.js';
import { pageReady, watchLoading } from './loading.js';
import { makePrey } from './prey.js';
import { dropProtist, PROTISTS } from './protists.js';
import { watchInputMode } from './touch.js';

// Show touch or arrow-key directions, whichever fits the device.
watchInputMode();
// "Making a wet mount…" while the next screen loads.
watchLoading();

// Every protist's drawing, hidden: yours is shown below.
document.querySelector('.protist-mover').append(...PROTISTS.map(dropProtist));

const params = new URLSearchParams(window.location.search);
const choice = params.get('protist');
// Compare names rather than building a CSS selector from the address, so a
// mangled link (e.g. ?protist=prue"]) can't crash the page.
const drawings = [...document.querySelectorAll('.drop-protist')];
const protist = drawings.find((el) => el.dataset.protist === choice) ?? drawings[0];
// Level 1 unless the address says otherwise.
const levelNumber = Math.min(Math.max(parseInt(params.get('level'), 10) || 1, 1), LEVELS.length);
const level = LEVELS[levelNumber - 1];

protist.removeAttribute('hidden');
document.title = `ProtistParty | ${protist.dataset.name} | Level ${levelNumber}`;
const species = SPECIES[protist.dataset.protist];
// Her name and species above the drop.
const title = document.querySelector('.protist-name');
title.textContent = protist.dataset.name;
title.style.color = species.color;
document.querySelector('.species-name').replaceChildren(...withItalics(species.scientific));
for (const el of document.querySelectorAll('.prey-name')) el.replaceChildren(...withItalics(PREY.name));
// More bacteria each level.
const count = PREY.count + GAME.PREY_PER_LEVEL * (levelNumber - 1);
playGame(protist, species, (wet) => makePrey({ count, wet }),
  { level: levelNumber, target: level.target, dryMs: level.dryMs });
// The drop is set up: take the loading card away.
pageReady();
