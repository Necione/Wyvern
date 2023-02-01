import { getData } from "../constants";
import { getItem, getItems, Item } from "./Item";
import { ItemBuildMaterial } from "./Material";

export interface Potion extends Item, ItemBuildMaterial {
  heal: number;
}

export const potions = getData<Potion>("content", "potion.json");

export function isPotion(item: Item | Potion): item is Potion {
  if ("heal" in item) {
    return true;
  }

  return false;
}

export function getPotion(id: string) {
  return getItem(potions, id);
}

export function getPotions(ids: string[]) {
  return getItems(potions, ids);
}
