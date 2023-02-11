import { getData } from "../constants";
import { getItem, getItems, Item } from "./Item";
import { ItemBuildMaterial } from "./Material";

export interface Consumable extends Item, ItemBuildMaterial {
  heal: number;
  energy: number;
}

export const consumables = getData<Consumable>("content", "consumable.json");

export function isConsumable(item: Item | Consumable): item is Consumable {
  if ("heal" in item) {
    return true;
  }

  return false;
}

export function getConsumable(id: string) {
  return getItem(consumables, id);
}

export function getConsumables(ids: string[]) {
  return getItems(consumables, ids);
}
