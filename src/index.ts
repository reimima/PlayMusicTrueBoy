import { exit } from 'process';

import { MusicBot } from './MusicBot';

const client = new MusicBot();

process.on('warning', (...args) => client.logger.warn(...args));

['exit', 'unhandledRejection', 'uncaughtException'].forEach(signal =>
    process.on(signal, arg => {
        switch (signal) {
            case 'exit':
                client.logger.info(`NodeJS process exited with code ${arg as number}`);
                break;

            case 'unhandledRejection':
                client.logger.error(
                    '[UNHANDLED_REJECTION] - ',
                    (arg as Error).stack ? arg : new Error(arg as string),
                );
                break;

            case 'uncaughtException':
                client.logger.error('[UNCAUGHT_EXCEPTION] - ', arg as Error);
                client.logger.warn('Uncaught Exception detected, trying to restart...');
                exit(1);
        }
    }),
);

['SIGTERM', 'SIGINT'].forEach(signal => process.on(signal, () => client.shutdown()));

await client.start().catch(e => client.logger.error(e));
