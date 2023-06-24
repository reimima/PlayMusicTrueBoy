import type { ChatInputCommandInteraction, Message } from 'discord.js';
import { ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';

import type { ExClient } from '../ExClient';
import { ExCommand } from '../interfaces';
import { delayDelete } from '../utils';

export default class extends ExCommand {
    public constructor(client: ExClient) {
        super(client, {
            name: 'remove',
            description: 'あなたの世界から音楽を抹消。',
            options: [
                {
                    name: 'track',
                    description: '貴方が抹消したい音楽は？',
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

        const track = interaction.options.get('track', true).value;

        if (typeof track !== 'number') return;

        if (track < 1 || track > queue.tracks.size)
            return interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(
                                `${this.client._emojis.namek.failure} Must be between 1 and ${queue.tracks.size}`,
                            )
                            .setDescription(
                                `削除したいトラックは \`1 ~ ${queue.tracks.size}\` の間で指定してください。`,
                            ),
                    ],
                })
                .then(message => delayDelete(3, message));

        const target = queue.tracks.at(track - 1);

        if (!target)
            return interaction
                .followUp({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle(`${this.client._emojis.namek.failure} Unknown error.`)
                            .setDescription(
                                `不明なエラーです。 ${
                                    this.client.developer?.toString() ?? 'N/A'
                                } にメンションしてください。`,
                            )
                            .addFields({
                                name: '備考 to developer',
                                value: '通常発生するはずのないエラーです。',
                            }),
                    ],
                })
                .then(message => delayDelete(3, message));

        queue.removeTrack(track);

        await interaction
            .followUp({
                embeds: [
                    new EmbedBuilder()
                        .setColor('DarkPurple')
                        .setTitle(`${this.client._emojis.namek.success} Remove successfully!`)
                        .setDescription(
                            `[[${target.author}] ${target.title} - (${target.duration})](${target.url}) をキューから削除しました！`,
                        ),
                ],
            })
            .then(message => delayDelete(3, message));
    };

    public override readonly autoCompletion = (): Promise<never> =>
        Promise.reject(new Error('This command does not support auto completion'));
}
