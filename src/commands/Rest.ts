import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { GREEN } from "../constants";
import { Player } from "../structure/Player";
import { HEART, LIGHTNING } from "../constants";
import { isValidChannel } from "../execs/preExecs";
import { time } from "@jiman24/discordjs-utils";

export default class extends Command {
  name = "rest";
  description = "Take a break and recover energy and health.";
  preExec = [isValidChannel];
  // prevent player from spamming this command
  cooldown = process.env.ENV === "DEV" ? time.SECOND : time.MINUTE * 5;

  constructor() {
    super();
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.load(i.user.id);

    if (player.energy < 100 || player.hp < player.maxHP) {
      let energyRecovered = (player.energy += 40);
      let healthRecovered = (player.hp += 5);

      if (energyRecovered > 100) {
        player.energy = 100;
      }

      if (healthRecovered > player.maxHP) {
        player.hp = player.maxHP;
      }

      await player.save();
    } else {
      this.cooldown = 0;
      throw new CommandError(`\`⚠️\` You are not tired enough to take a rest!`);
    }

    const embed = new EmbedBuilder()
      .setColor(GREEN)
      .setDescription(
        `You took a rest and recovered \`${LIGHTNING} +40 Energy\` and \`${HEART} +5 HP\`! `
      );

    await i.editReply({ embeds: [embed] });
  }
}
