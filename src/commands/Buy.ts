import { remove } from "@jiman24/discordjs-utils";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { client } from "..";
import { GREEN } from "../constants";
import { isItemBuildMaterial } from "../structure/Material";
import { Player } from "../structure/Player";

export default class extends Command {
  name = "buy";
  description = "Buy items from the shop";

  constructor() {
    super();

    this.addStringOption((option) =>
      option.setName("item_id").setDescription("item id").setRequired(true)
    );

    this.addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("amount of items to buy")
        .setMinValue(1)
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.load(i.user.id);
    const itemId = i.options.get("item_id", true)?.value as string;
    const amount = (i.options.get("amount")?.value as number) || 1;
    const item = client.items
      .filter((x) => !x.trader)
      .find((x) => x.id === itemId);

    if (!item) throw new CommandError(`\`⚠️\` Item not found`);

    for (let i = 0; i < amount; i++) {
      if (player.coins < item.price) {
        throw new CommandError(`\`⚠️\` Insufficient coins`);
      }

      // deduct player's coin
      player.coins -= item.price;

      if (isItemBuildMaterial(item)) {
        for (const material of item.materials) {
          const playerMaterialAmount = player.materials.filter(
            (x) => x.id === material.id
          ).length;

          if (playerMaterialAmount < material.amount) {
            throw new CommandError(
              `\`⚠️\` You don't have all the required materials`
            );
          }
        }
      }

      // remove materials from player's inventory
      if (isItemBuildMaterial(item)) {
        for (const material of item.materials) {
          player.materialsId = remove(
            material.id,
            player.materialsId,
            material.amount
          );
        }
      }

      player.addItem(item);
    }

    await player.save();

    const embed = new EmbedBuilder()
      .setColor(GREEN)
      .setDescription(`Successfully bought **${item.name}**!`);

    await i.editReply({ embeds: [embed] });
  }
}
