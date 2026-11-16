// Entities: the warden, bullets, foes and pickups. Movement and hit
// tests live here; the Game class owns spawning, scoring and waves.

import { ARENA, ENEMY_TYPES, KEEP, PLAYER } from './config.js';

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function clampToArena(x, y, radius) {
  const d = dist(x, y, ARENA.x, ARENA.y);
  const max = ARENA.radius - radius;
  if (d <= max) return { x, y };
  const s = max / Math.max(0.001, d);
  return { x: ARENA.x + (x - ARENA.x) * s, y: ARENA.y + (y - ARENA.y) * s };
}

export function makePlayer() {
  return {
    x: ARENA.x, y: ARENA.y + 120, radius: PLAYER.radius,
    hp: PLAYER.maxHp, maxHp: PLAYER.maxHp,
    aim: -Math.PI / 2, fireTimer: 0, dashTimer: 0, dashLeft: 0,
    dashX: 0, dashY: -1, hurtTimer: 0, starTimer: 0,
    fireRateMul: 1, damageMul: 1, spread: 1, pierce: 0,
    magnetMul: 1, speedMul: 1,
  };
}

export function makeEnemy(type, x, y, wave) {
  const def = ENEMY_TYPES[type];
  const hpScale = 1 + (wave - 1) * 0.12;
  return {
    type, x, y, radius: def.radius,
    hp: Math.round(def.hp * hpScale), maxHp: Math.round(def.hp * hpScale),
    speed: def.speed * (1 + (wave - 1) * 0.04),
    damage: def.damage, score: def.score,
    flash: 0, wobble: Math.random() * Math.PI * 2,
    spawnTimer: 0, chargeTimer: 0, charging: 0, chargeX: 0, chargeY: 0,
    hitBy: new Set(),
  };
}

export function makeBullet(x, y, angle, damage, pierce, owner) {
  return {
    x, y, vx: Math.cos(angle) * PLAYER.bulletSpeed,
    vy: Math.sin(angle) * PLAYER.bulletSpeed,
    radius: 4, damage, pierce, life: PLAYER.bulletLife,
    hitIds: new Set(), owner,
  };
}

export function makePickup(kind, x, y) {
  return { kind, x, y, radius: 11, life: 9, bob: Math.random() * Math.PI * 2 };
}

export function movePlayer(player, axis, dt) {
  if (player.dashLeft > 0) {
    player.dashLeft -= dt;
    player.x += player.dashX * PLAYER.dashSpeed * dt;
    player.y += player.dashY * PLAYER.dashSpeed * dt;
  } else {
    player.x += axis.x * PLAYER.speed * player.speedMul * dt;
    player.y += axis.y * PLAYER.speed * player.speedMul * dt;
  }
  const clamped = clampToArena(player.x, player.y, player.radius);
  player.x = clamped.x;
  player.y = clamped.y;
}

export function updateEnemy(enemy, dt, time, player, keepAlive) {
  enemy.flash = Math.max(0, enemy.flash - dt);
  enemy.wobble += dt * 3;
  const def = ENEMY_TYPES[enemy.type];
  let tx;
  let ty;
  if (def.target === 'player' || !keepAlive) {
    tx = player.x;
    ty = player.y;
  } else {
    tx = KEEP.x;
    ty = KEEP.y;
  }
  let dx = tx - enemy.x;
  let dy = ty - enemy.y;
  const d = Math.max(0.001, Math.hypot(dx, dy));
  dx /= d;
  dy /= d;

  if (enemy.type === 'dartwing') {
    const perpX = -dy;
    const perpY = dx;
    const sway = Math.sin(enemy.wobble * 2.2) * 0.65;
    dx += perpX * sway;
    dy += perpY * sway;
    const len = Math.max(0.001, Math.hypot(dx, dy));
    dx /= len;
    dy /= len;
  }

  if (enemy.type === 'herald') {
    enemy.chargeTimer -= dt;
    if (enemy.charging > 0) {
      enemy.charging -= dt;
      enemy.x += enemy.chargeX * 300 * dt;
      enemy.y += enemy.chargeY * 300 * dt;
      return;
    }
    if (enemy.chargeTimer <= 0 && d < 260) {
      enemy.charging = 0.55;
      enemy.chargeTimer = 3.2;
      enemy.chargeX = dx;
      enemy.chargeY = dy;
      return;
    }
  }

  enemy.x += dx * enemy.speed * dt;
  enemy.y += dy * enemy.speed * dt;
  void time;
}

export function circlesHit(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const r = a.radius + b.radius;
  return dx * dx + dy * dy <= r * r;
}
