import { inspect } from 'node:util';

import type { BaseMessageOptions, Interaction } from 'discord.js';
import { EmbedBuilder, InteractionType } from 'discord.js';

import { ExtendedEvent } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedEvent {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'interactionCreate',
            once: false,
        });
    }

    public override execute = async (interaction: Interaction): Promise<void> => {
        try {
            if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
                await this.client.commandManager
                    .get(interaction.commandName)
                    ?.autoCompletion(interaction);
            }

            if (interaction.isChatInputCommand()) {
                await this.client.commandManager.get(interaction.commandName)?.execute(interaction);
            }
        } catch (e) {
            this.logger.error(e);

            const message: BaseMessageOptions = {
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('インタラクション実行中での予期せぬエラー')
                        .setDescription(
                            inspect(e, { depth: 1, maxArrayLength: null }).substring(0, 4096),
                        ),
                ],
            };

            if (interaction.isChatInputCommand()) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(message).catch(err => this.logger.error(err));
                } else {
                    await interaction.reply(message).catch(err => this.logger.error(err));
                }
            }
        }
    };
}
