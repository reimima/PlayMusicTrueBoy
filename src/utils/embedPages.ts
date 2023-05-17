/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { BaseMessageOptions, EmbedBuilder, InteractionReplyOptions } from 'discord.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction } from 'discord.js';

export const embedPages = async (
    source: CommandInteraction,
    pages: EmbedBuilder[],
    options: {
        fromButton: boolean;
        timeOut: number;
    },
) => {
    const buttons = [
            new ButtonBuilder()
                .setCustomId('first')
                .setLabel('<<')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('previous')
                .setLabel('<')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder().setCustomId('next').setLabel('>').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('last').setLabel('>>').setStyle(ButtonStyle.Secondary),
        ],
        rows = [new ActionRowBuilder().addComponents(buttons)];

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
            buttons[2]!.setDisabled(true),
            buttons[3]!.setDisabled(true),
        );
    }

    const message = options.fromButton
            ? await source.channel?.send(contents as BaseMessageOptions)
            : await source.reply(contents as InteractionReplyOptions),
        pagedMessage =
            source instanceof CommandInteraction && !options.fromButton
                ? await source.fetchReply()
                : message;

    const filter = (res: { customId: string }) =>
            ['first', 'previous', 'next', 'last'].includes(res.customId),
        collecter = pagedMessage?.createMessageComponentCollector({
            filter,
            time: options.timeOut,
        });

    const fetchedPagedMessage = source.channel?.messages.cache.get(pagedMessage?.id ?? '');
    if (!fetchedPagedMessage) return;

    collecter?.on('collect', async interaction => {
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
                    buttons[0]!.setDisabled(true),
                    buttons[1]!.setDisabled(true),
                    buttons[2]!.setDisabled(false),
                    buttons[3]!.setDisabled(false),
                );
                break;

            case pages.length - 1:
                rows[0]?.setComponents(
                    buttons[0]!.setDisabled(false),
                    buttons[1]!.setDisabled(false),
                    buttons[2]!.setDisabled(true),
                    buttons[3]!.setDisabled(true),
                );
                break;

            default:
                rows[0]?.setComponents(
                    buttons[0]!.setDisabled(false),
                    buttons[1]!.setDisabled(false),
                    buttons[2]!.setDisabled(false),
                    buttons[3]!.setDisabled(false),
                );
                break;
        }

        await fetchedPagedMessage.edit({
            embeds: [
                pages[currentPage]!.setFooter({
                    text: `Page : ${currentPage + 1}/${pages.length}`,
                }),
            ],
            // @ts-expect-error
            components: rows,
        });

        collecter.resetTimer();
        await interaction.deferUpdate();
    });

    collecter?.on('end', async (_, reason) => {
        if (reason !== 'messageDelete' && fetchedPagedMessage.editable) {
            rows[0]?.setComponents(
                buttons[0]!.setDisabled(true),
                buttons[1]!.setDisabled(true),
                buttons[2]!.setDisabled(true),
                buttons[3]!.setDisabled(true),
            );
            await fetchedPagedMessage
                .edit({
                    embeds: [
                        pages[currentPage]!.setFooter({
                            text: `Page : ${currentPage + 1}/${pages.length}`,
                        }),
                    ],
                    // @ts-expect-error
                    components: rows,
                })
                .catch(e => console.error(e));
        }
    });
    return fetchedPagedMessage;
};
