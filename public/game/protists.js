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

// Amy's outline: a small round body with long, finger-like pseudopods
// reaching every which way, like a textbook drawing of Amoeba proteus.
// Each pseudopod is [direction in degrees (0 is right, 90 is down), how
// far it reaches past her body, how wide it is (radians)]. She oozes
// between two sets: some pseudopods stretch out as others pull in.
const AMY_PSEUDOPODS = [
  [[-30, 38, 0.3], [22, 22, 0.28], [66, 44, 0.27], [130, 30, 0.29], [200, 46, 0.27], [262, 18, 0.34]],
  [[-36, 44, 0.29], [18, 16, 0.3], [72, 38, 0.29], [124, 38, 0.27], [196, 40, 0.29], [258, 26, 0.32]],
];
const AMY_CENTER = [100, 104];
const AMY_BODY = 46; // her body's radius

// How far her outline is from her center in direction `angle` (radians).
// Each pseudopod falls away a little more steeply than a bell curve on
// either side (a power of 2.5, not 2), so it comes out as a finger with a
// soft, rounded tip, not a spike, and flows smoothly into her body.
function reach(angle, pseudopods) {
  let r = AMY_BODY;
  for (const [direction, length, width] of pseudopods) {
    const off = ((angle - (direction * Math.PI) / 180 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    r += length * Math.exp(-(Math.abs(off / width) ** 2.5));
  }
  return r;
}

// Her outline as a smooth, closed SVG path through 60 points around her,
// `scale` times her full size. Every outline has the same number of
// curves, so the browser can morph one into the other.
export function amoebaPath(pseudopods, scale = 1) {
  const [cx, cy] = AMY_CENTER;
  const points = Array.from({ length: 60 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 60 - Math.PI / 2;
    const r = reach(angle, pseudopods) * scale;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
  const n = (v) => Number(v.toFixed(1));
  // Each stretch between two points is a curve whose handles point along
  // the neighbors on either side (a Catmull-Rom spline).
  const curves = points.map((p1, i) => {
    const p0 = points[(i + 59) % 60];
    const p2 = points[(i + 1) % 60];
    const p3 = points[(i + 2) % 60];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    return `C${n(c1[0])} ${n(c1[1])} ${n(c2[0])} ${n(c2[1])} ${n(p2[0])} ${n(p2[1])}`;
  });
  return `M${n(points[0][0])} ${n(points[0][1])} ${curves.join(' ')} Z`;
}

const AMY_SHAPES = AMY_PSEUDOPODS.map((pods) => amoebaPath(pods));
const OOZE = 'dur="3.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"';

export const PROTISTS = [
  // Amy: Amoeba proteus, a lilac amoeba with long pseudopods, a nucleus,
  // a contractile vacuole and a sprinkle of granules
  {
    id: 'amy',
    name: 'Amy',
    looks: 'a lilac amoeba with long, finger-like pseudopods reaching every which way, a round nucleus and a clear bubble of a contractile vacuole',
    motion: 'squish',
    frames: { home: '0 0 200 200', drop: '9 25 170 170' },
    art: `
      <!-- her outline, oozing between two shapes -->
      <path d="${AMY_SHAPES[0]}" fill="#ece1fd" stroke="#8b5cf6" stroke-width="4" stroke-linejoin="round">
        <animate attributeName="d" ${OOZE} values="${AMY_SHAPES[0]};${AMY_SHAPES[1]};${AMY_SHAPES[0]}" />
      </path>
      <!-- granules in her cytoplasm -->
      <g fill="#c4b0f4">
        <circle cx="48" cy="78" r="2.6" />
        <circle cx="87" cy="57" r="2.2" />
        <circle cx="133" cy="101" r="2.6" />
        <circle cx="55" cy="98" r="2.2" />
        <circle cx="126" cy="150" r="2" />
        <circle cx="120" cy="162" r="2" />
      </g>
      <!-- her nucleus -->
      <ellipse cx="112" cy="138" rx="15" ry="11" fill="#d7c4fa" stroke="#8b5cf6" stroke-width="3" />
      <!-- her contractile vacuole, a clear bubble that pumps out extra water -->
      <circle cx="74" cy="132" r="9" fill="#f8f3ff" stroke="#c4b0f4" stroke-width="2.5" />
      <ellipse cx="84" cy="70" rx="9" ry="4.5" fill="#f8f3ff" transform="rotate(-20 84 70)" />
      ${face(100, 98, '#4c1d95')}
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
