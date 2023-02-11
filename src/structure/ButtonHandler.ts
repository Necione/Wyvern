import {
  Message,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  MessageComponentInteraction,
  User,
  InteractionCollector,
  ButtonInteraction,
  ButtonStyle,
  CacheType,
  ComponentType,
} from "discord.js";
import crypto from "crypto";

interface Button {
  id: string;
  label: string;
  callback: (user: User, id: string) => void | Promise<void>;
}

type ButtonCallback = Button["callback"];

const GLOBAL_BUTTONS: Button[] = [];

export class ButtonHandler {
  private msg: Message;
  private userID: string;
  private embed: EmbedBuilder[];
  private buttons: Button[] = [];
  private timeout = 60_000;
  private maxUser = 1;
  private users?: string[];
  private clickedUsers = new Map<string, number>();
  private max = 1;
  private id = this.uuid();
  private filter?: (user: User) => boolean;
  private collector?: InteractionCollector<ButtonInteraction>;

  constructor(msg: Message, embed: EmbedBuilder[], userID?: string) {
    this.msg = msg;
    this.userID = userID || msg.author.id;
    this.embed = embed;
  }

  private uuid() {
    return crypto.randomBytes(16).toString("hex");
  }

  private labelToID(label: string) {
    return `${this.id}-` + label.replace(/\s+/, "") + `-${this.uuid()}`;
  }

  private getButtonHandlerID(id: string) {
    return id.split("-")[0];
  }

  private isMultiUser() {
    return this.maxUser !== 1;
  }

  /** set custom filter */
  setFilter(cb: (user: User) => boolean) {
    this.filter = cb;
    return this;
  }

  /** set selected amount user can click. 1 by default. */
  setUsers(ids: string[]) {
    this.users = ids;
    return this;
  }

  /** set max number of users can click. (1 button click per user by default) */
  setMultiUser(max: number) {
    this.maxUser = max;
    return this;
  }

  /** set button timeout */
  setTimeout(ms: number) {
    this.timeout = ms;
    return this;
  }

  /** set max button click per user */
  setMax(max: number) {
    this.max = max;
    return this;
  }

  /** async reset embed. This method only works for single user and single click */
  setEmbed(embed: EmbedBuilder) {
    this.embed = [embed];
    this.close();
    this.clickedUsers.delete(this.userID);
    this.run();
  }

  /** adds button */
  addButton(label: string, callback: ButtonCallback) {
    const id = this.labelToID(label);
    const button = {
      id,
      label,
      callback,
    };

    this.buttons.push(button);
    GLOBAL_BUTTONS.push(button);

    return this;
  }

  /** add generic cancel button */
  addCloseButton() {
    const label = "Leave";
    const id = this.labelToID(label);
    const button = {
      id,
      label,
      callback: () => {},
    };

    this.buttons.push(button);
    GLOBAL_BUTTONS.push(button);

    return this;
  }

  /** stop collecting button click */
  close() {
    this.collector?.emit("end");
  }

  /** start collecting button click */
  async run() {
    const buttons = this.buttons.map((x) => {
      const btn = new ButtonBuilder()
        .setCustomId(x.id)
        .setLabel(x.label)
        .setStyle(ButtonStyle.Primary);

      if (x.id.toLowerCase().includes("leave")) {
        btn.setStyle(ButtonStyle.Danger);
      }

      return btn;
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
    const menu = await this.msg.channel.send({
      embeds: [...this.embed],
      components: [row],
    });

    const filter = (i: MessageComponentInteraction) => {
      i.deferUpdate().catch(() => {});

      const userID = i.user.id;

      if (this.filter && !this.filter(i.user)) return false;

      let isValidUser = this.userID === userID;

      if (this.users) {
        isValidUser = this.users.includes(userID);
      } else if (this.isMultiUser()) {
        isValidUser = true;
      }

      const clicked = this.clickedUsers.get(userID) || 0;

      if (isValidUser && clicked < this.max) {
        this.clickedUsers.set(userID, clicked + 1);
        return true;
      }

      return false;
    };

    let max = this.max;

    if (this.users) {
      max = this.users.length * this.max;
    } else if (this.isMultiUser()) {
      max = this.maxUser * this.max;
    }

    const collector = menu.createMessageComponentCollector({
      max,
      filter,
      componentType: ComponentType.Button,
      time: this.timeout,
    });

    this.collector = collector as InteractionCollector<
      ButtonInteraction<CacheType>
    >;

    return new Promise<void>((resolve, reject) => {
      const promises: Promise<void>[] = [];

      collector.on("collect", async (button) => {
        let btn = this.buttons.find((x) => x.id === button.customId);

        if (!btn) {
          btn = GLOBAL_BUTTONS.find((x) => {
            const btnHandlerID = this.getButtonHandlerID(x.id);
            return btnHandlerID === this.id && x.id === button.customId;
          });
        }

        if (btn) {
          try {
            const promise = btn.callback(button.user, button.customId);

            if (promise) promises.push(promise);
          } catch (err) {
            collector.emit("end");
            reject(err);
          }
        }
      });

      collector.on("end", async () => {
        await menu.delete().catch(() => {});

        for (const button of this.buttons) {
          const index = GLOBAL_BUTTONS.findIndex((x) => x.id === button.id);
          GLOBAL_BUTTONS.splice(index, 1);
        }

        Promise.allSettled(promises)
          .then(() => resolve())
          .catch((err) => reject(err));
      });
    });
  }
}
