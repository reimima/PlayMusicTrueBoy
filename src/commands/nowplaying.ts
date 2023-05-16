import { useTimeline } from 'discord-player';
import { type ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

import { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedCommand {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'nowplaying',
            description: '再生中の曲についての情報を表示します',
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

        if (!queue) {
            await interaction.followUp({
                content: '何も曲が流れていません！',
            });
            return;
        }

        const track = queue.currentTrack;

        if (!track) return;

        await interaction.followUp({
            embeds: [
                new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('🎶 Now Playing...')
                    .setDescription(
                        `[[${track.author}] ${track.title} - (${track.duration})](${track.url})`,
                    )
                    .setThumbnail(
                        (track.thumbnail as string | undefined) ??
                            interaction.user.displayAvatarURL(),
                    )
                    .addFields([
                        { name: 'アップロード者', value: track.author },
                        {
                            name: '再生時間',
                            value: `${queue.node.createProgressBar() ?? 'N/A'} (${
                                useTimeline(interaction.guild)?.timestamp.progress ?? 'N/A'
                            }%)`,
                        },
                        {
                            name: 'エクストラクター',
                            value: `\`${track.extractor?.identifier ?? 'N/A'}\``,
                        },
                    ]),
            ],
        });
    };

    public override autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('このコマンドはAutoCompletionをサポートしていません。'));
}
