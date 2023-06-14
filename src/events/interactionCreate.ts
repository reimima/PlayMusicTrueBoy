import { InteractionType } from 'discord.js';
import type { Interaction } from 'discord.js';

import type { ExClient } from '../ExClient';
import { ExEvent } from '../interfaces';

export default class extends ExEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'interactionCreate',
            once: false,
        });
    }

    public readonly run = async (interaction: Interaction): Promise<void> => {
        this.logger.trace('Recieved interaction event');

        try {
            if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
                await this.client.commandManager
                    .get(interaction.commandName)
                    ?.autoCompletion(interaction);
            }

            if (interaction.isChatInputCommand()) {
                await this.client.commandManager.get(interaction.commandName)?.run(interaction);
            }
        } catch (e) {
            this.logger.error(e);
        }
    };
}
