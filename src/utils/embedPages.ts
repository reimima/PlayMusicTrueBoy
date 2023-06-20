import type {
    ButtonInteraction,
    EmbedBuilder,
    InteractionReplyOptions,
    InteractionResponse,
} from 'discord.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
    Message,
} from 'discord.js';

import type { ExClient } from '../ExClient';

export const embedPages = async (
    client: ExClient,
    interaction: ButtonInteraction | ChatInputCommandInteraction,
    pages: EmbedBuilder[],
    options: {
        replied: boolean;
        ephemeral: boolean;
        timeout: number;
    },
): Promise<InteractionResponse | Message | undefined> => {
    const buttons = [
        new ButtonBuilder()
            .setCustomId('first')
            .setEmoji(client._emojis.process.first)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('previous')
            .setEmoji(client._emojis.process.previous)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('next')
            .setEmoji(client._emojis.process.next)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
        new ButtonBuilder()
            .setCustomId('last')
            .setEmoji(client._emojis.process.last)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
    ];

    const rows = [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)];

    let currentPage = 0;

    const message = {
        embeds: [
            pages[currentPage]?.setFooter({
                text: `Page : ${currentPage + 1}/${pages.length}`,
            }),
        ],
        components: rows,
        ephemeral: options.ephemeral,
    } as InteractionReplyOptions;

    const sent =
        interaction instanceof ChatInputCommandInteraction && !options.replied
            ? await interaction.fetchReply()
            : options.replied
            ? await interaction.followUp(message)
            : await interaction.reply(message);

    const filter = (interaction: ButtonInteraction) =>
        ['first', 'previous', 'next', 'last'].includes(interaction.customId);
    const collecter = sent.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: options.timeout,
    });

    collecter.on('collect', async interaction => {
        switch (interaction.customId) {
            case 'first':
                currentPage = 0;
                break;

            case 'previous':
                currentPage = currentPage > 0 ? --currentPage : pages.length - 1;
                break;

            case 'next':
                currentPage = currentPage + 1 < pages.length ? ++currentPage : 0;
                break;

            case 'last':
                currentPage = pages.length - 1;
                break;
        }

        switch (currentPage) {
            case 0:
                rows[0]?.setComponents(
                    buttons.map((button, index) =>
                        [0, 1].includes(index)
                            ? button.setDisabled(true)
                            : button.setDisabled(false),
                    ),
                );
                break;

            case pages.length - 1:
                rows[0]?.setComponents(
                    buttons.map((button, index) =>
                        [2, 3].includes(index)
                            ? button.setDisabled(true)
                            : button.setDisabled(false),
                    ),
                );
                break;

            default:
                rows[0]?.setComponents(buttons.map(button => button.setDisabled(false)));
                break;
        }

        const embed = pages[currentPage];

        if (!embed) return;

        await sent.edit({
            embeds: [
                embed.setFooter({
                    text: `Page : ${currentPage + 1}/${pages.length}`,
                }),
            ],
            components: rows,
        });

        collecter.resetTimer();
        await interaction.deferUpdate();
    });

    collecter.on('end', async (_, reason) => {
        if (
            reason !== 'messageDelete' && sent instanceof Message
                ? sent.editable
                : (await sent.fetch()).editable
        ) {
            rows[0]?.setComponents(buttons.map(button => button.setDisabled(true)));

            const embed = pages[currentPage];

            if (!embed) return;

            await sent.edit({
                embeds: [
                    embed.setFooter({
                        text: `Page : ${currentPage + 1}/${pages.length}`,
                    }),
                ],
                components: rows,
            });
        }
    });
    return sent;
};
