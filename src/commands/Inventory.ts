import { aggregateById, chunk, bold, time } from "@jiman24/discordjs-utils";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Pagination } from "@jiman24/discordjs-pagination";
import { Player } from "../structure/Player";
import { isWeapon } from "../structure/Weapon";
import { client } from "..";

export default class extends Command {
  name = "inventory";
  description = "Check your inventory";

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.load(i.user.id);
    const items = player.items;

    if (items.length === 0) {
      throw new CommandError("`⚠️` You do not have anything in your inventory");
    }

    await i.editReply("\u200b");

    const aggregatedItems = aggregateById(items);
    const pages = chunk([...aggregatedItems.values()], 10);

    const pagesEmbed = pages.map((page) => {
      const content = page
        .map((x) => {
          const item = x.value;
          let name = item.name;

          if (
            isWeapon(item) &&
            player.weaponReforge &&
            item.id === player.equippedWeapons
          ) {
            name = player.weapon()!.name;
          }

          return `\`${x.count}x\` ${name} (ID: ${item.id})`;
        })
        .join("\n");

      const embed = new EmbedBuilder()
        .setTitle(`${i.user.username}#${i.user.discriminator}'s inventory:`)
        .setColor("Random")
        .setDescription(
          `<:gold:1073793987829309562> **Gold:** ${player.coins}\n${content}`
        );

      return embed;
    });

    const pagination = new Pagination(i, pagesEmbed, {
      timeout: 3 * time.MINUTE,
    });
    pagination.noSelect = true;

    await pagination.run();
  }
}
