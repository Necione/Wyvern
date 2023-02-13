import { getItem, getItems, Item } from "./Item";
import { getData } from "../constants";
import { ItemBuildMaterial } from "./Material";

export const armorTypes = ["head", "chest", "leggings", "boots"] as const;
export type ArmorType = typeof armorTypes[number];

export interface Armor extends Item, ItemBuildMaterial {
  type: ArmorType;
  hp: number;
  defence: number;
  defenceChance: number;
  atk: number;
}

export const armors = getData<Armor>("content", "armor.json");

export function isArmor(item: Item | Armor): item is Armor {
  if (
    "type" in item &&
    "hp" in item &&
    "defence" in item &&
    "defenceChance" in item
  ) {
    return true;
  }

  return false;
}

export function getArmor(id: string) {
  return getItem(armors, id);
}

export function getArmors(ids: string[]) {
  return getItems(armors, ids);
}
