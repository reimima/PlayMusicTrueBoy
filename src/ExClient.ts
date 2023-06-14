import { exit } from 'node:process';

import { SpotifyExtractor, YoutubeExtractor } from '@discord-player/extractor';
import { Player } from 'discord-player';
import type { Message, User } from 'discord.js';
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import log4js from 'log4js';

import { emojis } from './emojis';
import type { ExEvent, ExPlayerEvent } from './interfaces';
import { CommandManager } from './managers';
import { __dirname, loadModules } from './utils';

config();

// eslint-disable-next-line import/no-named-as-default-member
const { getLogger } = log4js;

export class ExClient extends Client {
    public readonly logger = getLogger('ExClient');

    public readonly player: Player;

    public readonly commandManager: CommandManager;

    public readonly developer = this.users.cache.get(process.env['DEVELOPER_ID'] ?? '') as User;

    public readonly _emojis = emojis;

    public readonly panels = new Map<string, { message: Message }>();

    public constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds |
                    GatewayIntentBits.GuildIntegrations |
                    GatewayIntentBits.GuildVoiceStates |
                    GatewayIntentBits.GuildMessages |
                    GatewayIntentBits.MessageContent,
            ],
            allowedMentions: {
                repliedUser: false,
            },
        });

        this.player = new Player(this, {
            ytdlOptions: {
                filter: 'audioonly',
                quality: 'highestaudio',
            },
        });

        this.commandManager = new CommandManager(this);

        getLogger().level = process.env['NODE_ENV'] ? 'trace' : 'info';
    }

    public readonly start = async (): Promise<void> => {
        this.logger.info('Initializing...');

        try {
            await this.loadEvents();
            await this.loadPlayerEvents();
            await this.loadCommands();
            await this.loadExtractors();

            this.loadRawPlayerEvents();
        } catch (e) {
            this.logger.error(e);
        }

        this.logger.info('Initialize done. Logging in...');

        await super.login(process.env['DISCORD_TOKEN']).catch(e => this.logger.error(e));
    };

    private readonly loadEvents = async (): Promise<void> =>
        (
            await loadModules<ExEvent>(this, [`${__dirname(import.meta.url)}/events/**/*.ts`])
        ).forEach(event => {
            this[event.data.once ? 'once' : 'on'](event.data.name, event.run.bind(this));
        });

    private readonly loadPlayerEvents = async (): Promise<void> =>
        (
            await loadModules<ExPlayerEvent>(this, [
                `${__dirname(import.meta.url)}/player-events/**/*.ts`,
            ])
        ).forEach(event => {
            this.player.events[event.data.once ? 'once' : 'on'](
                event.data.name,
                event.run.bind(this),
            );
        });

    private readonly loadCommands = async (): Promise<void> =>
        await this.commandManager
            .registerAll([`${__dirname(import.meta.url)}/commands/**/*.ts`])
            .catch(e => this.logger.error(e));

    private readonly loadExtractors = async (): Promise<void> => {
        try {
            await this.player.extractors.register(YoutubeExtractor, {});
            await this.player.extractors.register(SpotifyExtractor, {});
        } catch (e) {
            this.logger.error(e);
        }
    };

    private readonly loadRawPlayerEvents = (): Player =>
        this.player
            .on('debug', message => this.logger.debug(`DP raw debug -`, message))
            .on('error', error => this.logger.error('DP raw error -', error));

    public readonly shutdown = (): void => {
        this.logger.info('Shutting down...');

        this.removeAllListeners();
        this.destroy();
        exit();
    };
}
