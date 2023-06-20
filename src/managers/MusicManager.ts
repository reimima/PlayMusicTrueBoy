import { QueueRepeatMode } from 'discord-player';
import type { GuildQueue, Track } from 'discord-player';
import { ButtonStyle, EmbedBuilder } from 'discord.js';
import type {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    Message,
    TextBasedChannel,
} from 'discord.js';

import type { ExClient } from '../ExClient';
import { delayDelete, embedPages } from '../utils';

export class MusicManager {
    public constructor(
        private readonly client: ExClient,
        private readonly interaction: ButtonInteraction,
        private readonly rows: ActionRowBuilder<ButtonBuilder>[],
        private readonly queue: GuildQueue<{ channel: TextBasedChannel | null }>,
        private readonly message: Message,
    ) {}

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

    public readonly backTrack = async (): Promise<Promise<Message>[]> => {
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

    public readonly toggleTrackState = async (): Promise<Message> => {
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

    public readonly skipTrack = async (): Promise<Promise<Message>[]> => {
        this.queue.node.skip();

        return this.interaction
            .followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('DarkPurple')
                        .setTitle(`${this.client._emojis.namek.success} Skip successfully!`)
                        .setDescription(
                            `\`${
                                this.queue.currentTrack?.title ?? 'N/A'
                            }\` のスキップに成功しました！`,
                        ),
                ],
            })
            .then(message => delayDelete(3, message));
    };

    public readonly volumeUp = async (): Promise<Promise<Message>[]> => {
        const beforeVolume = this.queue.node.volume;

        if (beforeVolume >= 100) {
            const failure = await this.interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(
                            `${this.client._emojis.namek.failure} Volume is already above 100%`,
                        )
                        .setDescription('ボリュームはすでに `100%` です。'),
                ],
            });

            return delayDelete(3, failure);
        }

        this.queue.node.setVolume(beforeVolume + 10);

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

    public readonly shuffleQueue = async (): Promise<Promise<Message>[]> => {
        this.queue.tracks.shuffle();

        return this.interaction
            .followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('DarkPurple')
                        .setTitle(`${this.client._emojis.namek.success} Shuffle successfully!`)
                        .setDescription('キュー内のシャッフルに成功しました！'),
                ],
            })
            .then(message => delayDelete(3, message));
    };

    public readonly loopMode = async (): Promise<Promise<Message>[]> => {
        switch (this.queue.repeatMode) {
            case QueueRepeatMode.OFF:
                this.queue.setRepeatMode(QueueRepeatMode.TRACK);
                break;

            case QueueRepeatMode.TRACK:
                this.queue.setRepeatMode(QueueRepeatMode.QUEUE);
                break;

            case QueueRepeatMode.QUEUE:
                this.queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
                break;

            case QueueRepeatMode.AUTOPLAY:
                this.queue.setRepeatMode(QueueRepeatMode.OFF);
                break;
        }

        const message = `${
            this.queue.repeatMode === QueueRepeatMode.OFF
                ? 'off'
                : this.queue.repeatMode === QueueRepeatMode.TRACK
                ? 'track'
                : this.queue.repeatMode === QueueRepeatMode.QUEUE
                ? 'queue'
                : 'autoplay'
        }`;

        return this.interaction
            .followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('DarkPurple')
                        .setTitle(
                            `${this.client._emojis.namek.success} Change loop mode to \`${message}\`.`,
                        )
                        .setDescription(`ループモードを \`${message}\` に変更しました！`),
                ],
            })
            .then(message => delayDelete(3, message));
    };

    public readonly stopTrack = async (): Promise<Promise<Message>[]> => {
        const joinedChannel = this.interaction.guild?.members.me?.voice.channel;

        return this.queue.player.destroy().then(() =>
            this.interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('DarkPurple')
                            .setTitle(
                                `${this.client._emojis.namek.success} Bot has left by ${
                                    joinedChannel?.name ?? 'N/A'
                                }.`,
                            )
                            .setDescription(
                                `${joinedChannel?.toString() ?? 'N/A'} から退出しました！`,
                            ),
                    ],
                })
                .then(message => delayDelete(3, message)),
        );
    };

    public readonly showPlaylist = () => {
        const track = this.queue.currentTrack;
        const tracks = this.queue.tracks.map(
            (m, i) => `${i + 1}. [**[${m.author}] ${m.title}**](${m.url})`,
        );
        const individualTracks = ((tracks: string[]): string[][] =>
            new Array(Math.ceil(tracks.length / 20))
                .fill(tracks)
                .map((_, i) => tracks.slice(i * 20, (i + 1) * 20)))(tracks);

        if (!track) return;

        const embeds = ((nowPlaying: Track, tracks: string[][]): EmbedBuilder[] => {
            const embeds: EmbedBuilder[] = [];

            for (let index = tracks.length; ; index--) {
                if (tracks.length < 1) {
                    embeds.push(
                        new EmbedBuilder()
                            .setColor('DarkPurple')
                            .setTitle(`**[${nowPlaying.author}] ${nowPlaying.title}**`)
                            .setURL(nowPlaying.url),
                    );
                    return embeds;
                }

                tracks.map(track =>
                    embeds.push(
                        new EmbedBuilder()
                            .setColor('DarkPurple')
                            .setTitle(`**[${nowPlaying.author}] ${nowPlaying.title}**`)
                            .setURL(nowPlaying.url)
                            .setDescription(`${track.join('\n')}`),
                    ),
                );

                if (index < 2) break;
            }

            return embeds;
        })(track, individualTracks);

        return this.interaction
            .followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('DarkPurple')
                        .setTitle(`${this.client._emojis.namek.loading} Loading queue...`)
                        .setDescription('キューを読み込んでいます...'),
                ],
            })
            .then(async message => {
                await message.delete();
                await embedPages(this.client, this.interaction, embeds, {
                    replied: true,
                    ephemeral: true,
                    timeout: 60000,
                });
            });
    };
}
