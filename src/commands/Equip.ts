import { remove } from "@jiman24/discordjs-utils";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { BLUE } from "../constants";
import { isValidChannel } from "../execs/preExecs";
import { getArmor, isArmor } from "../structure/Armor";
import { Player } from "../structure/Player";
import { getWeapon, isWeapon } from "../structure/Weapon";

export default class extends Command {
  name = "equip";
  description = "equip item";
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
      const equippedArmor = player.equippedArmors.find(
        (x) => x.type === item.type
      );

      if (equippedArmor) {
        player.equippedArmorsId = remove(equippedArmor.id, player.equippedArmorsId);
      }

      player.equippedArmorsId.push(item.id);
    } else if (isWeapon(item)) {
      player.equippedWeapons = item.id;
    }

    await player.save();

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setDescription(`Successfully equipped **${item.name}**!`);

    i.editReply({ embeds: [embed] });
  }
}
