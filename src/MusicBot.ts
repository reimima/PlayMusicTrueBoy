import { exit } from 'process';

import { Player } from 'discord-player';
import { Client } from 'discord.js';
import { config } from 'dotenv';
import pkg from 'log4js';

import type { ExtendedEvent } from './interface';
import { CommandManager } from './manager';
import { Loader } from './utils';

config();

// eslint-disable-next-line import/no-named-as-default-member
const { getLogger } = pkg;

export class MusicBot extends Client {
    public readonly logger = getLogger('MusicBot');

    public readonly player: Player;

    public readonly commandManager: CommandManager;

    public constructor() {
        super({
            intents: ['Guilds', 'GuildIntegrations', 'GuildVoiceStates'],
            allowedMentions: {
                repliedUser: false,
            },
        });

        getLogger().level = process.env['NODE_ENV'] ? 'trace' : 'info';

        this.player = new Player(this, {
            ytdlOptions: {
                filter: 'audioonly',
                highWaterMark: 1 << 30,
                dlChunkSize: 0,
            },
        });

        this.commandManager = new CommandManager(this);
    }

    public start = async (): Promise<void> => {
        (
            await Loader.loadModules<ExtendedEvent>(this, [
                `${Loader.__dirname(import.meta.url)}/events/**/*.ts`,
            ])
        ).forEach(event => {
            this[event.data.once ? 'once' : 'on'](event.data.name, event.execute.bind(this));
        });

        await this.commandManager.registerAll().catch(e => this.logger.error(e));

        await super.login(process.env['DISCORD_TOKEN']).catch(e => this.logger.error(e));
    };

    public shutdown = (): void => {
        this.removeAllListeners();
        this.destroy();
        exit();
    };
}
