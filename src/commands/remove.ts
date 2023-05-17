import { ApplicationCommandOptionType, type ChatInputCommandInteraction } from 'discord.js';

import { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedCommand {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'remove',
            description: '指定したトラックを削除します',
            options: [
                {
                    name: 'target',
                    description: '指定するトラック',
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
            ],
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
        const target = interaction.options.get('target', true).value;

        if (typeof target !== 'number') return;

        if (!queue) {
            await interaction.followUp({
                content: '何も曲が流れていません！',
            });
            return;
        }

        if (target < 1 || target > queue.tracks.size) {
            await interaction.followUp({
                content: `削除したいトラックは \`1~${queue.tracks.size}\` の間で指定してください。`,
            });
            return;
        }

        const track = queue.tracks.at(target - 1);

        if (!track) return;

        queue.removeTrack(track);

        await interaction.followUp({
            content: `[${track.author}] ${track.title} - (${track.duration}) をキューから削除しました！`,
        });
    };

    public override autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('このコマンドはAutoCompletionをサポートしていません。'));
}
