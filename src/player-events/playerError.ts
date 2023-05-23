import type { GuildQueue } from 'discord-player';

import { ExtendedPlayerEvent } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedPlayerEvent {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'playerError',
            once: false,
        });
    }

    public override execute = (_queue: GuildQueue, error: Error): void => {
        this.logger.error(`Dp PlayerError - `, error);
    };
}
