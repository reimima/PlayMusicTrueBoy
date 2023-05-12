import { Collection } from 'discord.js';
import pkg from 'log4js';

import type { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';
import { Loader } from '../utils';

// eslint-disable-next-line import/no-named-as-default-member
const { getLogger } = pkg;

export class CommandManager extends Collection<string, ExtendedCommand> {
    private readonly logger = getLogger('CommandManager');

    public constructor(private readonly client: MusicBot) {
        super();
    }

    public readonly registerAll = async (): Promise<void> => {
        (
            await Loader.loadModules<ExtendedCommand>(this.client, [
                `${Loader.__dirname(import.meta.url)}/commands/**/*.ts`,
            ])
        ).forEach(command => {
            if (this.has(command.data.name))
                this.logger.error(
                    `Failed to register ${command.data.name} `,
                    `${command.data.name} is used`,
                );

            this.set(command.data.name, command);
        });
    };

    public readonly subscribe = async (): Promise<void> => {
        const target = this.client.guilds.cache.get('1075366696220626965');

        const subscribed = (await target?.commands.fetch()) ?? new Collection();

        const diffAdded = this.filter(c => !subscribed.find(s => s.name === c.data.name));
        const diffRemoved = subscribed.filter(s => !this.find(c => s.name === c.data.name));
        const diff = this.filter(
            c => !(subscribed.find(s => s.name === c.data.name)?.equals(c.data) ?? false),
        );

        await Promise.allSettled([
            ...diffAdded.mapValues(add => target?.commands.create(add.data)),
            ...diffRemoved.mapValues(remove => target?.commands.delete(remove.id)),
            ...diff.mapValues(change => {
                const id = subscribed.find(s => s.name === change.data.name)?.id;
                if (id) return target?.commands.edit(id, change.data);

                return 0;
            }),
        ]);
    };
}
