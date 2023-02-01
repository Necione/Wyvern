import { Command } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Player } from "../structure/Player";
import { RED } from "../constants";

export default class extends Command {
  name = "profile";
  description = "show your profile";

  async exec(i: CommandInteraction) {
    await i.deferReply();
    const player = await Player.load(i.user.id);

    if (player.isDead === true) {
      const embed = new EmbedBuilder()
        .setColor(RED)
        .setDescription(
          `You are currently dead! Please use the \`/revive\` command.`
        );

      await i.editReply({ embeds: [embed] });
    } else {
      i.editReply({ embeds: [player.show(i.user)] });
    }
  }
}
