import { EmbedBuilder } from "@discordjs/builders";
import { random, sleep } from "@jiman24/discordjs-utils";
import { CommandError } from "@jiman24/slash-commandment";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  CommandInteraction,
  GuildMemberRoleManager,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { client } from "..";
