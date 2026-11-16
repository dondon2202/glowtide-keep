// All drawing for Glowtide Keep. Every picture is drawn in code on
// one canvas: gradient sea and sky, aurora, the stone arena, the
// crystal Keep, the warden, foes, pickups, particles and every menu.
// Nothing is loaded from a file, so the game never makes a request.

import { ARENA, KEEP, PALETTE, VIEW } from './config.js';
import { SeededRandom } from './rng.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const trial = line === '' ? word : `${line} ${word}`;
    if (ctx.measureText(trial).width > maxWidth && line !== '') {
      lines.push(line);
      line = word;
    } else {
      line = trial;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    const rng = new SeededRandom(7);
    this.stars = [];
    for (let i = 0; i < 90; i += 1) {
      this.stars.push({
        x: rng.range(0, VIEW.width), y: rng.range(0, 240),
        r: rng.range(0.6, 1.8), tw: rng.range(0, Math.PI * 2),
      });
    }
    this.resize();
  }

  resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect.width));
    const h = Math.max(200, Math.round(rect.height));
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.scale = this.canvas.width / VIEW.width;
    this.dpr = dpr;
  }

  toLogical(px, py, rectW, rectH) {
    const s = Math.min(rectW / VIEW.width, rectH / VIEW.height);
    const ox = (rectW - VIEW.width * s) / 2;
    const oy = (rectH - VIEW.height * s) / 2;
    return { x: (px - ox) / s, y: (py - oy) / s };
  }

  beginFrame(game) {
    const ctx = this.ctx;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    const shake = game.shake.offset();
    ctx.translate(shake.x, shake.y);
    return ctx;
  }

  drawBackground(ctx, now) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
    g.addColorStop(0, PALETTE.skyTop);
    g.addColorStop(0.55, PALETTE.skyBottom);
    g.addColorStop(1, PALETTE.sea);
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, VIEW.width + 40, VIEW.height + 40);
    for (const s of this.stars) {
      const a = 0.45 + 0.4 * Math.sin(now * 1.4 + s.tw);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#d9f4ff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Aurora ribbons.
    const bands = [
      { y: 58, amp: 16, color: 'rgba(63,210,192,0.20)', speed: 0.35 },
      { y: 92, amp: 22, color: 'rgba(139,92,199,0.16)', speed: 0.22 },
      { y: 126, amp: 14, color: 'rgba(110,231,255,0.14)', speed: 0.5 },
    ];
    for (const band of bands) {
      ctx.fillStyle = band.color;
      ctx.beginPath();
      ctx.moveTo(0, band.y + 30);
      for (let x = 0; x <= VIEW.width; x += 24) {
        ctx.lineTo(x, band.y + Math.sin(x * 0.008 + now * band.speed) * band.amp);
      }
      for (let x = VIEW.width; x >= 0; x -= 24) {
        ctx.lineTo(x, band.y + 34 + Math.sin(x * 0.01 + now * band.speed + 1.7) * band.amp);
      }
      ctx.closePath();
      ctx.fill();
    }
    // Moon glow.
    const moon = ctx.createRadialGradient(828, 74, 6, 828, 74, 70);
    moon.addColorStop(0, 'rgba(255,240,200,0.9)');
    moon.addColorStop(0.25, 'rgba(255,240,200,0.35)');
    moon.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(748, -6, 160, 160);
    ctx.fillStyle = '#fff3cf';
    ctx.beginPath();
    ctx.arc(828, 74, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  drawArena(ctx, now) {
    // Sea shimmer rings.
    ctx.strokeStyle = 'rgba(63,210,192,0.18)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(ARENA.x, ARENA.y, ARENA.radius + 26 + i * 22 + Math.sin(now + i) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.arenaFloor;
    ctx.beginPath();
    ctx.arc(ARENA.x, ARENA.y, ARENA.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.arenaEdge;
    ctx.lineWidth = 5;
    ctx.stroke();
    // Stone rings and runes.
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    for (const r of [90, 150, 205]) {
      ctx.beginPath();
      ctx.arc(ARENA.x, ARENA.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.rune;
    ctx.globalAlpha = 0.55 + 0.2 * Math.sin(now * 1.8);
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      const x = ARENA.x + Math.cos(a) * 208;
      const y = ARENA.y + Math.sin(a) * 208;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillRect(-2, -9, 4, 18);
      ctx.fillRect(-7, -2, 14, 4);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  drawKeep(ctx, game, now) {
    const pulse = 1 + 0.08 * Math.sin(now * 2.4);
    const glow = ctx.createRadialGradient(KEEP.x, KEEP.y, 8, KEEP.x, KEEP.y, 74 * pulse);
    glow.addColorStop(0, game.keepFlash > 0 ? 'rgba(255,107,122,0.55)' : 'rgba(110,231,255,0.45)');
    glow.addColorStop(1, 'rgba(110,231,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(KEEP.x - 80, KEEP.y - 80, 160, 160);
    // Stone base.
    ctx.fillStyle = PALETTE.keepStone;
    ctx.beginPath();
    ctx.arc(KEEP.x, KEEP.y + 12, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a5d7d';
    ctx.beginPath();
    ctx.arc(KEEP.x, KEEP.y + 10, 24, 0, Math.PI * 2);
    ctx.fill();
    // Crystal.
    ctx.save();
    ctx.translate(KEEP.x, KEEP.y - 6);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = PALETTE.keepCrystal;
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(16, -4);
    ctx.lineTo(0, 26);
    ctx.lineTo(-16, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.lineTo(7, -4);
    ctx.lineTo(0, 26);
    ctx.lineTo(-4, -4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Keep health ring.
    const frac = Math.max(0, game.keepHp / KEEP.maxHp);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(KEEP.x, KEEP.y, 40, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = frac > 0.35 ? '#6ee7ff' : '#ff6b7a';
    ctx.beginPath();
    ctx.arc(KEEP.x, KEEP.y, 40, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
  }

  drawPickups(ctx, game) {
    for (const p of game.pickups) {
      const bob = Math.sin(p.bob) * 3;
      const fade = p.life < 2 ? 0.4 + 0.6 * Math.abs(Math.sin(p.life * 6)) : 1;
      ctx.globalAlpha = fade;
      ctx.save();
      ctx.translate(p.x, p.y + bob);
      if (p.kind === 'shard') {
        ctx.fillStyle = '#9be8ff';
        ctx.beginPath();
        ctx.moveTo(0, -11);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, 11);
        ctx.lineTo(-8, 0);
        ctx.closePath();
        ctx.fill();
      } else if (p.kind === 'heart') {
        ctx.fillStyle = '#7be495';
        ctx.beginPath();
        ctx.arc(-4, -3, 6, 0, Math.PI * 2);
        ctx.arc(4, -3, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-9, 0);
        ctx.lineTo(0, 11);
        ctx.lineTo(9, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#ffd76e';
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? 12 : 5;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  drawEnemies(ctx, game) {
    for (const e of game.enemies) {
      const wob = Math.sin(e.wobble) * 2;
      ctx.save();
      ctx.translate(e.x, e.y + wob * 0.4);
      const isHerald = e.type === 'herald';
      const body = e.flash > 0 ? '#ffffff' : this.enemyColor(e.type);
      if (e.type === 'mote') {
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-8, e.radius - 4, 6, 0, Math.PI * 2);
        ctx.arc(8, e.radius - 4, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (e.type === 'dartwing') {
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(0, -e.radius);
        ctx.lineTo(e.radius + 6, e.radius);
        ctx.lineTo(0, e.radius - 4);
        ctx.lineTo(-e.radius - 6, e.radius);
        ctx.closePath();
        ctx.fill();
      } else if (e.type === 'bulwark') {
        ctx.fillStyle = body;
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const a = (i / 6) * Math.PI * 2;
          const x = Math.cos(a) * e.radius;
          const y = Math.sin(a) * e.radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd76e';
        ctx.beginPath();
        ctx.moveTo(-16, -e.radius + 4);
        ctx.lineTo(-8, -e.radius - 12);
        ctx.lineTo(0, -e.radius + 2);
        ctx.lineTo(8, -e.radius - 12);
        ctx.lineTo(16, -e.radius + 4);
        ctx.closePath();
        ctx.fill();
      }
      // Eyes face the warden.
      ctx.fillStyle = this.enemyEye(e.type);
      const eyeY = isHerald ? -4 : -3;
      ctx.beginPath();
      ctx.arc(-5, eyeY, isHerald ? 4 : 3, 0, Math.PI * 2);
      ctx.arc(5, eyeY, isHerald ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
      if (e.charging > 0) {
        ctx.strokeStyle = '#ff6b7a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, e.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      if (e.hp < e.maxHp) {
        const w = e.radius * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(e.x - e.radius, e.y - e.radius - 10, w, 5);
        ctx.fillStyle = '#ff8fa3';
        ctx.fillRect(e.x - e.radius, e.y - e.radius - 10, w * Math.max(0, e.hp / e.maxHp), 5);
      }
    }
  }

  enemyColor(type) {
    if (type === 'dartwing') return '#2e9d86';
    if (type === 'bulwark') return '#4658b8';
    if (type === 'herald') return '#a83a63';
    return '#6d4aa8';
  }

  enemyEye(type) {
    if (type === 'dartwing') return '#ffffff';
    return '#ffd76e';
  }

  drawBullets(ctx, game) {
    for (const b of game.bullets) {
      const glow = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 12);
      glow.addColorStop(0, 'rgba(255,233,168,0.95)');
      glow.addColorStop(1, 'rgba(255,184,77,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(b.x - 12, b.y - 12, 24, 24);
      ctx.fillStyle = '#fff3cf';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawPlayer(ctx, game, now) {
    const p = game.player;
    if (p.hurtTimer > 0 && Math.floor(now * 16) % 2 === 0) return;
    const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 46);
    glow.addColorStop(0, 'rgba(255,184,77,0.5)');
    glow.addColorStop(1, 'rgba(255,184,77,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - 46, p.y - 46, 92, 92);
    // Aim guide.
    ctx.strokeStyle = 'rgba(255,233,168,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.aim) * 20, p.y + Math.sin(p.aim) * 20);
    ctx.lineTo(p.x + Math.cos(p.aim) * 52, p.y + Math.sin(p.aim) * 52);
    ctx.stroke();
    ctx.setLineDash([]);
    // Cloak body.
    ctx.fillStyle = PALETTE.playerCloak;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1d7a6e';
    ctx.beginPath();
    ctx.arc(p.x, p.y + 4, p.radius - 5, 0, Math.PI * 2);
    ctx.fill();
    // Hood and lantern.
    ctx.fillStyle = '#eaf6f1';
    ctx.beginPath();
    ctx.arc(p.x, p.y - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    const lx = p.x + Math.cos(p.aim) * 15;
    const ly = p.y + Math.sin(p.aim) * 15;
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fill();
    if (p.starTimer > 0) {
      ctx.strokeStyle = '#ffd76e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius + 5 + Math.sin(now * 8) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawParticles(ctx, game) {
    for (const p of game.particles.items) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px system-ui, sans-serif';
    for (const t of game.texts.items) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  drawBar(ctx, x, y, w, h, frac, fill, label) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = fill;
    if (frac > 0) {
      roundRect(ctx, x + 2, y + 2, Math.max(0, (w - 4) * frac), h - 4, (h - 4) / 2);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 8, y + h - 5);
  }

  drawHud(ctx, game, input) {
    ctx.fillStyle = 'rgba(4,18,28,0.72)';
    roundRect(ctx, 14, 12, 300, 54, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE ${game.score}`, 28, 36);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.dimText;
    ctx.fillText(`BEST ${game.best}   KILLS ${game.kills}`, 28, 56);

    ctx.fillStyle = 'rgba(4,18,28,0.72)';
    roundRect(ctx, 380, 12, 200, 54, 10);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`WAVE ${game.director.wave} / ${game.director.totalWaves}`, 480, 36);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.dimText;
    ctx.fillText(`FOES LEFT ${game.director.remaining(game.enemies.length)}`, 480, 56);

    ctx.fillStyle = 'rgba(4,18,28,0.72)';
    roundRect(ctx, 646, 12, 300, 54, 10);
    ctx.fill();
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 18px system-ui, sans-serif';
    const mins = Math.floor(game.time / 60);
    const secs = Math.floor(game.time % 60).toString().padStart(2, '0');
    ctx.fillText(`${mins}:${secs}`, 932, 36);
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.dimText;
    ctx.fillText(game.muted ? 'SOUND OFF  [M]' : 'SOUND ON  [M]  ·  PAUSE  [P]', 932, 56);

    const p = game.player;
    this.drawBar(ctx, 14, 548, 260, 22, p.hp / p.maxHp, p.hp > 30 ? '#7be495' : '#ff6b7a', `WARDEN ${Math.ceil(p.hp)}`);
    this.drawBar(ctx, 350, 548, 260, 22, game.keepHp / KEEP.maxHp, '#6ee7ff', `KEEP ${Math.ceil(game.keepHp)}`);
    // Dash pip.
    ctx.fillStyle = 'rgba(4,18,28,0.72)';
    roundRect(ctx, 646, 540, 300, 38, 10);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.text;
    const dashReady = p.dashTimer <= 0;
    ctx.fillText(dashReady ? 'DASH READY  [SHIFT]' : `DASH ${p.dashTimer.toFixed(1)}s`, 660, 564);
    if (p.starTimer > 0) {
      ctx.fillStyle = '#ffd76e';
      ctx.textAlign = 'right';
      ctx.fillText(`STARFLARE ${p.starTimer.toFixed(1)}s`, 932, 564);
    }
    void input;
  }

  drawBanner(ctx, game) {
    if (game.bannerTimer <= 0 || game.banner === '') return;
    const a = Math.min(1, game.bannerTimer);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.fillStyle = '#ffd76e';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 10;
    ctx.fillText(game.banner, 480, 120);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  drawButton(ctx, b, hover) {
    ctx.fillStyle = hover ? '#ffb84d' : '#e8a33d';
    roundRect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fill();
    ctx.strokeStyle = '#fff3cf';
    ctx.lineWidth = 2;
    roundRect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.stroke();
    ctx.fillStyle = '#241505';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 6);
  }

  hoverButton(game, input) {
    return game.buttons().find((b) => (
      input.mouseX >= b.x && input.mouseX <= b.x + b.w
      && input.mouseY >= b.y && input.mouseY <= b.y + b.h
    ));
  }

  drawTitle(ctx, game, input, now) {
    ctx.fillStyle = 'rgba(4,18,28,0.45)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76e';
    ctx.font = 'bold 62px system-ui, sans-serif';
    ctx.shadowColor = 'rgba(255,184,77,0.45)';
    ctx.shadowBlur = 22;
    ctx.fillText('GLOWTIDE KEEP', 480, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('Hold the light through five waves of the Gloom.', 480, 186);
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.dimText;
    ctx.fillText('Guard the crystal Keep. Guard yourself. Choose a boon after every wave.', 480, 212);

    ctx.fillStyle = 'rgba(4,18,28,0.78)';
    roundRect(ctx, 260, 248, 440, 150, 14);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = '16px system-ui, sans-serif';
    const lines = [
      'MOVE   WASD or Arrow keys',
      'AIM   Mouse      SHOOT   Hold Click or Space',
      'DASH   Shift or Right-click  (briefly untouchable)',
      'PICKUPS   Shards heal and score  ·  Hearts heal  ·  Stars flare',
      'PAUSE  P      SOUND  M      RESTART  R',
    ];
    lines.forEach((line, i) => ctx.fillText(line, 286, 282 + i * 26));
    if (game.best > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd76e';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(`BEST SCORE  ${game.best}`, 480, 428);
    }
    const hover = this.hoverButton(game, input);
    for (const b of game.buttons()) this.drawButton(ctx, b, hover === b);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.dimText;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Click START or press Enter.  Sound starts on your first key or click.', 480, 536);
    void now;
  }

  drawUpgradeCard(ctx, def, rect, keyLabel, hover) {
    ctx.fillStyle = hover ? 'rgba(30,64,84,0.96)' : 'rgba(10,32,46,0.94)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
    ctx.fill();
    ctx.strokeStyle = hover ? '#ffd76e' : 'rgba(110,231,255,0.5)';
    ctx.lineWidth = hover ? 3 : 2;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
    ctx.stroke();
    // Icon.
    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + 52);
    ctx.fillStyle = '#ffd76e';
    if (def.icon === 'shot') {
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#241505';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (def.icon === 'bolt') {
      ctx.beginPath();
      ctx.moveTo(4, -18);
      ctx.lineTo(-10, 2);
      ctx.lineTo(-1, 2);
      ctx.lineTo(-4, 18);
      ctx.lineTo(10, -2);
      ctx.lineTo(1, -2);
      ctx.closePath();
      ctx.fill();
    } else if (def.icon === 'heart') {
      ctx.fillStyle = '#7be495';
      ctx.beginPath();
      ctx.arc(-6, -4, 8, 0, Math.PI * 2);
      ctx.arc(6, -4, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-13, 0);
      ctx.lineTo(0, 15);
      ctx.lineTo(13, 0);
      ctx.closePath();
      ctx.fill();
    } else if (def.icon === 'keep') {
      ctx.fillStyle = '#6ee7ff';
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 18);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#241505';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('+', 0, 6);
    }
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(def.name, rect.x + rect.w / 2, rect.y + 104);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.dimText;
    const lines = wrapLines(ctx, def.desc, rect.w - 32);
    lines.forEach((line, i) => {
      ctx.fillText(line, rect.x + rect.w / 2, rect.y + 132 + i * 20);
    });
    ctx.fillStyle = '#ffd76e';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText(`[${keyLabel}]`, rect.x + rect.w / 2, rect.y + rect.h - 16);
  }

  drawUpgrade(ctx, game, input) {
    ctx.fillStyle = 'rgba(4,18,28,0.62)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76e';
    ctx.font = 'bold 36px system-ui, sans-serif';
    ctx.fillText('WAVE CLEARED — CHOOSE A BOON', 480, 150);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`Score ${game.score}  ·  Next: Wave ${game.director.wave + 1} of ${game.director.totalWaves}`, 480, 180);
    const hover = this.hoverButton(game, input);
    const rects = game.buttons();
    game.offer.forEach((def, i) => {
      this.drawUpgradeCard(ctx, def, rects[i], String(i + 1), hover === rects[i]);
    });
    ctx.fillStyle = PALETTE.dimText;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Click a card or press 1, 2 or 3.', 480, 470);
  }

  drawPaused(ctx, game, input) {
    ctx.fillStyle = 'rgba(4,18,28,0.7)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.fillText('PAUSED', 480, 250);
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = PALETTE.dimText;
    ctx.fillText('The tide waits. WASD move · Mouse aim · Click shoot · Shift dash', 480, 282);
    const hover = this.hoverButton(game, input);
    for (const b of game.buttons()) this.drawButton(ctx, b, hover === b);
    ctx.fillStyle = PALETTE.dimText;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('P or Esc resumes · R restarts · M toggles sound', 480, 410);
  }

  drawEnd(ctx, game, input) {
    const stats = game.endStats || {
      won: false, score: game.score, best: game.best, isBest: false,
      kills: game.kills, accuracy: 0, time: game.time, wave: game.director.wave,
    };
    ctx.fillStyle = stats.won ? 'rgba(8,34,30,0.72)' : 'rgba(30,8,18,0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = stats.won ? '#ffd76e' : '#ff8fa3';
    ctx.font = 'bold 46px system-ui, sans-serif';
    ctx.fillText(stats.won ? 'THE TIDE HOLDS' : 'THE LIGHT FADES', 480, 170);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText(
      stats.won
        ? 'Five waves weathered. The Keep still burns bright.'
        : 'The Gloom takes the harbor this time. The lantern can be lit again.',
      480, 202,
    );
    ctx.fillStyle = 'rgba(4,18,28,0.8)';
    roundRect(ctx, 300, 232, 360, 168, 14);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = '17px system-ui, sans-serif';
    const mins = Math.floor(stats.time / 60);
    const secs = Math.floor(stats.time % 60).toString().padStart(2, '0');
    const rows = [
      ['SCORE', String(stats.score)],
      ['BEST', String(stats.best) + (stats.isBest ? '  ★ NEW BEST' : '')],
      ['FOES FELLED', String(stats.kills)],
      ['ACCURACY', `${stats.accuracy}%`],
      ['TIME', `${mins}:${secs}   ·   WAVE ${stats.wave}`],
    ];
    rows.forEach(([label, value], i) => {
      const y = 264 + i * 30;
      ctx.fillStyle = PALETTE.dimText;
      ctx.fillText(label, 326, y);
      ctx.fillStyle = PALETTE.text;
      ctx.textAlign = 'right';
      ctx.fillText(value, 634, y);
      ctx.textAlign = 'left';
    });
    const hover = this.hoverButton(game, input);
    for (const b of game.buttons()) this.drawButton(ctx, b, hover === b);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.dimText;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('Click PLAY AGAIN or press R.', 480, 552);
  }

  render(game, input, now) {
    const ctx = this.beginFrame(game);
    this.drawBackground(ctx, now);
    this.drawArena(ctx, now);
    this.drawKeep(ctx, game, now);
    if (game.state !== 'title') {
      this.drawPickups(ctx, game);
      this.drawEnemies(ctx, game);
      this.drawBullets(ctx, game);
      this.drawPlayer(ctx, game, now);
      this.drawParticles(ctx, game);
    }
    if (game.state === 'playing' || game.state === 'paused' || game.state === 'upgrade') {
      this.drawHud(ctx, game, input);
      this.drawBanner(ctx, game);
    }
    if (game.state === 'title') this.drawTitle(ctx, game, input, now);
    else if (game.state === 'upgrade') this.drawUpgrade(ctx, game, input);
    else if (game.state === 'paused') this.drawPaused(ctx, game, input);
    else if (game.state === 'victory' || game.state === 'defeat') this.drawEnd(ctx, game, input);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
