// Boot and frame loop for Glowtide Keep. A fixed 1/60 s step keeps
// the simulation steady on any display; rendering follows each frame.
// This module starts nothing when there is no document, so the game
// logic can be imported and stepped in a plain Node test.

import { SoundBank } from './audio.js';
import { Game } from './game.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { applyShotScene, parseShotParams } from './shots.js';

const STEP = 1 / 60;

export function startGame(canvas) {
  const renderer = new Renderer(canvas);
  const sound = new SoundBank();
  const storage = (() => {
    try {
      return window.localStorage || null;
    } catch {
      return null;
    }
  })();
  const game = new Game({ seed: 20261116, sound, storage });
  const input = new Input(canvas, (px, py, w, h) => renderer.toLogical(px, py, w, h));
  input.onFirstGesture = () => {
    sound.unlock();
    if (game.state === 'playing') sound.startPad();
  };

  const shotParams = parseShotParams(window.location.search);
  let shotMode = false;
  if (shotParams.shot) {
    shotMode = true;
    applyShotScene(game, shotParams.shot, shotParams.seed);
  }

  window.addEventListener('resize', () => renderer.resize());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) game.pause();
  });

  let last = performance.now();
  let acc = 0;
  let frames = 0;
  const clockStart = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    const elapsed = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (shotMode) {
      renderer.render(game, input, 12.5);
      frames += 1;
      if (frames === 3) window.__shotReady = true;
      input.endFrame();
      return;
    }
    // Route clicks to menu buttons outside of live play.
    if (game.state !== 'playing') {
      for (const click of input.clicks) {
        if (click.button === 0) game.handleClick(click.x, click.y);
      }
    }
    acc += elapsed;
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      game.update(STEP, input);
      acc -= STEP;
      steps += 1;
      if (game.state !== 'playing' && game.state !== 'paused') {
        // Menus still tick once per frame below; do not spin the sim.
        break;
      }
    }
    if (steps === 4) acc = 0;
    if (game.state === 'title' || game.state === 'upgrade'
      || game.state === 'victory' || game.state === 'defeat') {
      game.update(0, input);
    }
    const renderNow = (now - clockStart) / 1000;
    renderer.render(game, input, renderNow);
    input.endFrame();
  }

  requestAnimationFrame(frame);
  return { game, input, renderer, sound };
}

if (typeof document !== 'undefined') {
  const canvas = document.getElementById('game');
  if (canvas) startGame(canvas);
}
