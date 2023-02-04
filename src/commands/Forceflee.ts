import { EmbedBuilder } from "@discordjs/builders";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { BLUE, RED, LIGHTNING } from "../constants";
import { Battle } from "../structure/Battle";
import { Player } from "../structure/Player";

export default class extends Command {
  name = "forceflee";
  description = "Spend 25 energy to forcefully flee";

  async exec(i: CommandInteraction) {
    const battle = await Battle.load(i);
    const player = await Player.load(i.user.id);

    if (!battle.isReady) {
      throw new CommandError("`⚠️` You need to wait for your turn");
    }

    await i.deferReply();
    await i.editReply("\u200b");
    await i.deleteReply();

    battle.isReady = false;
    await battle.save();

    const monster = battle.monster;

    if (player.energy - 35 < 0) {
      let embed = new EmbedBuilder()
        .setColor(RED)
        .setDescription(`You do not have enough energy to forceflee!`);

      await battle.editReply(embed);
      await battle.sleep();

      embed = await battle.handleMonsterAttack();

      await battle.editReply(embed);
      await battle.sleep();
      battle.handleDead();

      battle.isReady = true;
      await battle.save();
      await battle.editReply(battle.turnMessage());
      return;
    }

    player.energy -= 35;
    await player.save();

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(
        `You spent \`${LIGHTNING} 35 Energy\` and fled from ${monster.name}!`
      );

    await battle.editReply(embed);
    await battle.delete();
  }
}
