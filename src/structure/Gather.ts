import { random } from "@jiman24/discordjs-utils";
import { CommandError } from "@jiman24/slash-commandment";
import { EmbedBuilder } from "discord.js";
import { client } from "..";
import { getData, Unit } from "../constants";

const gatherData = getData<GatherData>("content", "gather.json");

interface GatherData {
  floor: number;
  items: {
    id: string;
    amount: number;
  }[];
}

export class Gather {
  static DROP_CHANCE = 1;

  constructor(public floor: number, public items: Unit[]) {}

  static get all() {
    return gatherData.map((x) => new Gather(x.floor, x.items));
  }

  static random(floor: number) {
    const gathers = Gather.all.filter((x) => x.floor === floor);
    return random.pick(gathers);
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
