import type { ExClient } from '../ExClient';
import { ExEvent } from '../interfaces';

export default class extends ExEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'warn',
            once: false,
        });
    }

    public readonly run = (error: Error): void =>
        this.logger.error('DJS Warning -', error);
}
