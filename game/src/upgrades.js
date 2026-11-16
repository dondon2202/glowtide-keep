// Between-wave upgrades. The player picks one of three cards after
// each cleared wave; each upgrade stacks and changes how the next
// wave is fought. Choices are drawn without repeating the same
// card in one offer.

export const UPGRADE_DEFS = [
  {
    id: 'swift-shot', name: 'Swift Lantern', icon: 'shot',
    desc: 'Shoot 20% faster. Lantern bolts fly in a quicker stream.',
    apply: (p) => { p.fireRateMul *= 0.8; },
  },
  {
    id: 'bright-bolt', name: 'Bright Bolt', icon: 'bolt',
    desc: 'Bolts deal 30% more damage. Fewer hits per foe.',
    apply: (p) => { p.damageMul *= 1.3; },
  },
  {
    id: 'twin-flame', name: 'Twin Flame', icon: 'spread',
    desc: 'Fire one extra bolt beside each shot. Wide and hungry.',
    apply: (p) => { p.spread += 1; },
  },
  {
    id: 'piercing-light', name: 'Piercing Light', icon: 'pierce',
    desc: 'Bolts pass through one extra foe before fading.',
    apply: (p) => { p.pierce += 1; },
  },
  {
    id: 'sturdy-cloak', name: 'Sturdy Cloak', icon: 'heart',
    desc: 'Gain 25 max health and heal 25 now.',
    apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); },
  },
  {
    id: 'quickstep', name: 'Quickstep', icon: 'dash',
    desc: 'Dash recharges 35% faster and you move 10% faster.',
    apply: (p) => { p.speedMul *= 1.1; p.dashCooldownMul = (p.dashCooldownMul || 1) * 0.65; },
  },
  {
    id: 'shard-magnet', name: 'Shard Magnet', icon: 'magnet',
    desc: 'Pickups drift to you from twice as far away.',
    apply: (p) => { p.magnetMul *= 2; },
  },
  {
    id: 'keep-mend', name: 'Keep Mend', icon: 'keep',
    desc: 'Repair the Keep by 40 and harden it: foes deal less to it.',
    apply: (p, game) => { game.healKeep(40); game.keepArmor = (game.keepArmor || 0) + 0.15; },
  },
];

export function drawUpgradeOffer(rng, count) {
  const pool = UPGRADE_DEFS.slice();
  const offer = [];
  while (offer.length < count && pool.length > 0) {
    const i = Math.floor(rng.next() * pool.length);
    offer.push(pool.splice(i, 1)[0]);
  }
  return offer;
}
