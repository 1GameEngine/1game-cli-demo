import type { MonsterDef } from '../data/monsters';
import type { PlayerState } from './types';

export type CombatPreview = {
  heroHit: number;
  turns: number;
  monsterHit: number;
  damage: number;
  canFight: boolean;
};

export function previewCombat(
  player: Pick<PlayerState, 'hp' | 'atk' | 'def'>,
  monster: Pick<MonsterDef, 'hp' | 'atk' | 'def' | 'magicAtk' | 'preDamage' | 'lifeSteal'>,
): CombatPreview {
  const heroHit = Math.max(0, player.atk - monster.def);
  if (heroHit <= 0) {
    return { heroHit: 0, turns: Infinity, monsterHit: 0, damage: Infinity, canFight: false };
  }
  const turns = Math.ceil(monster.hp / heroHit);
  const monsterHit = Math.max(0, monster.atk - player.def) + (monster.magicAtk || 0);
  const lifeSteal = Math.floor((monster.lifeSteal || 0) * player.hp);
  const preDamage = monster.preDamage || 0;
  const damage = (turns - 1) * monsterHit + lifeSteal + preDamage;
  return {
    heroHit,
    turns,
    monsterHit,
    damage,
    canFight: player.hp > damage,
  };
}
