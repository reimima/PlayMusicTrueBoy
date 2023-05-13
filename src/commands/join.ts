import type { ChatInputCommandInteraction, VoiceChannel } from 'discord.js';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';

import { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedCommand {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'join',
            description: 'ボイスチャンネルに参加します',
            options: [
                {
                    name: 'channel',
                    description: '[省略可] - 参加するチャンネルを指定できます',
                    type: ApplicationCommandOptionType.Channel,
                    required: false,
                },
            ],
        });
    }

    public override execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.deferReply();

        const guild = interaction.guild;

        if (!guild) return;

        const queue =
            this.client.player.queues.get(guild) ??
            this.client.player.queues.create(guild, {
                leaveOnEnd: false,
                leaveOnStop: false,
                leaveOnEmpty: true,
                metadata: {
                    channel: interaction.channel,
                    skipLoop: false,
                },
            });

        const channel = interaction.options.get('channel')?.channel;

        if (
            !channel &&
            !(await interaction.guild.members.fetch(interaction.user.id)).voice.channel
        ) {
            await interaction.followUp({
                content: 'チャンネルを指定またはボイスチャンネルに接続してください！',
            });
            return;
        }

        if (channel && channel.type !== ChannelType.GuildVoice) {
            await interaction.followUp({
                content: 'ボイスチャンネルを指定してください！',
            });
            return;
        }

        try {
            if (!queue.connection) {
                await queue
                    .connect(
                        (channel as VoiceChannel | undefined) ??
                            ((
                                await interaction.guild.members.fetch(interaction.user.id)
                            ).voice.channel as VoiceChannel),
                    )
                    .then(async () => {
                        await interaction.followUp({
                            content: `正常に接続が完了しました！`,
                        });
                    });
            } else {
                await interaction.followUp({
                    content: '既にボイスチャンネルに接続済みです！',
                });
            }
        } catch (e) {
            this.logger.error(e);

            queue.delete();

            await interaction.followUp({
                content: 'ボイスチャンネルに接続できません。権限などを確認してください。',
            });
        }
    };

    public override autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('このコマンドはAutoCompletionをサポートしていません。'));
}
