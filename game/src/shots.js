// Deterministic screenshot scenes for Glowtide Keep. Adding
// ?shot=start|play|upgrade|victory|defeat&seed=1 to the page URL builds
// one fixed scene from a seed and freezes it, so a screenshot shows
// the same frame every time. Normal play never uses this path.

import { ARENA } from './config.js';
import { makeEnemy } from './entities.js';
import { drawUpgradeOffer } from './upgrades.js';

export function parseShotParams(search) {
  const params = new URLSearchParams(search || '');
  const shot = params.get('shot');
  const seedRaw = parseInt(params.get('seed') || '1', 10);
  return {
    shot: ['start', 'play', 'upgrade', 'victory', 'defeat'].includes(shot) ? shot : null,
    seed: Number.isFinite(seedRaw) ? seedRaw : 1,
  };
}

function placeFoes(game, specs) {
  for (const [type, x, y] of specs) {
    const enemy = makeEnemy(type, x, y, 2);
    game.spawnEnemy(enemy);
  }
}

export function applyShotScene(game, shot, seed) {
  game.seed = seed;
  if (shot === 'start') {
    game.state = 'title';
    game.best = 1240;
    game.frozen = true;
    return;
  }
  if (shot === 'victory' || shot === 'defeat') {
    game.state = 'playing';
    game.score = shot === 'victory' ? 4860 : 1730;
    game.kills = shot === 'victory' ? 52 : 19;
    game.shotsFired = 210;
    game.shotsHit = 151;
    game.time = shot === 'victory' ? 342 : 148;
    game.director.wave = shot === 'victory' ? 5 : 3;
    game.best = 4860;
    game.endStats = {
      won: shot === 'victory',
      score: game.score, best: game.best, isBest: shot === 'victory',
      kills: game.kills, accuracy: 72, time: game.time, wave: game.director.wave,
    };
    game.state = shot;
    game.frozen = true;
    return;
  }
  if (shot === 'upgrade') {
    game.startRun();
    game.director.wave = 2;
    game.score = 1240;
    game.kills = 18;
    game.time = 118;
    game.player.hp = 72;
    game.keepHp = 84;
    game.offer = drawUpgradeOffer(game.rng, 3);
    game.banner = '';
    game.bannerTimer = 0;
    game.state = 'upgrade';
    game.frozen = true;
    return;
  }
  // Play: a busy mid-wave frame with foes, bolts, pickups and sparks.
  game.startRun();
  game.director.wave = 2;
  game.score = 860;
  game.kills = 11;
  game.time = 74;
  game.player.x = ARENA.x + 90;
  game.player.y = ARENA.y + 70;
  game.player.aim = -2.4;
  game.player.hp = 78;
  game.keepHp = 91;
  game.banner = 'WAVE 2';
  game.bannerTimer = 2;
  placeFoes(game, [
    ['mote', 300, 210],
    ['mote', 640, 190],
    ['mote', 690, 380],
    ['dartwing', 360, 420],
    ['dartwing', 610, 300],
    ['bulwark', 250, 330],
  ]);
  game.pickups.push({ kind: 'shard', x: 560, y: 420, radius: 11, life: 9, bob: 0.5 });
  game.pickups.push({ kind: 'heart', x: 380, y: 250, radius: 11, life: 9, bob: 1.2 });
  game.particles.burst(300, 210, '#b794e6', 10, 140, 0.5, 3);
  game.particles.burst(610, 300, '#ffe9a8', 8, 110, 0.4, 2);
  game.texts.add(300, 190, '+50', '#ffd76e');
  // Step the simulation a little so bolts are mid-flight, then freeze.
  const fakeInput = {
    mouseX: 300, mouseY: 210, mouseDown: true,
    moveAxis: () => ({ x: 0, y: 0 }),
    wasPressed: () => false, down: () => false, clicks: [],
  };
  for (let i = 0; i < 12; i += 1) {
    game.updatePlaying(1 / 60, fakeInput);
  }
  game.banner = 'WAVE 2';
  game.bannerTimer = 2;
  game.frozen = true;
}
