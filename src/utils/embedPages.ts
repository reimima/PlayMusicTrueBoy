/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {
    BaseMessageOptions,
    ButtonInteraction,
    EmbedBuilder,
    InteractionReplyOptions,
} from 'discord.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    ComponentType,
} from 'discord.js';

export const embedPages = async (
    source: ChatInputCommandInteraction,
    pages: EmbedBuilder[],
    options: {
        fromButton: boolean;
        timeOut: number;
    },
) => {
    const buttons = [
            new ButtonBuilder()
                .setCustomId('first')
                .setLabel('⏪')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('◀️')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('delete')
                .setLabel('🗑️')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(false),
            new ButtonBuilder().setCustomId('next').setLabel('▶️').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('last').setLabel('⏩').setStyle(ButtonStyle.Primary),
        ],
        rows = [new ActionRowBuilder<ButtonBuilder>().addComponents(buttons)];

    let currentPage = 0;

    const contents = {
        embeds: [
            pages[currentPage]?.setFooter({ text: `Page : ${currentPage + 1}/${pages.length}` }),
        ],
        components: rows,
    } as BaseMessageOptions | InteractionReplyOptions;

    if (pages.length < 2) {
        rows[0]?.setComponents(
            buttons[0]!.setDisabled(true),
            buttons[1]!.setDisabled(true),
            buttons[2]!.setDisabled(false),
            buttons[3]!.setDisabled(true),
            buttons[4]!.setDisabled(true),
        );
    }

    const sent = options.fromButton
        ? await source.channel?.send(contents as BaseMessageOptions)
        : await source.reply(contents as InteractionReplyOptions);
    const fetched =
        source instanceof ChatInputCommandInteraction && !options.fromButton
            ? await source.fetchReply()
            : sent;

    const filter = (interaction: ButtonInteraction) =>
        ['first', 'previous', 'delete', 'next', 'last'].includes(interaction.customId);
    const collecter = fetched?.createMessageComponentCollector({
        filter,
        componentType: ComponentType.Button,
        time: options.timeOut,
    });

    const collected = source.channel?.messages.cache.get(fetched!.id);

    if (!collected) return;

    collecter?.on('collect', async interaction => {
        switch (interaction.customId) {
            case 'first':
                currentPage = 0;
                break;
            case 'previous':
                currentPage = currentPage > 0 ? --currentPage : pages.length - 1;
                break;
            case 'delete':
                currentPage = 404;
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
                    buttons[0]!.setDisabled(true),
                    buttons[1]!.setDisabled(true),
                    buttons[2]!.setDisabled(false),
                    buttons[3]!.setDisabled(false),
                    buttons[4]!.setDisabled(false),
                );
                break;

            case 404:
                await collected.delete();
                return;

            case pages.length - 1:
                rows[0]?.setComponents(
                    buttons[0]!.setDisabled(false),
                    buttons[1]!.setDisabled(false),
                    buttons[2]!.setDisabled(false),
                    buttons[3]!.setDisabled(true),
                    buttons[4]!.setDisabled(true),
                );
                break;

            default:
                rows[0]?.setComponents(
                    buttons[0]!.setDisabled(false),
                    buttons[1]!.setDisabled(false),
                    buttons[2]!.setDisabled(false),
                    buttons[3]!.setDisabled(false),
                    buttons[4]!.setDisabled(false),
                );
                break;
        }

        await collected.edit({
            embeds: [
                pages[currentPage]!.setFooter({
                    text: `Page : ${currentPage + 1}/${pages.length}`,
                }),
            ],
            components: rows,
        });

        collecter.resetTimer();
        await interaction.deferUpdate();
    });

    collecter?.on('end', async (_, reason) => {
        if (reason !== 'messageDelete' && collected.editable) {
            rows[0]?.setComponents(
                buttons[0]!.setDisabled(true),
                buttons[1]!.setDisabled(true),
                buttons[2]!.setDisabled(true),
                buttons[3]!.setDisabled(true),
                buttons[4]!.setDisabled(true),
            );
            await collected
                .edit({
                    embeds: [
                        pages[currentPage]!.setFooter({
                            text: `Page : ${currentPage + 1}/${pages.length}`,
                        }),
                    ],
                    components: rows,
                })
                .catch(e => console.error(e));
        }
    });
    return collected;
};
