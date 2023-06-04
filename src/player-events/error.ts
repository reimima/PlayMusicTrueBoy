import type { ExClient } from '../ExClient';
import { ExPlayerEvent } from '../interfaces';

export default class extends ExPlayerEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'error',
            once: false,
        });
    }

    public override run = (error: Error): void => {
        this.logger.error(`DP Error -`, error);
    };
}
