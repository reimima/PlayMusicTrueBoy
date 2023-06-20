import { Collection } from 'discord.js';
import type { Logger } from 'log4js';
import log4js from 'log4js';

import type { ExClient } from '../ExClient';
import type { ExCommand } from '../interfaces';
import { loadModules } from '../utils';

// eslint-disable-next-line import/no-named-as-default-member
const { getLogger } = log4js;

export class CommandManager extends Collection<string, ExCommand> {
    private readonly logger: Logger;

    private readonly client: ExClient;

    public constructor(client: ExClient) {
        super();

        this.logger = getLogger('CommandManager');

        this.client = client;
    }

    public readonly registerAll = async (paths: string[]): Promise<void> => {
        (await loadModules<ExCommand>(this.client, paths)).forEach(command => {
            if (this.has(command.data.name))
                this.logger.error(
                    `Failed to register ${command.data.name} `,
                    `${command.data.name} is used`,
                );

            this.set(command.data.name, command);
        });
    };

    public readonly subscribe = async (): Promise<void> => {
        /** @access This server id from Namek. If you want to access to dev server, you should change this id to 1075366696220626965 */
        const guild = this.client.guilds.cache.get('705003456984907786');

        const subscribed = (await guild?.commands.fetch()) ?? new Collection();

        const diffAdded = this.filter(c => !subscribed.find(s => s.name === c.data.name));
        const diffRemoved = subscribed.filter(s => !this.find(c => s.name === c.data.name));
        const diff = this.filter(
            c => !(subscribed.find(s => s.name === c.data.name)?.equals(c.data) ?? false),
        );

        await Promise.allSettled([
            ...diffAdded.mapValues(add => guild?.commands.create(add.data)),
            ...diffRemoved.mapValues(remove => guild?.commands.delete(remove.id)),
            ...diff.mapValues(change => {
                const id = subscribed.find(s => s.name === change.data.name)?.id;
                if (id) return guild?.commands.edit(id, change.data);
                return 0;
            }),
        ]);
    };
}
