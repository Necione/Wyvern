import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { GREEN } from "../constants";
import { Player } from "../structure/Player";
import { isValidChannel } from "../execs/preExecs";
import { time } from "@jiman24/discordjs-utils";

export default class extends Command {
  name = "revive";
  description = "Revive from the dead!";
  preExec = [isValidChannel];
  // prevent player from spamming this command
  cooldown = process.env.ENV === "DEV" ? time.SECOND : time.HOUR * 24;

  constructor() {
    super();
  }

  async exec(i: CommandInteraction) {
    const player = await Player.load(i.user.id);
    await i.deferReply();

    if (player.isDead === true) {
      player.energy = 100;
      player.hp = player.maxHP;
      player.isDead = false;

      await player.save();
      const embed = new EmbedBuilder()
        .setColor(GREEN)
        .setDescription(
          `You have used your daily revive, and came back from the dead!`
        );
      await i.editReply({ embeds: [embed] });
    } else {
      this.cooldown = 0;
      throw new CommandError(`\`⚠️\` You cannot use this command`);
    }
  }
}
