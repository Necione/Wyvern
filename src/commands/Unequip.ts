import { remove } from "@jiman24/discordjs-utils";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { BLUE } from "../constants";
import { isValidChannel } from "../execs/preExecs";
import { getArmor, getArmors, isArmor } from "../structure/Armor";
import { Player } from "../structure/Player";
import { getWeapon, isWeapon } from "../structure/Weapon";

export default class extends Command {
  name = "unequip";
  description = "unequip item";
  preExec = [isValidChannel];

  constructor() {
    super();

    this.addStringOption((option) =>
      option.setName("item_id").setDescription("item id").setRequired(true)
    );
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.load(i.user.id);
    const itemId = i.options.get("item_id")?.value as string;
    const item = getWeapon(itemId) || getArmor(itemId);

    if (!item) {
      throw new CommandError(
        `\`⚠️\` Could not find that item! Did you type **Item ID** correctly?`
      );
    }

    if (isArmor(item)) {
      // gets the armor
      const equippedArmor = getArmors(player.equippedArmors).find(
        (x) => x.type === item.type
      );

      if (equippedArmor) {
        player.equippedArmors = remove(equippedArmor.id, player.equippedArmors);
      }
    } else if (isWeapon(item)) {
      player.equippedWeapons = "";
    }

    await player.save();

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setDescription(`Successfully unequipped **${item.name}**!`);

    i.editReply({ embeds: [embed] });
  }
}
