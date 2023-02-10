import { Command } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { Player } from "../structure/Player";
import { isValidChannel } from "../execs/preExecs";
import { time } from "@jiman24/discordjs-utils";
import { Mine } from "../structure/Mine";

export default class extends Command {
  name = "mine";
  description = "Go mining for some materials!";
  preExec = [isValidChannel];
  // prevent player from spamming this command
  cooldown = process.env.ENV === "DEV" ? time.SECOND : time.MINUTE * 5;

  constructor() {
    super();
  }

  async exec(i: CommandInteraction) {
    await i.deferReply();

    const player = await Player.load(i.user.id);
    const mine = Mine.random(player.floor);

    player.addInventory(mine.items);
    await player.save();

    await i.editReply({ embeds: [mine.show()] });
  }
}
