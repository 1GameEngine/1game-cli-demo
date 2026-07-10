export type ShopOption = {
  label: string;
  action: string;
};

export type ShopDef = {
  id: string;
  title: string;
  text: string;
  options: ShopOption[];
};

export const SHOPS: Record<string, ShopDef> = {
  goldShopF3: {
    id: 'goldShopF3',
    title: '金币商店',
    text: '想要增加你的能力吗？\n如果你有 25 个金币，你可以任意选择一项：',
    options: [
      { label: '生命+800', action: 'gold3_hp' },
      { label: '攻击+4', action: 'gold3_atk' },
      { label: '防御+4', action: 'gold3_def' },
      { label: '离开', action: 'leave' },
    ],
  },
  goldShopF11: {
    id: 'goldShopF11',
    title: '金币商店',
    text: '想要增加你的能力吗？\n如果你有 100 个金币，你可以任意选择一项：',
    options: [
      { label: '生命+4000', action: 'gold11_hp' },
      { label: '攻击+20', action: 'gold11_atk' },
      { label: '防御+20', action: 'gold11_def' },
      { label: '离开', action: 'leave' },
    ],
  },
  keyShopF5: {
    id: 'keyShopF5',
    title: '钥匙商人',
    text: '相信你一定有特殊的需要，只要你有金币，我就可以帮你：',
    options: [
      { label: '购买1把黄钥匙(10金币)', action: 'buy_yk' },
      { label: '购买1把蓝钥匙(50金币)', action: 'buy_bk' },
      { label: '购买1把红钥匙(100金币)', action: 'buy_rk' },
      { label: '离开', action: 'leave' },
    ],
  },
  keyShopF12: {
    id: 'keyShopF12',
    title: '钥匙商人',
    text: '哦，欢迎你的到来，如果你手里缺少金币，我可以帮你：',
    options: [
      { label: '卖出1把黄钥匙(7金币)', action: 'sell_yk' },
      { label: '卖出1把蓝钥匙(35金币)', action: 'sell_bk' },
      { label: '卖出1把红钥匙(70金币)', action: 'sell_rk' },
      { label: '离开', action: 'leave' },
    ],
  },
  expElderF5: {
    id: 'expElderF5',
    title: '经验老人',
    text: '你好，英雄的人类，只要你有足够的经验，我就可以让你变得更强大：',
    options: [
      { label: '提升1级(100经验)', action: 'exp5_lv' },
      { label: '攻击+5(30经验)', action: 'exp5_atk' },
      { label: '防御+5(30经验)', action: 'exp5_def' },
      { label: '离开', action: 'leave' },
    ],
  },
  expElderF13: {
    id: 'expElderF13',
    title: '经验老人',
    text: '你好，英雄的人类，只要你有足够的经验，我就可以让你变得更强大：',
    options: [
      { label: '提升3级(270经验)', action: 'exp13_lv' },
      { label: '攻击+17(95经验)', action: 'exp13_atk' },
      { label: '防御+17(95经验)', action: 'exp13_def' },
      { label: '离开', action: 'leave' },
    ],
  },
  elderF15: {
    id: 'elderF15',
    title: '老人',
    text: '我将给你一把非常好的剑，它可以使你的攻击力提升120点，但这必须用你的 500 点经验来进行交换，考虑一下吧！',
    options: [
      { label: '交换宝剑', action: 'f15_sword' },
      { label: '我再想想', action: 'leave' },
    ],
  },
  merchantF15: {
    id: 'merchantF15',
    title: '商人',
    text: '是这座塔里最好的盾牌，防御值可以增加 120 点，你只要出 500 个金币就可以买下。怎么样？',
    options: [
      { label: '购买盾牌', action: 'f15_shield' },
      { label: '我再想想', action: 'leave' },
    ],
  },
};
