import { Command } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { RED } from "../constants";
import { Player } from "../structure/Player";
import { isValidChannel } from "../execs/preExecs";

export default class extends Command {
  name = "data_reset";
  description = "Restart your file.";
  preExec = [isValidChannel];

  constructor() {
    super();
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.load(i.user.id);

    player.deletePlayerData();
    player.resetData();

    await player.save();

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setDescription(`You have reset your data! `);

    await i.editReply({ embeds: [embed] });
  }
}
