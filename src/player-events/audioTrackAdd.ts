import { setTimeout } from 'timers/promises';

import type { GuildQueue, Track } from 'discord-player';
import type { TextBasedChannel } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

import { ExtendedPlayerEvent } from '../interface';

export default class extends ExtendedPlayerEvent {
    public constructor() {
        super({
            name: 'audioTrackAdd',
            once: false,
        });
    }

    public override execute = async (
        queue: GuildQueue<{
            channel: TextBasedChannel;
        }>,
        track: Track,
    ): Promise<void> => {
        await queue.metadata.channel
            .send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Random')
                        .setTitle('新しいトラックが追加されました！')
                        .setDescription(
                            `[[${track.author}] ${track.title} - (${track.duration})](${track.url})`,
                        ),
                ],
            })
            .then(async message => {
                await setTimeout(3000);
                await message.delete();
            });
    };
}
