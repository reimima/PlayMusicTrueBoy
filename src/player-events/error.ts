import { ExtendedPlayerEvent } from '../interface';

export default class extends ExtendedPlayerEvent {
    public constructor() {
        super({
            name: 'error',
            once: false,
        });
    }

    public override execute = (error: Error): void => {
        this.logger.error(`Discord-player error - `, error);
    };
}
