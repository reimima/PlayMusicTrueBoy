import type { GuildQueueEvents } from 'discord-player';
import pkg from 'log4js';

import { ExpansionBase } from './ExpansionBase';

// eslint-disable-next-line import/no-named-as-default-member
const { getLogger } = pkg;

export abstract class ExtendedPlayerEvent extends ExpansionBase {
    protected constructor(
        public readonly data: {
            name: keyof GuildQueueEvents;
            once: boolean;
        },
    ) {
        super();

        this.logger = getLogger(data.name);
    }

    public abstract execute(...args: unknown[]): void;
}
