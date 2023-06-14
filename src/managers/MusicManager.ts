import { type GuildQueue } from 'discord-player';
import { ButtonStyle, EmbedBuilder } from 'discord.js';
import type {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    Message,
    TextBasedChannel,
} from 'discord.js';
import type { Logger } from 'log4js';
import log4js from 'log4js';

import type { ExClient } from '../ExClient';
import { delayDelete } from '../utils';

// eslint-disable-next-line import/no-named-as-default-member
const { getLogger } = log4js;

export class MusicManager {
    private readonly logger: Logger;

    public constructor(
        private readonly client: ExClient,
        private readonly interaction: ButtonInteraction,
        private readonly rows: ActionRowBuilder<ButtonBuilder>[],
        private readonly queue: GuildQueue<{ channel: TextBasedChannel | null }>,
        private readonly message: Message,
    ) {
        this.logger = getLogger('MusicManager');
    }

    public readonly volumeDown = async (): Promise<Promise<Message>[]> => {
        const beforeVolume = this.queue.node.volume;

        if (beforeVolume <= 0) {
            const failure = await this.interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${this.client._emojis.namek.failure} Volume is already below 0%`)
                        .setDescription('ボリュームはすでに `0%` です。'),
                ],
            });

            return delayDelete(3, failure);
        }

        this.queue.node.setVolume(beforeVolume - 10);

        const success = await this.interaction.followUp({
            embeds: [
                new EmbedBuilder()
                    .setColor('DarkPurple')
                    .setTitle(
                        `${this.client._emojis.namek.success} Changed the volume to \`${this.queue.node.volume}%\`!`,
                    )
                    .setDescription(`ボリュームを \`${this.queue.node.volume}%\` にしました！`),
            ],
        });

        return delayDelete(3, success);
    };

    public readonly backTrack = async () => {
        if (!(this.queue.history.tracks.size > 0)) {
            const failure = await this.interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(
                            `${this.client._emojis.namek.failure} Number of queue histroy is under 1.`,
                        )
                        .setDescription(
                            '再生された曲の合計が一つ以上でない限り、 `Back` は行えません。',
                        ),
                ],
            });

            return delayDelete(3, failure);
        }

        await this.queue.history.previous();

        const success = await this.interaction.followUp({
            embeds: [
                new EmbedBuilder()
                    .setColor('DarkPurple')
                    .setTitle(`${this.client._emojis.namek.success} Back successfully!`)
                    .setDescription('一つ前のトラックに戻りました！'),
            ],
        });

        return delayDelete(3, success);
    };

    public readonly toggleTrackState = async () => {
        if (!this.queue.node.isPaused()) {
            this.queue.node.setPaused(true);

            const pause = await this.interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('DarkPurple')
                        .setTitle(
                            `${this.client._emojis.namek.success} Toggle to pause successfully!`,
                        )
                        .setDescription('ポーズ状態に変更しました！'),
                ],
            });

            delayDelete(3, pause);

            this.rows[0]?.components[2]
                ?.setLabel('Resume')
                .setEmoji({ id: '1112754963253297163' })
                .setStyle(ButtonStyle.Primary);

            return this.message.edit({ components: this.rows });
        }

        this.queue.node.setPaused(false);

        const unpause = await this.interaction.followUp({
            embeds: [
                new EmbedBuilder()
                    .setColor('DarkPurple')
                    .setTitle(
                        `${this.client._emojis.namek.success} Toggle to unpause successfully!`,
                    )
                    .setDescription('ポーズ状態を解除しました！'),
            ],
        });

        delayDelete(3, unpause);

        this.rows[0]?.components[2]
            ?.setLabel('Pause')
            .setEmoji({ id: '1112677166476431380' })
            .setStyle(ButtonStyle.Primary);

        return this.message.edit({ components: this.rows });
    };
}
