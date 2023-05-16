import { QueueRepeatMode } from 'discord-player';
import { ApplicationCommandOptionType, type ChatInputCommandInteraction } from 'discord.js';

import { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedCommand {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'loop',
            description: 'ループモードを変更します',
            options: [
                {
                    name: 'mode',
                    description: 'ループのモードを選択してください',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        {
                            name: 'off',
                            value: 'off',
                        },
                        {
                            name: 'track',
                            value: 'track',
                        },
                        {
                            name: 'queue',
                            value: 'queue',
                        },
                        {
                            name: 'autoplay',
                            value: 'autoplay',
                        },
                    ],
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

        if (!queue) {
            await interaction.followUp({
                content: '何も曲が流れていません！',
            });
            return;
        }

        const mode = interaction.options.get('mode', true).value as
            | 'autoplay'
            | 'off'
            | 'queue'
            | 'track';

        switch (mode) {
            case 'off':
                queue.setRepeatMode(QueueRepeatMode.OFF);
                break;

            case 'track':
                queue.setRepeatMode(QueueRepeatMode.TRACK);
                break;

            case 'queue':
                queue.setRepeatMode(QueueRepeatMode.QUEUE);
                break;

            case 'autoplay':
                queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
                break;
        }

        await interaction.followUp({
            content: `ループモードを \`${
                mode === 'off'
                    ? 'off'
                    : mode === 'track'
                    ? 'track'
                    : mode === 'queue'
                    ? 'queue'
                    : 'autoplay'
            }\` に変更しました！`,
        });
    };

    public override autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('このコマンドはAutoCompletionをサポートしていません。'));
}
