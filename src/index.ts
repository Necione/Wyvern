import { config } from "dotenv";
config();

import { Client } from "./structure/Client";
import path from "path";
import { CommandError, CommandManager } from "@jiman24/slash-commandment";
import { EmbedBuilder } from "@discordjs/builders";
import { handleCommandError, RED } from "./constants";
import { TextChannel, PresenceData, ActivityType } from "discord.js";
import { Battle } from "./structure/Battle";

export const client = new Client({
  intents: ["GuildMessages", "Guilds", "GuildMembers"],
});

export const commandManager = new CommandManager({
  client,
  devGuildID: client.settings.guildId,
});

commandManager.verbose = true;

commandManager.handleCommandOnCooldown((i, command, timeLeft) => {
  const embed = new EmbedBuilder().setColor(RED);
  const { hours, minutes, seconds } = timeLeft;

  if (command.name === "heavy") {
    embed.setDescription(
      `\`⚠️\` Your heavy attack is on cooldown! Please wait **${seconds}s**`
    );
  } else {
    embed.setDescription(
      `This command is on cooldown. Please wait for **${hours}h ${minutes}m ${seconds}s**`
    );
  }

  i.reply({ embeds: [embed], ephemeral: true });
});

commandManager.handleCommandError(handleCommandError);

const presenceData: PresenceData = {
  status: "idle",
};

client.on("ready", async () => {
  client.user?.setPresence(presenceData);
  client.user?.setActivity("over Caramel Iced Latte", {
    type: ActivityType.Watching,
  });

  commandManager.registerCommands(path.resolve(__dirname, "./commands"));
  console.log(client.user!.username, "is ready!");

  const roleId = client.settings.roleId as string;
  const guildId = client.settings.guildId as string;
  const guild = await client.guilds.fetch(guildId);

  if (!guild) throw new CommandError(`Cannot find guild "${guildId}"`);

  const role = await guild.roles.fetch(roleId);

  if (!role) throw new CommandError(`cannot find role "${roleId}"`);

  for (const channel of client.channels.cache.values()) {
    if (channel.id === client.settings.channelId) continue;
    if (channel.isThread()) continue;

    if (channel instanceof TextChannel) {
      channel.permissionOverwrites
        .create(role, { ViewChannel: false })
        .catch(() => {});
    }
  }
});

client.on("interactionCreate", async (i) => {
  if (i.isCommand()) {
    commandManager.handleInteraction(i);
  } else if (i.isButton()) {
    if (Battle.isValidButtonInteraction(i.customId)) {
      await i.deferReply({ ephemeral: true });

      try {
        const battle = await Battle.load(i);

        if (!battle.isReady) {
          throw new CommandError("You need to wait for your turn");
        }

        await battle.handleAttack(i);
      } catch (err) {
        handleCommandError(i, err as Error);
      }
    }
  }
});

client.login(process.env.BOT_TOKEN);
