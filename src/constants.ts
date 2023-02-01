import { CommandError } from "@jiman24/slash-commandment";
import {
  ButtonInteraction,
  CommandInteraction,
  EmbedBuilder,
  RGBTuple,
} from "discord.js";
import { readFileSync } from "fs";
import { join } from "path";

export const GREEN = [1, 198, 137] as RGBTuple;
export const RED = [244, 67, 54] as RGBTuple;
export const BLUE = [159, 197, 232] as RGBTuple;
export const HEART = "❤️";
export const SWORD = "⚔️";
export const SHIELD = "🛡️";
export const LIGHTNING = "⚡";
export const EXPLOSION = "💥";

export interface Unit {
  id: string;
  amount: number;
}

export function errorEmbed(message: string) {
  return new EmbedBuilder().setColor(RED).setDescription(message);
}

export function handleCommandError(
  i: CommandInteraction | ButtonInteraction,
  err: Error
) {
  let errMsg = "There's an error occured";

  if (err instanceof CommandError) {
    errMsg = err.message;
  } else {
    console.log(err);
  }

  const embed = new EmbedBuilder().setColor(RED).setDescription(errMsg);

  if (i.replied || i.deferred) {
    i.editReply({ embeds: [embed] });
  } else {
    i.reply({ embeds: [embed], ephemeral: true });
  }
}

export function getData<T>(...paths: string[]): T[] {
  return JSON.parse(readFileSync(join(...paths), { encoding: "utf8" }));
}

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}

export function formatFloat(num: number) {
  return num.toFixed(1).replace(/\.0/, "");
}
