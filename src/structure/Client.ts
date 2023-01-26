import { Client as DiscordClient } from "discord.js";
import Josh from "@joshdb/core";
//@ts-ignore
import provider from "@joshdb/sqlite";
import { CommandError } from "@jiman24/slash-commandment";
import { getData } from "../constants";
import { getWeapon, Weapon, weapons } from "./Weapon";
import { Armor, armors, getArmor } from "./Armor";
import { getMaterial, Material, materials } from "./Material";
import { getPotion, Potion, potions } from "./Potion";
import { Item } from "./Item";

const settingsFile = process.env.ENV === "DEV" ? 
  "dev-settings.json" : "settings.json";

const settingsData = getData("content", settingsFile) as unknown as SettingsData;

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

  settings = {
    channelId: settingsData.channelId,
    roleId: settingsData.roleId,
    guildId: settingsData.guildId,
    threadChannelId: settingsData.threadChannelId,
  }

  getItem(id: string): Weapon | Armor | Potion | Material | undefined  {
    return getWeapon(id) || getArmor(id) || getPotion(id) || getMaterial(id);
  }

  get items() {
    return [
      ...weapons,
      ...armors,
      ...potions,
      ...materials,
    ]
  }

  get traderItems() {
    return this.items.filter(x => x.trader);
  }

  getItemType<T extends Item>(item: T) {
    if (getArmor(item.id)) {
      return "armor" as const;
    } else if (getWeapon(item.id)) {
      return "weapon" as const;
    } else if (getMaterial(item.id)) {
      return "material" as const;
    } else if (getPotion(item.id)) {
      return "potion" as const;
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

  async getRole(roleId: string) {
    const guild = await this.guilds.fetch(this.settings.guildId);
    const role = await guild.roles.fetch(roleId);
    if (!role) {
      throw new CommandError(`Cannot find role "${roleId}"`);
    }
    return role;
  }
}
