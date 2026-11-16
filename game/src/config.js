// Tuning and palette for Glowtide Keep. Every number the game balances
// lives here so a tuning pass touches one file.

export const VIEW = { width: 960, height: 600 };
export const ARENA = { x: 480, y: 300, radius: 252 };
export const KEEP = { x: 480, y: 300, radius: 26, maxHp: 100 };

export const PLAYER = {
  radius: 14,
  speed: 235,
  maxHp: 100,
  fireCooldown: 0.17,
  bulletSpeed: 540,
  bulletDamage: 12,
  bulletLife: 1.15,
  dashTime: 0.16,
  dashSpeed: 760,
  dashCooldown: 2.1,
  pickupRadius: 34,
  contactGrace: 0.55,
};

export const ENEMY_TYPES = {
  mote: {
    label: 'Gloom Mote', radius: 14, hp: 24, speed: 56, damage: 8,
    score: 50, target: 'keep', color: '#8b5cc7', eye: '#ffd76e',
  },
  dartwing: {
    label: 'Dartwing', radius: 11, hp: 14, speed: 112, damage: 6,
    score: 80, target: 'player', color: '#4ec9b0', eye: '#ffffff',
  },
  bulwark: {
    label: 'Bulwark', radius: 22, hp: 92, speed: 34, damage: 16,
    score: 150, target: 'keep', color: '#5b6ee1', eye: '#ff8fa3',
  },
  herald: {
    label: 'Gloom Herald', radius: 30, hp: 430, speed: 42, damage: 20,
    score: 1000, target: 'player', color: '#c94f7c', eye: '#ffe066',
  },
};

// One entry per wave: what spawns, how fast, and the clear bonus.
export const WAVES = [
  { mote: 8, dartwing: 0, bulwark: 0, herald: 0, interval: 1.15, bonus: 100 },
  { mote: 10, dartwing: 4, bulwark: 0, herald: 0, interval: 1.0, bonus: 150 },
  { mote: 12, dartwing: 6, bulwark: 2, herald: 0, interval: 0.9, bonus: 200 },
  { mote: 14, dartwing: 8, bulwark: 3, herald: 0, interval: 0.8, bonus: 250 },
  { mote: 6, dartwing: 4, bulwark: 2, herald: 1, interval: 0.9, bonus: 400 },
];

export const PICKUPS = {
  shardChance: 0.18,
  heartChance: 0.06,
  starChance: 0.04,
  shardScore: 25,
  shardHeal: 2,
  heartHeal: 12,
  starTime: 6,
  life: 9,
};

export const PALETTE = {
  skyTop: '#0a1626',
  skyBottom: '#0e2f3a',
  sea: '#0c2531',
  arenaFloor: '#16394a',
  arenaEdge: '#2b6b7a',
  rune: '#3fd2c0',
  player: '#ffb84d',
  playerCloak: '#2dd4bf',
  keepCrystal: '#6ee7ff',
  keepStone: '#3a4a63',
  text: '#eaf6f1',
  dimText: '#9db8c4',
  danger: '#ff6b7a',
  gold: '#ffd76e',
};
