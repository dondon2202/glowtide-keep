// Particles, floating score text and screen shake. A fixed-size pool
// keeps per-frame allocation near zero during busy fights.

export class ParticlePool {
  constructor(capacity) {
    this.items = [];
    this.capacity = capacity;
  }

  burst(x, y, color, count, speed, life, size) {
    for (let i = 0; i < count; i += 1) {
      if (this.items.length >= this.capacity) this.items.shift();
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.85);
      this.items.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: life * (0.6 + Math.random() * 0.6),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
      });
    }
  }

  trail(x, y, color, size) {
    if (this.items.length >= this.capacity) return;
    this.items.push({
      x, y, vx: 0, vy: 0, life: 0.3, maxLife: 0.3, size, color,
    });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.items.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
    }
  }

  clear() {
    this.items.length = 0;
  }
}

export class FloatTexts {
  constructor() {
    this.items = [];
  }

  add(x, y, text, color) {
    this.items.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
    if (this.items.length > 24) this.items.shift();
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const t = this.items[i];
      t.life -= dt;
      t.y -= 34 * dt;
      if (t.life <= 0) this.items.splice(i, 1);
    }
  }

  clear() {
    this.items.length = 0;
  }
}

export class Shake {
  constructor() {
    this.strength = 0;
  }

  add(amount) {
    this.strength = Math.min(14, this.strength + amount);
  }

  offset() {
    if (this.strength <= 0.1) return { x: 0, y: 0 };
    return {
      x: (Math.random() * 2 - 1) * this.strength,
      y: (Math.random() * 2 - 1) * this.strength,
    };
  }

  update(dt) {
    this.strength = Math.max(0, this.strength - 26 * dt);
  }

  clear() {
    this.strength = 0;
  }
}
