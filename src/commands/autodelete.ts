import { writeFileSync } from 'fs';

import {
    ApplicationCommandOptionType,
    type ChatInputCommandInteraction,
    formatEmoji,
} from 'discord.js';

import { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedCommand {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'autodelete',
            description: 'メッセージを削除するまでの秒数と自動削除の有無を設定します。',
            options: [
                {
                    name: 'auto',
                    description: '指定秒数以内に自動的に削除するかどうか',
                    type: ApplicationCommandOptionType.Boolean,
                    required: true,
                },
                {
                    name: 'sec',
                    description: '自動削除するまでの秒数(second)',
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
            ],
        });
    }

    public override execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.deferReply();

        const auto = interaction.options.get('auto', true).value;
        const sec = interaction.options.get('sec', true).value;

        if (typeof auto !== 'boolean' || typeof sec !== 'number') return;

        const data = JSON.stringify(
            {
                [interaction.user.id]: {
                    auto,
                    sec,
                },
            },
            null,
            4,
        );

        writeFileSync('./src/json/data.json', data);

        await interaction.followUp({
            content: `${formatEmoji(
                this.client._emojis.checkyel,
                true,
            )} | 正常に保存が完了しました！ \n> AutoDelete : ${String(auto)} \n> Second : ${sec}`,
        });
    };

    public override autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('このコマンドはAutoCompletionをサポートしていません。'));
}
