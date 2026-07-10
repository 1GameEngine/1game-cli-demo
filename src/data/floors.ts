export type EntityType = 'monster' | 'item' | 'tile' | 'npc' | 'trigger';

export type FloorEntity = {
  uid: string;
  x: number;
  y: number;
  type: EntityType;
  id: string;
  special?: string;
  hidden?: boolean;
  statOverride?: { hp: number; atk: number; def: number; gold: number; exp: number };
};

export type FloorDef = {
  floor: number;
  spawnUp: { x: number; y: number } | null;
  spawnDown: { x: number; y: number } | null;
  entities: FloorEntity[];
};

export const FLOORS: FloorDef[] = 
[
  {
    "floor": 0,
    "spawnUp": null,
    "spawnDown": {
      "x": 6,
      "y": 2
    },
    "entities": [
      {
        "uid": "f0_tile_stairUp_6_1_0",
        "x": 6,
        "y": 1,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f0_tile_star_10_1_1",
        "x": 10,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f0_tile_star_9_1_2",
        "x": 9,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f0_tile_star_8_1_3",
        "x": 8,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f0_tile_star_4_1_4",
        "x": 4,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f0_tile_star_3_1_5",
        "x": 3,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f0_tile_star_2_1_6",
        "x": 2,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f0_tile_lava_10_10_7",
        "x": 10,
        "y": 10,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_tile_lava_8_10_8",
        "x": 8,
        "y": 10,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_tile_lava_7_10_9",
        "x": 7,
        "y": 10,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_tile_lava_5_10_10",
        "x": 5,
        "y": 10,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_tile_lava_4_10_11",
        "x": 4,
        "y": 10,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_tile_lava_2_10_12",
        "x": 2,
        "y": 10,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_tile_lava_11_9_13",
        "x": 11,
        "y": 9,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_tile_lava_9_9_14",
        "x": 9,
        "y": 9,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_tile_lava_3_9_15",
        "x": 3,
        "y": 9,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_tile_lava_1_9_16",
        "x": 1,
        "y": 9,
        "type": "tile",
        "id": "lava"
      },
      {
        "uid": "f0_npc_fairy_6_9_17",
        "x": 6,
        "y": 9,
        "type": "npc",
        "id": "fairy"
      },
      {
        "uid": "f0_tile_yellowDoor_6_8_18",
        "x": 6,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f0_tile_wall_9_8_19",
        "x": 9,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wall_11_1_20",
        "x": 11,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wall_8_8_21",
        "x": 8,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wall_10_7_22",
        "x": 10,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wall_7_1_23",
        "x": 7,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wall_3_8_24",
        "x": 3,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wall_4_8_25",
        "x": 4,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wall_2_7_26",
        "x": 2,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wall_5_1_27",
        "x": 5,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wall_1_1_28",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f0_tile_wallAlt_0_1_29",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f0_tile_wallAlt_12_0_30",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f0_tile_wallAlt_1_12_31",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f0_tile_wallAlt_0_0_32",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 1,
    "spawnUp": {
      "x": 6,
      "y": 10
    },
    "spawnDown": {
      "x": 2,
      "y": 1
    },
    "entities": [
      {
        "uid": "f1_monster_skeleton_2_4_0",
        "x": 2,
        "y": 4,
        "type": "monster",
        "id": "skeleton"
      },
      {
        "uid": "f1_monster_skeleton_3_3_1",
        "x": 3,
        "y": 3,
        "type": "monster",
        "id": "skeleton"
      },
      {
        "uid": "f1_item_redGem_3_4_2",
        "x": 3,
        "y": 4,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f1_tile_wall_3_5_3",
        "x": 3,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_item_redPotion_1_3_4",
        "x": 1,
        "y": 3,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f1_item_yellowKey_1_4_5",
        "x": 1,
        "y": 4,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_monster_redSlime_6_1_6",
        "x": 6,
        "y": 1,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f1_monster_bat_9_6_7",
        "x": 9,
        "y": 6,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f1_monster_greenSlime_8_6_8",
        "x": 8,
        "y": 6,
        "type": "monster",
        "id": "greenSlime"
      },
      {
        "uid": "f1_monster_greenSlime_7_1_9",
        "x": 7,
        "y": 1,
        "type": "monster",
        "id": "greenSlime"
      },
      {
        "uid": "f1_monster_greenSlime_5_1_10",
        "x": 5,
        "y": 1,
        "type": "monster",
        "id": "greenSlime"
      },
      {
        "uid": "f1_item_yellowKey_4_1_11",
        "x": 4,
        "y": 1,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_item_yellowKey_8_4_12",
        "x": 8,
        "y": 4,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_item_redPotion_9_4_13",
        "x": 9,
        "y": 4,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f1_item_redPotion_9_3_14",
        "x": 9,
        "y": 3,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f1_item_redPotion_7_4_15",
        "x": 7,
        "y": 4,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f1_item_redPotion_7_3_16",
        "x": 7,
        "y": 3,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f1_item_yellowKey_8_3_17",
        "x": 8,
        "y": 3,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_monster_blackSlime_9_5_18",
        "x": 9,
        "y": 5,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f1_tile_wall_7_5_19",
        "x": 7,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_6_7_20",
        "x": 6,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_item_blueKey_11_10_21",
        "x": 11,
        "y": 10,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f1_item_yellowKey_11_11_22",
        "x": 11,
        "y": 11,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_item_yellowKey_10_11_23",
        "x": 10,
        "y": 11,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_item_yellowKey_9_11_24",
        "x": 9,
        "y": 11,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_item_yellowKey_9_10_25",
        "x": 9,
        "y": 10,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_item_yellowKey_3_11_26",
        "x": 3,
        "y": 11,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_item_redPotion_1_10_27",
        "x": 1,
        "y": 10,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f1_item_redPotion_1_11_28",
        "x": 1,
        "y": 11,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f1_item_bluePotion_2_10_29",
        "x": 2,
        "y": 10,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f1_item_yellowKey_3_10_30",
        "x": 3,
        "y": 10,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_item_blueGem_1_7_31",
        "x": 1,
        "y": 7,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f1_monster_skeletonSoldier_2_9_32",
        "x": 2,
        "y": 9,
        "type": "monster",
        "id": "skeletonSoldier"
      },
      {
        "uid": "f1_item_monsterBook_2_11_33",
        "x": 2,
        "y": 11,
        "type": "item",
        "id": "monsterBook"
      },
      {
        "uid": "f1_monster_skeletonSoldier_2_6_34",
        "x": 2,
        "y": 6,
        "type": "monster",
        "id": "skeletonSoldier"
      },
      {
        "uid": "f1_item_yellowKey_1_6_35",
        "x": 1,
        "y": 6,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f1_item_blueKey_3_7_36",
        "x": 3,
        "y": 7,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f1_item_redKey_5_10_37",
        "x": 5,
        "y": 10,
        "type": "item",
        "id": "redKey"
      },
      {
        "uid": "f1_tile_stairUp_1_1_38",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f1_tile_wall_1_2_39",
        "x": 1,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_1_5_40",
        "x": 1,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_monster_beast_10_10_41",
        "x": 10,
        "y": 10,
        "type": "monster",
        "id": "beast"
      },
      {
        "uid": "f1_tile_yellowDoor_10_9_42",
        "x": 10,
        "y": 9,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f1_tile_redDoor_6_9_43",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f1_monster_mage_7_6_44",
        "x": 7,
        "y": 6,
        "type": "monster",
        "id": "mage"
      },
      {
        "uid": "f1_tile_yellowDoor_6_6_45",
        "x": 6,
        "y": 6,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f1_tile_yellowDoor_4_3_46",
        "x": 4,
        "y": 3,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f1_tile_yellowDoor_2_5_47",
        "x": 2,
        "y": 5,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f1_tile_yellowDoor_2_8_48",
        "x": 2,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f1_tile_wall_3_8_49",
        "x": 3,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_1_8_50",
        "x": 1,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_5_9_51",
        "x": 5,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_7_9_52",
        "x": 7,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_9_9_53",
        "x": 9,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_11_9_54",
        "x": 11,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_6_3_55",
        "x": 6,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_10_2_56",
        "x": 10,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_8_9_57",
        "x": 8,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wall_4_4_58",
        "x": 4,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f1_tile_wallAlt_0_1_59",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f1_tile_stairDown_6_11_60",
        "x": 6,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f1_tile_wallAlt_12_0_61",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f1_tile_wallAlt_1_12_62",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f1_tile_wallAlt_0_0_63",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 2,
    "spawnUp": {
      "x": 1,
      "y": 2
    },
    "spawnDown": {
      "x": 1,
      "y": 10
    },
    "entities": [
      {
        "uid": "f2_tile_wall_8_6_0",
        "x": 8,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_wall_7_6_1",
        "x": 7,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_wall_6_4_2",
        "x": 6,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_ironFence_10_8_3",
        "x": 10,
        "y": 8,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f2_npc_merchantF2_10_11_4",
        "x": 10,
        "y": 11,
        "type": "npc",
        "id": "merchantF2"
      },
      {
        "uid": "f2_npc_elderF2_8_11_5",
        "x": 8,
        "y": 11,
        "type": "npc",
        "id": "elderF2"
      },
      {
        "uid": "f2_tile_ironFence_8_8_6",
        "x": 8,
        "y": 8,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f2_tile_wall_10_6_7",
        "x": 10,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_stairUp_1_11_8",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f2_tile_yellowDoor_6_6_9",
        "x": 6,
        "y": 6,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f2_tile_yellowDoor_9_6_10",
        "x": 9,
        "y": 6,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f2_tile_yellowDoor_8_5_11",
        "x": 8,
        "y": 5,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f2_tile_yellowDoor_10_4_12",
        "x": 10,
        "y": 4,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f2_tile_storyDoor_2_7_13",
        "x": 2,
        "y": 7,
        "type": "tile",
        "id": "storyDoor",
        "special": "f2StoryDoor"
      },
      {
        "uid": "f2_tile_yellowDoor_3_6_14",
        "x": 3,
        "y": 6,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f2_item_redPotion_6_11_15",
        "x": 6,
        "y": 11,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f2_item_redPotion_6_10_16",
        "x": 6,
        "y": 10,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f2_item_redPotion_6_9_17",
        "x": 6,
        "y": 9,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f2_tile_blueDoor_6_8_18",
        "x": 6,
        "y": 8,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f2_tile_yellowDoor_3_8_19",
        "x": 3,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f2_tile_wall_4_8_20",
        "x": 4,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_wall_2_8_21",
        "x": 2,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_wall_5_8_22",
        "x": 5,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_wall_5_6_23",
        "x": 5,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_item_redGem_3_11_24",
        "x": 3,
        "y": 11,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f2_item_redGem_7_3_25",
        "x": 7,
        "y": 3,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f2_item_redGem_7_2_26",
        "x": 7,
        "y": 2,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f2_item_redGem_7_1_27",
        "x": 7,
        "y": 1,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f2_monster_goldCaptain_4_1_28",
        "x": 4,
        "y": 1,
        "type": "monster",
        "id": "goldCaptain"
      },
      {
        "uid": "f2_item_blueGem_3_2_29",
        "x": 3,
        "y": 2,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f2_tile_wall_4_2_30",
        "x": 4,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_item_blueGem_8_3_31",
        "x": 8,
        "y": 3,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f2_item_blueGem_8_2_32",
        "x": 8,
        "y": 2,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f2_item_yellowKey_3_10_33",
        "x": 3,
        "y": 10,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f2_item_yellowKey_3_9_34",
        "x": 3,
        "y": 9,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f2_item_bluePotion_5_11_35",
        "x": 5,
        "y": 11,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f2_item_bluePotion_5_10_36",
        "x": 5,
        "y": 10,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f2_item_bluePotion_5_9_37",
        "x": 5,
        "y": 9,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f2_item_bluePotion_5_2_38",
        "x": 5,
        "y": 2,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f2_item_yellowKey_5_3_39",
        "x": 5,
        "y": 3,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f2_item_yellowKey_5_4_40",
        "x": 5,
        "y": 4,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f2_item_yellowKey_3_4_41",
        "x": 3,
        "y": 4,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f2_item_yellowKey_3_3_42",
        "x": 3,
        "y": 3,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f2_item_yellowKey_9_3_43",
        "x": 9,
        "y": 3,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f2_monster_goldGuard_9_7_44",
        "x": 9,
        "y": 7,
        "type": "monster",
        "id": "goldGuard"
      },
      {
        "uid": "f2_monster_goldGuard_10_3_45",
        "x": 10,
        "y": 3,
        "type": "monster",
        "id": "goldGuard"
      },
      {
        "uid": "f2_item_yellowKey_9_2_46",
        "x": 9,
        "y": 2,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f2_item_blueKey_10_2_47",
        "x": 10,
        "y": 2,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f2_item_redKey_10_1_48",
        "x": 10,
        "y": 1,
        "type": "item",
        "id": "redKey"
      },
      {
        "uid": "f2_item_yellowKey_9_1_49",
        "x": 9,
        "y": 1,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f2_item_blueGem_8_1_50",
        "x": 8,
        "y": 1,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f2_tile_wall_6_1_51",
        "x": 6,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_wall_11_1_52",
        "x": 11,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_wall_9_8_53",
        "x": 9,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_wall_2_1_54",
        "x": 2,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f2_tile_wallAlt_0_1_55",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f2_tile_stairDown_1_1_56",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f2_tile_wallAlt_12_0_57",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f2_tile_wallAlt_1_12_58",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f2_tile_wallAlt_0_0_59",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 3,
    "spawnUp": {
      "x": 2,
      "y": 11
    },
    "spawnDown": {
      "x": 11,
      "y": 10
    },
    "entities": [
      {
        "uid": "f3_monster_skeleton_2_3_0",
        "x": 2,
        "y": 3,
        "type": "monster",
        "id": "skeleton"
      },
      {
        "uid": "f3_monster_skeleton_6_4_1",
        "x": 6,
        "y": 4,
        "type": "monster",
        "id": "skeleton"
      },
      {
        "uid": "f3_item_blueGem_7_11_2",
        "x": 7,
        "y": 11,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f3_item_redGem_7_10_3",
        "x": 7,
        "y": 10,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f3_tile_wall_3_4_4",
        "x": 3,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_item_yellowKey_1_3_5",
        "x": 1,
        "y": 3,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f3_monster_redSlime_11_4_6",
        "x": 11,
        "y": 4,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f3_monster_redSlime_5_6_7",
        "x": 5,
        "y": 6,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f3_monster_redSlime_7_9_8",
        "x": 7,
        "y": 9,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f3_monster_redSlime_9_9_9",
        "x": 9,
        "y": 9,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f3_monster_redSlime_11_6_10",
        "x": 11,
        "y": 6,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f3_monster_redSlime_1_2_11",
        "x": 1,
        "y": 2,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f3_item_ironSword_1_1_12",
        "x": 1,
        "y": 1,
        "type": "item",
        "id": "ironSword"
      },
      {
        "uid": "f3_monster_redSlime_2_1_13",
        "x": 2,
        "y": 1,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f3_item_bluePotion_8_11_14",
        "x": 8,
        "y": 11,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f3_monster_bat_8_10_15",
        "x": 8,
        "y": 10,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f3_monster_bat_4_6_16",
        "x": 4,
        "y": 6,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f3_monster_bat_6_6_17",
        "x": 6,
        "y": 6,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f3_monster_bat_10_2_18",
        "x": 10,
        "y": 2,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f3_monster_bat_11_5_19",
        "x": 11,
        "y": 5,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f3_monster_bat_5_9_20",
        "x": 5,
        "y": 9,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f3_monster_greenSlime_1_6_21",
        "x": 1,
        "y": 6,
        "type": "monster",
        "id": "greenSlime"
      },
      {
        "uid": "f3_monster_greenSlime_1_7_22",
        "x": 1,
        "y": 7,
        "type": "monster",
        "id": "greenSlime"
      },
      {
        "uid": "f3_item_yellowKey_2_2_23",
        "x": 2,
        "y": 2,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f3_item_yellowKey_3_1_24",
        "x": 3,
        "y": 1,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f3_item_yellowKey_9_6_25",
        "x": 9,
        "y": 6,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f3_item_yellowKey_9_5_26",
        "x": 9,
        "y": 5,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f3_item_yellowKey_9_4_27",
        "x": 9,
        "y": 4,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f3_tile_wall_5_5_28",
        "x": 5,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_2_7_29",
        "x": 2,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_item_yellowKey_9_11_30",
        "x": 9,
        "y": 11,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f3_item_yellowKey_9_10_31",
        "x": 9,
        "y": 10,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f3_tile_stairUp_11_11_32",
        "x": 11,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f3_tile_wall_9_1_33",
        "x": 9,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_1_4_34",
        "x": 1,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_yellowDoor_8_8_35",
        "x": 8,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f3_tile_yellowDoor_6_3_36",
        "x": 6,
        "y": 3,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f3_tile_yellowDoor_2_4_37",
        "x": 2,
        "y": 4,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f3_tile_wall_3_11_38",
        "x": 3,
        "y": 11,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_2_9_39",
        "x": 2,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_1_9_40",
        "x": 1,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_npc_goldShopF3_5_1_41",
        "x": 5,
        "y": 1,
        "type": "npc",
        "id": "goldShopF3"
      },
      {
        "uid": "f3_tile_wall_5_3_42",
        "x": 5,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_7_3_43",
        "x": 7,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_2_6_44",
        "x": 2,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_7_8_45",
        "x": 7,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_9_8_46",
        "x": 9,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_4_1_47",
        "x": 4,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_8_1_48",
        "x": 8,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_10_3_49",
        "x": 10,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wall_6_7_50",
        "x": 6,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f3_tile_wallAlt_0_1_51",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f3_tile_stairDown_1_11_52",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f3_tile_wallAlt_12_0_53",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f3_tile_wallAlt_1_12_54",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f3_tile_wallAlt_0_0_55",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 4,
    "spawnUp": {
      "x": 11,
      "y": 10
    },
    "spawnDown": {
      "x": 1,
      "y": 10
    },
    "entities": [
      {
        "uid": "f4_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f4_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f4_monster_redSlime_11_7_2",
        "x": 11,
        "y": 7,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f4_monster_bat_1_5_3",
        "x": 1,
        "y": 5,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f4_monster_bat_1_6_4",
        "x": 1,
        "y": 6,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f4_monster_redSlime_1_7_5",
        "x": 1,
        "y": 7,
        "type": "monster",
        "id": "redSlime"
      },
      {
        "uid": "f4_monster_bat_11_5_6",
        "x": 11,
        "y": 5,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f4_monster_bat_11_6_7",
        "x": 11,
        "y": 6,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f4_item_redPotion_3_6_8",
        "x": 3,
        "y": 6,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f4_item_redPotion_3_5_9",
        "x": 3,
        "y": 5,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f4_monster_skeleton_3_4_10",
        "x": 3,
        "y": 4,
        "type": "monster",
        "id": "skeleton"
      },
      {
        "uid": "f4_item_redPotion_9_6_11",
        "x": 9,
        "y": 6,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f4_item_redPotion_9_5_12",
        "x": 9,
        "y": 5,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f4_monster_skeleton_9_4_13",
        "x": 9,
        "y": 4,
        "type": "monster",
        "id": "skeleton"
      },
      {
        "uid": "f4_tile_yellowDoor_3_2_14",
        "x": 3,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f4_tile_yellowDoor_1_2_15",
        "x": 1,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f4_tile_yellowDoor_9_2_16",
        "x": 9,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f4_tile_yellowDoor_11_2_17",
        "x": 11,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f4_monster_blackSlime_2_1_18",
        "x": 2,
        "y": 1,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f4_item_yellowKey_7_10_19",
        "x": 7,
        "y": 10,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f4_tile_wall_7_3_20",
        "x": 7,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_npc_thief_6_1_21",
        "x": 6,
        "y": 1,
        "type": "npc",
        "id": "thief"
      },
      {
        "uid": "f4_tile_ironFence_6_3_22",
        "x": 6,
        "y": 3,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f4_tile_wall_5_3_23",
        "x": 5,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_tile_redDoor_6_6_24",
        "x": 6,
        "y": 6,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f4_item_blueGem_7_5_25",
        "x": 7,
        "y": 5,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f4_monster_bigBat_7_4_26",
        "x": 7,
        "y": 4,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f4_monster_bigBat_6_5_27",
        "x": 6,
        "y": 5,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f4_monster_redBat_6_4_28",
        "x": 6,
        "y": 4,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f4_monster_bigBat_5_4_29",
        "x": 5,
        "y": 4,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f4_item_blueGem_5_5_30",
        "x": 5,
        "y": 5,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f4_tile_wall_5_6_31",
        "x": 5,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_tile_wall_7_6_32",
        "x": 7,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_tile_wall_7_9_33",
        "x": 7,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_item_redGem_7_8_34",
        "x": 7,
        "y": 8,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f4_tile_blueDoor_6_9_35",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f4_monster_beast_6_8_36",
        "x": 6,
        "y": 8,
        "type": "monster",
        "id": "beast"
      },
      {
        "uid": "f4_monster_beast_7_7_37",
        "x": 7,
        "y": 7,
        "type": "monster",
        "id": "beast"
      },
      {
        "uid": "f4_monster_guard_6_7_38",
        "x": 6,
        "y": 7,
        "type": "monster",
        "id": "guard"
      },
      {
        "uid": "f4_monster_beast_5_7_39",
        "x": 5,
        "y": 7,
        "type": "monster",
        "id": "beast"
      },
      {
        "uid": "f4_item_redGem_5_8_40",
        "x": 5,
        "y": 8,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f4_tile_wall_5_9_41",
        "x": 5,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_item_yellowKey_5_10_42",
        "x": 5,
        "y": 10,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f4_monster_blackSlime_4_11_43",
        "x": 4,
        "y": 11,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f4_monster_blackSlime_8_11_44",
        "x": 8,
        "y": 11,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f4_monster_blackSlime_10_1_45",
        "x": 10,
        "y": 1,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f4_tile_stairUp_1_11_46",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f4_tile_wall_2_2_47",
        "x": 2,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_tile_wall_4_1_48",
        "x": 4,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_tile_wall_8_1_49",
        "x": 8,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_tile_wall_10_2_50",
        "x": 10,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f4_tile_stairDown_11_11_51",
        "x": 11,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f4_tile_wallAlt_1_12_52",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f4_tile_wallAlt_0_0_53",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 5,
    "spawnUp": {
      "x": 2,
      "y": 11
    },
    "spawnDown": {
      "x": 10,
      "y": 10
    },
    "entities": [
      {
        "uid": "f5_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f5_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f5_tile_stairUp_10_11_2",
        "x": 10,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f5_tile_yellowDoor_9_3_3",
        "x": 9,
        "y": 3,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f5_tile_yellowDoor_10_9_4",
        "x": 10,
        "y": 9,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f5_tile_yellowDoor_9_10_5",
        "x": 9,
        "y": 10,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f5_monster_bigBat_1_5_6",
        "x": 1,
        "y": 5,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f5_item_keyBox_1_1_7",
        "x": 1,
        "y": 1,
        "type": "item",
        "id": "keyBox"
      },
      {
        "uid": "f5_monster_bigBat_1_3_8",
        "x": 1,
        "y": 3,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f5_tile_yellowDoor_2_4_9",
        "x": 2,
        "y": 4,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f5_tile_yellowDoor_6_9_10",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f5_monster_bat_6_10_11",
        "x": 6,
        "y": 10,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f5_monster_blackSlime_4_7_12",
        "x": 4,
        "y": 7,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f5_monster_blackSlime_4_8_13",
        "x": 4,
        "y": 8,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f5_monster_bat_4_9_14",
        "x": 4,
        "y": 9,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f5_monster_bat_3_11_15",
        "x": 3,
        "y": 11,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f5_tile_wall_5_7_16",
        "x": 5,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_7_3_17",
        "x": 7,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_10_3_18",
        "x": 10,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_5_5_19",
        "x": 5,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_9_11_20",
        "x": 9,
        "y": 11,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_9_9_21",
        "x": 9,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_7_4_22",
        "x": 7,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_11_9_23",
        "x": 11,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_monster_skeleton_7_6_24",
        "x": 7,
        "y": 6,
        "type": "monster",
        "id": "skeleton"
      },
      {
        "uid": "f5_item_blueKey_11_1_25",
        "x": 11,
        "y": 1,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f5_item_yellowKey_10_1_26",
        "x": 10,
        "y": 1,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f5_item_yellowKey_11_2_27",
        "x": 11,
        "y": 2,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f5_monster_mage_10_2_28",
        "x": 10,
        "y": 2,
        "type": "monster",
        "id": "mage"
      },
      {
        "uid": "f5_monster_skeletonSoldier_11_5_29",
        "x": 11,
        "y": 5,
        "type": "monster",
        "id": "skeletonSoldier"
      },
      {
        "uid": "f5_monster_guard_10_8_30",
        "x": 10,
        "y": 8,
        "type": "monster",
        "id": "guard"
      },
      {
        "uid": "f5_monster_beast_9_8_31",
        "x": 9,
        "y": 8,
        "type": "monster",
        "id": "beast"
      },
      {
        "uid": "f5_monster_beast_9_4_32",
        "x": 9,
        "y": 4,
        "type": "monster",
        "id": "beast"
      },
      {
        "uid": "f5_npc_keyShopF5_11_4_33",
        "x": 11,
        "y": 4,
        "type": "npc",
        "id": "keyShopF5"
      },
      {
        "uid": "f5_monster_skeletonSoldier_10_4_34",
        "x": 10,
        "y": 4,
        "type": "monster",
        "id": "skeletonSoldier"
      },
      {
        "uid": "f5_item_ironShield_5_4_35",
        "x": 5,
        "y": 4,
        "type": "item",
        "id": "ironShield"
      },
      {
        "uid": "f5_monster_skeletonSoldier_6_4_36",
        "x": 6,
        "y": 4,
        "type": "monster",
        "id": "skeletonSoldier"
      },
      {
        "uid": "f5_monster_skeletonSoldier_5_3_37",
        "x": 5,
        "y": 3,
        "type": "monster",
        "id": "skeletonSoldier"
      },
      {
        "uid": "f5_monster_mage_9_1_38",
        "x": 9,
        "y": 1,
        "type": "monster",
        "id": "mage"
      },
      {
        "uid": "f5_item_bluePotion_5_1_39",
        "x": 5,
        "y": 1,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f5_monster_mage_5_2_40",
        "x": 5,
        "y": 2,
        "type": "monster",
        "id": "mage"
      },
      {
        "uid": "f5_monster_mage_6_1_41",
        "x": 6,
        "y": 1,
        "type": "monster",
        "id": "mage"
      },
      {
        "uid": "f5_item_redPotion_3_1_42",
        "x": 3,
        "y": 1,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f5_npc_expElderF5_2_8_43",
        "x": 2,
        "y": 8,
        "type": "npc",
        "id": "expElderF5"
      },
      {
        "uid": "f5_item_blueGem_1_7_44",
        "x": 1,
        "y": 7,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f5_item_redGem_1_6_45",
        "x": 1,
        "y": 6,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f5_item_redGem_3_2_46",
        "x": 3,
        "y": 2,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f5_monster_mage_3_4_47",
        "x": 3,
        "y": 4,
        "type": "monster",
        "id": "mage"
      },
      {
        "uid": "f5_monster_bat_6_6_48",
        "x": 6,
        "y": 6,
        "type": "monster",
        "id": "bat"
      },
      {
        "uid": "f5_item_yellowKey_8_11_49",
        "x": 8,
        "y": 11,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f5_item_blueGem_8_10_50",
        "x": 8,
        "y": 10,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f5_tile_blueDoor_8_9_51",
        "x": 8,
        "y": 9,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f5_tile_wall_7_9_52",
        "x": 7,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_5_8_53",
        "x": 5,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_4_1_54",
        "x": 4,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_2_1_55",
        "x": 2,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_2_5_56",
        "x": 2,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_3_7_57",
        "x": 3,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_wall_1_9_58",
        "x": 1,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f5_tile_stairDown_1_11_59",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f5_tile_wallAlt_1_12_60",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f5_tile_wallAlt_0_0_61",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 6,
    "spawnUp": {
      "x": 10,
      "y": 10
    },
    "spawnDown": {
      "x": 5,
      "y": 10
    },
    "entities": [
      {
        "uid": "f6_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f6_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f6_tile_yellowDoor_8_11_2",
        "x": 8,
        "y": 11,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f6_tile_stairUp_5_11_3",
        "x": 5,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f6_tile_yellowDoor_7_11_4",
        "x": 7,
        "y": 11,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f6_tile_wall_7_10_5",
        "x": 7,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_tile_wall_6_9_6",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_tile_yellowDoor_5_9_7",
        "x": 5,
        "y": 9,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f6_tile_yellowDoor_3_9_8",
        "x": 3,
        "y": 9,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f6_monster_bigBat_3_10_9",
        "x": 3,
        "y": 10,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f6_monster_bigBat_3_8_10",
        "x": 3,
        "y": 8,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f6_monster_bigBat_5_8_11",
        "x": 5,
        "y": 8,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f6_tile_yellowDoor_4_8_12",
        "x": 4,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f6_tile_wall_4_9_13",
        "x": 4,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_item_yellowKey_6_6_14",
        "x": 6,
        "y": 6,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f6_item_yellowKey_7_6_15",
        "x": 7,
        "y": 6,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f6_item_yellowKey_5_6_16",
        "x": 5,
        "y": 6,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f6_monster_highMage_3_6_17",
        "x": 3,
        "y": 6,
        "type": "monster",
        "id": "highMage"
      },
      {
        "uid": "f6_tile_wall_3_7_18",
        "x": 3,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_tile_wall_2_7_19",
        "x": 2,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_monster_guard_4_4_20",
        "x": 4,
        "y": 4,
        "type": "monster",
        "id": "guard"
      },
      {
        "uid": "f6_tile_redDoor_4_5_21",
        "x": 4,
        "y": 5,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f6_tile_wall_5_4_22",
        "x": 5,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_tile_blueDoor_3_3_23",
        "x": 3,
        "y": 3,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f6_monster_redBat_6_3_24",
        "x": 6,
        "y": 3,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f6_tile_blueDoor_5_3_25",
        "x": 5,
        "y": 3,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f6_tile_wall_5_1_26",
        "x": 5,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_tile_wall_6_5_27",
        "x": 6,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_tile_wall_1_5_28",
        "x": 1,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_tile_wall_3_4_29",
        "x": 3,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_monster_redBat_2_3_30",
        "x": 2,
        "y": 3,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f6_item_yellowKey_1_3_31",
        "x": 1,
        "y": 3,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f6_monster_skeletonCaptain_1_2_32",
        "x": 1,
        "y": 2,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f6_item_smallWing_1_1_33",
        "x": 1,
        "y": 1,
        "type": "item",
        "id": "smallWing"
      },
      {
        "uid": "f6_monster_skeletonCaptain_2_1_34",
        "x": 2,
        "y": 1,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f6_item_yellowKey_2_2_35",
        "x": 2,
        "y": 2,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f6_tile_wall_3_1_36",
        "x": 3,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_monster_highMage_9_6_37",
        "x": 9,
        "y": 6,
        "type": "monster",
        "id": "highMage"
      },
      {
        "uid": "f6_tile_yellowDoor_10_5_38",
        "x": 10,
        "y": 5,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f6_tile_wall_11_5_39",
        "x": 11,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_item_yellowKey_8_3_40",
        "x": 8,
        "y": 3,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f6_item_yellowKey_7_2_41",
        "x": 7,
        "y": 2,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f6_item_redGem_4_2_42",
        "x": 4,
        "y": 2,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f6_item_blueGem_4_1_43",
        "x": 4,
        "y": 1,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f6_monster_slimeKing_8_2_44",
        "x": 8,
        "y": 2,
        "type": "monster",
        "id": "slimeKing"
      },
      {
        "uid": "f6_item_coinBag_8_1_45",
        "x": 8,
        "y": 1,
        "type": "item",
        "id": "coinBag"
      },
      {
        "uid": "f6_monster_slimeKing_7_1_46",
        "x": 7,
        "y": 1,
        "type": "monster",
        "id": "slimeKing"
      },
      {
        "uid": "f6_item_yellowKey_6_1_47",
        "x": 6,
        "y": 1,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f6_monster_redMage_10_4_48",
        "x": 10,
        "y": 4,
        "type": "monster",
        "id": "redMage"
      },
      {
        "uid": "f6_monster_stoneMan_11_3_49",
        "x": 11,
        "y": 3,
        "type": "monster",
        "id": "stoneMan"
      },
      {
        "uid": "f6_item_bluePotion_11_2_50",
        "x": 11,
        "y": 2,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f6_item_bluePotion_11_1_51",
        "x": 11,
        "y": 1,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f6_item_bluePotion_10_1_52",
        "x": 10,
        "y": 1,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f6_monster_stoneMan_10_2_53",
        "x": 10,
        "y": 2,
        "type": "monster",
        "id": "stoneMan"
      },
      {
        "uid": "f6_tile_wall_9_1_54",
        "x": 9,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_tile_wall_11_7_55",
        "x": 11,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f6_tile_blueDoor_10_9_56",
        "x": 10,
        "y": 9,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f6_tile_stairDown_10_11_57",
        "x": 10,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f6_tile_wallAlt_1_12_58",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f6_tile_wallAlt_0_0_59",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 7,
    "spawnUp": {
      "x": 6,
      "y": 11
    },
    "spawnDown": {
      "x": 2,
      "y": 1
    },
    "entities": [
      {
        "uid": "f7_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f7_tile_wall_11_3_1",
        "x": 11,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_10_2_2",
        "x": 10,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_9_1_3",
        "x": 9,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wallAlt_12_0_4",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f7_tile_wall_11_11_5",
        "x": 11,
        "y": 11,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_item_bluePotion_6_9_6",
        "x": 6,
        "y": 9,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f7_tile_redDoor_6_10_7",
        "x": 6,
        "y": 10,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f7_tile_wall_1_11_8",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_yellowDoor_8_11_9",
        "x": 8,
        "y": 11,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f7_tile_yellowDoor_4_11_10",
        "x": 4,
        "y": 11,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f7_tile_stairDown_5_11_11",
        "x": 5,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f7_tile_wallAlt_1_12_12",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f7_tile_wall_1_3_13",
        "x": 1,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_item_blueGem_8_7_14",
        "x": 8,
        "y": 7,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f7_item_redPotion_8_8_15",
        "x": 8,
        "y": 8,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f7_item_redPotion_9_7_16",
        "x": 9,
        "y": 7,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f7_item_yellowKey_9_8_17",
        "x": 9,
        "y": 8,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f7_tile_wall_9_9_18",
        "x": 9,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_7_10_19",
        "x": 7,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_3_10_20",
        "x": 3,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_item_redGem_4_7_21",
        "x": 4,
        "y": 7,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f7_item_blueKey_8_9_22",
        "x": 8,
        "y": 9,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f7_item_blueKey_7_9_23",
        "x": 7,
        "y": 9,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f7_item_blueKey_5_9_24",
        "x": 5,
        "y": 9,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f7_item_blueKey_4_9_25",
        "x": 4,
        "y": 9,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f7_item_redPotion_4_8_26",
        "x": 4,
        "y": 8,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f7_item_redPotion_3_7_27",
        "x": 3,
        "y": 7,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f7_item_yellowKey_3_8_28",
        "x": 3,
        "y": 8,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f7_tile_wall_2_9_29",
        "x": 2,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_monster_redBat_3_3_30",
        "x": 3,
        "y": 3,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f7_monster_redBat_4_2_31",
        "x": 4,
        "y": 2,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f7_item_blueGem_4_3_32",
        "x": 4,
        "y": 3,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f7_tile_wall_5_2_33",
        "x": 5,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_7_2_34",
        "x": 7,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_10_7_35",
        "x": 10,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_7_7_36",
        "x": 7,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_5_7_37",
        "x": 5,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_2_7_38",
        "x": 2,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_2_6_39",
        "x": 2,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wall_7_6_40",
        "x": 7,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_item_redGem_8_3_41",
        "x": 8,
        "y": 3,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f7_monster_skeletonCaptain_9_3_42",
        "x": 9,
        "y": 3,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f7_monster_skeletonCaptain_8_2_43",
        "x": 8,
        "y": 2,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f7_tile_wall_8_4_44",
        "x": 8,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_monster_whiteWarrior_6_3_45",
        "x": 6,
        "y": 3,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f7_tile_ironFence_6_6_46",
        "x": 6,
        "y": 6,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f7_tile_ironFence_7_5_47",
        "x": 7,
        "y": 5,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f7_tile_ironFence_6_4_48",
        "x": 6,
        "y": 4,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f7_item_cross_6_5_49",
        "x": 6,
        "y": 5,
        "type": "item",
        "id": "cross"
      },
      {
        "uid": "f7_tile_ironFence_5_5_50",
        "x": 5,
        "y": 5,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f7_monster_whiteWarrior_4_5_51",
        "x": 4,
        "y": 5,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f7_monster_whiteWarrior_6_7_52",
        "x": 6,
        "y": 7,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f7_monster_whiteWarrior_8_5_53",
        "x": 8,
        "y": 5,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f7_tile_blueDoor_9_5_54",
        "x": 9,
        "y": 5,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f7_tile_blueDoor_6_8_55",
        "x": 6,
        "y": 8,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f7_tile_blueDoor_6_2_56",
        "x": 6,
        "y": 2,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f7_tile_blueDoor_3_5_57",
        "x": 3,
        "y": 5,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f7_tile_wall_3_4_58",
        "x": 3,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_stairUp_1_1_59",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f7_tile_wall_1_2_60",
        "x": 1,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f7_tile_wallAlt_0_0_61",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 8,
    "spawnUp": {
      "x": 1,
      "y": 2
    },
    "spawnDown": {
      "x": 8,
      "y": 5
    },
    "entities": [
      {
        "uid": "f8_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f8_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f8_monster_redBat_1_6_2",
        "x": 1,
        "y": 6,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f8_monster_bigBat_1_7_3",
        "x": 1,
        "y": 7,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f8_monster_bigBat_1_5_4",
        "x": 1,
        "y": 5,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f8_monster_blackSlime_11_5_5",
        "x": 11,
        "y": 5,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f8_item_redGem_11_3_6",
        "x": 11,
        "y": 3,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f8_monster_blackSlime_11_4_7",
        "x": 11,
        "y": 4,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f8_tile_wall_10_3_8",
        "x": 10,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_wall_4_3_9",
        "x": 4,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_monster_bigBat_9_4_10",
        "x": 9,
        "y": 4,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f8_tile_blueDoor_7_3_11",
        "x": 7,
        "y": 3,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f8_tile_wall_7_1_12",
        "x": 7,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_wall_6_5_13",
        "x": 6,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_wall_8_7_14",
        "x": 8,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_wall_6_8_15",
        "x": 6,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_monster_guard_7_8_16",
        "x": 7,
        "y": 8,
        "type": "monster",
        "id": "guard"
      },
      {
        "uid": "f8_monster_skeletonCaptain_7_9_17",
        "x": 7,
        "y": 9,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f8_item_blueGem_3_6_18",
        "x": 3,
        "y": 6,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f8_monster_blackSlime_3_7_19",
        "x": 3,
        "y": 7,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f8_monster_blackSlime_3_8_20",
        "x": 3,
        "y": 8,
        "type": "monster",
        "id": "blackSlime"
      },
      {
        "uid": "f8_monster_skeletonCaptain_4_9_21",
        "x": 4,
        "y": 9,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f8_tile_yellowDoor_5_10_22",
        "x": 5,
        "y": 10,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f8_tile_yellowDoor_8_2_23",
        "x": 8,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f8_item_redPotion_5_6_24",
        "x": 5,
        "y": 6,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f8_monster_yellowMage_5_4_25",
        "x": 5,
        "y": 4,
        "type": "monster",
        "id": "yellowMage"
      },
      {
        "uid": "f8_item_redPotion_5_5_26",
        "x": 5,
        "y": 5,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f8_tile_yellowDoor_6_2_27",
        "x": 6,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f8_monster_skeletonCaptain_10_1_28",
        "x": 10,
        "y": 1,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f8_item_yellowKey_9_1_29",
        "x": 9,
        "y": 1,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f8_tile_wall_9_2_30",
        "x": 9,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_wall_7_6_31",
        "x": 7,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_yellowDoor_9_8_32",
        "x": 9,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f8_monster_redBat_10_7_33",
        "x": 10,
        "y": 7,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f8_tile_wall_10_8_34",
        "x": 10,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_monster_slimeKing_10_11_35",
        "x": 10,
        "y": 11,
        "type": "monster",
        "id": "slimeKing"
      },
      {
        "uid": "f8_monster_slimeKing_8_11_36",
        "x": 8,
        "y": 11,
        "type": "monster",
        "id": "slimeKing"
      },
      {
        "uid": "f8_monster_whiteWarrior_9_11_37",
        "x": 9,
        "y": 11,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f8_tile_wall_9_10_38",
        "x": 9,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_wall_6_4_39",
        "x": 6,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_wall_4_2_40",
        "x": 4,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_wall_4_8_41",
        "x": 4,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_monster_yellowMage_3_11_42",
        "x": 3,
        "y": 11,
        "type": "monster",
        "id": "yellowMage"
      },
      {
        "uid": "f8_tile_wall_3_10_43",
        "x": 3,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_wall_2_1_44",
        "x": 2,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f8_tile_stairDown_1_1_45",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f8_tile_wallAlt_1_12_46",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f8_tile_stairUp_7_5_47",
        "x": 7,
        "y": 5,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f8_tile_wallAlt_0_0_48",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 9,
    "spawnUp": {
      "x": 7,
      "y": 4
    },
    "spawnDown": {
      "x": 7,
      "y": 8
    },
    "entities": [
      {
        "uid": "f9_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f9_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f9_tile_wall_8_9_2",
        "x": 8,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_10_11_3",
        "x": 10,
        "y": 11,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_monster_skeletonCaptain_11_10_4",
        "x": 11,
        "y": 10,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f9_item_yellowKey_11_9_5",
        "x": 11,
        "y": 9,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f9_item_yellowKey_11_8_6",
        "x": 11,
        "y": 8,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f9_item_redPotion_11_5_7",
        "x": 11,
        "y": 5,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f9_item_yellowKey_11_4_8",
        "x": 11,
        "y": 4,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f9_item_yellowKey_11_3_9",
        "x": 11,
        "y": 3,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f9_item_redPotion_11_7_10",
        "x": 11,
        "y": 7,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f9_tile_wall_11_6_11",
        "x": 11,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_1_8_12",
        "x": 1,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_monster_beastWarrior_3_2_13",
        "x": 3,
        "y": 2,
        "type": "monster",
        "id": "beastWarrior"
      },
      {
        "uid": "f9_item_floorTeleporter_1_1_14",
        "x": 1,
        "y": 1,
        "type": "item",
        "id": "floorTeleporter"
      },
      {
        "uid": "f9_item_yellowKey_2_1_15",
        "x": 2,
        "y": 1,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f9_item_yellowKey_1_2_16",
        "x": 1,
        "y": 2,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f9_tile_wall_1_3_17",
        "x": 1,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_redDoor_4_5_18",
        "x": 4,
        "y": 5,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f9_item_redGem_3_7_19",
        "x": 3,
        "y": 7,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f9_item_blueGem_1_7_20",
        "x": 1,
        "y": 7,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f9_monster_redMage_2_7_21",
        "x": 2,
        "y": 7,
        "type": "monster",
        "id": "redMage"
      },
      {
        "uid": "f9_tile_blueDoor_2_6_22",
        "x": 2,
        "y": 6,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f9_tile_wall_1_6_23",
        "x": 1,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_3_8_24",
        "x": 3,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_3_6_25",
        "x": 3,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_4_4_26",
        "x": 4,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_8_2_27",
        "x": 8,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_6_3_28",
        "x": 6,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_3_3_29",
        "x": 3,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_yellowDoor_10_10_30",
        "x": 10,
        "y": 10,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f9_tile_yellowDoor_8_8_31",
        "x": 8,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f9_tile_yellowDoor_2_8_32",
        "x": 2,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f9_tile_yellowDoor_2_3_33",
        "x": 2,
        "y": 3,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f9_tile_yellowDoor_4_2_34",
        "x": 4,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f9_tile_wall_4_1_35",
        "x": 4,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_monster_skeletonCaptain_11_2_36",
        "x": 11,
        "y": 2,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f9_tile_yellowDoor_10_2_37",
        "x": 10,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f9_tile_wall_10_1_38",
        "x": 10,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_10_3_39",
        "x": 10,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_8_5_40",
        "x": 8,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_7_6_41",
        "x": 7,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_item_redPotion_3_10_42",
        "x": 3,
        "y": 10,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f9_item_redPotion_2_9_43",
        "x": 2,
        "y": 9,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f9_monster_skeletonCaptain_1_9_44",
        "x": 1,
        "y": 9,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f9_monster_skeletonCaptain_3_11_45",
        "x": 3,
        "y": 11,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f9_item_blueKey_2_11_46",
        "x": 2,
        "y": 11,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f9_item_steelSword_1_11_47",
        "x": 1,
        "y": 11,
        "type": "item",
        "id": "steelSword"
      },
      {
        "uid": "f9_item_blueKey_1_10_48",
        "x": 1,
        "y": 10,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f9_monster_skeletonCaptain_2_10_49",
        "x": 2,
        "y": 10,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f9_monster_skeletonCaptain_3_9_50",
        "x": 3,
        "y": 9,
        "type": "monster",
        "id": "skeletonCaptain"
      },
      {
        "uid": "f9_tile_yellowDoor_4_11_51",
        "x": 4,
        "y": 11,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f9_item_bluePotion_5_11_52",
        "x": 5,
        "y": 11,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f9_item_bluePotion_7_11_53",
        "x": 7,
        "y": 11,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f9_tile_wall_7_9_54",
        "x": 7,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_blueDoor_6_9_55",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f9_tile_wall_5_9_56",
        "x": 5,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_4_7_57",
        "x": 4,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_wall_6_4_58",
        "x": 6,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f9_tile_stairDown_7_5_59",
        "x": 7,
        "y": 5,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f9_tile_wallAlt_1_12_60",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f9_monster_stoneMan_6_11_61",
        "x": 6,
        "y": 11,
        "type": "monster",
        "id": "stoneMan"
      },
      {
        "uid": "f9_monster_stoneMan_7_10_62",
        "x": 7,
        "y": 10,
        "type": "monster",
        "id": "stoneMan"
      },
      {
        "uid": "f9_monster_stoneMan_5_10_63",
        "x": 5,
        "y": 10,
        "type": "monster",
        "id": "stoneMan"
      },
      {
        "uid": "f9_monster_yellowMage_6_10_64",
        "x": 6,
        "y": 10,
        "type": "monster",
        "id": "yellowMage"
      },
      {
        "uid": "f9_monster_yellowMage_5_7_65",
        "x": 5,
        "y": 7,
        "type": "monster",
        "id": "yellowMage"
      },
      {
        "uid": "f9_tile_stairUp_7_7_66",
        "x": 7,
        "y": 7,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f9_tile_wallAlt_0_0_67",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 10,
    "spawnUp": {
      "x": 5,
      "y": 7
    },
    "spawnDown": {
      "x": 1,
      "y": 10
    },
    "entities": [
      {
        "uid": "f10_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f10_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f10_tile_wall_4_4_2",
        "x": 4,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_6_1_3",
        "x": 6,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_3_8_4",
        "x": 3,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_item_yellowKey_7_5_5",
        "x": 7,
        "y": 5,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f10_item_yellowKey_6_5_6",
        "x": 6,
        "y": 5,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f10_item_yellowKey_5_5_7",
        "x": 5,
        "y": 5,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f10_tile_wall_4_6_8",
        "x": 4,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_8_10_9",
        "x": 8,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_item_yellowKey_11_6_10",
        "x": 11,
        "y": 6,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f10_item_yellowKey_11_5_11",
        "x": 11,
        "y": 5,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f10_item_yellowKey_11_9_12",
        "x": 11,
        "y": 9,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f10_item_yellowKey_11_10_13",
        "x": 11,
        "y": 10,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f10_item_redPotion_11_11_14",
        "x": 11,
        "y": 11,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f10_tile_wall_10_9_15",
        "x": 10,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_9_8_16",
        "x": 9,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_yellowDoor_8_8_17",
        "x": 8,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f10_monster_redBat_8_9_18",
        "x": 8,
        "y": 9,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f10_monster_redBat_10_7_19",
        "x": 10,
        "y": 7,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f10_tile_yellowDoor_9_7_20",
        "x": 9,
        "y": 7,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f10_tile_yellowDoor_8_6_21",
        "x": 8,
        "y": 6,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f10_tile_wall_9_6_22",
        "x": 9,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_monster_redMage_10_3_23",
        "x": 10,
        "y": 3,
        "type": "monster",
        "id": "redMage"
      },
      {
        "uid": "f10_item_bluePotion_11_3_24",
        "x": 11,
        "y": 3,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f10_monster_redMage_11_2_25",
        "x": 11,
        "y": 2,
        "type": "monster",
        "id": "redMage"
      },
      {
        "uid": "f10_tile_wall_10_4_26",
        "x": 10,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_9_1_27",
        "x": 9,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_8_2_28",
        "x": 8,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_item_blueGem_4_1_29",
        "x": 4,
        "y": 1,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f10_monster_beastWarrior_5_1_30",
        "x": 5,
        "y": 1,
        "type": "monster",
        "id": "beastWarrior"
      },
      {
        "uid": "f10_item_redGem_8_1_31",
        "x": 8,
        "y": 1,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f10_monster_beastWarrior_7_1_32",
        "x": 7,
        "y": 1,
        "type": "monster",
        "id": "beastWarrior"
      },
      {
        "uid": "f10_tile_yellowDoor_7_2_33",
        "x": 7,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f10_tile_yellowDoor_5_2_34",
        "x": 5,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f10_tile_wall_3_2_35",
        "x": 3,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_2_1_36",
        "x": 2,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_2_4_37",
        "x": 2,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_monster_bigBat_1_5_38",
        "x": 1,
        "y": 5,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f10_monster_redBat_1_6_39",
        "x": 1,
        "y": 6,
        "type": "monster",
        "id": "redBat"
      },
      {
        "uid": "f10_monster_bigBat_1_7_40",
        "x": 1,
        "y": 7,
        "type": "monster",
        "id": "bigBat"
      },
      {
        "uid": "f10_tile_wall_6_11_41",
        "x": 6,
        "y": 11,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_item_redPotion_3_11_42",
        "x": 3,
        "y": 11,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f10_item_redPotion_3_10_43",
        "x": 3,
        "y": 10,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f10_item_blueGem_4_11_44",
        "x": 4,
        "y": 11,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f10_item_blueGem_4_10_45",
        "x": 4,
        "y": 10,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f10_item_redGem_5_11_46",
        "x": 5,
        "y": 11,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f10_item_blueKey_9_11_47",
        "x": 9,
        "y": 11,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f10_monster_yellowMage_9_10_48",
        "x": 9,
        "y": 10,
        "type": "monster",
        "id": "yellowMage"
      },
      {
        "uid": "f10_item_blueKey_7_11_49",
        "x": 7,
        "y": 11,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f10_monster_yellowMage_7_10_50",
        "x": 7,
        "y": 10,
        "type": "monster",
        "id": "yellowMage"
      },
      {
        "uid": "f10_tile_redDoor_6_10_51",
        "x": 6,
        "y": 10,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f10_item_redGem_5_10_52",
        "x": 5,
        "y": 10,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f10_item_redGem_5_9_53",
        "x": 5,
        "y": 9,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f10_item_blueGem_4_9_54",
        "x": 4,
        "y": 9,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f10_item_redPotion_3_9_55",
        "x": 3,
        "y": 9,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f10_tile_wall_6_9_56",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_10_5_57",
        "x": 10,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_wall_7_7_58",
        "x": 7,
        "y": 7,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f10_tile_stairDown_6_7_59",
        "x": 6,
        "y": 7,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f10_tile_wallAlt_1_12_60",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f10_tile_stairUp_1_11_61",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f10_tile_wallAlt_0_0_62",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 11,
    "spawnUp": {
      "x": 2,
      "y": 11
    },
    "spawnDown": {
      "x": 10,
      "y": 11
    },
    "entities": [
      {
        "uid": "f11_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f11_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f11_tile_wall_8_8_2",
        "x": 8,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_wall_5_8_3",
        "x": 5,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_item_redPotion_7_10_4",
        "x": 7,
        "y": 10,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f11_npc_goldShopF11_5_9_5",
        "x": 5,
        "y": 9,
        "type": "npc",
        "id": "goldShopF11"
      },
      {
        "uid": "f11_item_redPotion_5_10_6",
        "x": 5,
        "y": 10,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f11_tile_wall_4_8_7",
        "x": 4,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_wall_11_10_8",
        "x": 11,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_blueDoor_10_4_9",
        "x": 10,
        "y": 4,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f11_tile_wall_11_4_10",
        "x": 11,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_wall_9_4_11",
        "x": 9,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_wall_9_6_12",
        "x": 9,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_blueDoor_8_6_13",
        "x": 8,
        "y": 6,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f11_tile_blueDoor_4_6_14",
        "x": 4,
        "y": 6,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f11_item_bluePotion_7_7_15",
        "x": 7,
        "y": 7,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f11_monster_midGuard_8_7_16",
        "x": 8,
        "y": 7,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f11_monster_midGuard_4_7_17",
        "x": 4,
        "y": 7,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f11_monster_swordsman_6_7_18",
        "x": 6,
        "y": 7,
        "type": "monster",
        "id": "swordsman"
      },
      {
        "uid": "f11_item_bluePotion_5_7_19",
        "x": 5,
        "y": 7,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f11_tile_wall_5_6_20",
        "x": 5,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_wall_3_6_21",
        "x": 3,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_item_blueGem_1_9_22",
        "x": 1,
        "y": 9,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f11_item_blueGem_1_8_23",
        "x": 1,
        "y": 8,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f11_item_blueGem_1_7_24",
        "x": 1,
        "y": 7,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f11_tile_yellowDoor_1_6_25",
        "x": 1,
        "y": 6,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f11_tile_wall_2_6_26",
        "x": 2,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_yellowDoor_11_6_27",
        "x": 11,
        "y": 6,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f11_item_redGem_11_7_28",
        "x": 11,
        "y": 7,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f11_item_redGem_11_8_29",
        "x": 11,
        "y": 8,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f11_item_redGem_11_9_30",
        "x": 11,
        "y": 9,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f11_tile_wall_10_6_31",
        "x": 10,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_item_redKey_7_3_32",
        "x": 7,
        "y": 3,
        "type": "item",
        "id": "redKey"
      },
      {
        "uid": "f11_item_redKey_7_2_33",
        "x": 7,
        "y": 2,
        "type": "item",
        "id": "redKey"
      },
      {
        "uid": "f11_item_redKey_7_1_34",
        "x": 7,
        "y": 1,
        "type": "item",
        "id": "redKey"
      },
      {
        "uid": "f11_item_knightShield_10_1_35",
        "x": 10,
        "y": 1,
        "type": "item",
        "id": "knightShield"
      },
      {
        "uid": "f11_item_bluePotion_11_1_36",
        "x": 11,
        "y": 1,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f11_monster_midGuard_11_2_37",
        "x": 11,
        "y": 2,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f11_monster_midGuard_10_3_38",
        "x": 10,
        "y": 3,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f11_monster_highGuard_10_2_39",
        "x": 10,
        "y": 2,
        "type": "monster",
        "id": "highGuard"
      },
      {
        "uid": "f11_monster_midGuard_9_2_40",
        "x": 9,
        "y": 2,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f11_item_bluePotion_9_1_41",
        "x": 9,
        "y": 1,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f11_tile_wall_8_1_42",
        "x": 8,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_item_blueKey_5_3_43",
        "x": 5,
        "y": 3,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f11_item_blueKey_5_2_44",
        "x": 5,
        "y": 2,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f11_item_blueKey_5_1_45",
        "x": 5,
        "y": 1,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f11_tile_wall_6_1_46",
        "x": 6,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_wall_4_1_47",
        "x": 4,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_yellowDoor_7_4_48",
        "x": 7,
        "y": 4,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f11_tile_yellowDoor_5_4_49",
        "x": 5,
        "y": 4,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f11_tile_yellowDoor_3_4_50",
        "x": 3,
        "y": 4,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f11_tile_yellowDoor_1_4_51",
        "x": 1,
        "y": 4,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f11_item_redPotion_1_3_52",
        "x": 1,
        "y": 3,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f11_item_redPotion_1_2_53",
        "x": 1,
        "y": 2,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f11_item_redPotion_1_1_54",
        "x": 1,
        "y": 1,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f11_item_yellowKey_3_3_55",
        "x": 3,
        "y": 3,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f11_item_yellowKey_3_2_56",
        "x": 3,
        "y": 2,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f11_item_yellowKey_3_1_57",
        "x": 3,
        "y": 1,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f11_tile_wall_2_1_58",
        "x": 2,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_redDoor_9_10_59",
        "x": 9,
        "y": 10,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f11_monster_beastWarrior_9_9_60",
        "x": 9,
        "y": 9,
        "type": "monster",
        "id": "beastWarrior"
      },
      {
        "uid": "f11_monster_beastWarrior_9_8_61",
        "x": 9,
        "y": 8,
        "type": "monster",
        "id": "beastWarrior"
      },
      {
        "uid": "f11_monster_beastWarrior_3_8_62",
        "x": 3,
        "y": 8,
        "type": "monster",
        "id": "beastWarrior"
      },
      {
        "uid": "f11_monster_beastWarrior_3_9_63",
        "x": 3,
        "y": 9,
        "type": "monster",
        "id": "beastWarrior"
      },
      {
        "uid": "f11_tile_redDoor_3_10_64",
        "x": 3,
        "y": 10,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f11_tile_wall_1_10_65",
        "x": 1,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f11_tile_stairDown_1_11_66",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f11_tile_wallAlt_1_12_67",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f11_tile_stairUp_11_11_68",
        "x": 11,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f11_tile_wallAlt_0_0_69",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 12,
    "spawnUp": {
      "x": 10,
      "y": 11
    },
    "spawnDown": {
      "x": 2,
      "y": 11
    },
    "entities": [
      {
        "uid": "f12_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f12_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f12_tile_stairDown_11_11_2",
        "x": 11,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f12_tile_wallAlt_1_12_3",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f12_monster_spiritWarrior_10_4_4",
        "x": 10,
        "y": 4,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f12_monster_spiritWarrior_11_5_5",
        "x": 11,
        "y": 5,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f12_tile_wall_11_6_6",
        "x": 11,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_tile_blueDoor_2_6_7",
        "x": 2,
        "y": 6,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f12_monster_darkWarrior_2_5_8",
        "x": 2,
        "y": 5,
        "type": "monster",
        "id": "darkWarrior"
      },
      {
        "uid": "f12_monster_swordsman_2_4_9",
        "x": 2,
        "y": 4,
        "type": "monster",
        "id": "swordsman"
      },
      {
        "uid": "f12_monster_swordsman_1_5_10",
        "x": 1,
        "y": 5,
        "type": "monster",
        "id": "swordsman"
      },
      {
        "uid": "f12_tile_wall_1_6_11",
        "x": 1,
        "y": 6,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_item_blueGem_2_1_12",
        "x": 2,
        "y": 1,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f12_npc_keyShopF12_1_1_13",
        "x": 1,
        "y": 1,
        "type": "npc",
        "id": "keyShopF12"
      },
      {
        "uid": "f12_item_redGem_1_2_14",
        "x": 1,
        "y": 2,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f12_tile_wall_3_1_15",
        "x": 3,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_item_bluePotion_11_2_16",
        "x": 11,
        "y": 2,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f12_item_cross_11_1_17",
        "x": 11,
        "y": 1,
        "type": "item",
        "id": "cross"
      },
      {
        "uid": "f12_item_bluePotion_10_1_18",
        "x": 10,
        "y": 1,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f12_tile_wall_9_1_19",
        "x": 9,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_tile_wall_7_2_20",
        "x": 7,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_monster_swordsman_2_9_21",
        "x": 2,
        "y": 9,
        "type": "monster",
        "id": "swordsman"
      },
      {
        "uid": "f12_monster_swordsman_10_9_22",
        "x": 10,
        "y": 9,
        "type": "monster",
        "id": "swordsman"
      },
      {
        "uid": "f12_item_redGem_11_9_23",
        "x": 11,
        "y": 9,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f12_tile_yellowDoor_9_9_24",
        "x": 9,
        "y": 9,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f12_monster_spiritMage_10_5_25",
        "x": 10,
        "y": 5,
        "type": "monster",
        "id": "spiritMage"
      },
      {
        "uid": "f12_tile_blueDoor_10_6_26",
        "x": 10,
        "y": 6,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f12_monster_midGuard_8_9_27",
        "x": 8,
        "y": 9,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f12_monster_midGuard_7_9_28",
        "x": 7,
        "y": 9,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f12_monster_highGuard_6_9_29",
        "x": 6,
        "y": 9,
        "type": "monster",
        "id": "highGuard"
      },
      {
        "uid": "f12_monster_midGuard_5_9_30",
        "x": 5,
        "y": 9,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f12_monster_midGuard_4_9_31",
        "x": 4,
        "y": 9,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f12_tile_blueDoor_6_10_32",
        "x": 6,
        "y": 10,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f12_item_blueGem_1_9_33",
        "x": 1,
        "y": 9,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f12_tile_yellowDoor_3_9_34",
        "x": 3,
        "y": 9,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f12_item_redPotion_6_6_35",
        "x": 6,
        "y": 6,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f12_item_redPotion_6_7_36",
        "x": 6,
        "y": 7,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f12_item_yellowKey_6_5_37",
        "x": 6,
        "y": 5,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f12_item_yellowKey_6_4_38",
        "x": 6,
        "y": 4,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f12_monster_goldGuard_7_1_39",
        "x": 7,
        "y": 1,
        "type": "monster",
        "id": "goldGuard"
      },
      {
        "uid": "f12_monster_goldGuard_5_1_40",
        "x": 5,
        "y": 1,
        "type": "monster",
        "id": "goldGuard"
      },
      {
        "uid": "f12_monster_goldCaptain_6_3_41",
        "x": 6,
        "y": 3,
        "type": "monster",
        "id": "goldCaptain"
      },
      {
        "uid": "f12_monster_goldCaptain_6_1_42",
        "x": 6,
        "y": 1,
        "type": "monster",
        "id": "goldCaptain"
      },
      {
        "uid": "f12_tile_yellowDoor_6_2_43",
        "x": 6,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f12_tile_wall_5_2_44",
        "x": 5,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_tile_wall_5_8_45",
        "x": 5,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_tile_wall_1_8_46",
        "x": 1,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_tile_wall_9_8_47",
        "x": 9,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_tile_wall_7_10_48",
        "x": 7,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_tile_wall_1_10_49",
        "x": 1,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f12_tile_stairUp_1_11_50",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f12_tile_wallAlt_0_0_51",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 13,
    "spawnUp": {
      "x": 2,
      "y": 11
    },
    "spawnDown": {
      "x": 5,
      "y": 11
    },
    "entities": [
      {
        "uid": "f13_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f13_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f13_tile_wall_3_2_2",
        "x": 3,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_monster_darkWarrior_10_1_3",
        "x": 10,
        "y": 1,
        "type": "monster",
        "id": "darkWarrior"
      },
      {
        "uid": "f13_item_redGem_9_7_4",
        "x": 9,
        "y": 7,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f13_item_redGem_9_6_5",
        "x": 9,
        "y": 6,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f13_item_redGem_9_5_6",
        "x": 9,
        "y": 5,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f13_item_blueGem_11_7_7",
        "x": 11,
        "y": 7,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f13_item_blueGem_11_8_8",
        "x": 11,
        "y": 8,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f13_item_blueGem_11_9_9",
        "x": 11,
        "y": 9,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f13_tile_wall_10_2_10",
        "x": 10,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_tile_wall_8_1_11",
        "x": 8,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_tile_yellowDoor_7_2_12",
        "x": 7,
        "y": 2,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f13_tile_wall_6_5_13",
        "x": 6,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_monster_midGuard_7_7_14",
        "x": 7,
        "y": 7,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f13_monster_highGuard_7_6_15",
        "x": 7,
        "y": 6,
        "type": "monster",
        "id": "highGuard"
      },
      {
        "uid": "f13_monster_midGuard_7_5_16",
        "x": 7,
        "y": 5,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f13_monster_midGuard_5_3_17",
        "x": 5,
        "y": 3,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f13_tile_redDoor_3_4_18",
        "x": 3,
        "y": 4,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f13_tile_wall_4_4_19",
        "x": 4,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_tile_wall_4_9_20",
        "x": 4,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_tile_wall_2_2_21",
        "x": 2,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_item_bigWing_8_11_22",
        "x": 8,
        "y": 11,
        "type": "item",
        "id": "bigWing"
      },
      {
        "uid": "f13_monster_darkCaptain_9_11_23",
        "x": 9,
        "y": 11,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f13_tile_yellowDoor_10_11_24",
        "x": 10,
        "y": 11,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f13_tile_wall_7_11_25",
        "x": 7,
        "y": 11,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_monster_darkWarrior_8_9_26",
        "x": 8,
        "y": 9,
        "type": "monster",
        "id": "darkWarrior"
      },
      {
        "uid": "f13_item_bluePotion_5_10_27",
        "x": 5,
        "y": 10,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f13_tile_wall_6_10_28",
        "x": 6,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_monster_darkCaptain_4_6_29",
        "x": 4,
        "y": 6,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f13_monster_darkWarrior_3_7_30",
        "x": 3,
        "y": 7,
        "type": "monster",
        "id": "darkWarrior"
      },
      {
        "uid": "f13_monster_darkWarrior_5_5_31",
        "x": 5,
        "y": 5,
        "type": "monster",
        "id": "darkWarrior"
      },
      {
        "uid": "f13_tile_ironFence_5_6_32",
        "x": 5,
        "y": 6,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f13_npc_expElderF13_5_7_33",
        "x": 5,
        "y": 7,
        "type": "npc",
        "id": "expElderF13"
      },
      {
        "uid": "f13_tile_ironFence_4_7_34",
        "x": 4,
        "y": 7,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f13_tile_wall_2_8_35",
        "x": 2,
        "y": 8,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_monster_goldCaptain_1_6_36",
        "x": 1,
        "y": 6,
        "type": "monster",
        "id": "goldCaptain"
      },
      {
        "uid": "f13_monster_swordsman_2_1_37",
        "x": 2,
        "y": 1,
        "type": "monster",
        "id": "swordsman"
      },
      {
        "uid": "f13_item_bluePotion_1_4_38",
        "x": 1,
        "y": 4,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f13_monster_goldGuard_1_5_39",
        "x": 1,
        "y": 5,
        "type": "monster",
        "id": "goldGuard"
      },
      {
        "uid": "f13_monster_goldGuard_1_7_40",
        "x": 1,
        "y": 7,
        "type": "monster",
        "id": "goldGuard"
      },
      {
        "uid": "f13_monster_goldGuard_2_9_41",
        "x": 2,
        "y": 9,
        "type": "monster",
        "id": "goldGuard"
      },
      {
        "uid": "f13_tile_wall_1_10_42",
        "x": 1,
        "y": 10,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f13_tile_stairDown_1_11_43",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f13_tile_wallAlt_1_12_44",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f13_tile_blueDoor_4_11_45",
        "x": 4,
        "y": 11,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f13_tile_stairUp_6_11_46",
        "x": 6,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f13_tile_wallAlt_0_0_47",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 14,
    "spawnUp": {
      "x": 6,
      "y": 10
    },
    "spawnDown": {
      "x": 6,
      "y": 1
    },
    "entities": [
      {
        "uid": "f14_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f14_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f14_tile_blueDoor_7_10_2",
        "x": 7,
        "y": 10,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f14_item_holyWater_6_4_3",
        "x": 6,
        "y": 4,
        "type": "item",
        "id": "holyWater"
      },
      {
        "uid": "f14_tile_ironFence_6_5_4",
        "x": 6,
        "y": 5,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f14_monster_darkWarrior_6_6_5",
        "x": 6,
        "y": 6,
        "type": "monster",
        "id": "darkWarrior"
      },
      {
        "uid": "f14_monster_darkCaptain_6_7_6",
        "x": 6,
        "y": 7,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f14_monster_darkWarrior_6_8_7",
        "x": 6,
        "y": 8,
        "type": "monster",
        "id": "darkWarrior"
      },
      {
        "uid": "f14_tile_blueDoor_6_9_8",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f14_tile_wall_7_11_9",
        "x": 7,
        "y": 11,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_tile_wall_2_11_10",
        "x": 2,
        "y": 11,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_monster_midGuard_10_10_11",
        "x": 10,
        "y": 10,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f14_monster_midGuard_8_10_12",
        "x": 8,
        "y": 10,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f14_monster_highGuard_9_10_13",
        "x": 9,
        "y": 10,
        "type": "monster",
        "id": "highGuard"
      },
      {
        "uid": "f14_tile_star_9_7_14",
        "x": 9,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f14_tile_star_8_7_15",
        "x": 8,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f14_tile_star_4_7_16",
        "x": 4,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f14_tile_star_3_7_17",
        "x": 3,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f14_monster_highGuard_3_10_18",
        "x": 3,
        "y": 10,
        "type": "monster",
        "id": "highGuard"
      },
      {
        "uid": "f14_monster_midGuard_2_10_19",
        "x": 2,
        "y": 10,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f14_monster_midGuard_4_10_20",
        "x": 4,
        "y": 10,
        "type": "monster",
        "id": "midGuard"
      },
      {
        "uid": "f14_tile_blueDoor_5_10_21",
        "x": 5,
        "y": 10,
        "type": "tile",
        "id": "blueDoor"
      },
      {
        "uid": "f14_tile_wall_9_3_22",
        "x": 9,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_tile_wall_8_2_23",
        "x": 8,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_tile_wall_7_2_24",
        "x": 7,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_tile_wall_6_2_25",
        "x": 6,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_item_redPotion_9_6_26",
        "x": 9,
        "y": 6,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f14_item_redPotion_3_6_27",
        "x": 3,
        "y": 6,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f14_tile_wall_3_3_28",
        "x": 3,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_item_bluePotion_9_2_29",
        "x": 9,
        "y": 2,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f14_item_bluePotion_3_2_30",
        "x": 3,
        "y": 2,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f14_tile_wall_4_2_31",
        "x": 4,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_tile_wall_5_2_32",
        "x": 5,
        "y": 2,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_tile_wall_11_1_33",
        "x": 11,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_tile_wall_1_1_34",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f14_tile_stairDown_6_11_35",
        "x": 6,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f14_tile_wallAlt_1_12_36",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f14_monster_spiritWarrior_3_1_37",
        "x": 3,
        "y": 1,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f14_item_keyBox_4_1_38",
        "x": 4,
        "y": 1,
        "type": "item",
        "id": "keyBox"
      },
      {
        "uid": "f14_tile_stairUp_5_1_39",
        "x": 5,
        "y": 1,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f14_tile_wallAlt_0_0_40",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 15,
    "spawnUp": {
      "x": 4,
      "y": 1
    },
    "spawnDown": {
      "x": 8,
      "y": 1
    },
    "entities": [
      {
        "uid": "f15_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f15_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f15_tile_star_4_2_2",
        "x": 4,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_5_2_3",
        "x": 5,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_7_2_4",
        "x": 7,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_8_2_5",
        "x": 8,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_9_2_6",
        "x": 9,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_10_2_7",
        "x": 10,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_wall_7_3_8",
        "x": 7,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f15_tile_wall_5_3_9",
        "x": 5,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f15_tile_wall_6_3_10",
        "x": 6,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f15_tile_wall_4_3_11",
        "x": 4,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f15_tile_wall_3_4_12",
        "x": 3,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f15_tile_wall_9_4_13",
        "x": 9,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f15_tile_wall_8_3_14",
        "x": 8,
        "y": 3,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f15_tile_star_9_7_15",
        "x": 9,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_8_9_16",
        "x": 8,
        "y": 9,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_yellowDoor_7_8_17",
        "x": 7,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f15_item_blueGem_7_5_18",
        "x": 7,
        "y": 5,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f15_item_redGem_7_6_19",
        "x": 7,
        "y": 6,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f15_item_redGem_5_6_20",
        "x": 5,
        "y": 6,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f15_npc_elderF15_5_4_21",
        "x": 5,
        "y": 4,
        "type": "npc",
        "id": "elderF15"
      },
      {
        "uid": "f15_npc_merchantF15_7_4_22",
        "x": 7,
        "y": 4,
        "type": "npc",
        "id": "merchantF15"
      },
      {
        "uid": "f15_item_blueGem_5_5_23",
        "x": 5,
        "y": 5,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f15_tile_yellowDoor_5_8_24",
        "x": 5,
        "y": 8,
        "type": "tile",
        "id": "yellowDoor"
      },
      {
        "uid": "f15_tile_redDoor_6_10_25",
        "x": 6,
        "y": 10,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f15_tile_star_7_10_26",
        "x": 7,
        "y": 10,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_5_10_27",
        "x": 5,
        "y": 10,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_4_9_28",
        "x": 4,
        "y": 9,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_3_7_29",
        "x": 3,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_3_2_30",
        "x": 3,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_2_2_31",
        "x": 2,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_star_6_1_32",
        "x": 6,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f15_tile_stairDown_5_1_33",
        "x": 5,
        "y": 1,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f15_tile_wallAlt_1_12_34",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f15_tile_stairUp_7_1_35",
        "x": 7,
        "y": 1,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f15_tile_wallAlt_0_0_36",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 16,
    "spawnUp": {
      "x": 6,
      "y": 1
    },
    "spawnDown": {
      "x": 6,
      "y": 7
    },
    "entities": [
      {
        "uid": "f16_tile_wall_6_9_0",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f16_tile_wall_4_5_1",
        "x": 4,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f16_tile_wall_8_5_2",
        "x": 8,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f16_tile_wall_7_4_3",
        "x": 7,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f16_trigger_bossTalk16_6_5_4",
        "x": 6,
        "y": 5,
        "type": "trigger",
        "id": "bossTalk16"
      },
      {
        "uid": "f16_tile_redDoor_6_4_5",
        "x": 6,
        "y": 4,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f16_tile_wall_5_4_6",
        "x": 5,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f16_tile_wallAlt_0_1_7",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f16_tile_wallAlt_12_0_8",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f16_tile_stairDown_7_1_9",
        "x": 7,
        "y": 1,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f16_tile_wallAlt_1_12_10",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f16_tile_star_6_10_11",
        "x": 6,
        "y": 10,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_7_2_12",
        "x": 7,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_5_1_13",
        "x": 5,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_4_1_14",
        "x": 4,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_8_1_15",
        "x": 8,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_9_1_16",
        "x": 9,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_10_1_17",
        "x": 10,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_11_1_18",
        "x": 11,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_3_1_19",
        "x": 3,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_2_1_20",
        "x": 2,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_star_1_1_21",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f16_tile_stairUp_6_8_22",
        "x": 6,
        "y": 8,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f16_tile_wallAlt_0_0_23",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f16_monster_redBoss_6_6_24",
        "x": 6,
        "y": 6,
        "type": "monster",
        "id": "redBoss",
        "special": "f16Boss"
      }
    ]
  },
  {
    "floor": 17,
    "spawnUp": {
      "x": 6,
      "y": 9
    },
    "spawnDown": {
      "x": 2,
      "y": 11
    },
    "entities": [
      {
        "uid": "f17_tile_star_2_10_0",
        "x": 2,
        "y": 10,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_9_8_1",
        "x": 9,
        "y": 8,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_8_6_2",
        "x": 8,
        "y": 6,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_6_4_3",
        "x": 6,
        "y": 4,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_5_4_4",
        "x": 5,
        "y": 4,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_7_6_5",
        "x": 7,
        "y": 6,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_11_4_6",
        "x": 11,
        "y": 4,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_4_2_7",
        "x": 4,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_4_7_8",
        "x": 4,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_4_8_9",
        "x": 4,
        "y": 8,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_3_2_10",
        "x": 3,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_star_1_1_11",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f17_tile_wallAlt_0_1_12",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f17_tile_wallAlt_12_0_13",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f17_monster_shadowWarrior_3_11_14",
        "x": 3,
        "y": 11,
        "type": "monster",
        "id": "shadowWarrior"
      },
      {
        "uid": "f17_monster_darkCaptain_3_1_15",
        "x": 3,
        "y": 1,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f17_monster_darkCaptain_2_2_16",
        "x": 2,
        "y": 2,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f17_monster_spiritWarrior_11_11_17",
        "x": 11,
        "y": 11,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_11_9_18",
        "x": 11,
        "y": 9,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_8_9_19",
        "x": 8,
        "y": 9,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_8_7_20",
        "x": 8,
        "y": 7,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_10_7_21",
        "x": 10,
        "y": 7,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_10_5_22",
        "x": 10,
        "y": 5,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_11_3_23",
        "x": 11,
        "y": 3,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_11_1_24",
        "x": 11,
        "y": 1,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_2_1_25",
        "x": 2,
        "y": 1,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_4_3_26",
        "x": 4,
        "y": 3,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_6_5_27",
        "x": 6,
        "y": 5,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_4_6_28",
        "x": 4,
        "y": 6,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_spiritWarrior_2_9_29",
        "x": 2,
        "y": 9,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f17_monster_darkCaptain_2_8_30",
        "x": 2,
        "y": 8,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f17_monster_darkCaptain_3_9_31",
        "x": 3,
        "y": 9,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f17_monster_shadowWarrior_5_9_32",
        "x": 5,
        "y": 9,
        "type": "monster",
        "id": "shadowWarrior"
      },
      {
        "uid": "f17_tile_stairDown_6_8_33",
        "x": 6,
        "y": 8,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f17_tile_wallAlt_1_12_34",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f17_tile_stairUp_1_11_35",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f17_tile_wallAlt_0_0_36",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 18,
    "spawnUp": {
      "x": 2,
      "y": 11
    },
    "spawnDown": {
      "x": 10,
      "y": 11
    },
    "entities": [
      {
        "uid": "f18_npc_princess_6_5_0",
        "x": 6,
        "y": 5,
        "type": "npc",
        "id": "princess"
      },
      {
        "uid": "f18_tile_ironFence_6_6_1",
        "x": 6,
        "y": 6,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f18_tile_redDoor_6_7_2",
        "x": 6,
        "y": 7,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f18_tile_redDoor_6_8_3",
        "x": 6,
        "y": 8,
        "type": "tile",
        "id": "redDoor"
      },
      {
        "uid": "f18_tile_wall_5_4_4",
        "x": 5,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f18_tile_wall_6_4_5",
        "x": 6,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f18_tile_wall_4_5_6",
        "x": 4,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f18_tile_wall_7_4_7",
        "x": 7,
        "y": 4,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f18_tile_wall_8_5_8",
        "x": 8,
        "y": 5,
        "type": "tile",
        "id": "wall"
      },
      {
        "uid": "f18_tile_star_11_1_9",
        "x": 11,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_10_1_10",
        "x": 10,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_9_1_11",
        "x": 9,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_8_1_12",
        "x": 8,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_7_1_13",
        "x": 7,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_6_9_14",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "star",
        "special": "princessPath"
      },
      {
        "uid": "f18_tile_star_6_1_15",
        "x": 6,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_5_1_16",
        "x": 5,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_4_1_17",
        "x": 4,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_3_1_18",
        "x": 3,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_2_1_19",
        "x": 2,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_star_1_1_20",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f18_tile_wallAlt_0_1_21",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f18_tile_wallAlt_12_0_22",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f18_tile_stairDown_1_11_23",
        "x": 1,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f18_tile_wallAlt_1_12_24",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f18_tile_stairUp_11_11_25",
        "x": 11,
        "y": 11,
        "type": "tile",
        "id": "stairUp",
        "special": "hiddenStair18",
        "hidden": true
      },
      {
        "uid": "f18_tile_wallAlt_0_0_26",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 19,
    "spawnUp": {
      "x": 10,
      "y": 11
    },
    "spawnDown": {
      "x": 6,
      "y": 5
    },
    "entities": [
      {
        "uid": "f19_tile_star_6_2_0",
        "x": 6,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f19_tile_star_9_9_1",
        "x": 9,
        "y": 9,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f19_tile_star_10_2_2",
        "x": 10,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f19_tile_star_8_2_3",
        "x": 8,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f19_tile_star_7_2_4",
        "x": 7,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f19_tile_star_5_2_5",
        "x": 5,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f19_tile_star_4_2_6",
        "x": 4,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f19_item_divineShield_9_8_7",
        "x": 9,
        "y": 8,
        "type": "item",
        "id": "divineShield"
      },
      {
        "uid": "f19_tile_ironFence_9_7_8",
        "x": 9,
        "y": 7,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f19_monster_redBoss_9_6_9",
        "x": 9,
        "y": 6,
        "type": "monster",
        "id": "redBoss"
      },
      {
        "uid": "f19_trigger_bossTalk19_6_8_10",
        "x": 6,
        "y": 8,
        "type": "trigger",
        "id": "bossTalk19"
      },
      {
        "uid": "f19_item_starSword_3_8_11",
        "x": 3,
        "y": 8,
        "type": "item",
        "id": "starSword"
      },
      {
        "uid": "f19_tile_ironFence_3_7_12",
        "x": 3,
        "y": 7,
        "type": "tile",
        "id": "ironFence"
      },
      {
        "uid": "f19_monster_redBoss_3_6_13",
        "x": 3,
        "y": 6,
        "type": "monster",
        "id": "redBoss"
      },
      {
        "uid": "f19_tile_star_3_9_14",
        "x": 3,
        "y": 9,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f19_tile_star_2_2_15",
        "x": 2,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f19_tile_wallAlt_0_1_16",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f19_tile_wallAlt_12_0_17",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f19_tile_stairDown_11_11_18",
        "x": 11,
        "y": 11,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f19_tile_wallAlt_1_12_19",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f19_monster_finalBoss_6_7_20",
        "x": 6,
        "y": 7,
        "type": "monster",
        "id": "finalBoss",
        "special": "f19Boss"
      },
      {
        "uid": "f19_tile_stairUp_6_4_21",
        "x": 6,
        "y": 4,
        "type": "tile",
        "id": "stairUp"
      },
      {
        "uid": "f19_tile_wallAlt_0_0_22",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 20,
    "spawnUp": {
      "x": 6,
      "y": 5
    },
    "spawnDown": {
      "x": 6,
      "y": 7
    },
    "entities": [
      {
        "uid": "f20_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f20_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f20_tile_star_6_10_2",
        "x": 6,
        "y": 10,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_redPotion_8_11_3",
        "x": 8,
        "y": 11,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f20_tile_star_8_10_4",
        "x": 8,
        "y": 10,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_bluePotion_11_10_5",
        "x": 11,
        "y": 10,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f20_tile_star_10_10_6",
        "x": 10,
        "y": 10,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_star_11_9_7",
        "x": 11,
        "y": 9,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_redPotion_11_8_8",
        "x": 11,
        "y": 8,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f20_tile_star_10_8_9",
        "x": 10,
        "y": 8,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_star_8_8_10",
        "x": 8,
        "y": 8,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_blueKey_10_7_11",
        "x": 10,
        "y": 7,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f20_item_redKey_11_6_12",
        "x": 11,
        "y": 6,
        "type": "item",
        "id": "redKey"
      },
      {
        "uid": "f20_tile_star_10_6_13",
        "x": 10,
        "y": 6,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_star_6_6_14",
        "x": 6,
        "y": 6,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_star_8_6_15",
        "x": 8,
        "y": 6,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_star_8_4_16",
        "x": 8,
        "y": 4,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_redPotion_11_4_17",
        "x": 11,
        "y": 4,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f20_tile_star_10_4_18",
        "x": 10,
        "y": 4,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_star_11_3_19",
        "x": 11,
        "y": 3,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_bluePotion_11_2_20",
        "x": 11,
        "y": 2,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f20_tile_star_10_2_21",
        "x": 10,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_redPotion_8_1_22",
        "x": 8,
        "y": 1,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f20_tile_star_8_2_23",
        "x": 8,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_redKey_6_1_24",
        "x": 6,
        "y": 1,
        "type": "item",
        "id": "redKey"
      },
      {
        "uid": "f20_tile_star_6_2_25",
        "x": 6,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_yellowKey_9_10_26",
        "x": 9,
        "y": 10,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f20_monster_whiteWarrior_9_9_27",
        "x": 9,
        "y": 9,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f20_item_redGem_10_11_28",
        "x": 10,
        "y": 11,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f20_monster_whiteWarrior_9_11_29",
        "x": 9,
        "y": 11,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f20_monster_whiteWarrior_3_11_30",
        "x": 3,
        "y": 11,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f20_item_yellowKey_3_10_31",
        "x": 3,
        "y": 10,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f20_monster_whiteWarrior_3_9_32",
        "x": 3,
        "y": 9,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f20_item_yellowKey_3_4_33",
        "x": 3,
        "y": 4,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f20_monster_whiteWarrior_3_3_34",
        "x": 3,
        "y": 3,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f20_item_yellowKey_9_2_35",
        "x": 9,
        "y": 2,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f20_item_yellowKey_9_4_36",
        "x": 9,
        "y": 4,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f20_monster_whiteWarrior_9_3_37",
        "x": 9,
        "y": 3,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f20_item_redGem_10_1_38",
        "x": 10,
        "y": 1,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f20_monster_whiteWarrior_9_1_39",
        "x": 9,
        "y": 1,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f20_item_redGem_2_1_40",
        "x": 2,
        "y": 1,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f20_item_yellowKey_3_2_41",
        "x": 3,
        "y": 2,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f20_monster_whiteWarrior_3_1_42",
        "x": 3,
        "y": 1,
        "type": "monster",
        "id": "whiteWarrior"
      },
      {
        "uid": "f20_monster_darkCaptain_11_7_43",
        "x": 11,
        "y": 7,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f20_monster_darkCaptain_11_5_44",
        "x": 11,
        "y": 5,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f20_monster_darkCaptain_7_11_45",
        "x": 7,
        "y": 11,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f20_monster_darkCaptain_5_11_46",
        "x": 5,
        "y": 11,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f20_monster_darkCaptain_1_7_47",
        "x": 1,
        "y": 7,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f20_monster_darkCaptain_1_5_48",
        "x": 1,
        "y": 5,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f20_monster_darkCaptain_7_1_49",
        "x": 7,
        "y": 1,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f20_monster_darkCaptain_5_1_50",
        "x": 5,
        "y": 1,
        "type": "monster",
        "id": "darkCaptain"
      },
      {
        "uid": "f20_item_redPotion_4_1_51",
        "x": 4,
        "y": 1,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f20_tile_star_4_2_52",
        "x": 4,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_monster_spiritWarrior_3_5_53",
        "x": 3,
        "y": 5,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f20_item_yellowKey_3_8_54",
        "x": 3,
        "y": 8,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f20_monster_spiritWarrior_3_7_55",
        "x": 3,
        "y": 7,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f20_monster_spiritWarrior_5_9_56",
        "x": 5,
        "y": 9,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f20_monster_spiritWarrior_7_9_57",
        "x": 7,
        "y": 9,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f20_item_yellowKey_9_8_58",
        "x": 9,
        "y": 8,
        "type": "item",
        "id": "yellowKey"
      },
      {
        "uid": "f20_monster_spiritWarrior_9_7_59",
        "x": 9,
        "y": 7,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f20_item_blueKey_10_5_60",
        "x": 10,
        "y": 5,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f20_monster_spiritWarrior_9_5_61",
        "x": 9,
        "y": 5,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f20_monster_spiritWarrior_7_3_62",
        "x": 7,
        "y": 3,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f20_monster_spiritWarrior_5_3_63",
        "x": 5,
        "y": 3,
        "type": "monster",
        "id": "spiritWarrior"
      },
      {
        "uid": "f20_tile_star_4_4_64",
        "x": 4,
        "y": 4,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_star_4_6_65",
        "x": 4,
        "y": 6,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_star_4_8_66",
        "x": 4,
        "y": 8,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_redPotion_4_11_67",
        "x": 4,
        "y": 11,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f20_tile_star_4_10_68",
        "x": 4,
        "y": 10,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_bluePotion_1_10_69",
        "x": 1,
        "y": 10,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f20_tile_star_2_10_70",
        "x": 2,
        "y": 10,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_blueGem_10_9_71",
        "x": 10,
        "y": 9,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f20_item_blueGem_10_3_72",
        "x": 10,
        "y": 3,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f20_item_blueGem_2_3_73",
        "x": 2,
        "y": 3,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f20_item_blueGem_2_9_74",
        "x": 2,
        "y": 9,
        "type": "item",
        "id": "blueGem"
      },
      {
        "uid": "f20_tile_star_1_9_75",
        "x": 1,
        "y": 9,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_redPotion_1_8_76",
        "x": 1,
        "y": 8,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f20_tile_star_2_8_77",
        "x": 2,
        "y": 8,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_redKey_1_6_78",
        "x": 1,
        "y": 6,
        "type": "item",
        "id": "redKey"
      },
      {
        "uid": "f20_tile_star_2_6_79",
        "x": 2,
        "y": 6,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_item_redPotion_1_4_80",
        "x": 1,
        "y": 4,
        "type": "item",
        "id": "redPotion"
      },
      {
        "uid": "f20_item_blueKey_2_7_81",
        "x": 2,
        "y": 7,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f20_item_blueKey_2_5_82",
        "x": 2,
        "y": 5,
        "type": "item",
        "id": "blueKey"
      },
      {
        "uid": "f20_tile_star_2_4_83",
        "x": 2,
        "y": 4,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_star_1_3_84",
        "x": 1,
        "y": 3,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_monster_shadowWarrior_11_1_85",
        "x": 11,
        "y": 1,
        "type": "monster",
        "id": "shadowWarrior"
      },
      {
        "uid": "f20_monster_shadowWarrior_11_11_86",
        "x": 11,
        "y": 11,
        "type": "monster",
        "id": "shadowWarrior"
      },
      {
        "uid": "f20_item_redGem_2_11_87",
        "x": 2,
        "y": 11,
        "type": "item",
        "id": "redGem"
      },
      {
        "uid": "f20_monster_shadowWarrior_1_11_88",
        "x": 1,
        "y": 11,
        "type": "monster",
        "id": "shadowWarrior"
      },
      {
        "uid": "f20_monster_shadowWarrior_1_1_89",
        "x": 1,
        "y": 1,
        "type": "monster",
        "id": "shadowWarrior"
      },
      {
        "uid": "f20_item_bluePotion_1_2_90",
        "x": 1,
        "y": 2,
        "type": "item",
        "id": "bluePotion"
      },
      {
        "uid": "f20_tile_star_2_2_91",
        "x": 2,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f20_tile_stairDown_6_4_92",
        "x": 6,
        "y": 4,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f20_tile_wallAlt_1_12_93",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f20_tile_stairUp_6_8_94",
        "x": 6,
        "y": 8,
        "type": "tile",
        "id": "stairUp",
        "special": "hiddenStair20",
        "hidden": true
      },
      {
        "uid": "f20_tile_wallAlt_0_0_95",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  },
  {
    "floor": 21,
    "spawnUp": {
      "x": 6,
      "y": 6
    },
    "spawnDown": null,
    "entities": [
      {
        "uid": "f21_tile_wallAlt_0_1_0",
        "x": 0,
        "y": 1,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f21_tile_wallAlt_12_0_1",
        "x": 12,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f21_tile_star_6_7_2",
        "x": 6,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_4_3_3",
        "x": 4,
        "y": 3,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_8_3_4",
        "x": 8,
        "y": 3,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_7_2_5",
        "x": 7,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_3_1_6",
        "x": 3,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_monster_finalBoss_6_2_7",
        "x": 6,
        "y": 2,
        "type": "monster",
        "id": "finalBoss",
        "special": "f21Boss",
        "statOverride": {
          "hp": 45000,
          "atk": 2550,
          "def": 2250,
          "gold": 312,
          "exp": 275
        }
      },
      {
        "uid": "f21_monster_spiritMage_6_3_8",
        "x": 6,
        "y": 3,
        "type": "monster",
        "id": "spiritMage"
      },
      {
        "uid": "f21_monster_spiritMage_6_4_9",
        "x": 6,
        "y": 4,
        "type": "monster",
        "id": "spiritMage"
      },
      {
        "uid": "f21_tile_star_5_2_10",
        "x": 5,
        "y": 2,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_2_1_11",
        "x": 2,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_10_1_12",
        "x": 10,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_7_9_13",
        "x": 7,
        "y": 9,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_6_9_14",
        "x": 6,
        "y": 9,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_5_9_15",
        "x": 5,
        "y": 9,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_4_8_16",
        "x": 4,
        "y": 8,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_8_8_17",
        "x": 8,
        "y": 8,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_9_7_18",
        "x": 9,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_3_7_19",
        "x": 3,
        "y": 7,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_2_5_20",
        "x": 2,
        "y": 5,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_10_5_21",
        "x": 10,
        "y": 5,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_11_1_22",
        "x": 11,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_star_1_1_23",
        "x": 1,
        "y": 1,
        "type": "tile",
        "id": "star"
      },
      {
        "uid": "f21_tile_storyDoor_7_8_24",
        "x": 7,
        "y": 8,
        "type": "tile",
        "id": "storyDoor",
        "special": "f21StoryDoor"
      },
      {
        "uid": "f21_tile_storyDoor_5_8_25",
        "x": 5,
        "y": 8,
        "type": "tile",
        "id": "storyDoor",
        "special": "f21StoryDoor"
      },
      {
        "uid": "f21_tile_stairDown_6_8_26",
        "x": 6,
        "y": 8,
        "type": "tile",
        "id": "stairDown"
      },
      {
        "uid": "f21_tile_wallAlt_1_12_27",
        "x": 1,
        "y": 12,
        "type": "tile",
        "id": "wallAlt"
      },
      {
        "uid": "f21_tile_wallAlt_0_0_28",
        "x": 0,
        "y": 0,
        "type": "tile",
        "id": "wallAlt"
      }
    ]
  }
];
