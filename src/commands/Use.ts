import { remove } from "@jiman24/discordjs-utils";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { client } from "..";
import { HEART, LIGHTNING } from "../constants";
import { Player } from "../structure/Player";
import { isConsumable } from "../structure/Consumable";

export default class extends Command {
  name = "use";
  description = "Use items in inventory";

  constructor() {
    super();

    this.addStringOption((option) =>
      option
        .setName("item_id")
        .setDescription("item id to be used")
        .setRequired(true)
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply({ ephemeral: true });

    const player = await Player.load(i.user.id);
    const itemId = i.options.get("item_id")?.value as string;
    const item = client.getItem(itemId);

    if (!item) {
      throw new CommandError(
        `\`⚠️\` Could not find that item! Did you type **Item ID** correctly?`
      );
    } else if (!player.hasItem(item.id)) {
      throw new CommandError(`\`⚠️\` You do not own the item`);
    }

    const embed = new EmbedBuilder().setColor("Random");

    if (isConsumable(item)) {
      if (player.hp >= player.maxHP) {
        throw new CommandError(`\`⚠️\` Your \`${HEART} HP\` is already full`);
      }

      player.consumablesId = remove(item.id, player.consumablesId);
      player.hp += item.heal;
      player.energy += item.energy;
      await player.save();

      if (player.hp + item.heal >= player.maxHP) {
        player.hp = player.maxHP;
      }
      if (player.energy + item.energy >= 100) {
        player.energy = 100;
      }

      embed.setTitle(`You used a ${item.name}!`);
      let description = "Regained";
      if (item.heal !== 0) {
        description += ` \`${HEART} ${item.heal} HP\``;
      }
      if (item.energy !== 0) {
        if (item.heal !== 0) {
          description += " and";
        }
        description += ` \`${LIGHTNING} ${item.energy} Energy\``;
      }
      description += "!";

      embed.setDescription(description);
    } else {
      throw new CommandError("`⚠️` Item does not have functionality!");
    }

    await i.editReply({ embeds: [embed] });
    await player.save();
  }
}
