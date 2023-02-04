import { remove } from "@jiman24/discordjs-utils";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { client } from "..";
import { HEART } from "../constants";
import { Player } from "../structure/Player";
import { isPotion } from "../structure/Potion";

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

    if (isPotion(item)) {
      if (player.hp >= player.maxHP) {
        throw new CommandError(`\`⚠️\` Your \`${HEART} HP\` is already full`);
      }

      player.potionsId = remove(item.id, player.potionsId);
      player.hp += item.heal;
      await player.save();

      if (player.hp + item.heal >= player.maxHP) {
        player.hp = player.maxHP;
      }

      embed.setTitle(`You used a ${item.name}!`);
      embed.setDescription(`Regained + \`${HEART} ${item.heal} HP\``);
    } else {
      throw new CommandError("`⚠️` Item does not have functionality");
    }

    await i.editReply({ embeds: [embed] });
    await player.save();
  }
}
