// Every protist's drawing, in one place. The home page and the pond drop
// both draw the protists from here, so a change to how one looks only has
// to be made once.
//
// Each protist has:
//   id      her key, matching SPECIES in config.js and ?protist= in addresses
//   name    what she's called
//   looks   what a screen reader says after her name
//   motion  her idle animation in styles.css (bob, squish or wobble)
//   frames  the part of the drawing each page shows (an SVG viewBox): a
//           little room around her on the home page, snug in the drop
//   art     the drawing itself, in a 200 x 200 space. Wrap the face in
//           <g class="face">.
//
// To add a protist: add her to this list and to SPECIES in config.js.

const SVG = 'http://www.w3.org/2000/svg';

// A cute face: eyes with a glint, rosy cheeks and a smile, centered on
// (x, y), in the protist's `dark` color.
const face = (x, y, dark) => `
      <g class="face">
        <circle cx="${x - 11}" cy="${y}" r="6" fill="${dark}" />
        <circle cx="${x + 11}" cy="${y}" r="6" fill="${dark}" />
        <circle cx="${x - 9}" cy="${y - 2}" r="2" fill="white" />
        <circle cx="${x + 13}" cy="${y - 2}" r="2" fill="white" />
        <ellipse cx="${x - 21}" cy="${y + 12}" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.8" />
        <ellipse cx="${x + 21}" cy="${y + 12}" rx="6" ry="3.5" fill="#f9a8d4" opacity="0.8" />
        <path d="M${x - 6} ${y + 12} Q${x} ${y + 18} ${x + 6} ${y + 12}" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round" />
      </g>`;

// Amy's outline in two shapes she oozes between: her pseudopods push out
// on one side as they pull in on another. Both have the same number of
// curves, so the browser can morph one into the other.
const AMY_SHAPES = [
  'M100 40 C130 36 142 62 162 64 C188 68 186 104 166 116 C150 126 160 158 132 164 C108 170 96 150 74 160 C46 170 28 140 42 118 C52 100 20 88 38 64 C54 44 76 42 100 40 Z',
  'M104 44 C132 34 152 54 172 56 C194 62 184 98 168 112 C152 124 154 152 128 160 C104 168 92 156 66 166 C36 174 26 134 40 114 C50 98 28 80 46 62 C60 48 80 48 104 44 Z',
];
const OOZE = 'dur="3.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"';

export const PROTISTS = [
  // Amy: Amoeba proteus, a lilac blob with pseudopods, a nucleus, a
  // contractile vacuole and a sprinkle of granules
  {
    id: 'amy',
    name: 'Amy',
    looks: 'a lilac amoeba: a soft, ever-changing blob with stubby pseudopods, a round nucleus and a clear bubble of a contractile vacuole',
    motion: 'squish',
    frames: { home: '0 0 200 200', drop: '12 14 186 186' },
    art: `
      <!-- her outline, oozing between two shapes -->
      <path d="${AMY_SHAPES[0]}" fill="#ece1fd" stroke="#8b5cf6" stroke-width="4" stroke-linejoin="round">
        <animate attributeName="d" ${OOZE} values="${AMY_SHAPES[0]};${AMY_SHAPES[1]};${AMY_SHAPES[0]}" />
      </path>
      <!-- granules in her cytoplasm -->
      <g fill="#c4b0f4">
        <circle cx="58" cy="76" r="2.6" />
        <circle cx="150" cy="78" r="2.2" />
        <circle cx="152" cy="104" r="2.6" />
        <circle cx="88" cy="146" r="2.4" />
        <circle cx="62" cy="108" r="2" />
        <circle cx="112" cy="58" r="2.2" />
      </g>
      <!-- her nucleus -->
      <ellipse cx="128" cy="134" rx="15" ry="11" fill="#d7c4fa" stroke="#8b5cf6" stroke-width="3" />
      <!-- her contractile vacuole, a clear bubble that pumps out extra water -->
      <circle cx="66" cy="134" r="9" fill="#f8f3ff" stroke="#c4b0f4" stroke-width="2.5" />
      <ellipse cx="84" cy="58" rx="9" ry="4.5" fill="#f8f3ff" transform="rotate(-20 84 58)" />
      ${face(102, 98, '#4c1d95')}
    `,
  },
];

// The home page's order.
const HOME = ['amy'];
export const HOME_PROTISTS = HOME.map((id) => PROTISTS.find((protist) => protist.id === id));

export function protistById(id) {
  return PROTISTS.find((protist) => protist.id === id);
}

// Her drawing as an <svg>, framed for `page` ('home' or 'drop'). Her
// oozing is an <animate>, which CSS can't pause, so it's taken out for
// anyone who'd rather have less motion.
function drawing(protist, page) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', protist.frames[page]);
  svg.innerHTML = protist.art;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    for (const ooze of svg.querySelectorAll('animate')) ooze.remove();
  }
  return svg;
}

// For the home page's row of protists.
export function homeProtist(protist) {
  const svg = drawing(protist, 'home');
  svg.setAttribute('class', `protist ${protist.motion}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${protist.name}, ${protist.looks}`);
  return svg;
}

// For the pond drop, hidden until the game picks her (main.js).
export function dropProtist(protist) {
  const svg = drawing(protist, 'drop');
  svg.setAttribute('class', `drop-protist ${protist.motion}`);
  svg.dataset.protist = protist.id;
  svg.dataset.name = protist.name;
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${protist.name}, ${protist.looks}`);
  svg.setAttribute('hidden', '');
  return svg;
}
