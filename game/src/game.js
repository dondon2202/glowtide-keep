// Game orchestration for Glowtide Keep: states, combat, waves,
// scoring and upgrades. This module touches no DOM and no canvas, so
// the simulation can be stepped headlessly in a test.

import { ARENA, KEEP, PICKUPS, PLAYER, WAVES } from './config.js';
import {
  circlesHit, clampToArena, makeBullet, makePickup, makePlayer,
  movePlayer, updateEnemy,
} from './entities.js';
import { FloatTexts, ParticlePool, Shake } from './particles.js';
import { SeededRandom } from './rng.js';
import { drawUpgradeOffer } from './upgrades.js';
import { WaveDirector } from './waves.js';

const SILENT_SOUND = {
  shoot() {}, dash() {}, hit() {}, enemyDown() {}, pickup() {}, hurt() {},
  waveStart() {}, upgradePick() {}, click() {}, victory() {}, defeat() {},
  startPad() {}, stopPad() {}, unlock() {}, setMuted() {},
};

function loadBest(storage) {
  try {
    const raw = storage ? storage.getItem('glowtide-keep-best') : null;
    const n = raw === null ? 0 : parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export class Game {
  constructor(options) {
    const opts = options || {};
    this.seed = opts.seed || 1;
    this.rng = new SeededRandom(this.seed);
    this.sound = opts.sound || SILENT_SOUND;
    this.storage = opts.storage || null;
    this.best = loadBest(this.storage);
    this.state = 'title';
    this.previousState = 'title';
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.keepHp = KEEP.maxHp;
    this.keepArmor = 0;
    this.keepFlash = 0;
    this.banner = '';
    this.bannerTimer = 0;
    this.offer = [];
    this.frozen = false;
    this.muted = false;
    this.player = makePlayer();
    this.enemies = [];
    this.bullets = [];
    this.pickups = [];
    this.particles = new ParticlePool(320);
    this.texts = new FloatTexts();
    this.shake = new Shake();
    this.director = new WaveDirector(this.rng);
    this.nextEnemyId = 1;
    this.heraldTimer = 4;
    this.endStats = null;
  }

  healKeep(amount) {
    this.keepHp = Math.min(KEEP.maxHp, this.keepHp + amount);
  }

  startRun() {
    this.rng = new SeededRandom(this.seed);
    this.player = makePlayer();
    this.enemies = [];
    this.bullets = [];
    this.pickups = [];
    this.particles.clear();
    this.texts.clear();
    this.shake.clear();
    this.director = new WaveDirector(this.rng);
    this.score = 0;
    this.kills = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.time = 0;
    this.keepHp = KEEP.maxHp;
    this.keepArmor = 0;
    this.keepFlash = 0;
    this.nextEnemyId = 1;
    this.heraldTimer = 4;
    this.endStats = null;
    this.state = 'playing';
    this.beginWave(1);
    this.sound.startPad();
  }

  beginWave(index) {
    this.director.startWave(index);
    this.banner = index === WAVES.length ? 'FINAL WAVE: THE HERALD STIRS' : `WAVE ${index}`;
    this.bannerTimer = 2.2;
    this.sound.waveStart();
  }

  toTitle() {
    this.state = 'title';
    this.sound.stopPad();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.previousState = 'playing';
    this.state = 'paused';
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
  }

  toggleMute() {
    this.muted = !this.muted;
    this.sound.setMuted(this.muted);
  }

  finish(won) {
    const rawAccuracy = this.shotsFired === 0 ? 0 : Math.round((this.shotsHit / this.shotsFired) * 100);
    const accuracy = Math.min(100, rawAccuracy);
    const isBest = this.score > this.best;
    if (isBest) {
      this.best = this.score;
      try {
        if (this.storage) this.storage.setItem('glowtide-keep-best', String(this.best));
      } catch { /* best score is a nicety, not a requirement */ }
    }
    this.endStats = {
      won, score: this.score, best: this.best, isBest,
      kills: this.kills, accuracy, time: this.time,
      wave: this.director.wave,
    };
    this.state = won ? 'victory' : 'defeat';
    this.sound.stopPad();
    if (won) this.sound.victory();
    else this.sound.defeat();
  }

  pickUpgrade(index) {
    const def = this.offer[index];
    if (!def) return;
    def.apply(this.player, this);
    this.sound.upgradePick();
    this.texts.add(this.player.x, this.player.y - 26, def.name, '#ffd76e');
    this.offer = [];
    this.state = 'playing';
    const next = this.director.wave + 1;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 15);
    this.healKeep(10);
    this.beginWave(next);
  }

  spawnEnemy(enemy) {
    enemy.id = this.nextEnemyId;
    this.nextEnemyId += 1;
    enemy.keepTimer = 0;
    this.enemies.push(enemy);
  }

  fireBullets() {
    const p = this.player;
    const cooldown = PLAYER.fireCooldown * p.fireRateMul * (p.starTimer > 0 ? 0.6 : 1);
    if (p.fireTimer > 0) return;
    p.fireTimer = cooldown;
    const spreadCount = p.spread + (p.starTimer > 0 ? 1 : 0);
    const step = 0.13;
    for (let i = 0; i < spreadCount; i += 1) {
      const offset = (i - (spreadCount - 1) / 2) * step;
      const angle = p.aim + offset;
      const bx = p.x + Math.cos(angle) * (p.radius + 6);
      const by = p.y + Math.sin(angle) * (p.radius + 6);
      this.bullets.push(makeBullet(
        bx, by, angle,
        Math.round(PLAYER.bulletDamage * p.damageMul), p.pierce, 'player',
      ));
    }
    this.shotsFired += spreadCount;
    this.sound.shoot();
    this.particles.burst(p.x, p.y, '#ffd76e', 2, 40, 0.18, 2);
  }

  tryDash(axis) {
    const p = this.player;
    if (p.dashTimer > 0 || p.dashLeft > 0) return;
    const mul = p.dashCooldownMul || 1;
    p.dashTimer = PLAYER.dashCooldown * mul;
    p.dashLeft = PLAYER.dashTime;
    if (axis.x !== 0 || axis.y !== 0) {
      const len = Math.hypot(axis.x, axis.y);
      p.dashX = axis.x / len;
      p.dashY = axis.y / len;
    } else {
      p.dashX = Math.cos(p.aim);
      p.dashY = Math.sin(p.aim);
    }
    this.sound.dash();
    this.particles.burst(p.x, p.y, '#6ee7ff', 8, 120, 0.3, 3);
  }

  damagePlayer(amount) {
    const p = this.player;
    if (p.dashLeft > 0 || p.hurtTimer > 0) return;
    p.hp -= amount;
    p.hurtTimer = PLAYER.contactGrace;
    this.shake.add(7);
    this.sound.hurt();
    this.particles.burst(p.x, p.y, '#ff6b7a', 10, 150, 0.4, 3);
    if (p.hp <= 0) {
      p.hp = 0;
      this.finish(false);
    }
  }

  damageKeep(amount) {
    const reduced = Math.max(1, Math.round(amount * (1 - this.keepArmor)));
    this.keepHp -= reduced;
    this.keepFlash = 0.4;
    this.shake.add(5);
    this.sound.hit();
    this.particles.burst(KEEP.x, KEEP.y, '#6ee7ff', 8, 120, 0.35, 3);
    if (this.keepHp <= 0) {
      this.keepHp = 0;
      this.finish(false);
    }
  }

  killEnemy(enemy) {
    this.kills += 1;
    this.score += enemy.score;
    this.texts.add(enemy.x, enemy.y - 14, `+${enemy.score}`, '#ffd76e');
    this.particles.burst(enemy.x, enemy.y, '#b794e6', 14, 170, 0.5, 3);
    this.sound.enemyDown();
    if (enemy.type === 'bulwark' && this.director.wave >= 3) {
      for (let i = 0; i < 2; i += 1) {
        const angle = this.rng.angle();
        const child = {
          type: 'mote', x: enemy.x + Math.cos(angle) * 18, y: enemy.y + Math.sin(angle) * 18,
          radius: 14, hp: 14, maxHp: 14, speed: 70, damage: 6, score: 25,
          flash: 0, wobble: 0, spawnTimer: 0, chargeTimer: 0, charging: 0,
          chargeX: 0, chargeY: 0, hitBy: new Set(),
        };
        this.spawnEnemy(child);
      }
    }
    const roll = this.rng.next();
    let kind = null;
    if (roll < PICKUPS.starChance) kind = 'star';
    else if (roll < PICKUPS.starChance + PICKUPS.heartChance) kind = 'heart';
    else if (roll < PICKUPS.starChance + PICKUPS.heartChance + PICKUPS.shardChance) kind = 'shard';
    if (kind) this.pickups.push(makePickup(kind, enemy.x, enemy.y));
  }

  collectPickup(pickup) {
    const p = this.player;
    if (pickup.kind === 'shard') {
      this.score += PICKUPS.shardScore;
      p.hp = Math.min(p.maxHp, p.hp + PICKUPS.shardHeal);
      this.texts.add(pickup.x, pickup.y - 12, `+${PICKUPS.shardScore}`, '#9be8ff');
    } else if (pickup.kind === 'heart') {
      p.hp = Math.min(p.maxHp, p.hp + PICKUPS.heartHeal);
      this.texts.add(pickup.x, pickup.y - 12, `+${PICKUPS.heartHeal} HP`, '#7be495');
    } else if (pickup.kind === 'star') {
      p.starTimer = PICKUPS.starTime;
      this.texts.add(pickup.x, pickup.y - 12, 'STARFLARE!', '#ffd76e');
    }
    this.sound.pickup();
    this.particles.burst(pickup.x, pickup.y, '#ffd76e', 8, 110, 0.35, 3);
  }

  updatePlaying(dt, input) {
    const p = this.player;
    this.time += dt;
    this.bannerTimer = Math.max(0, this.bannerTimer - dt);
    this.keepFlash = Math.max(0, this.keepFlash - dt);
    p.fireTimer = Math.max(0, p.fireTimer - dt);
    p.dashTimer = Math.max(0, p.dashTimer - dt);
    p.hurtTimer = Math.max(0, p.hurtTimer - dt);
    p.starTimer = Math.max(0, p.starTimer - dt);

    p.aim = Math.atan2(input.mouseY - p.y, input.mouseX - p.x);
    const axis = input.moveAxis();
    movePlayer(p, axis, dt);
    if (p.dashLeft > 0) {
      this.particles.trail(p.x, p.y, '#6ee7ff', 4);
    }
    if (input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight')) this.tryDash(axis);
    for (const click of input.clicks) {
      if (click.button === 2) this.tryDash(axis);
    }
    if (input.mouseDown || input.down('Space')) this.fireBullets();

    this.director.update(dt, (e) => this.spawnEnemy(e));

    const hasHerald = this.enemies.some((e) => e.type === 'herald');
    if (hasHerald) {
      this.heraldTimer -= dt;
      if (this.heraldTimer <= 0 && this.enemies.length < 14) {
        this.heraldTimer = 4;
        const herald = this.enemies.find((e) => e.type === 'herald');
        if (herald) {
          const angle = this.rng.angle();
          const mote = {
            type: 'mote', x: herald.x + Math.cos(angle) * 40, y: herald.y + Math.sin(angle) * 40,
            radius: 14, hp: 18, maxHp: 18, speed: 64, damage: 6, score: 25,
            flash: 0, wobble: 0, spawnTimer: 0, chargeTimer: 0, charging: 0,
            chargeX: 0, chargeY: 0, hitBy: new Set(),
          };
          const clamped = clampToArena(mote.x, mote.y, mote.radius);
          mote.x = clamped.x;
          mote.y = clamped.y;
          this.spawnEnemy(mote);
        }
      }
    }

    for (const enemy of this.enemies) {
      updateEnemy(enemy, dt, this.time, p, this.keepHp > 0);
      enemy.keepTimer = Math.max(0, (enemy.keepTimer || 0) - dt);
    }

    // Bullets move and strike foes.
    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const b = this.bullets[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      let dead = b.life <= 0;
      if (!dead) {
        const d = Math.hypot(b.x - ARENA.x, b.y - ARENA.y);
        if (d > ARENA.radius + 10) dead = true;
      }
      if (!dead) {
        for (const enemy of this.enemies) {
          if (enemy.hp <= 0 || b.hitIds.has(enemy.id)) continue;
          if (!circlesHit(b, enemy)) continue;
          b.hitIds.add(enemy.id);
          enemy.hp -= b.damage;
          enemy.flash = 0.12;
          this.shotsHit += 1;
          this.sound.hit();
          this.particles.burst(b.x, b.y, '#ffe9a8', 4, 90, 0.25, 2);
          if (b.hitIds.size > b.pierce) { dead = true; }
          break;
        }
      }
      if (dead) this.bullets.splice(i, 1);
    }

    // Fallen foes drop pickups; the living press the attack.
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      if (enemy.hp <= 0) {
        this.enemies.splice(i, 1);
        this.killEnemy(enemy);
        continue;
      }
      if (circlesHit(enemy, p)) this.damagePlayer(enemy.damage);
      if (this.state !== 'playing') return;
      const keepBody = { x: KEEP.x, y: KEEP.y, radius: KEEP.radius };
      if (circlesHit(enemy, keepBody) && enemy.keepTimer <= 0) {
        enemy.keepTimer = 0.8;
        this.damageKeep(enemy.damage);
        if (this.state !== 'playing') return;
      }
    }

    // Pickups drift toward the warden, then are collected on touch.
    for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
      const pickup = this.pickups[i];
      pickup.life -= dt;
      pickup.bob += dt * 3;
      if (pickup.life <= 0) {
        this.pickups.splice(i, 1);
        continue;
      }
      const d = Math.hypot(p.x - pickup.x, p.y - pickup.y);
      const magnet = PLAYER.pickupRadius * p.magnetMul;
      if (d < magnet + 60 && d > 1) {
        const pull = 190 * dt;
        pickup.x += ((p.x - pickup.x) / d) * pull;
        pickup.y += ((p.y - pickup.y) / d) * pull;
      }
      if (circlesHit(pickup, p)) {
        this.pickups.splice(i, 1);
        this.collectPickup(pickup);
      }
    }

    this.particles.update(dt);
    this.texts.update(dt);
    this.shake.update(dt);

    if (this.director.cleared(this.enemies.length)) {
      this.score += this.director.bonus();
      if (this.director.wave >= WAVES.length) {
        this.finish(true);
      } else {
        this.offer = drawUpgradeOffer(this.rng, 3);
        this.state = 'upgrade';
        this.banner = '';
      }
    }
  }

  update(dt, input) {
    if (this.frozen) return;
    if (input.wasPressed('KeyM')) this.toggleMute();
    if (this.state === 'playing') {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
        this.pause();
        return;
      }
      this.updatePlaying(dt, input);
      return;
    }
    if (this.state === 'paused') {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape') || input.wasPressed('Enter')) {
        this.resume();
      }
      if (input.wasPressed('KeyR')) this.startRun();
      return;
    }
    if (this.state === 'upgrade') {
      if (input.wasPressed('Digit1')) this.pickUpgrade(0);
      if (input.wasPressed('Digit2')) this.pickUpgrade(1);
      if (input.wasPressed('Digit3')) this.pickUpgrade(2);
      return;
    }
    if (this.state === 'title') {
      if (input.wasPressed('Enter') || input.wasPressed('Space')) this.startRun();
      return;
    }
    if (this.state === 'victory' || this.state === 'defeat') {
      if (input.wasPressed('KeyR') || input.wasPressed('Enter') || input.wasPressed('Space')) {
        this.startRun();
      }
    }
  }

  // Buttons are canvas rectangles the renderer draws; clicks are
  // tested here so keyboard and mouse stay in one place.
  buttons() {
    if (this.state === 'title') {
      return [{ id: 'start', x: 380, y: 452, w: 200, h: 52, label: 'START THE WATCH' }];
    }
    if (this.state === 'upgrade') {
      return this.offer.map((def, i) => ({
        id: `upgrade-${i}`, x: 150 + i * 230, y: 210, w: 200, h: 220, label: def.name,
      }));
    }
    if (this.state === 'paused') {
      return [
        { id: 'resume', x: 330, y: 320, w: 140, h: 48, label: 'RESUME' },
        { id: 'restart', x: 490, y: 320, w: 140, h: 48, label: 'RESTART' },
      ];
    }
    if (this.state === 'victory' || this.state === 'defeat') {
      return [{ id: 'again', x: 380, y: 470, w: 200, h: 52, label: 'PLAY AGAIN' }];
    }
    return [];
  }

  handleClick(x, y) {
    for (const b of this.buttons()) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.sound.click();
        if (b.id === 'start' || b.id === 'again') this.startRun();
        else if (b.id === 'resume') this.resume();
        else if (b.id === 'restart') this.startRun();
        else if (b.id.startsWith('upgrade-')) this.pickUpgrade(Number(b.id.slice(8)));
        return true;
      }
    }
    return false;
  }
}
