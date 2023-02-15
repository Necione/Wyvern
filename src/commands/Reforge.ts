import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Player } from "../structure/Player";
import { randomReforges } from "../structure/Weapon";

export default class extends Command {
  name = "reforge";
  description = "Reforges your currently equipped weapon";

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.load(i.user.id);
    const weapon = player.weapon();

    if (!weapon) {
      throw new CommandError(`No equipped weapon`);
    }

    if (player.coins < 30) {
      throw new CommandError(
        `Insufficient Gold, $30 is required to reforge weapon`
      );
    }

    const reforge = randomReforges();

    player.weaponReforge = reforge.id;
    player.coins -= 30;

    const embed = new EmbedBuilder()
      .setColor("Random")
      .setDescription(`Successfully reforged **${player.weapon()!.name}**!`);

    await player.save();

    i.editReply({ embeds: [embed] });
  }
}
