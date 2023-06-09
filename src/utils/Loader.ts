import { dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { glob } from 'glob';

import type { ExClient } from '../ExClient';

export const __dirname = (path: string): string => dirname(fileURLToPath(path));

export const loadModules = async <T>(client: ExClient, paths: string[]): Promise<Awaited<T[]>> => {
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
                (i: { default: new (_client: ExClient) => Promise<T> }) => new i.default(client),
            ),
        ),
    );
};
