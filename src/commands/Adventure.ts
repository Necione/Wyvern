import { Command, CommandError } from "@jiman24/slash-commandment";
import {
  ChannelType,
  CommandInteraction,
  EmbedBuilder,
  GuildMemberRoleManager,
  Message,
  TextChannel,
} from "discord.js";
import { Player } from "../structure/Player";
import { Monster } from "../structure/Monster";
import { Battle } from "../structure/Battle";
import { client } from "..";
import {
  chunk,
  random,
  time,
  bold,
  remove,
  sleep,
  code,
} from "@jiman24/discordjs-utils";
import { GREEN, HEART } from "../constants";
import { isValidChannel } from "../execs/preExecs";
import { ButtonHandler as Button } from "@jiman24/discordjs-button";
import { Chest } from "../structure/Chest";
import { ButtonHandler } from "../structure/ButtonHandler";
import { Item, showStat } from "../structure/Item";
import { isItemBuildMaterial } from "../structure/Material";
import { randomItems } from "../structure/Trader";

export default class extends Command {
  name = "adventure";
  description = "Venture further into the dungeon...";
  preExec = [isValidChannel];
  // prevent player from spamming this command
  cooldown = process.env.ENV === "DEV" ? time.SECOND : time.MINUTE / 3;
  blueRoomChance = process.env.ENV === "DEV" ? 1 : 0.5;
  whiteRoomChance = 0.25;
  greenRoomChance = 0.25;

  async battle(i: CommandInteraction) {
    const player = await Player.load(i.user.id);

    const isBoss = player.redRoomPassed >= player.redRoomRequired;
    const monster = isBoss
      ? Monster.randomBoss(player.floor)
      : Monster.random(player.floor, player.phase);
    const battle = new Battle(i, player, monster);
    const role = await client.getRole(client.settings.roleId);
    const memberRoles = i.member?.roles as GuildMemberRoleManager;

    await memberRoles.add(role);
    await battle.start();

    // checks if player starts first
    const moveFirst = random.bool();

    if (moveFirst) {
      battle.round++;
      battle.isReady = true;
      await battle.save();

      await battle.editReply(battle.turnMessage());
      await battle.sleep();
    } else {
      battle.isReady = false;
      await battle.save();

      const embed = await battle.handleMonsterAttack();
      await battle.editReply(embed);
      await battle.sleep();
      await battle.handleDead();

      battle.round++;
      battle.isReady = true;
      await battle.save();

      await battle.editReply(battle.turnMessage());
    }
  }

  async handleGreenRoom(i: CommandInteraction) {
    const player = await Player.load(i.user.id);
    const monster = Monster.randomSpecial(player.floor);
    const battle = new Battle(i, player, monster);
    const role = await client.getRole(client.settings.roleId);
    const memberRoles = i.member?.roles as GuildMemberRoleManager;

    await memberRoles.add(role);
    await battle.start();

    // checks if player starts first
    const moveFirst = random.bool();

    if (moveFirst) {
      battle.round++;
      battle.isReady = true;
      await battle.save();

      await battle.editReply(battle.turnMessage());
      await battle.sleep();
    } else {
      battle.isReady = false;
      await battle.save();

      const embed = await battle.handleMonsterAttack();
      await battle.editReply(embed);
      await battle.sleep();
      await battle.handleDead();

      battle.round++;
      battle.isReady = true;
      await battle.save();

      await battle.editReply(battle.turnMessage());
    }
  }

  async handleWhiteRoom(i: CommandInteraction) {
    const player = await Player.load(i.user.id);
    const chest = Chest.random(player.floor);
    const isMonsterSpawn = random.bool(0.5);
    const isHealingWell = random.bool(0.5);

    if (isMonsterSpawn) {
      await this.battle(i);
      return;
    } else if (isHealingWell) {
      player.hp += 15;
      await player.save();

      const embed = new EmbedBuilder()
        .setColor(GREEN)
        .setDescription(
          `You stumbled upon a healing well and recovered \`${HEART} +15 HP\`! `
        );

      await i.editReply({ embeds: [embed] });
    } else {
      player.addInventory(chest.items);
      player.coins += chest.coins;
      await player.save();

      await i.editReply({ embeds: [chest.show()] });
    }
  }

  async handleTrader(items: Item[], player: Player, message: Message) {
    while (true) {
      const pages = chunk(items, 3);

      const pagesEmbed = pages.map((page) => {
        const content = page
          .map((item) => {
            const lines = [
              bold(`${item.name} (ID: ${item.id})`),
              `*${item.desc}*`,
              showStat(item),
            ];

            if (isItemBuildMaterial(item)) {
              const materials = item.materials.map((x) => {
                const item = client.getItem(x.id);

                if (!item) {
                  throw new CommandError(`\`⚠️\` Item not found "${x.id}"`);
                }

                return code(`${item.name} (x${x.amount})`);
              });

              lines.push("> Materials: " + materials.join());
            }

            lines.push(`> Price: **$${item.price} Coins**`);

            return lines.filter((x) => !!x).join("\n");
          })
          .join("\n\n");

        const descs = [
          "Use the `/inventory` command to check your items.\n",
          content,
        ];

        const embed = new EmbedBuilder()
          .setTitle(`The Trader Shop`)
          .setColor("Random")
          .setDescription(descs.join("\n"));

        return embed;
      });

      const buttonHandler = new ButtonHandler(message, pagesEmbed, player.id);

      let selectedItem!: Item;

      for (const item of items) {
        buttonHandler.addButton(item.name, () => {
          selectedItem = item;
        });
      }

      buttonHandler.addCloseButton();

      await buttonHandler.run();

      if (!selectedItem) {
        return;
      }

      if (player.coins < selectedItem.price) {
        await message.edit({
          content: `\`⚠️\` Insufficient coins`,
          components: [],
          embeds: [],
        });
        await sleep(3 * time.SECOND);
        continue;
      }

      if (isItemBuildMaterial(selectedItem)) {
        try {
          for (const material of selectedItem.materials) {
            const playerMaterialAmount = player.materials.filter(
              (x) => x.id === material.id
            ).length;

            if (playerMaterialAmount < material.amount) {
              throw new Error();
            }
          }
        } catch (e) {
          await message.edit({
            content: `\`⚠️\` You don't have all the required materials`,
            components: [],
            embeds: [],
          });
          await sleep(3 * time.SECOND);
          continue;
        }
      }

      return selectedItem;
    }
  }

  async handleBlueRoom(i: CommandInteraction) {
    const threadChannel = client.getChannel(client.settings.threadChannelId);

    if (!(threadChannel instanceof TextChannel)) {
      throw new CommandError(
        `\`⚠️\` Channel "${threadChannel.id}" is not text-based`
      );
    }

    let thread = await threadChannel.threads.create({
      name: "Trader",
      invitable: false,
      type: ChannelType.PrivateThread,
    });

    await thread.members.add(i.user.id);
    await thread.members.add(client.user!.id);

    await i.editReply(
      `${thread} has been successfully created. Please continue there.`
    );

    const items = randomItems();
    const player = await Player.load(i.user.id);
    const message = await thread.send("\u200b");
    const selectedItem = await this.handleTrader(items, player, message);

    if (!selectedItem) {
      await thread.delete();
      return;
    }

    player.coins -= selectedItem.price;

    if (isItemBuildMaterial(selectedItem)) {
      for (const material of selectedItem.materials) {
        player.materialsId = remove(
          material.id,
          player.materialsId,
          material.amount
        );
      }
    }

    player.addItem(selectedItem);

    const embed = new EmbedBuilder()
      .setColor(GREEN)
      .setDescription(`Successfully bought **${selectedItem.name}**!`);

    await message.edit({
      content: "\u200b",
      embeds: [embed],
      components: [],
    });

    await player.save();
    await sleep(5 * time.SECOND);
    await thread.delete();
  }

  async exec(i: CommandInteraction) {
    const player = await Player.load(i.user.id);
    await i.deferReply();

    //Drain energy per use
    let energyDrain = (player.energy -= 10);
    await player.save();

    if (player.hp <= 0 || energyDrain <= 0) {
      player.energy += 10;
      await player.save();
      throw new CommandError(`\`⚠️\` You cannot go on an adventure`);
    }

    const isBattleRunning = await client.battles.has(i.user.id);

    if (isBattleRunning) {
      this.cooldown = 0;
      throw new CommandError("`⚠️` There's already a battle running");
    }

    const buttonHandler = new Button(
      i,
      "You venture futher into the dungeon, choose which room you enter:"
    );

    let room!: "red" | "white" | "blue" | "green";

    buttonHandler.addButton("Red Room", () => {
      room = "red";
    });

    if (random.bool(this.whiteRoomChance)) {
      buttonHandler.addButton("White Room", () => {
        room = "white";
      });
    }

    if (random.bool(this.blueRoomChance)) {
      buttonHandler.addButton("Blue Room", () => {
        room = "blue";
      });
    }

    if (random.bool(this.greenRoomChance)) {
      buttonHandler.addButton("Green Room", () => {
        room = "green";
      });
    }

    await buttonHandler.run();

    switch (room) {
      case "red":
        await this.battle(i);
        break;
      case "white":
        await this.handleWhiteRoom(i);
        break;
      case "blue":
        await this.handleBlueRoom(i);
        break;
      case "green":
        await this.handleGreenRoom(i);
        break;
    }
  }
}
