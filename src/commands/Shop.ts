import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Pagination } from "@jiman24/discordjs-pagination";
import { bold, chunk, code, time } from "@jiman24/discordjs-utils";
import { isValidChannel } from "../execs/preExecs";
import { client } from "..";
import { Player } from "../structure/Player";
import { weapons } from "../structure/Weapon";
import { armors } from "../structure/Armor";
import { consumables } from "../structure/Consumable";
import { isItemBuildMaterial, materials } from "../structure/Material";
import { toTitleCase } from "../constants";
import { showStat } from "../structure/Item";

export default class extends Command {
  name = "shop";
  description = "Visit the shop";
  preExec = [isValidChannel];

  constructor() {
    super();

    this.addStringOption((option) =>
      option
        .setName("category")
        .setDescription("Shop category")
        .setRequired(true)
        .setChoices(
          {
            name: "Weapon",
            value: "weapon",
          },
          {
            name: "Armor",
            value: "armor",
          },
          {
            name: "Consumable",
            value: "consumable",
          },
          {
            name: "Material",
            value: "material",
          }
        )
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const option = i.options.get("category", true);
    const category = option.value as string;
    const items =
      category === "weapon"
        ? weapons
        : category === "armor"
        ? armors
        : category === "consumable"
        ? consumables
        : materials;
    const pages = chunk(
      items.filter((x) => !x.trader && !x.hidden),
      4
    );

    const pagesEmbed = pages.map((page) => {
      const content = page
        .map((item) => {
          const lines = [bold(`${item.name} (ID: ${item.id})`), showStat(item)];

          if (isItemBuildMaterial(item)) {
            const materials = item.materials.map((x) => {
              const item = client.getItem(x.id);

              if (!item) {
                throw new CommandError(`\`⚠️\` Item not found "${x.id}"`);
              }

              return code(`${item.name} (x${x.amount})`);
            });

            lines.push("> Materials: " + materials.join());
          }

          lines.push(`> Price: **$${item.price} Mora**`);

          return lines.filter((x) => !!x).join("\n");
        })
        .join("\n\n");

      const descs = [
        "Use the `/buy (ID)` command to purchase an item!",
        "Use the `/inventory` command to check your items.\n",
        content,
      ];

      const embed = new EmbedBuilder()
        .setTitle(`The ${toTitleCase(category)} Shop`)
        .setColor("Random")
        .setDescription(descs.join("\n"));

      return embed;
    });

    const pagination = new Pagination(i, pagesEmbed, {
      timeout: 3 * time.MINUTE,
    });
    pagination.noSelect = true;

    await pagination.run();
  }
}
