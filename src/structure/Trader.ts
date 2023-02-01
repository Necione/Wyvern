import { random } from "@jiman24/discordjs-utils";
import { client } from "..";

export const MAX = 3;

export function randomItems() {
  return random.sample(client.traderItems, MAX);
}
