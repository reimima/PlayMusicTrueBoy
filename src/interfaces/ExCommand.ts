import type { ApplicationCommandData, AutocompleteInteraction, Interaction } from 'discord.js';
import type { Logger } from 'log4js';
import log4js from 'log4js';

import type { ExClient } from '../ExClient';

// eslint-disable-next-line import/no-named-as-default-member
const { getLogger } = log4js;

export abstract class ExCommand {
    protected readonly logger: Logger;

    protected constructor(protected readonly client: ExClient, public readonly data: ApplicationCommandData) {
        this.logger = getLogger(data.name);
    }

    public abstract run(interaction: Interaction): Promise<unknown>;

    public abstract autoCompletion(interaction: AutocompleteInteraction): Promise<unknown>;
}
