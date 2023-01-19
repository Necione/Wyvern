import { CommandError } from "@jiman24/slash-commandment";
import { 
  ButtonInteraction, 
  CommandInteraction, 
  EmbedBuilder, 
  RGBTuple,
} from "discord.js";
import { readFileSync } from "fs";
import { join } from "path";
import { Item } from "./structure/Item";
import { Trader } from "./structure/Trader";

export const GREEN = [1, 198, 137] as RGBTuple;
export const RED = [244, 67, 54] as RGBTuple;
export const BLUE = [159, 197, 232] as RGBTuple;
export const HEART = "❤️";
export const SWORD = "⚔️";
export const WARNING = "⚠️";

export interface Unit {
  id: string;
  amount: number;
}

export function errorEmbed(message: string) {
  return new EmbedBuilder()
    .setColor(RED)
    .setDescription(message);
}

export function handleCommandError(
  i: CommandInteraction | ButtonInteraction, 
  err: Error,
) {
  let errMsg = "There's an error occured";

  if (err instanceof CommandError) {
    errMsg = err.message;
  } else {
    console.log(err);
  }

  const embed = new EmbedBuilder()
    .setColor(RED)
    .setDescription(errMsg);

  if (i.replied || i.deferred) {
    i.editReply({ embeds: [embed] });
  } else {
    i.reply({ embeds: [embed], ephemeral: true });
  }
}


export function getItem(itemId: string) {
  return Item.all.find(x => x.id === itemId) || Trader.all.find(x => x.id === itemId);
}

export function getData<T>(...paths: string[]): T[] {
  return JSON.parse(
    readFileSync(join(...paths), { encoding: "utf8" })
  );
}
