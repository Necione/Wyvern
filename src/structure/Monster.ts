import { random } from "@jiman24/discordjs-utils";
import { getData, Unit } from "../constants";
import { Entity } from "./Entity";

//Pulling monster data
const floor1Data = getData<MonsterData>("content", "monsters", "floor1.json");
const floor2Data = getData<MonsterData>("content", "monsters", "floor2.json");

const monstersData = [...floor1Data, ...floor2Data];

//Pulling boss data
const bossesData = getData<MonsterData>("content", "monsters", "boss.json");

//Pulling specials data
const specialsData = getData<MonsterData>(
  "content",
  "monsters",
  "special.json"
);

export type DropUnit = Unit & { dropChance: number };

export interface MonsterData {
  id: string;
  name: string;
  desc: string;
  thumbnailUrl: string;
  floor: number;
  phase: number;
  hp: number;
  defence: number;
  defenceChance: number;
  minAtk: number;
  maxAtk: number;
  minXp: number;
  maxXp: number;
  missChance: number;
  playerMissChance: number;
  fleeChance: number;
  coins: number;
  drop: DropUnit[];
  isBoss?: boolean;
  isSpecial?: boolean;
}

export class Monster extends Entity {
  description: string;
  thumbnailUrl: string;
  floor: number;
  phase: number;
  coins: number;
  drop: DropUnit[];
  isBoss?: boolean;
  isSpecial?: boolean;
  fleeChance: number;
  missChance: number;
  playerMissChance: number;
  minAtk: number;
  maxAtk: number;
  defence: number;
  defenceChance: number;
  minXp: number;
  maxXp: number;

  constructor(data: MonsterData) {
    super(data.id, data.name, data.hp);
    this.description = data.desc;
    this.thumbnailUrl = data.thumbnailUrl;
    this.floor = data.floor;
    this.phase = data.phase;
    this.drop = data.drop;
    this.coins = data.coins;
    this.minAtk = data.minAtk;
    this.maxAtk = data.maxAtk;
    this.defence = data.defence;
    this.defenceChance = data.defenceChance;
    this.minXp = data.minXp;
    this.maxXp = data.maxXp;
    this.fleeChance = data.fleeChance;
    this.missChance = data.missChance;
    this.playerMissChance = data.playerMissChance;
    this.isBoss = data.isBoss;
    this.isSpecial = data.isSpecial;
  }

  attack() {
    return random.integer(this.minAtk, this.maxAtk);
  }

  xpDrop() {
    return random.integer(this.minXp, this.maxXp);
  }

  static get all() {
    return monstersData.map((x) => new Monster(x));
  }

  static get bosses() {
    return bossesData
      .map((x) => {
        x.isBoss = true;
        return x;
      })
      .map((x) => new Monster(x));
  }

  static get specials() {
    return specialsData
      .map((x) => {
        x.isSpecial = true;
        return x;
      })
      .map((x) => new Monster(x));
  }

  static randomBoss(floor: number) {
    const bosses = Monster.bosses.filter((x) => x.floor === floor);
    return random.pick(bosses);
  }

  static randomSpecial(floor: number) {
    const specials = Monster.specials.filter((x) => x.floor === floor);
    return random.pick(specials);
  }

  static random(floor: number, phase: number) {
    const monsters = Monster.all.filter(
      (x) => x.floor === floor && x.phase <= phase
    );
    return random.pick(monsters);
  }
}
