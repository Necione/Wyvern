import { CommandError } from "@jiman24/slash-commandment";
import { CommandInteraction } from "discord.js";
import { client } from "../index";

export async function isValidChannel(i: CommandInteraction) {
  if (!i.channel) {
    throw new CommandError(`\`⚠️\` Commands only work in channel`);
  }

  const channelId = client.settings.channelId;
  const channel = client.channels.cache.get(channelId);

  if (!channel) {
    throw new CommandError(`\`⚠️\` Channel "${channelId}" not found`);
  }

  if (i.channelId !== client.settings.channelId) {
    throw new CommandError(
      `\`⚠️\` Invalid channel. You cannot use this command here!`
    );
  }
}
