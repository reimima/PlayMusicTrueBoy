import { formatEmoji } from 'discord.js';

export const emojis = {
    process: {
        first: formatEmoji('1114360600735252703'),
        previous: formatEmoji('1114360594536091778'),
        delete: formatEmoji('1114360598621335633'),
        next: formatEmoji('1114360596150894622'),
        last: formatEmoji('1114360603696451645'),
    },
    namek: {
        failure: formatEmoji('761875274181902336', true),
        success: formatEmoji('810076522273964032', true),
        loading: formatEmoji('810076530293604373', true),
    },
} as const;
