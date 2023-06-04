import type { ExClient } from '../ExClient';
import { ExEvent } from '../interfaces';

export default class extends ExEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'shardResume',
            once: false,
        });
    }

    public readonly run = (id: number, replayedEvents: number): void =>
        this.logger.info(
            `Shard: ${id} has resumed. Replayed: ${replayedEvents}`,
        );
}
