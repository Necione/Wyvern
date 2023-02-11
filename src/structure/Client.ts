import { Client as DiscordClient } from "discord.js";
import Josh from "@joshdb/core";
//@ts-ignore
import provider from "@joshdb/sqlite";
import { CommandError } from "@jiman24/slash-commandment";
import { getData } from "../constants";
import { getWeapon, Weapon, weapons } from "./Weapon";
import { Armor, armors, getArmor } from "./Armor";
import { getMaterial, Material, materials } from "./Material";
import { getConsumable, Consumable, consumables } from "./Consumable";
import { Item } from "./Item";

const settingsFile =
  process.env.ENV === "DEV" ? "dev-settings.json" : "settings.json";

const settingsData = getData(
  "content",
  settingsFile
) as unknown as SettingsData;

interface SettingsData {
  channelId: string;
  roleId: string;
  guildId: string;
  threadChannelId: string;
}

export class Client extends DiscordClient {
  players = new Josh({
    name: "players",
    provider,
  });

  battles = new Josh({
    name: "battles",
    provider,
  });

  reforgedWeapons = new Josh({
    name: "reforged_weapons",
    provider,
  });

  settings = {
    channelId: settingsData.channelId,
    guildId: settingsData.guildId,
    threadChannelId: settingsData.threadChannelId,
  };

  getItem(id: string): Weapon | Armor | Consumable | Material | undefined {
    return (
      getWeapon(id) || getArmor(id) || getConsumable(id) || getMaterial(id)
    );
  }

  get items() {
    return [...weapons, ...armors, ...consumables, ...materials];
  }

  get traderItems() {
    return this.items.filter((x) => x.trader);
  }

  getItemType<T extends Item>(item: T) {
    if (getArmor(item.id)) {
      return "armor" as const;
    } else if (getWeapon(item.id)) {
      return "weapon" as const;
    } else if (getMaterial(item.id)) {
      return "material" as const;
    } else if (getConsumable(item.id)) {
      return "consumable" as const;
    } else {
      return undefined;
    }
  }

  getChannel(channelId: string) {
    const channel = this.channels.cache.get(channelId);
    if (!channel) {
      throw new CommandError(`Cannot find channel "${channelId}"`);
    }
    return channel;
  }
}
