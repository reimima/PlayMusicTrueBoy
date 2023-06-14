import { setTimeout } from 'timers/promises';

import type { Message } from 'discord.js';

export const delayDelete = (second: number, ...targets: Message[]): Promise<Message>[] =>
    targets.map(async target => await setTimeout(second * 1000).then(() => target.delete()));
