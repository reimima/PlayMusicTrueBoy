import { QueryType } from 'discord-player';
import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    Message,
    VoiceChannel,
} from 'discord.js';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import type { ExClient } from '../ExClient';
import { ExCommand } from '../interfaces';
import { createShortUrl, undoShortUrl } from '../utils';

export default class extends ExCommand {
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
    }

    public override run = async (interaction: ChatInputCommandInteraction): Promise<Message | void> => {
        await interaction.deferReply();

        if (!(await interaction.guild?.members.fetch(interaction.user.id))?.voice.channel)
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${this.client._emojis.namek.failure} No user in voice channel.`)
                        .setDescription('ボイスチャンネルに接続した状態で行ってください。'),
                ],
            });

        if (
            (await interaction.guild?.members.fetch(interaction.user.id))?.voice.channel !==
                interaction.guild?.members.me?.voice.channel &&
            interaction.guild?.members.me?.voice.channel?.joinable
        )
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${this.client._emojis.namek.failure} User doesn't join same channel.`)
                        .setDescription('ボットと同じボイスチャンネルに接続してください。'),
                ],
            });

        let song = interaction.options.get('song')?.value;

        if (!song) return interaction.followUp('[🚧] 工事中です...');

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
            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${this.client._emojis.namek.failure} Search results could not be found.`)
                        .setDescription('貴方のための最高の音楽を見つけられませんでした。'),
                ],
            });

        const guild = interaction.guild;

        if (!guild) return;

        const queue =
            this.client.player.queues.get(guild) ??
            this.client.player.queues.create(guild, {
                leaveOnEnd: false,
                leaveOnStop: false,
                leaveOnEmpty: true,
                volume: 50,
                metadata: {
                    channel: interaction.channel,
                    skipLoop: false,
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

            return interaction.followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle(`${this.client._emojis.namek.failure} Where Are you?`)
                        .setDescription('貴方の居場所が見つかりませんでした、権限を確認してみてください。'),
                ],
            });
        }

        await interaction
            .followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Default')
                        .setTitle(`${this.client._emojis.namek.loading} Loading music...`)
                        .setDescription(`\`${result.playlist ? 'playlist' : 'track'}\` を読み込んでいます...`),
                ],
            })
            .then(async message => {
                const track = result.tracks[0];

                if (!track) return;

                queue.addTrack(result.playlist ? result.tracks : track);

                if (!queue.isPlaying()) await queue.node.play();

                await message.delete();
            })
            .catch(e => this.logger.error(e));
    };

    public override autoCompletion = async (interaction: AutocompleteInteraction): Promise<void> => {
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
