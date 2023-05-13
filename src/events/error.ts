import { ExtendedEvent } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedEvent {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'error',
            once: false,
        });
    }

    public override execute = (error: Error): void => {
        this.logger.error('Djs Error - ', error);
    };
}
