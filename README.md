# ProtistParty 💧

A cute protistology game for the browser, and the sister game to [PetriPals](https://github.com/jessicasogge/petripals), [FunGals](https://github.com/jessicasogge/fungals) and [CellMates](https://github.com/jessicasogge/cellmates). Protists are the single cells (and a few bigger ones) that aren't bacteria, fungi, plants or animals: amoebas, ciliates, flagellates, algae, slime molds and more. Steer a real protist through a drop of pond water, eat bacteria and split in two before the drop dries up.

**[▶ Play ProtistParty](https://jessicasogge.github.io/protistparty/)**: works on computers, phones and tablets.

## How to play: Pond Drop

1. **Move around the drop.** Use the arrow keys, or on a touch screen, drag like a trackpad, just like PetriPals, FunGals and CellMates.
2. **Eat bacteria.** Touch an *E. coli* to swallow it. It waits inside her in a **food vacuole** (the amber bubble) while she digests it.
3. **Split in two.** Every 2 bacteria a cell eats, it divides by binary fission. Her daughters crawl off on their own, eating and splitting too.
4. **Stay in the water.** The drop dries in from its edge. If she crawls onto the dry glass, she dries out and you try the level again. Her daughters keep to the water on their own.

There are seven levels. Each one doubles the colony you need to grow, from 4 cells up to 256, adds 2 more bacteria to the drop, and dries the drop a little faster.

## The protists

| Protist | Species | Looks |
|---|---|---|
| **Amy** | *Amoeba proteus* | A lilac blob that oozes as she goes, with stubby pseudopods, a round nucleus and a clear bubble of a contractile vacuole |

More protists are on the way.

## The real science

- **Protists** aren't one family on the tree of life. "Protist" is an old grab-bag name for every eukaryote (a cell with a nucleus) that isn't an animal, plant or fungus. "Protozoa" is the older name for the animal-like ones that move about and eat, like Amy.
- **Amy's pseudopods** ("false feet") are how amoebas move: her jelly-like cytoplasm streams forward into a bulge, and the rest of her follows. Her outline never stops changing, which is why she oozes between shapes in the game. Her name is short for *amoeba*, from the Greek for "change," and her species, *proteus*, is named for Proteus, the Greek sea god who could change his shape.
- **Eating:** Amy wraps her pseudopods around food and swallows it whole, a way of eating called phagocytosis. Each meal sits in a bubble, a food vacuole, while it's digested. White blood cells eat germs the same way.
- **Her contractile vacuole** is the clear bubble in her picture. Pond water keeps soaking into her, and the vacuole fills with the extra and squeezes it back out, over and over.
- **Splitting in two:** Amy copies her nucleus and pinches into two daughter cells (binary fission). In the game she splits after every 2 bacteria; a real *Amoeba proteus* eats far more, and splits about once a day or two.
- **Scale:** Amy can grow to about half a millimeter, just big enough to see without a microscope, while an *E. coli* cell is about 2 micrometers long. True to scale, the bacteria would be specks a couple of hundred times smaller than her, so in the game they're drawn much bigger.
- **The drying drop:** to watch live protists, you put a drop of pond water on a glass slide under a thin coverslip (a wet mount). It slowly dries from the edges. Real drops take many minutes, not seconds. Many protists survive drying by turning into tough, dormant cysts, but *Amoeba proteus* isn't known to, so in the game Amy has to stay in the water.
- **The bacteria** are *E. coli*, drawn like Colette's offspring in PetriPals. Amoebas really eat bacteria, and labs often grow them on *E. coli* or other bacteria as food.

## Running it locally

The game is plain HTML, CSS and JavaScript in [`public/`](public/), with no build step. To run it with the included dev server:

```sh
npm install
npm run dev
```

Then open http://localhost:3008.

## Tests

```sh
npm test                # run the tests
npm run test:coverage   # run them and check how much of the game they cover
```

The tests use [Vitest](https://vitest.dev/), and most run in [jsdom](https://github.com/jsdom/jsdom), a simulated browser page. The coverage check fails if the tests leave game code untested (the thresholds are in [`vitest.config.js`](vitest.config.js)), and the deploy runs it, so untested code doesn't ship.

## Project layout

ProtistParty started from the CellMates engine (steering, the loading card, the end-of-level pop-up and the win confetti), with the viruses swapped for protists and the lawn of host cells for a drying drop of pond water full of bacteria.

| Path | What's there |
|---|---|
| `public/index.html` | Home page, with its row of protists drawn by `script.js` |
| `public/pond-drop.html` | The game; `game/main.js` starts it |
| `public/game/config.js` | Every protist's settings and facts, the bacteria (PREY), the levels, and the numbers the game is built on |
| `public/game/protists.js` | Every protist's name and drawing, in one place. To add a protist, see the notes at the top. |
| `public/game/game.js` | The game loop: steering, winning and drying out |
| `public/game/colony.js` | Her and her daughters: eating, food vacuoles and splitting in two |
| `public/game/prey.js` | The bacteria: swimming, being eaten, and new ones swimming in |
| `public/game/drop.js` | The drop of pond water, drying in from its edge |
| `public/game/` | Also: steering with the arrow keys (`keyboard.js`) and by touch or mouse (`touch.js`), the end-of-level pop-up (`banner.js`), the fun-fact pop-up (`facts.js`, with italics from `italics.js`), the loading card (`loading.js`), visit counting (`track.js`) and the win confetti (`party.js`, using canvas-confetti in `vendor/`) |
| `test/` | Tests |
| `src/index.ts` | Small Express server for local development |

## Deployment

Every push to `main` runs the tests and the coverage check and, if they pass, publishes `public/` to GitHub Pages (see [`.github/workflows/pages.yml`](.github/workflows/pages.yml)). In the repo's **Settings → Pages**, set **Source** to **GitHub Actions** once.

## Contributing

Bug reports, ideas and fixes are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started, and please follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

ProtistParty is released under the [MIT License](LICENSE). The confetti uses [canvas-confetti](https://github.com/catdad/canvas-confetti), which is ISC licensed ([`public/game/vendor/confetti.LICENSE`](public/game/vendor/confetti.LICENSE)). The home page uses the [Fredoka](https://github.com/hafontia/Fredoka-One) and [Nunito](https://github.com/googlefonts/nunito) fonts, under the SIL Open Font License ([`public/fonts/`](public/fonts/)).

## Credits

Made by Jessica Sogge.
