// The home page: the row of protists, and the "Press Start to Play" button.
// There's only one protist so far, so Start goes straight to the drop.
import { goTo, watchLoading } from './game/loading.js';
import { HOME_PROTISTS, homeProtist } from './game/protists.js';

// "Making a wet mount…" while the next screen loads.
watchLoading();

const friends = document.querySelector('.friends');
friends?.append(...HOME_PROTISTS.map(homeProtist));

const startButton = document.querySelector('.start-btn');

if (startButton) {
  const label = startButton.textContent;

  startButton.addEventListener('click', () => {
    startButton.textContent = 'Making a wet mount...';
    startButton.disabled = true;

    setTimeout(() => {
      goTo('./pond-drop.html');
    }, 250);
  });

  // When you come back with the browser's Back button, the browser may show
  // this page exactly as it was left, still saying "Making a wet mount...".
  // Put the button back the way it started.
  window.addEventListener('pageshow', () => {
    startButton.textContent = label;
    startButton.disabled = false;
  });
}
