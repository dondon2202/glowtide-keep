// Wave direction: builds each wave's spawn queue, trickles foes in
// from the arena rim, and reports when a wave is fully cleared.

import { ARENA, WAVES } from './config.js';
import { makeEnemy } from './entities.js';

export class WaveDirector {
  constructor(rng) {
    this.rng = rng;
    this.wave = 0;
    this.queue = [];
    this.spawnTimer = 0;
    this.active = false;
  }

  get totalWaves() {
    return WAVES.length;
  }

  startWave(index) {
    this.wave = index;
    const spec = WAVES[index - 1];
    this.queue = [];
    const kinds = ['herald', 'bulwark', 'dartwing', 'mote'];
    for (const kind of kinds) {
      for (let i = 0; i < spec[kind]; i += 1) this.queue.push(kind);
    }
    // Shuffle lightly so the same kind never arrives in one block, but
    // keep the herald near the end of the final wave.
    for (let i = this.queue.length - 1; i > 0; i -= 1) {
      if (this.queue[i] === 'herald') continue;
      const j = Math.floor(this.rng.next() * (i + 1));
      if (this.queue[j] === 'herald') continue;
      const tmp = this.queue[i];
      this.queue[i] = this.queue[j];
      this.queue[j] = tmp;
    }
    this.spawnTimer = 0.6;
    this.active = true;
  }

  interval() {
    return WAVES[this.wave - 1].interval;
  }

  bonus() {
    return WAVES[this.wave - 1].bonus;
  }

  update(dt, spawnOne) {
    if (!this.active || this.queue.length === 0) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = this.interval();
    const kind = this.queue.shift();
    const angle = this.rng.angle();
    const edge = ARENA.radius - 8;
    const x = ARENA.x + Math.cos(angle) * edge;
    const y = ARENA.y + Math.sin(angle) * edge;
    spawnOne(makeEnemy(kind, x, y, this.wave));
  }

  cleared(enemyCount) {
    return this.active && this.queue.length === 0 && enemyCount === 0;
  }

  remaining(enemyCount) {
    return this.queue.length + enemyCount;
  }

  reset() {
    this.wave = 0;
    this.queue = [];
    this.spawnTimer = 0;
    this.active = false;
  }
}
