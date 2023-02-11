import { Command } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { Player } from "../structure/Player";
import { isValidChannel } from "../execs/preExecs";
import { time } from "@jiman24/discordjs-utils";
import { Gather } from "../structure/Gather";

export default class extends Command {
  name = "gather";
  description = "Go looking for some materials!";
  preExec = [isValidChannel];
  // prevent player from spamming this command
  cooldown = process.env.ENV === "DEV" ? time.SECOND : time.MINUTE * 5;

  constructor() {
    super();
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.load(i.user.id);
    const gather = Gather.random(player.floor);

    player.addInventory(gather.items);
    await player.save();

    await i.editReply({ embeds: [gather.show()] });
  }
}
