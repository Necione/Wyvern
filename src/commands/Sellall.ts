import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { client } from "..";
import { RED } from "../constants";
import { Player } from "../structure/Player";

export default class extends Command {
  name = "sellall";
  description = "Sell all of an item to the shop";

  constructor() {
    super();

    this.addStringOption((option) =>
      option.setName("item_id").setDescription("item id").setRequired(true)
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.load(i.user.id);
    const itemId = i.options.get("item_id", true)?.value as string;
    const amount = (i.options.get("amount")?.value as number) || 1;
    const item = player.items.find((x) => x.id === itemId);

    if (!item) throw new CommandError(`\`⚠️\` Item not found`);

    for (let i = 0; i < amount; i++) {
      player.removeItem(item);
      player.coins += item.price / 5;
    }

    await player.save();

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setDescription(`Successfully sold all your **${item.name}**!`);

    await i.editReply({ embeds: [embed] });
  }
}
