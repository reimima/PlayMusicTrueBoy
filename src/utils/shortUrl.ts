import request from 'request';

export const createShortUrl = (url: string): Promise<unknown> =>
    new Promise((resolve, reject) => {
        request(
            {
                url: `https://ur0.cc/api.php?create=true&url=${encodeURIComponent(url)}`,
                json: true,
            },
            (error, _response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            },
        );
    });

export const undoShortUrl = (url: string): Promise<unknown> =>
    new Promise((resolve, reject) => {
        request(
            {
                url: `https://ur0.cc/api.php?get=true&id=${url.replace('https://ur0.cc/', '')}`,
                json: true,
            },
            (error, _response, body) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(body);
                }
            },
        );
    });
