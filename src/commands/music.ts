import { setTimeout as sleep } from 'node:timers/promises';

import { QueryType, QueueRepeatMode, useTimeline } from 'discord-player';
import type { GuildQueue, Track } from 'discord-player';
import {
    ActionRowBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    EmbedBuilder,
} from 'discord.js';
import type {
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Guild,
    GuildMember,
    Message,
    TextBasedChannel,
    VoiceChannel,
} from 'discord.js';

import type { ExClient } from '../ExClient';
import { ExCommand } from '../interfaces';
import { MusicManager } from '../managers';
import { createShortUrl, delayDelete, undoShortUrl } from '../utils';

export default class extends ExCommand {
    private queue!: GuildQueue<{
        channel: TextBasedChannel | null;
    }>;

    private guild!: Guild;

    private channel!: TextBasedChannel;

    private message!: Message;

    private readonly embed: EmbedBuilder;

    private readonly rows: ActionRowBuilder<ButtonBuilder>[];

    private readonly cooldown = new Set();

    public constructor(client: ExClient) {
        super(client, {
            name: 'music',
            description: 'いつでも素晴らしい音楽ライフを貴方に！',
            options: [
                {
                    name: 'song',
                    description: '貴方のために再生する最高の音楽を！',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    autocomplete: true,
                },
            ],
        });

        this.embed = new EmbedBuilder().setColor('Purple').setAuthor({
            name: '🎶 Now Playing...',
            iconURL:
                'https://cdn.discordapp.com/attachments/1108758787357155450/1109823030642876416/cd-loop.gif',
        });

        this.rows = [
            new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId('volume_down')
                    .setLabel('Down')
                    .setEmoji({ id: '1112677285657587722' })
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('back_track')
                    .setLabel('Back')
                    .setEmoji({ id: '1112677203872862218' })
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('toggle_track_state')
                    .setLabel('Pause')
                    .setEmoji({ id: '1112677166476431380' })
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('skip_track')
                    .setLabel('Skip')
                    .setEmoji({ id: '1112677228644409405' })
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('volume_up')
                    .setLabel('Up')
                    .setEmoji({ id: '1112677301822443624' })
                    .setStyle(ButtonStyle.Primary),
            ),

            new ActionRowBuilder<ButtonBuilder>().setComponents(
                new ButtonBuilder()
                    .setCustomId('shuffle_queue')
                    .setLabel('Shuffle')
                    .setEmoji({ id: '1112677185044627456' })
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('loop_mode')
                    .setLabel('Loop')
                    .setEmoji({ id: '1112677268913926185' })
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('stop_track')
                    .setLabel('Stop')
                    .setEmoji({ id: '1112677248592515103' })
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('show_playlist')
                    .setLabel('Playlist')
                    .setEmoji({ id: '1112677148700975134' })
                    .setStyle(ButtonStyle.Primary),
            ),
        ];
    }

    public override readonly run = async (
        interaction: ChatInputCommandInteraction,
    ): Promise<Message | Promise<Message>[] | void> => {
        await interaction.deferReply();

        if (!(await interaction.guild?.members.fetch(interaction.user.id))?.voice.channel)
            return interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(
                                `${this.client._emojis.namek.failure} No user in voice channel.`,
                            )
                            .setDescription('ボイスチャンネルに接続した状態で行ってください。'),
                    ],
                })
                .then(message => delayDelete(3, message));

        if (
            (await interaction.guild?.members.fetch(interaction.user.id))?.voice.channel !==
                interaction.guild?.members.me?.voice.channel &&
            interaction.guild?.members.me?.voice.channel?.joinable
        )
            return interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(
                                `${this.client._emojis.namek.failure} User doesn't join same channel.`,
                            )
                            .setDescription('ボットと同じボイスチャンネルに接続してください。'),
                    ],
                })
                .then(message => delayDelete(3, message));

        let song = interaction.options.get('song')?.value;

        if (!song) return this.showMusicPanel(interaction);

        if (typeof song !== 'string') return;

        if (song.includes('https://ur0.cc/'))
            song = (
                (await undoShortUrl(song)) as {
                    longurl: string;
                }
            ).longurl;

        const result = await this.client.player.search(song, {
            requestedBy: interaction.member as GuildMember,
            searchEngine: QueryType.AUTO,
        });

        if (!result.tracks.length)
            return interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(
                                `${this.client._emojis.namek.failure} Search results could not be found.`,
                            )
                            .setDescription('貴方のための最高の音楽を見つけられませんでした。'),
                    ],
                })
                .then(message => delayDelete(3, message));

        const guild = interaction.guild;
        const channel = interaction.channel;

        if (!guild || !channel) return;

        this.guild = guild;
        this.channel = channel;

        const queue =
            this.client.player.queues.get(guild) ??
            this.client.player.queues.create(guild, {
                leaveOnEnd: false,
                leaveOnStop: false,
                leaveOnEmpty: true,
                volume: 50,
                metadata: {
                    guild: interaction.guild,
                    channel: interaction.channel,
                },
            });

        try {
            if (!queue.connection) {
                await queue.connect(
                    (
                        await interaction.guild.members.fetch(interaction.user.id)
                    ).voice.channel as VoiceChannel,
                );
            }
        } catch (e) {
            this.logger.error(e);

            queue.delete();

            return interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`${this.client._emojis.namek.failure} Where Are you?`)
                            .setDescription(
                                '貴方の居場所が見つかりませんでした、権限を確認してみてください。',
                            ),
                    ],
                })
                .then(message => delayDelete(3, message));
        }

        await interaction
            .followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('DarkPurple')
                        .setTitle(`${this.client._emojis.namek.loading} Loading music...`)
                        .setDescription(
                            `\`${result.playlist ? 'playlist' : 'track'}\` を読み込んでいます...`,
                        ),
                ],
            })
            .then(async message => {
                const track = result.tracks[0];

                if (!track) return;

                queue.addTrack(result.playlist ? result.tracks : track);

                await interaction.followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('DarkPurple')
                            .setTitle(`${this.client._emojis.namek.success} New music added!`)
                            .setDescription(`\`${track.title}\` をキューに追加しました！`),
                    ],
                });

                if (!queue.isPlaying()) await queue.node.play();

                await message.delete();
            })
            .catch(e => this.logger.error(e));
    };

    private readonly showMusicPanel = async (
        interaction: ChatInputCommandInteraction,
    ): Promise<Message | Promise<Message>[] | void> => {
        const queue = this.client.player.queues.get(this.guild);

        if (!queue?.isPlaying())
            return interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`${this.client._emojis.namek.failure} No music is playing...`)
                            .setDescription('あなたが求める最高の音楽が流れていません。'),
                    ],
                })
                .then(message => delayDelete(3, message));

        this.queue = queue as GuildQueue<{ channel: TextBasedChannel | null }>;

        const track = this.queue.currentTrack;

        if (!track) return;

        const message = (this.message = await interaction.followUp({
            embeds: [
                this.embed
                    .setTitle(track.title)
                    .setURL(track.url)
                    .setDescription(`_${track.author}_`)
                    .setFields(
                        {
                            name: 'プレイヤー',
                            value: `**${this.queue.tracks.size}曲**`,
                            inline: true,
                        },
                        {
                            name: 'ループモード',
                            value: `\`${
                                this.queue.repeatMode === QueueRepeatMode.OFF
                                    ? 'off'
                                    : this.queue.repeatMode === QueueRepeatMode.TRACK
                                    ? 'track'
                                    : this.queue.repeatMode === QueueRepeatMode.QUEUE
                                    ? 'queue'
                                    : 'autoplay'
                            }\``,
                            inline: true,
                        },
                        {
                            name: '再生時間',
                            value: `${this.queue.node.createProgressBar() ?? 'N/A'} (${
                                useTimeline(this.guild)?.timestamp.progress ?? 'N/A'
                            }%)`,
                        },
                    )
                    .setThumbnail(track.thumbnail)
                    .setFooter({
                        text: `${
                            track.requestedBy?.username ?? 'N/A'
                        } によってリクエストされました`,
                        iconURL: track.requestedBy?.avatarURL() ?? 'N/A',
                    }),
            ],
            components: this.rows,
        }));

        this.client.globalEmbed = this.embed;

        this.readyMusicPanel(interaction);

        this.client.panels.set(this.channel.id, { message });

        await this.updateMusicPanel();
    };

    private readonly readyMusicPanel = (interaction: ChatInputCommandInteraction): void => {
        const collector = this.message.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: (pressed: ButtonInteraction): boolean =>
                pressed.user.id.includes(interaction.user.id),
        });

        collector.on('collect', async collected => this.controlMusicPanel(collected));
    };

    private readonly controlMusicPanel = async (interaction: ButtonInteraction): Promise<void> => {
        await interaction.deferReply();

        if (this.cooldown.has(interaction.user.id)) {
            await interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(
                                `${this.client._emojis.namek.failure} The button is on cooldown.`,
                            )
                            .setDescription('ボタンは現在クールダウン中です。'),
                    ],
                })
                .then(message => delayDelete(3, message));
            return;
        }

        this.cooldown.add(interaction.user.id);
        setTimeout(() => this.cooldown.delete(interaction.user.id), 3000);

        const musicManager = new MusicManager(
            this.client,
            interaction,
            this.rows,
            this.queue,
            this.message,
        );

        try {
            switch (interaction.customId) {
                case 'volume_down':
                    await musicManager.volumeDown();
                    break;

                case 'back_track':
                    await musicManager.backTrack();
                    break;

                case 'toggle_track_state':
                    await musicManager.toggleTrackState();
                    break;

                case 'skip_track': {
                    await musicManager.skipTrack();
                    break;
                }

                case 'volume_up':
                    await musicManager.volumeUp();
                    break;

                case 'shuffle_queue':
                    await musicManager.shuffleQueue();
                    break;

                case 'loop_mode':
                    await musicManager.loopMode();
                    break;

                case 'stop_track':
                    await musicManager.stopTrack().then(() =>
                        this.message
                            .edit({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('DarkPurple')
                                        .setTitle(
                                            `${this.client._emojis.namek.success} Player was stopped by user!`,
                                        )
                                        .setDescription(
                                            'プレイヤーはユーザーによって停止されました。',
                                        ),
                                ],
                                components: [],
                            })
                            .then(message => delayDelete(3, message)),
                    );
                    break;

                case 'show_playlist':
                    await musicManager.showPlaylist();
                    break;
            }
        } catch (e) {
            this.logger.error(e);

            await interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${this.client._emojis.namek.failure} Unknown error.`)
                        .setDescription(
                            `予期せぬエラーが発生しました。 ${
                                this.client.developer?.toString() ?? 'N/A'
                            } にメンションしてください。`,
                        ),
                ],
            });
        }
    };

    private readonly updateMusicPanelInfomation = async (track: Track | null): Promise<void> => {
        const panel = this.client.panels.get(this.channel.id);

        if (!panel || !track) return;

        this.embed
            .setTitle(track.title)
            .setURL(track.url)
            .setDescription(`_${track.author}_`)
            .setFields(
                {
                    name: 'プレイヤー',
                    value: `**${this.queue.tracks.size}曲**`,
                    inline: true,
                },
                {
                    name: 'ループモード',
                    value: `\`${
                        this.queue.repeatMode === QueueRepeatMode.OFF
                            ? 'off'
                            : this.queue.repeatMode === QueueRepeatMode.TRACK
                            ? 'track'
                            : this.queue.repeatMode === QueueRepeatMode.QUEUE
                            ? 'queue'
                            : 'autoplay'
                    }\``,
                    inline: true,
                },
                {
                    name: '再生時間',
                    value: `${this.queue.node.createProgressBar() ?? 'N/A'} (${
                        useTimeline(this.guild)?.timestamp.progress ?? 'N/A'
                    }%)`,
                },
            )
            .setThumbnail(track.thumbnail)
            .setFooter({
                text: `${track.requestedBy?.username ?? 'N/A'} によってリクエストされました`,
                iconURL: track.requestedBy?.avatarURL() ?? 'N/A',
            });

        await panel.message.edit({
            embeds: [this.embed],
        });
    };

    private readonly updateMusicPanel = async (): Promise<void> => {
        while (this.queue.isPlaying()) {
            await sleep(3000);

            await this.updateMusicPanelInfomation(this.queue.currentTrack);

            const panel = this.client.panels.get(this.channel.id);
            const fields = this.embed.data.fields;

            if (!panel || !fields) return;

            fields[2] = {
                name: '再生時間',
                value: `${this.queue.node.createProgressBar() ?? 'N/A'} (${
                    useTimeline(this.guild)?.timestamp.progress ?? 'N/A'
                }%)`,
            };

            await panel.message.edit({
                embeds: [this.embed],
            });

            if (!this.queue.isPlaying()) break;
        }
    };

    public override readonly autoCompletion = async (
        interaction: AutocompleteInteraction,
    ): Promise<void> => {
        const song = interaction.options.get('song')?.value;

        if (typeof song !== 'string') return;

        if (!song)
            return interaction.respond([
                {
                    name: '貴方の人生を色鮮やかにする音楽は？',
                    /** @description If user doesn't select music, player will play Kimigayo. xD */
                    value: 'https://www.youtube.com/watch?v=tDrvgfDiEE4&ab_channel=WorldNationalAnthemsJP',
                },
            ]);

        if (/^.*(youtu.be\/|list=)([^#&?]*).*/.exec(song)) {
            return interaction.respond([
                {
                    name: 'プレイリストはこのオプションを選択してね！',
                    value: (
                        (await createShortUrl(song)) as {
                            shorturl: string;
                        }
                    ).shorturl,
                },
            ]);
        }

        await interaction.respond(
            (await this.client.player.search(song)).tracks.slice(0, 25).map(t => ({
                name: `[${t.author}] ${t.title} - (${t.duration})`.slice(0, 100),
                value: t.url,
            })),
        );
    };
}
