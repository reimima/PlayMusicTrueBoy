import { dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { glob } from 'glob';

import type { MusicBot } from '../MusicBot';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Loader {
    public static __dirname = (path: string): string => dirname(fileURLToPath(path));

    public static loadModules = async <T>(
        client: MusicBot,
        paths: string[],
    ): Promise<Awaited<T[]>> => {
        const files: string[] = [];

        await Promise.all(
            paths.map(async path => {
                const formatted = await glob(path.split(sep).join('/'));

                formatted.forEach(file => {
                    if (!files.includes(file)) files.push(`file:///${file}`);
                });
            }),
        );

        return Promise.all(
            files.map(file =>
                import(file).then(
                    (i: { default: new (_client: MusicBot) => Promise<T> }) =>
                        new i.default(client),
                ),
            ),
        );
    };
}
