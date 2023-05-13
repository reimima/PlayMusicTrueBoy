import { ExtendedEvent } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedEvent {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'warn',
            once: false,
        });
    }

    public override execute = (info: string): void => {
        this.logger.warn('Djs Warning - ', info);
    };
}
