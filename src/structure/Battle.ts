import { EmbedBuilder } from "@discordjs/builders";
import { random, sleep, time } from "@jiman24/discordjs-utils";
import { CommandError } from "@jiman24/slash-commandment";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  CommandInteraction,
  GuildMemberRoleManager,
  TextChannel,
  ThreadChannel,
} from "discord.js";
import { client } from "..";
import { BLUE, formatFloat, GREEN, HEART, RED, SWORD } from "../constants";
import { Monster } from "./Monster";
import { Player } from "./Player";

export class BattleEndError extends Error {}

interface BattleData {
  monsterHp: number;
  monsterId: string;
  channelId: string;
  threadId: string;
  messageId: string;
}

export class Battle {
  static interval = 2000;
  monsterHp: number;
  monsterId: string;
  channelId: string;
  threadId: string;
  messageId: string;
  isReady = true;
  round = 0;

  constructor(
    readonly i: CommandInteraction | ButtonInteraction,
    public player: Player,
    public monster: Monster
  ) {
    this.monsterHp = this.monster.hp;
    this.monsterId = this.monster.id;
    this.channelId = "";
    this.threadId = "";
    this.messageId = "";
  }

  static async load(i: CommandInteraction | ButtonInteraction) {
    const player = await Player.load(i.user.id);
    const data = (await client.battles.get(player.id)) as BattleData;
    const channel = i.channel as TextChannel | ThreadChannel | undefined;

    if (!data) {
      throw new CommandError("No active battle");
    }

    if (!channel) {
      throw new CommandError("Command only works in a particular thread");
    }

    const cacheChannel = client.channels.cache.get(
      data.channelId
    ) as TextChannel;

    await cacheChannel.threads.fetch();
    const thread = cacheChannel.threads.cache.get(data.threadId);

    if (!channel.isThread()) {
      throw new CommandError(`Please go to ${thread}`);
    }

    if (channel.id !== data.threadId) {
      throw new CommandError(`Please go to ${thread}`);
    }

    const monster =
      Monster.all.find((x) => x.id === data.monsterId) ||
      Monster.bosses.find((x) => x.id === data.monsterId);

    if (!monster) {
      throw new CommandError(`No monster with id "${data.monsterId}" found`);
    }

    const battle = new Battle(i, player, monster);

    Object.assign(battle, data);

    return battle;
  }

  async save() {
    if (this.player.hp <= 0 || this.monsterHp <= 0) {
      this.delete();
    } else {
      await client.battles.set(this.player.id, {
        monsterHp: this.monsterHp,
        isReady: this.isReady,
        monsterId: this.monsterId,
        channelId: this.channelId,
        threadId: this.threadId,
        messageId: this.messageId,
        round: this.round,
      });
    }
  }

  monsterEmbed(initialEncounter = false) {
    const fields = [
      `\`${HEART} Base HP\`: **${this.monsterHp}**`,
      `\`${SWORD} Base ATK\`: **${this.monster.minAtk} - ${this.monster.maxAtk}**`,
    ];

    const embed = new EmbedBuilder()
      .setColor(RED)
      .setThumbnail(this.monster.thumbnailUrl)
      .setTitle(
        initialEncounter
          ? `You encountered a... ${this.monster.name}!`
          : `${this.monster.name}`
      )
      .setDescription(this.monster.description)
      .addFields([
        {
          name: "\u200b",
          value: fields.join("\n"),
        },
      ]);

    return embed;
  }

  async delete() {
    const memberRoles = this.i.member!.roles as GuildMemberRoleManager;
    const role = await client.getRole(client.settings.roleId);
    const channel = client.getChannel(client.settings.threadChannelId);

    if (!(channel instanceof TextChannel)) {
      throw new CommandError(
        `channel "${channel.id}" is not text-based channel`
      );
    }

    await channel.threads.fetch();
    const thread = channel.threads.cache.get(this.threadId);

    if (!thread) {
      throw new CommandError(`thread "${this.threadId}" not found`);
    }

    const message = await this.getMessage();

    await message.edit({ components: [] });
    await memberRoles.remove(role);
    await sleep(5 * time.SECOND);
    await thread.delete();
    await client.battles.delete(this.player.id);
  }

  async handleDead() {
    if (this.player.hp <= 0) {
      this.player.redRoomPassed++;
      await this.player.save();

      throw new BattleEndError("**You have died!**");
    } else if (this.monsterHp <= 0) {
      this.player.coins += this.monster.coins;

      const messages = [`**${this.monster.name} has died!**`];

      for (const drop of this.monster.drop) {
        const isItemDrop = random.bool(drop.dropChance);

        if (!isItemDrop) {
          continue;
        }

        const item = client.getItem(drop.id);

        if (!item) {
          throw new CommandError(`Cannot find item "${drop.id}"`);
        }

        for (let i = 0; i < drop.amount; i++) {
          this.player.addItem(item);
        }

        messages.push(
          `You've earned **${item.name}** \`(x${drop.amount})\``
        );
      }

      const xp = this.monster.xpDrop();
      messages.push(`You've earned **${xp}** xp`);
      messages.push(`You've earned **${this.monster.coins}** coins`);

      const isLevelUp = this.player.addXp(xp);

      if (isLevelUp) {
        messages.push(this.player.levelUpMessage());
      }

      if (this.monster.isBoss) {
        this.player.floor++;
        this.player.redRoomPassed = 0;
        await this.player.save();
        messages.push(`You've ascended to floor **${this.player.floor}**`);
      } else {
        this.player.redRoomPassed++;
        await this.player.save();
      }

      throw new BattleEndError(messages.join("\n"));
    }
  }

  diedEmbed(message: string) {
    return new EmbedBuilder().setColor(RED).setDescription(message);
  }

  handleLightAttack() {
    const embed = new EmbedBuilder()
      .setColor(BLUE)
      .setTitle("`⚔️` You performed a __Light Attack__!")
      .setDescription(
        `Dealt \`${SWORD} ${this.player.attack()}\` damage to the ${this.monster.name}.`
      );

    this.monsterHp -= this.player.attack();

    return embed;
  }

  handleHeavyAttack() {
    const damage = this.player.attack() * 2.5;

    const embed = new EmbedBuilder()
      .setColor(GREEN)
      .setTitle("`⚔️` You performed a __Heavy Attack__!")
      .setDescription(
        `Dealt \`${SWORD} ${damage}\` damage to the ${this.monster.name}.`
      );

    this.monsterHp -= damage;

    return embed;
  }

  async handleMonsterAttack() {
    const missAttack = random.bool(this.monster.missChance);
    const embed = new EmbedBuilder().setColor(RED);

    if (missAttack) {
      embed.setTitle(`${this.monster.name} missed their attack!`);
    } else {
      let damage = this.monster.attack();
      const isDefended = random.bool(this.player.defenceChance);

      if (isDefended) {
        damage = damage * damage / (damage + this.player.defence);
      }

      embed.setTitle(`${this.monster.name} attacked you!`);

      embed.setDescription(
        `You were damaged and lost \`${HEART} ${formatFloat(damage)} HP\``
      );

      this.player.hp -= damage;
      await this.player.save();
    }

    return embed;
  }

  static sep = "|";

  static isValidButtonInteraction(id: string) {
    const [battle] = Battle.parseId(id);
    return battle === "battle";
  }

  static toId(userId: string, attackType: string) {
    return `battle${this.sep}${userId}${this.sep}${attackType}`;
  }

  static parseId(id: string) {
    const [battle, userId, attackType] = id.split(this.sep);
    return [battle, userId, attackType] as const;
  }

  static buttons() {}

  async getMessage() {
    const channel = client.channels.cache.get(this.channelId) as TextChannel;

    if (!channel) {
      throw new CommandError(`channel "${this.channelId}" not found`);
    }

    await channel.threads.fetch();
    const thread = channel.threads.cache.get(this.threadId);

    if (!thread) {
      throw new CommandError(`thread "${this.threadId}" not found`);
    }

    await thread.messages.fetch();
    const message = thread.messages.cache.get(this.messageId);

    if (!message) {
      throw new CommandError(`message "${this.messageId}" not found`);
    }

    return message;
  }

  async editReply(embed: EmbedBuilder) {
    const message = await this.getMessage();

    const light = new ButtonBuilder()
      .setCustomId(Battle.toId(this.i.user.id, "light"))
      .setLabel("Light Attack")
      .setEmoji("🗡️")
      .setStyle(ButtonStyle.Primary);

    const heavy = new ButtonBuilder()
      .setCustomId(Battle.toId(this.i.user.id, "heavy"))
      .setLabel("Heavy Attack")
      .setEmoji("⚔️")
      .setStyle(ButtonStyle.Danger);

    const buttonComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
      light,
      heavy
    );

    await message.edit({
      embeds: [this.player.show(this.i.user), this.monsterEmbed(), embed],
      components: [buttonComponent],
    });
  }

  turnMessage() {
    return new EmbedBuilder()
      .setColor(GREEN)
      .setTitle("It is now your turn!")
      .setDescription("You can also run the `use` or `flee` commands");
  }

  async sleep() {
    await sleep(Battle.interval);
  }

  async start() {
    const monsterEmbed = this.monsterEmbed(true);
    const channel = this.i.channel as TextChannel;
    const user = this.i.user;

    if (channel.isThread()) {
      throw new CommandError("Cannot run `/adventure` command in thread");
    }

    const threadChannel = client.getChannel(client.settings.threadChannelId);

    if (!(threadChannel instanceof TextChannel)) {
      throw new CommandError(
        `Channel "${client.settings.threadChannelId}" is not a thread`
      );
    }

    const thread = await threadChannel.threads.create({
      name: `${user.username}-vs-${this.monster.name}`,
      type: ChannelType.PrivateThread,
    });

    await thread.members.add(this.i.user.id);
    await thread.members.add(client.user!.id);

    await this.i.editReply(
      `${thread} has been successfully created. Please continue there.`
    );

    const message = await thread.send({ embeds: [monsterEmbed] });

    this.channelId = threadChannel.id;
    this.threadId = thread.id;
    this.messageId = message.id;
  }

  async handleAttack(i: ButtonInteraction) {
    const [, userId, attackType] = Battle.parseId(i.customId);

    if (userId !== i.user.id) {
      throw new CommandError("Invalid user");
    }

    const attack =
      attackType === "light"
        ? () => this.handleLightAttack()
        : () => this.handleHeavyAttack();

    if (attackType === "heavy" && this.round < 3) {
      throw new CommandError(
        "`⚠️` You can only use a heavy attack every 3 turns!"
      );
    } else if (attackType === "heavy") {
      this.round = 0;
    }

    try {
      this.isReady = false;
      await this.save();

      await i.editReply({ content: "\u200b" });
      await i.deleteReply();

      const isDodge = random.bool(this.monster.playerMissChance);
      let embed!: EmbedBuilder;

      if (isDodge) {
        embed = new EmbedBuilder()
          .setColor(RED)
          .setTitle("Your attack missed!");

        await this.editReply(embed);
        await this.sleep();
      } else {
        embed = attack();

        await this.editReply(embed);
        await this.sleep();
        await this.handleDead();
      }

      embed = await this.handleMonsterAttack();

      await this.editReply(embed);
      await this.sleep();
      await this.handleDead();

      this.round++;
      this.isReady = true;
      await this.save();
      await this.editReply(this.turnMessage());
    } catch (e) {
      const err = e as Error;

      if (err instanceof BattleEndError) {
        await this.editReply(this.diedEmbed(err.message));
        await this.delete();
      } else {
        throw err;
      }
    }
  }
}
