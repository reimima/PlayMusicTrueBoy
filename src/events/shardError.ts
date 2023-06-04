import type { ExClient } from '../ExClient';
import { ExEvent } from '../interfaces';

export default class extends ExEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'shardError',
            once: false,
        });
    }

    public readonly run = (error: Error, id: number): void =>
        this.logger.info(`Shard: ${id} has occured an error.`, error);
}
