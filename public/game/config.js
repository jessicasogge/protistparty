// Every protist's settings and fun facts, the bacteria she eats, the levels,
// and the numbers the game is built on.
//
// `scientific`: species name above the drop; only *marked parts* italicize.
// `color`: name color.
// `colors`: drawing palette (protists.js).
// `size`: her width relative to the drop. Enlarged for visibility: next to
//   the bacteria she eats she'd be hundreds of times bigger.
// `facts`: random win/lose facts (game/facts.js); *names* italicize.
export const SPECIES = {
  amy: {
    facts: [
      "Amy is named for Proteus, a Greek sea god who could change his shape.",
      "Amy moves by pushing out pseudopods, which means \"false feet.\"",
      "Amy eats by wrapping pseudopods around food. That's phagocytosis.",
      "Amy digests swallowed food inside little bubbles called food vacuoles.",
      "Amy's contractile vacuole collects extra water and empties it out of her cell.",
      "Amy can reach about half a millimeter, but her clear body is hard to spot.",
      "Amy lives in fresh water, among debris and plants in ponds and slow streams.",
      "Amy eats bacteria, algae and other protists, including *Paramecium*.",
      "Amy copies her DNA, divides her nucleus, then splits into two cells.",
      "Amy has no fixed shape: her outline changes as she moves.",
      "Amy's inner cytoplasm flows into each growing pseudopod.",
      "Some white blood cells crawl and engulf germs much as Amy moves and eats.",
      "Amy has no rigid cell wall, so she can stretch into changing shapes.",
      "In 1755, Rösel von Rosenhof drew an amoeba like Amy and called it \"little Proteus.\"",
    ],
    scientific: '*Amoeba proteus*',
    color: '#6d28d9',
    size: 0.13,
    colors: { fill: '#ece1fd', stroke: '#8b5cf6', highlight: '#f8f3ff', dark: '#4c1d95' },
  },
};

// Prey: E. coli drawn like Colette's offspring. `size` = cell/drop width;
// `radius` = touch range in drop radii; `speed` = drop radii/sec.
// `count` = level 1 population; add PREY_PER_LEVEL each level.
export const PREY = {
  name: '*E. coli*', size: 0.055, radius: 0.025, speed: 0.07, count: 10,
};

// Colony targets double each level, from 4 to 256 cells.
// `dryMs`: time to dry to GAME.WET_MIN; shorter each level.
export const LEVELS = [
  { target: 4, dryMs: 70000 },
  { target: 8, dryMs: 65000 },
  { target: 16, dryMs: 60000 },
  { target: 32, dryMs: 55000 },
  { target: 64, dryMs: 50000 },
  { target: 128, dryMs: 45000 },
  { target: 256, dryMs: 40000 },
];

export const GAME = {
  SPEED: 0.55, // drop radii per second: an amoeba is no sprinter
  ARRIVE: 0.01, // pointer tolerance, relative to drop radius
  DRAG_SPEED: 1.6, // drag cap in radii/sec, so a fast swipe doesn't fling her

  // How close counts as touching: this share of her drawn half-width (her
  // `size`, in drop radii), since her drawing doesn't fill its whole box.
  // Her daughters are drawn DAUGHTER_SCALE times her size.
  REACH_SHARE: 0.75,
  DAUGHTER_SCALE: 0.7,

  // A cell divides once it has eaten MEALS_PER_DIVISION bacteria (each
  // waits in a food vacuole till then), and not again for DIVIDE_MS.
  MEALS_PER_DIVISION: 2,
  DIVIDE_MS: 400,

  // A new daughter slides off at SPLIT_SPEED (drop radii per second) and
  // slows down at SETTLE_RATE, then crawls about at CRAWL_SPEED.
  SPLIT_SPEED: 0.5,
  SETTLE_RATE: 3,
  CRAWL_SPEED: 0.03,

  // More bacteria each level, and how soon a new one swims in after one is
  // eaten.
  PREY_PER_LEVEL: 2,
  PREY_RESPAWN_MS: 500,

  // The drop starts drying after DRY_DELAY_MS. Its edge creeps in until
  // only WET_MIN of its radius is left, and stays there.
  DRY_DELAY_MS: 3000,
  WET_MIN: 0.55,
  // She's dried out once her middle is this share of her reach past the
  // water's edge, so brushing it is fine.
  DRY_SHARE: 0.3,
};
