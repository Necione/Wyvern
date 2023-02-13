import { random } from "@jiman24/discordjs-utils";
import { CommandError } from "@jiman24/slash-commandment";
import { EmbedBuilder } from "discord.js";
import { client } from "..";
import { getData, Unit } from "../constants";

const chestData = getData<ChestData>("content", "chest.json");

interface ChestData {
  floor: number;
  coins: number;
  items: {
    id: string;
    amount: number;
  }[];
}

export class Chest {
  static DROP_CHANCE = 1;

  constructor(
    public floor: number,
    public coins: number,
    public items: Unit[]
  ) {}

  static get all() {
    return chestData.map((x) => new Chest(x.floor, x.coins, x.items));
  }

  static random(floor: number) {
    const chests = Chest.all.filter((x) => x.floor === floor);
    return random.pick(chests);
  }

  show() {
    const messages = [];

    messages.push("You've got a chest!");
    messages.push(`You earned **${this.coins}** Gold!`);

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
