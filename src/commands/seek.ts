import type { ChatInputCommandInteraction, Message } from 'discord.js';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import type { ExClient } from '../ExClient';
import { ExCommand } from '../interfaces';
import { delayDelete } from '../utils';

export default class extends ExCommand {
    public constructor(client: ExClient) {
        super(client, {
            name: 'seek',
            description: '指定した秒数間の音楽を記憶から消去。',
            options: [
                {
                    name: 'second',
                    description: '記憶から消去したい秒数を入力してください。',
                    type: ApplicationCommandOptionType.Integer,
                    required: true,
                },
            ],
        });
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

        if (!interaction.guild?.members.me?.voice.channel)
            return interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(
                                `${this.client._emojis.namek.failure} No bot in voice channel.`,
                            )
                            .setDescription('ボットがボイスチャンネルに接続されていません。'),
                    ],
                })
                .then(message => delayDelete(3, message));

        if (
            (await interaction.guild.members.fetch(interaction.user.id)).voice.channel !==
            interaction.guild.members.me.voice.channel
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

        const queue = this.client.player.queues.get(interaction.guild);

        if (!queue?.isPlaying())
            return interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`${this.client._emojis.namek.failure} No music is playing.`)
                            .setDescription('音楽は再生されていません。'),
                    ],
                })
                .then(message => delayDelete(3, message));

        const second = interaction.options.get('second', true).value;

        if (typeof second !== 'number') return;

        await queue.node.seek(second * 1000);

        await interaction
            .followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('DarkPurple')
                        .setTitle(`${this.client._emojis.namek.success} Seek successfully!`)
                        .setDescription(`\`${second}\` 秒間の音楽を飛ばしました！`),
                ],
            })
            .then(message => delayDelete(3, message));
    };

    public override readonly autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('This command does not support auto completion'));
}
