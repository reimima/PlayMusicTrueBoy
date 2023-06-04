import type { ExClient } from '../ExClient';
import { ExEvent } from '../interfaces';

export default class extends ExEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'shardDisconnect',
            once: false,
        });
    }

    public readonly run = (event: CloseEvent, id: number): void =>
        this.logger.info(`Shard: ${id} has disconnected.`, `Code: ${event.code}, Reason: ${event.reason}`);
}
