import type { ApplicationCommandData, AutocompleteInteraction, Interaction } from 'discord.js';
import pkg from 'log4js';

import { ExpansionBase } from './ExpansionBase';
import type { MusicBot } from '../MusicBot';

// eslint-disable-next-line import/no-named-as-default-member
const { getLogger } = pkg;

export abstract class ExtendedCommand extends ExpansionBase {
    protected constructor(
        protected readonly client: MusicBot,
        public readonly data: ApplicationCommandData,
    ) {
        super();

        this.logger = getLogger(data.name);
    }

    public abstract execute(interaction: Interaction): Promise<void>;

    public abstract autoCompletion(interaction: AutocompleteInteraction): Promise<void>;
}
