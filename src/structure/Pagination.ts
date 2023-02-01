import {
  ActionRowBuilder,
  Message,
  EmbedBuilder,
  ButtonBuilder,
  MessageComponentInteraction,
  ButtonStyle,
} from "discord.js";

const cancelButton = new ButtonBuilder()
  .setCustomId("cancel")
  .setLabel("Cancel")
  .setStyle(ButtonStyle.Danger);

export interface PaginationOptions {
  index?: number;
  timeout?: number;
  userID?: string;
}

export class Pagination {
  private buttonList = [
    new ButtonBuilder()
      .setCustomId("previous")
      .setLabel("Previous")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("next")
      .setLabel("Next")
      .setStyle(ButtonStyle.Primary),
  ];
  noSelect = false;

  constructor(
    private msg: Message,
    private pages: EmbedBuilder[],
    private options?: PaginationOptions,
  ) {
    if (pages.length === 0) throw new Error("Pages requires at least 1 embed");
  }

  setNoSelect(select: boolean) {
    this.noSelect = select;
  }

  setSelectText(text: string) {
    this.buttonList[1].setLabel(text);
    return this;
  }

  addCancelButton() {
    this.buttonList.push(cancelButton);
    return this;
  }

  async run() {

    return new Promise<void>(async (resolve) => {

      let page = this.options?.index ?? 0;

      if (this.noSelect) {
        this.buttonList.splice(1, 1);
      }

      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(this.buttonList);

      const components = this.pages.length === 1 ? [] : [row];

      const curPage = await this.msg.edit({
        content: `${page + 1}/${this.pages.length}`,
        embeds: [this.pages[page]],
        components,
      }) as Message<boolean>;


      const filter = (i: MessageComponentInteraction) => {
        if (!i.isButton()) return false;
        i.deferUpdate().catch(() => {});
        //@ts-ignore
        const validButton = this.buttonList.some(x => x.data.custom_id === i.customId);
        const target = this.options?.userID || this.msg.author.id;
        const isTarget = i.user.id === target;
        return validButton && isTarget;
      }

      const collector = curPage.createMessageComponentCollector({
        filter,
        time: this.options?.timeout || 60_000,
      });

      collector.on("collect", async (i) => {
        switch (i.customId) {
          case "previous":
            page = page > 0 ? --page : this.pages.length - 1;
            break;
          case "next":
            page = page + 1 < this.pages.length ? ++page : 0;
            break;
          //@ts-ignore
          case cancelButton.data.custom_id:
            collector.stop();
            return;
          default:
            break;
        }

        try { await i.deferUpdate(); } catch {}
        await i.editReply({
          content: `${page + 1}/${this.pages.length}`,
          embeds: [this.pages[page]],
          components: [row],
        });
        collector.resetTimer();
      });

      collector.on("end", (_, reason) => {
        if (reason !== "messageDelete") {
          this.msg.edit({ components: [] })
            .then(() => resolve());
        }
      });
    })

  }
}
