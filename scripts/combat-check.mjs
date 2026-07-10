function previewCombat(player, monster) {
  const heroHit = Math.max(0, player.atk - monster.def);
  if (heroHit <= 0) {
    return { heroHit: 0, turns: Infinity, monsterHit: 0, damage: Infinity, canFight: false };
  }
  const turns = Math.ceil(monster.hp / heroHit);
  const monsterHit = Math.max(0, monster.atk - player.def) + (monster.magicAtk || 0);
  const lifeSteal = Math.floor((monster.lifeSteal || 0) * player.hp);
  const preDamage = monster.preDamage || 0;
  const damage = (turns - 1) * monsterHit + lifeSteal + preDamage;
  return { heroHit, turns, monsterHit, damage, canFight: player.hp > damage };
}

const green = { hp: 50, atk: 20, def: 1, magicAtk: 0, preDamage: 0, lifeSteal: 0 };
const player = { hp: 1000, atk: 10, def: 10 };
const r = previewCombat(player, green);
if (r.heroHit !== 9) throw new Error(`heroHit ${r.heroHit}`);
if (r.turns !== 6) throw new Error(`turns ${r.turns}`);
if (r.damage !== 50) throw new Error(`damage ${r.damage}`);
if (!r.canFight) throw new Error('should fight');

const hard = previewCombat(
  { hp: 1000, atk: 10, def: 10 },
  { hp: 50, atk: 100, def: 100, magicAtk: 0, preDamage: 0, lifeSteal: 0 },
);
if (hard.canFight) throw new Error('should not fight high def');

const mage = previewCombat(
  { hp: 1000, atk: 200, def: 50 },
  { hp: 250, atk: 120, def: 70, magicAtk: 0, preDamage: 100, lifeSteal: 0 },
);
if (mage.damage !== 170) throw new Error(`mage dmg ${mage.damage}`);

const steal = previewCombat(
  { hp: 1000, atk: 500, def: 200 },
  { hp: 1300, atk: 300, def: 150, magicAtk: 0, preDamage: 0, lifeSteal: 0.25 },
);
// heroHit=350, turns=4, monsterHit=100, dmg=3*100+250=550
if (steal.damage !== 550) throw new Error(`steal dmg ${steal.damage}`);

console.log('combat unit OK');
