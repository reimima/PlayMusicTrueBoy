import { readFileSync } from 'fs';
import { setTimeout } from 'timers/promises';

import type { GuildQueue, Track } from 'discord-player';
import { bold, EmbedBuilder } from 'discord.js';
import type { TextBasedChannel, User } from 'discord.js';

import { ExtendedPlayerEvent } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedPlayerEvent {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'audioTracksAdd',
            once: false,
        });
    }

    public override execute = async (
        queue: GuildQueue<{
            channel: TextBasedChannel;
            requestor: User;
        }>,
        tracks: Track[],
    ): Promise<void> => {
        const playlist = tracks[0]?.playlist;

        if (!playlist) return;

        const message = await queue.metadata.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('Random')
                    .setTitle(playlist.title)
                    .setURL(playlist.url)
                    .setThumbnail(
                        (
                            playlist.thumbnail as unknown as {
                                url?: string;
                            }
                        ).url ??
                            tracks[0]?.url ??
                            playlist.thumbnail,
                    )
                    .addFields({
                        name: `${this.client._emojis[321]} 新しいプレイリストが追加されました！`,
                        value: `${bold(tracks.length.toString())} 曲が追加されました！`,
                    }),
            ],
        });

        const data = JSON.parse(readFileSync('./src/json/data.json', 'utf-8')) as {
            [key in string]: {
                auto: boolean;
                sec: number;
            };
        };

        const _req = data[queue.metadata.requestor.id];

        if (_req?.auto) {
            await setTimeout(_req.sec * 1000);
            await message.delete();
        }
    };
}
