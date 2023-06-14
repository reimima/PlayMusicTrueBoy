import type { Message } from 'discord.js';

import type { ExClient } from '../ExClient';
import { ExEvent } from '../interfaces';

export default class extends ExEvent {
    public constructor(client: ExClient) {
        super(client, {
            name: 'messageCreate',
            once: false,
        });
    }

    public readonly run = async (message: Message): Promise<void> => {
        this.logger.trace('Recieved message event');

        if (message.author.bot) return;

        if (new RegExp(`^<@!?${message.client.user.id}>$`).test(message.content))
            await this.mentioned(message);
    };

    private readonly mentioned = async (message: Message): Promise<void> => {
        await message.reply('[🚧] 工事中です...');
    };
}
