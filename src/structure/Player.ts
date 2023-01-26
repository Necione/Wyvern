import { EmbedBuilder } from "@discordjs/builders";
import { CommandError } from "@jiman24/slash-commandment";
import { bold, formatPercent } from "@jiman24/discordjs-utils";
import { client } from "..";
import { BLUE, HEART, SHIELD, SWORD, Unit } from "../constants";
import { Entity } from "./Entity";
import { User } from "discord.js";
import { Item } from "./Item";
import { getWeapon, getWeapons } from "./Weapon";
import { getPotions } from "./Potion";
import { getArmors } from "./Armor";
import { getMaterials } from "./Material";
import { formatFloat } from "../constants";

export class Player extends Entity {
  readonly id: string;
  static readonly DEFAULT_ATTACK = 2.5;
  static readonly DEFAULT_HP = 50;
  xp = 0;
  level = 1;
  armorsId: string[] = [];
  materialsId: string[] = [];
  weaponsId: string[] = [];
  potionsId: string[] = [];
  equippedWeapons?: string;
  equippedArmors: string[] = [];
  floor = 1;
  redRoomPassed = 0;
  coins = 0;

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
    return this.level * 100 * 1.25;
  }

  attack() {
    const weaponAtk = this.weapon()?.atk || 0;
    return this.baseAttack + weaponAtk;
  }

  maxHP() {
    const hp = this.armors.reduce((acc, armor) => armor.hp + acc, 0);
    return this.baseHP + hp;
  }

  get armorSet() {
    const armors = getArmors(this.equippedArmors);
    const head = armors.find(x => x.type === "head");
    const chest = armors.find(x => x.type === "chest");
    const leggings = armors.find(x => x.type === "leggings");
    const boots = armors.find(x => x.type === "boots");
    return {
      head,
      chest,
      leggings,
      boots,
    }
  }

  get baseAttack() {
    return Player.DEFAULT_ATTACK + ((this.level - 1) * 2);
  }

  get baseHP() {
    return Player.DEFAULT_HP + ((this.level - 1) * 5);
  }

  hasItem(itemId: string) {
    return [
      ...this.materialsId,
      ...this.weaponsId,
      ...this.potionsId,
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
    return `Congrats, you're now on level **${this.level}**!`;
  }

  addItem<T extends Item>(item: T) {
    const itemType = client.getItemType(item);

    switch (itemType) {
      case "weapon": this.weaponsId.push(item.id); break;
      case "armor": this.armorsId.push(item.id); break;
      case "material": this.materialsId.push(item.id); break;
      case "potion": this.potionsId.push(item.id); break;
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

    const weapon = getWeapon(this.equippedWeapons);

    if (!weapon) {
      throw new CommandError(`No item found`);
    } else if (weapon.atk === 0) {
      throw new CommandError("Item is not a weapon");
    }

    return weapon;
  }


  show(user: User) {
    const hpDiff = this.maxHP() - this.baseHP;
    const hpDiffShow = hpDiff !== 0 ? ` (+${hpDiff})` : "";
    const atkDiff = this.attack() - this.baseAttack;
    const atkDiffShow = atkDiff !== 0 ? ` (+${atkDiff})` : "";

    const fields = [
      `Current Floor: **${this.floor}** | Red Rooms: **${this.redRoomPassed}/20**`,
      `Current Level: **${this.level}** | XP: **${this.xp}**`,
      `\`${HEART} HP\` - ${bold(formatFloat(this.hp))}`,
      `\`${HEART} Base HP\` - ${bold(this.baseHP)}${hpDiffShow}`,
      `\`${SWORD} Base ATK\` - ${bold(this.baseAttack)}${atkDiffShow}`,
      `\`${SHIELD} DEF\` - ${bold(this.defence)} | \`${SHIELD} DEF %\` - **${formatPercent(this.defenceChance)}**`,
    ].join("\n");

    const armorSet = this.armorSet;

    const equipments = [
      `Equipped Weapon: \`${this.weapon()?.name || "-"}\``,
      `Head Armor: \`${armorSet.head?.name || "-"}\``,
      `Chest Armor: \`${armorSet.chest?.name || "-"}\``,
      `Leggings Armor: \`${armorSet.leggings?.name || "-"}\``,
      `Boots Armor: \`${armorSet.boots?.name || "-"}\``,
    ];

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setThumbnail(user.displayAvatarURL())
      .setTitle(`${user.username}'s Stats:`)
      .setDescription(fields)
      .addFields({
        name: "Equipment:",
        value: equipments.join("\n")
      })

    return embed;
  }

  async save() {
    const { attack, ...rest } = this;
    await client.players.set(this.id, rest);
  }

  get items() {
    return [
      ...this.potions,
      ...this.materials,
      ...this.armors,
      ...this.weapons,
    ]
  }

  get defence() {
    return this.armors.reduce((acc, armor) => acc + armor.defence, 0);
  }

  get defenceChance() {
    return this.armors.reduce((acc, armor) => acc + armor.defenceChance, 0);
  }

  get potions() {
    return getPotions(this.potionsId);
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
}
