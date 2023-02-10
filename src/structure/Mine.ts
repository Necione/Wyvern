import { random } from "@jiman24/discordjs-utils";
import { CommandError } from "@jiman24/slash-commandment";
import { EmbedBuilder } from "discord.js";
import { client } from "..";
import { getData, Unit } from "../constants";

const mineData = getData<MineData>("content", "mine.json");

interface MineData {
  floor: number;
  items: {
    id: string;
    amount: number;
  }[];
}

export class Mine {
  static DROP_CHANCE = 1;

  constructor(public floor: number, public items: Unit[]) {}

  static get all() {
    return mineData.map((x) => new Mine(x.floor, x.items));
  }

  static random(floor: number) {
    const mines = Mine.all.filter((x) => x.floor === floor);
    return random.pick(mines);
  }

  show() {
    const messages = [];

    messages.push("You went mining!");

    for (const itemData of this.items) {
      const item = client.getItem(itemData.id);

      if (!item) {
        throw new CommandError(`\`⚠️\` Cannot find item "${itemData.id}"`);
      }

      messages.push(`You've earned **${item.name}** \`(x${itemData.amount})\``);
    }

    return new EmbedBuilder()
      .setColor("Random")
      .setDescription(messages.join("\n"));
  }
}
