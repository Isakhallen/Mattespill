import Verden from './scener/Verden.js';

// Ligger på window så spillet kan sjekkes fra konsollen og i tester.
window.spill = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'spill',
  width: 320,
  height: 180,
  pixelArt: true,
  backgroundColor: '#111111',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Verden],
});
