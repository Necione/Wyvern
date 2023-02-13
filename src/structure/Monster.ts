import { random } from "@jiman24/discordjs-utils";
import { getData, Unit } from "../constants";
import { Entity } from "./Entity";

//Pulling monster data
const floor1Data = getData<MonsterData>("content", "monsters", "floor1.json");
const floor2Data = getData<MonsterData>("content", "monsters", "floor2.json");

const monstersData = [...floor1Data, ...floor2Data];

//Pulling boss data
const bossesData = getData<MonsterData>("content", "monsters", "boss.json");

export type DropUnit = Unit & { dropChance: number } & { min: number } & {
  max: number;
};

export interface MonsterData {
  id: string;
  name: string;
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
  minCoins: number;
  maxCoins: number;
  drop: DropUnit[];
  isBoss?: boolean;
  type: string;
}

export class Monster extends Entity {
  thumbnailUrl: string;
  floor: number;
  phase: number;
  minCoins: number;
  maxCoins: number;
  drop: DropUnit[];
  isBoss?: boolean;
  fleeChance: number;
  missChance: number;
  playerMissChance: number;
  minAtk: number;
  maxAtk: number;
  defence: number;
  defenceChance: number;
  minXp: number;
  maxXp: number;
  type: string;

  constructor(data: MonsterData) {
    super(data.id, data.name, data.hp);
    this.thumbnailUrl = data.thumbnailUrl;
    this.floor = data.floor;
    this.phase = data.phase;
    this.drop = data.drop;
    this.minCoins = data.minCoins;
    this.maxCoins = data.maxCoins;
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
    this.type = data.type;
  }

  attack(playerLevel: number) {
    const attackIncrease = Math.round(
      0.025 * (this.maxAtk - this.minAtk) * playerLevel
    );
    this.minAtk = Math.round(this.minAtk + attackIncrease);
    this.maxAtk = Math.round(this.maxAtk + attackIncrease);
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

  static randomBoss(floor: number) {
    const bosses = Monster.bosses.filter((x) => x.floor === floor);
    return random.pick(bosses);
  }

  static random(floor: number, phase: number) {
    const maxPhase = phase;
    const minPhase = phase >= 3 ? phase - 1 : 1;
    const monsters = Monster.all.filter(
      (x) => x.floor === floor && x.phase <= maxPhase && x.phase >= minPhase
    );
    const threshold = 0.75;
    if (Math.random() < threshold) {
      const currentPhaseMonsters = monsters.filter((x) => x.phase === phase);
      return random.pick(currentPhaseMonsters);
    } else {
      const lowerPhaseMonsters = monsters.filter((x) => x.phase === minPhase);
      return random.pick(lowerPhaseMonsters);
    }
  }
}
