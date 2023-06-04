import type { ExClient } from '../ExClient';
import { ExEvent } from '../interfaces';

export default class extends ExEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'shardReady',
            once: false,
        });
    }

    public readonly run = (id: number, unavailableGuilds: Set<string> | undefined): void => {
        const unavailable = unavailableGuilds?.size ?? 0;
        this.logger.info(
            `Shard: ${id} is now ready.`,
            unavailable === 0 ? '' : `${unavailable} guild${unavailable === 1 ? ' is' : 's are'} unavailable Store`,
        );
    };
}
