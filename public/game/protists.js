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
  [[-30, 38, 0.26], [22, 22, 0.24], [66, 44, 0.24], [130, 30, 0.26], [200, 46, 0.24], [262, 18, 0.3]],
  [[-36, 44, 0.24], [18, 16, 0.26], [72, 38, 0.26], [124, 38, 0.24], [196, 40, 0.26], [258, 26, 0.28]],
];
const AMY_CENTER = [100, 104];
const AMY_BODY = 46; // her body's radius

// How far her outline is from her center in direction `angle` (radians).
// Each pseudopod falls away steeply on either side (a fourth power, not a
// square), so it comes out as a finger with a rounded tip, not a spike.
function reach(angle, pseudopods) {
  let r = AMY_BODY;
  for (const [direction, length, width] of pseudopods) {
    const off = ((angle - (direction * Math.PI) / 180 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    r += length * Math.exp(-((off / width) ** 4));
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
// The dotted line just inside her outline: the clear, firm outer layer of
// her cytoplasm (ectoplasm), around the grainy, flowing inside (endoplasm).
const AMY_ECTOPLASM = AMY_PSEUDOPODS.map((pods) => amoebaPath(pods, 0.84));
const OOZE = 'dur="3.2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"';
const ooze = (shapes) => `<animate attributeName="d" ${OOZE} values="${shapes[0]};${shapes[1]};${shapes[0]}" />`;

// Granules and little crystals scattered through her endoplasm, clear of
// her face, nucleus and vacuoles: [x, y, radius] and [x, y, tilt].
const AMY_GRANULES = [
  [125, 88, 1.8], [71, 85, 2.2], [133, 101, 2.6], [85, 86, 1.8], [120, 159, 1.8], [110, 80, 2.6],
  [90, 137, 2.6], [132, 74, 2.2], [55, 98, 2.2], [139, 88, 2.2], [68, 104, 2.6], [44, 76, 2.6],
  [126, 148, 1.8], [87, 57, 1.8], [112, 125, 1.8], [78, 146, 2.2],
];
const AMY_CRYSTALS = [
  [99, 62, 20], [82, 72, 50], [97, 125, 0], [133, 120, 50], [55, 84, 0], [34, 86, 50], [95, 74, 70], [143, 111, 20],
];

export const PROTISTS = [
  // Amy: Amoeba proteus, a lilac amoeba with long pseudopods, a nucleus,
  // a contractile vacuole and a sprinkle of granules and crystals
  {
    id: 'amy',
    name: 'Amy',
    looks: 'a lilac amoeba with long, finger-like pseudopods reaching every which way, an oval nucleus and a clear bubble of a contractile vacuole',
    motion: 'squish',
    frames: { home: '0 0 200 200', drop: '8.5 24.5 172 172' },
    art: `
      <!-- her outline, oozing between two shapes -->
      <path d="${AMY_SHAPES[0]}" fill="#ece1fd" stroke="#8b5cf6" stroke-width="4" stroke-linejoin="round">
        ${ooze(AMY_SHAPES)}
      </path>
      <!-- the edge of her ectoplasm -->
      <path d="${AMY_ECTOPLASM[0]}" fill="none" stroke="#c4b0f4" stroke-width="2.2" stroke-dasharray="0.1 6" stroke-linecap="round">
        ${ooze(AMY_ECTOPLASM)}
      </path>
      <!-- granules and crystals in her endoplasm -->
      <g fill="#c4b0f4">
        ${AMY_GRANULES.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" />`).join('')}
      </g>
      <g fill="#f8f3ff" stroke="#b9a2f0" stroke-width="1.2">
        ${AMY_CRYSTALS.map(([x, y, tilt]) => `<rect x="${x - 2.5}" y="${y - 2.5}" width="5" height="5" rx="1" transform="rotate(${tilt} ${x} ${y})" />`).join('')}
      </g>
      <!-- her nucleus, grainy with DNA -->
      <ellipse cx="112" cy="138" rx="15" ry="10" fill="#d7c4fa" stroke="#8b5cf6" stroke-width="3" transform="rotate(-12 112 138)" />
      <g fill="#a78bfa">
        <circle cx="105" cy="136" r="1.6" /><circle cx="112" cy="134" r="1.6" /><circle cx="119" cy="137" r="1.6" />
        <circle cx="108" cy="142" r="1.6" /><circle cx="116" cy="142" r="1.6" />
      </g>
      <!-- her contractile vacuole, a clear bubble that pumps out extra water -->
      <circle cx="74" cy="132" r="9" fill="#f8f3ff" stroke="#c4b0f4" stroke-width="2.5" />
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
