import type { ExClient } from '../ExClient';
import { ExEvent } from '../interfaces';

export default class extends ExEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'shardReconnecting',
            once: false,
        });
    }

    public readonly run = (id: number): void =>
        this.logger.info(`Shard: ${id} is now reconnecting.`);
}
