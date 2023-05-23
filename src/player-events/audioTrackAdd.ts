import { readFileSync } from 'fs';
import { setTimeout } from 'timers/promises';

import type { GuildQueue, Track } from 'discord-player';
import type { TextBasedChannel, User } from 'discord.js';
import { EmbedBuilder, formatEmoji } from 'discord.js';

import { ExtendedPlayerEvent } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedPlayerEvent {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'audioTrackAdd',
            once: false,
        });
    }

    public override execute = async (
        queue: GuildQueue<{
            channel: TextBasedChannel;
            requestor: User;
        }>,
        track: Track,
    ): Promise<void> => {
        const message = await queue.metadata.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('Random')
                    .setTitle(
                        `${formatEmoji(
                            this.client._emojis.owoSaber,
                            true,
                        )} 新しいトラックが追加されました！`,
                    )
                    .setURL(track.url)
                    .setDescription(`[${track.author}] ${track.title} - (${track.duration})`),
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
