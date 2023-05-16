import type { Track } from 'discord-player';
import { type ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

import { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';
import { embedPages } from '../utils';

export default class extends ExtendedCommand {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'queue',
            description: 'キューを表示します！',
        });
    }

    public override execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.deferReply();

        if (!(await interaction.guild?.members.fetch(interaction.user.id))?.voice.channel) {
            await interaction.followUp({
                content: 'ボイスチャンネルに接続した状態で行ってください！',
            });
            return;
        }

        if (!interaction.guild?.members.me?.voice.channel) {
            await interaction.followUp({
                content: 'ボットがボイスチャンネルに接続していません！',
            });
            return;
        }

        if (
            (await interaction.guild.members.fetch(interaction.user.id)).voice.channel !==
            interaction.guild.members.me.voice.channel
        ) {
            await interaction.followUp({
                content: 'ボットと同じボイスチャンネルに接続してください！',
            });
            return;
        }

        const guild = interaction.guild;
        const queue = this.client.player.queues.get(guild);

        const track = queue?.currentTrack;
        const tracks = queue?.tracks.map((m, i) => `${i + 1}. [**[${m.author}] ${m.title}**](${m.url})`);
        const individualTracks = this.slice(tracks ?? ['']);

        if (!track) return;

        const embeds = this.getQueueEmbeds(track, individualTracks);

        await interaction
            .followUp({
                content: 'キューを読み込んでいます...',
            })
            .then(async message => {
                await Promise.all([
                    await message.delete(),
                    await embedPages(interaction, embeds, { fromButton: true, timeOut: 600000 }),
                ]);
            })
            .catch(e => this.logger.error(e));
    };

    private readonly slice = (array: string[]): string[][] => {
        const len = Math.ceil(array.length / 20);
        return new Array(len).fill(array).map((_, i) => array.slice(i * 20, (i + 1) * 20));
    };

    private readonly getQueueEmbeds = (nowPlaying: Track, tracks: string[][]): EmbedBuilder[] => {
        const embeds: EmbedBuilder[] = [];

        for (let index = tracks.length; ; index--) {
            if (tracks.length < 1) {
                embeds.push(
                    new EmbedBuilder()
                        .setColor('Random')
                        .setTitle(`[🎶 Now Playing] - **[${nowPlaying.author}] ${nowPlaying.title}**`)
                        .setURL(nowPlaying.url),
                );
                return embeds;
            }

            tracks.map(track =>
                embeds.push(
                    new EmbedBuilder()
                        .setColor('Random')
                        .setTitle(`[🎶 Now Playing] - **[${nowPlaying.author}] ${nowPlaying.title}**`)
                        .setURL(nowPlaying.url)
                        .setDescription(`${track.join('\n')}`),
                ),
            );
            if (index < 2) break;
        }

        return embeds;
    };

    public override autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('このコマンドはAutoCompletionをサポートしていません。'));
}
