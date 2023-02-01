import { client } from "..";
import { HEART, SHIELD, SWORD, Unit, EXPLOSION } from "../constants";
import { formatPercent } from "@jiman24/discordjs-utils";

export interface Item {
  id: string;
  name: string;
  desc: string;
  price: number;
  trader?: boolean;
  hidden?: boolean;
}

export function addInventory(inventory: string[], items: Unit[]) {
  for (const item of items) {
    for (let i = 0; i < item.amount; i++) {
      inventory.push(item.id);
    }
  }
}

export function getItem<T extends Item>(items: T[], id: string) {
  return items.find((x) => x.id === id);
}

export function getItems<T extends Item>(items: T[], ids: string[]) {
  return ids.map((id) => getItem(items, id)).filter((x) => !!x) as T[];
}

// prettier-ignore
export function showStat<T extends Item>(item: T) {
  const lines = [];
  const itemType = client.getItemType(item);

  switch (itemType) {
    case "weapon":
      //@ts-ignore
      lines.push(`> + \`${SWORD} ${item.atk} ATK\` when equipped`);
      //@ts-ignore
      lines.push(`> + \`${EXPLOSION} ${formatPercent(item.crit)} Crit\` when equipped`);
      //@ts-ignore
      lines.push(`> + \`${EXPLOSION} ${formatPercent(item.critChance)} Crit %\` when equipped`);
      break;
    case "potion":
      //@ts-ignore
      lines.push(`> + \`${HEART} ${item.heal} HP\` upon use`);
      break;
    case "armor":
      //@ts-ignore
      lines.push(`> + \`${HEART} ${item.hp} HP\` when equipped`);
      //@ts-ignore
      lines.push(`> + \`${SHIELD} ${item.defence} DEF\` when equipped`);
      //@ts-ignore
      lines.push(`> + \`${SHIELD} ${formatPercent(item.defenceChance)} DEF %\` when equipped`);
      break;
  }

  return lines.join("\n");
}
