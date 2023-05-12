import type { ClientEvents } from 'discord.js';
import pkg from 'log4js';

import { ExpansionBase } from './ExpansionBase';
import type { MusicBot } from '../MusicBot';

// eslint-disable-next-line import/no-named-as-default-member
const { getLogger } = pkg;

export abstract class ExtendedEvent extends ExpansionBase {
    protected constructor(
        protected readonly client: MusicBot,
        public readonly data: {
            name: keyof ClientEvents;
            once: boolean;
        },
    ) {
        super();

        this.logger = getLogger(data.name);
    }

    public abstract execute(...args: unknown[]): void;
}
