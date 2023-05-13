import type { ChatInputCommandInteraction } from 'discord.js';

import { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedCommand {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'leave',
            description: 'ボイスチャンネルから退出します。',
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

        if (
            interaction.guild?.members.me?.voice.channel &&
            (await interaction.guild.members.fetch(interaction.user.id)).voice.channel !==
                interaction.guild.members.me.voice.channel
        ) {
            await interaction.followUp({
                content: 'ボットと同じボイスチャンネルに接続してください！',
            });
            return;
        }

        const guild = interaction.guild;

        if (!guild) return;

        const queue = this.client.player.queues.get(guild);

        if (queue) {
            await queue.player.destroy().then(async () => {
                const channel = (await interaction.guild?.members.fetch(interaction.user.id))?.voice
                    .channel;

                if (!channel) return;

                await interaction.followUp({
                    // eslint-disable-next-line @typescript-eslint/no-base-to-string
                    content: `${channel.toString()} から退出しました！`,
                });
            });
        } else {
            await interaction.followUp({
                content: '何も曲が流れていません！',
            });
            return;
        }
    };

    public override autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('このコマンドはAutoCompletionをサポートしていません。'));
}