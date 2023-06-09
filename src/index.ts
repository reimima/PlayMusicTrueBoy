import { ExClient } from './ExClient';

const client = new ExClient();

['SIGTERM', 'SIGINT'].forEach(signal =>
    process.on(signal, () => {
        async () => {
            await client.shutdown();
        };
    }),
);

await client.start().catch(e => client.logger.error(e));
