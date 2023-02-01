import { EmbedBuilder } from "@discordjs/builders";
import { random } from "@jiman24/discordjs-utils";
import { Command, CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { BLUE, RED } from "../constants";
import { Battle } from "../structure/Battle";

export default class extends Command {
  name = "flee";
  description = "Allows you to flee from a battle";

  async exec(i: CommandInteraction) {
    const battle = await Battle.load(i);

    if (!battle.isReady) {
      throw new CommandError("`⚠️` You need to wait for your turn");
    }

    await i.deferReply();
    await i.editReply("\u200b");
    await i.deleteReply();

    battle.isReady = false;
    await battle.save();

    const monster = battle.monster;
    const isFleeable = random.bool(monster.fleeChance);

    if (!isFleeable) {
      let embed = new EmbedBuilder()
        .setColor(RED)
        .setDescription(`You failed to flee from ${monster.name}!`);

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

    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle(`You fled from ${monster.name}!`);

    await battle.editReply(embed);
    await battle.delete();
  }
}
