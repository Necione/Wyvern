import { getData, Unit } from "../constants";
import { getItem, getItems, Item } from "./Item";

export interface Material extends Item {}

// represents item that requires specific materials in order to buy
export interface ItemBuildMaterial {
  materials: Unit[];
}

export function isItemBuildMaterial(
  item: Item | ItemBuildMaterial
): item is ItemBuildMaterial {
  if ("materials" in item) {
    return true;
  }

  return false;
}

export function isMaterial(item: Item | Material): item is Material {
  if ("materials" in item) {
    return false;
  }

  return true;
}

const normmats = getData<Material>("content", "materials", "material.json");
const hidden = getData<Material>("content", "materials", "hidden.json");
const trader = getData<Material>("content", "materials", "trader.json");

export const materials = [...normmats, ...hidden, ...trader];

export function getMaterial(id: string) {
  return getItem(materials, id);
}

export function getMaterials(ids: string[]) {
  return getItems(materials, ids);
}
