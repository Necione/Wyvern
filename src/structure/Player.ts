import { EmbedBuilder } from "@discordjs/builders";
import { CommandError } from "@jiman24/slash-commandment";
import { bold, formatPercent } from "@jiman24/discordjs-utils";
import { client } from "..";
import {
  BLUE,
  HEART,
  SHIELD,
  SWORD,
  LIGHTNING,
  Unit,
  EXPLOSION,
} from "../constants";
import { Entity } from "./Entity";
import { User } from "discord.js";
import { Item } from "./Item";
import { getWeapon, getWeaponReforge, getWeapons, Weapon } from "./Weapon";
import { getConsumables } from "./Consumable";
import { getArmors } from "./Armor";
import { getMaterials } from "./Material";
import { formatFloat } from "../constants";

export class Player extends Entity {
  readonly id: string;
  static readonly DEFAULT_ATTACK = 2.5;
  static readonly DEFAULT_HP = 25;
  xp = 0;
  level = 1;
  energy = 100;
  armorsId: string[] = [];
  materialsId: string[] = [];
  weaponsId: string[] = [];
  consumablesId: string[] = [];
  equippedWeapons?: string;
  weaponReforge?: string;
  equippedArmorsId: string[] = [];
  floor = 1;
  phase = 1;
  redRoomPassed = 0;
  redRoomRequired = 30;
  kills = 0;
  coins = 0;
  isDead = false;
  deathCount = 0;

  constructor(id: string) {
    super(id, `<@${id}>`, Player.DEFAULT_HP);
    this.id = id;
  }

  static async load(id: string) {
    const data = await client.players.get(id);
    const player = new Player(id);

    if (!data) {
      await player.save();
    } else {
      Object.assign(player, data);
    }
    return player;
  }

  get xpRequired() {
    return this.level * 15 * 1.25;
  }

  attack() {
    const weaponAtk = this.weapon()?.atk || 0;
    return this.baseAttack + weaponAtk;
  }

  specialty() {
    return this.weapon()?.specialty;
  }

  get maxHP() {
    const armhp = this.armors.reduce((acc, armor) => acc + armor.hp, 0);
    let reforgehp = 0;
    if (this.equippedWeapons) {
      const weapon = this.weapon();
      if (this.weaponReforge && weapon) {
        const reforge = getWeaponReforge(this.weaponReforge);
        if (!reforge) {
          return this.baseHP + armhp;
        }

        reforgehp = reforge.hp;
      }
    }

    return this.baseHP + armhp + reforgehp;
  }

  deletePlayerData() {
    client.players.delete(this.id);
  }

  resetData() {
    this.hp = Player.DEFAULT_HP;
    this.xp = 0;
    this.level = 1;
    this.energy = 100;
    this.armorsId = [];
    this.materialsId = [];
    this.weaponsId = [];
    this.consumablesId = [];
    this.equippedWeapons = undefined;
    this.equippedArmorsId = [];
    this.floor = 1;
    this.phase = 1;
    this.redRoomPassed = 0;
    this.redRoomRequired = 20;
    this.coins = 0;
    this.isDead = false;
    this.deathCount = 0;
  }

  get armorSet() {
    const armors = this.equippedArmors;
    const head = armors.find((x) => x.type === "head");
    const chest = armors.find((x) => x.type === "chest");
    const leggings = armors.find((x) => x.type === "leggings");
    const boots = armors.find((x) => x.type === "boots");
    return {
      head,
      chest,
      leggings,
      boots,
    };
  }

  get baseAttack() {
    return Player.DEFAULT_ATTACK + (this.level - 1) * 1;
  }

  get baseHP() {
    return Player.DEFAULT_HP + (this.level - 1) * 2;
  }

  hasItem(itemId: string) {
    return [
      ...this.materialsId,
      ...this.weaponsId,
      ...this.consumablesId,
      ...this.armorsId,
    ].includes(itemId);
  }

  // adds xp while increments level if leveled up
  addXp(xp: number) {
    this.xp += xp;

    if (this.xp >= this.xpRequired) {
      this.level++;
      return true;
    }

    return false;
  }

  levelUpMessage() {
    return `\`⭐\` Congrats, you're now on level **${this.level}**!`;
  }

  addItem<T extends Item>(item: T) {
    const itemType = client.getItemType(item);

    switch (itemType) {
      case "weapon":
        this.weaponsId.push(item.id);
        break;
      case "armor":
        this.armorsId.push(item.id);
        break;
      case "material":
        this.materialsId.push(item.id);
        break;
      case "consumable":
        this.consumablesId.push(item.id);
        break;
    }
  }

  removeItem<T extends Item>(item: T) {
    const itemType = client.getItemType(item);

    switch (itemType) {
      case "weapon":
        this.weaponsId = this.weaponsId.filter((x) => x !== item.id);
        break;
      case "armor":
        this.armorsId = this.armorsId.filter((x) => x !== item.id);
        break;
      case "material":
        this.materialsId = this.materialsId.filter((x) => x !== item.id);
        break;
      case "consumable":
        this.consumablesId = this.consumablesId.filter((x) => x !== item.id);
        break;
    }
  }

  addItemId(id: string) {
    const item = client.getItem(id);

    if (item) {
      this.addItem(item);
    }
  }

  addInventory(items: Unit[]) {
    for (const item of items) {
      for (let i = 0; i < item.amount; i++) {
        this.addItemId(item.id);
      }
    }
  }

  weapon() {
    if (!this.equippedWeapons) return;

    const weapon = { ...getWeapon(this.equippedWeapons) } as Weapon;

    if (!weapon) {
      throw new CommandError(`\`⚠️\` No item found`);
    } else if (weapon.atk === 0) {
      throw new CommandError("`⚠️` Item is not a weapon");
    }

    if (this.weaponReforge) {
      const reforge = getWeaponReforge(this.weaponReforge);

      if (!reforge) {
        return weapon;
      }

      weapon.name = `${reforge.name} ${weapon.name}`;
      weapon.atk += reforge.atk;
      weapon.crit += reforge.crit;
      weapon.critChance += reforge.critChance;
    }

    return weapon;
  }

  show(user: User) {
    const hpDiff = this.maxHP - this.baseHP;
    let hpDiffShow = "";
    if (hpDiff !== 0) {
      if (hpDiff > 0) {
        hpDiffShow = ` (+${hpDiff})`;
      } else {
        hpDiffShow = ` (${hpDiff})`;
      }
    }

    const atkDiff = this.attack() - this.baseAttack;
    const atkDiffShow = atkDiff !== 0 ? ` (+${atkDiff})` : "";

    const fields = [
      `> \`🗺️ Current World Level\` - **${this.floor}**`,
      `> \`🧭 Current Phase\` - **${this.phase}**`,
      `> \`☠️ Red Rooms\` - **${this.redRoomPassed}/${this.redRoomRequired}**`,
      `> \`⭐ Level\` - **${this.level}** | \`💎 XP\` - **${this.xp}/${this.xpRequired}**`,
      this.deathCount !== 0
        ? `> \`🦴 Death Count\` - **${this.deathCount}**`
        : "",
    ].join("\n");

    const armorSet = this.armorSet;
    const playerCrit = this.crit;

    const stats = [
      `> \`🧡 Base HP\` - ${bold(
        this.baseHP
      )}${hpDiffShow} | \`${HEART} HP\` - ${bold(formatFloat(this.hp))}${
        this.hp > this.maxHP ? " `💜 OVERHEALED`" : ""
      }`,
      `${
        this.defence || this.defenceChance !== 0
          ? `\>\ \`${SHIELD} DEF\` - ${bold(
              this.defence
            )} | \`${SHIELD} DEF %\` - **${formatPercent(this.defenceChance)}**`
          : ""
      }`,
      `${
        this.crit || this.critChance !== 0
          ? `\>\ \`${EXPLOSION} Crit\` - **${formatPercent(
              playerCrit
            )}** | \`${EXPLOSION} Crit %\` - **${formatPercent(
              this.critChance
            )}**`
          : ""
      }`,
      `> \`${SWORD} Base ATK\` - ${bold(
        formatFloat(this.baseAttack)
      )}${atkDiffShow}`,
      `> \`${LIGHTNING} Energy\` - ${bold(this.energy)}`,
    ].filter(Boolean);

    const equipments = [
      `> Equipped Weapon: \`${this.weapon()?.name || "-"}\``,
      `> Head Armor: \`${armorSet.head?.name || "-"}\``,
      `> Chest Armor: \`${armorSet.chest?.name || "-"}\``,
      `> Leggings Armor: \`${armorSet.leggings?.name || "-"}\``,
      `> Boots Armor: \`${armorSet.boots?.name || "-"}\``,
    ];

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setThumbnail(user.displayAvatarURL())
      .setTitle(`${user.username}'s Profile:`)
      .setDescription(fields)
      .addFields(
        {
          name: "Your Current Stats:",
          value: stats.join("\n"),
        },
        {
          name: "Your Equipment:",
          value: equipments.join("\n"),
        }
      );

    return embed;
  }

  async save() {
    const { attack, ...rest } = this;
    await client.players.set(this.id, rest);
  }

  get items() {
    return [
      ...this.consumables,
      ...this.materials,
      ...this.armors,
      ...this.weapons,
    ];
  }

  get defence() {
    return this.equippedArmors.reduce((acc, armor) => acc + armor.defence, 0);
  }

  get defenceChance() {
    return this.equippedArmors.reduce(
      (acc, armor) => acc + armor.defenceChance,
      0
    );
  }

  get crit() {
    return this.weapon()?.crit || 0;
  }

  get critChance() {
    return this.weapon()?.critChance || 0;
  }

  get consumables() {
    return getConsumables(this.consumablesId);
  }

  get materials() {
    return getMaterials(this.materialsId);
  }

  get weapons() {
    return getWeapons(this.weaponsId);
  }

  get armors() {
    return getArmors(this.armorsId);
  }

  get equippedArmors() {
    return getArmors(this.equippedArmorsId);
  }
}
