import type { ChatInputCommandInteraction } from 'discord.js';

import { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedCommand {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'skip',
            description: '現在再生中の曲をスキップします',
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

        if (!queue?.isPlaying()) {
            await interaction.followUp({
                content: '何も曲が流れていません！',
            });
            return;
        }

        const success = queue.node.skip();

        if (success) {
            await interaction.followUp({
                content: `${`[${queue.currentTrack?.author ?? '*'}] ${
                    queue.currentTrack?.title ?? '*'
                } - (${queue.currentTrack?.duration ?? '*'})`.slice(0, 100)} をスキップしました！`,
            });
        } else {
            await interaction.followUp({
                content: `正常にスキップが完了しませんでした、もう一度行うか <@871527050685612042> に問い合わせてください。`,
            });
        }
    };

    public override autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('このコマンドはAutoCompletionをサポートしていません。'));
}
