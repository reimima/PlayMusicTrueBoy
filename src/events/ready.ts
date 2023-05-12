import { ActivityType, type Client } from 'discord.js';

import { ExtendedEvent } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedEvent {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'ready',
            once: true,
        });
    }

    public override execute = async (client: Client<true>): Promise<void> => {
        this.logger.info(`Logged in as ${client.user.tag}`);

        client.user.setPresence({
            status: 'idle',
            activities: [
                {
                    name: 'ナメック星を乗っ取り中...',
                    type: ActivityType.Playing,
                },
            ],
        });

        await this.client.commandManager
            .subscribe()
            .catch(e => this.logger.error('There was an error subscribing', e));
    };
}
