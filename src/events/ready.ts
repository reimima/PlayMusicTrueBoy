import { ActivityType, type Client } from 'discord.js';

import type { ExClient } from '../ExClient';
import { ExEvent } from '../interfaces';

export default class extends ExEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'ready',
            once: false,
        });
    }

    public readonly run = async (client: Client<true>): Promise<void> => {
        this.logger.info('Succesfully logged in and is Ready.');
        this.logger.trace(
            `Cached ${this.client.guilds.cache.size} guild${
                client.guilds.cache.size <= 1 ? '' : 's'
            }`,
        );

        client.user.setPresence({
            status: 'idle',
            activities: [
                {
                    name: 'ナメック星を乗っ取り中...',
                    type: ActivityType.Playing,
                },
            ],
        });

        this.logger.info('Starting to subscribe commands to Discord Server');
        await this.client.commandManager
            .subscribe()
            .then(() =>
                this.logger.info('Succesfully subscribed commands to Discord Server'),
            )
            .catch(e => this.logger.error('There was an error subscribing', e));
    };
}
