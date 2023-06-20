import { type GuildQueue, QueueRepeatMode, type Track, useTimeline } from 'discord-player';
import type { Guild, TextBasedChannel } from 'discord.js';

import type { ExClient } from '../ExClient';
import { ExPlayerEvent } from '../interfaces';

export default class extends ExPlayerEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'playerStart',
            once: false,
        });
    }

    public override run = async (
        queue: GuildQueue<{
            guild: Guild;
            channel: TextBasedChannel;
        }>,
        track: Track,
    ): Promise<void> => {
        const channel = queue.channel;

        if (!channel) return;

        const panel = this.client.panels.get(channel.id);

        this.client.globalEmbed
            .setTitle(track.title)
            .setURL(track.url)
            .setDescription(`_${track.author}_`)
            .setFields(
                {
                    name: 'プレイヤー',
                    value: `**${queue.tracks.size}曲**`,
                    inline: true,
                },
                {
                    name: 'ループモード',
                    value: `\`${
                        queue.repeatMode === QueueRepeatMode.OFF
                            ? 'off'
                            : queue.repeatMode === QueueRepeatMode.TRACK
                            ? 'track'
                            : queue.repeatMode === QueueRepeatMode.QUEUE
                            ? 'queue'
                            : 'autoplay'
                    }\``,
                    inline: true,
                },
                {
                    name: '再生時間',
                    value: `${queue.node.createProgressBar() ?? 'N/A'} (${
                        useTimeline(queue.guild)?.timestamp.progress ?? 'N/A'
                    }%)`,
                },
            )
            .setThumbnail(track.thumbnail)
            .setFooter({
                text: `${track.requestedBy?.username ?? 'N/A'} によってリクエストされました`,
                iconURL: track.requestedBy?.avatarURL() ?? 'N/A',
            });

        await panel?.message.edit({
            embeds: [this.client.globalEmbed],
        });
    };
}
