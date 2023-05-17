import { QueryType } from 'discord-player';
import type {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    GuildMember,
    VoiceChannel,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';

import { ExtendedCommand } from '../interface';
import type { MusicBot } from '../MusicBot';

export default class extends ExtendedCommand {
    public constructor(client: MusicBot) {
        super(client, {
            name: 'play',
            description: '音楽を再生します！',
            options: [
                {
                    name: 'song',
                    description: '曲の名前を入力してください！',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    autocomplete: true,
                },
            ],
        });
    }

    public override execute = async (interaction: ChatInputCommandInteraction): Promise<void> => {
        await interaction.deferReply();

        if (!(await interaction.guild?.members.fetch(interaction.user.id))?.voice.channel) {
            await interaction.followUp({
                content: 'ボイスチャンネルに接続した状態で行ってください！',
            });
            return;
        }

        const song = interaction.options.get('song')?.value;

        if (typeof song !== 'string') return;

        const result = await this.client.player
            .search(song, {
                requestedBy: interaction.member as GuildMember,
                searchEngine: QueryType.AUTO,
            })
            .catch(e => this.logger.error(e));

        if (!result?.tracks.length) {
            await interaction.followUp({
                content: '曲が見つかりませんでした。',
            });
            return;
        }

        const guild = interaction.guild;

        if (!guild) return;

        const queue =
            this.client.player.queues.get(guild) ??
            this.client.player.queues.create(guild, {
                leaveOnEnd: false,
                leaveOnStop: false,
                leaveOnEmpty: true,
                volume: 50,
                metadata: {
                    channel: interaction.channel,
                    skipLoop: false,
                },
            });

        try {
            if (!queue.connection)
                await queue.connect(
                    (
                        await interaction.guild.members.fetch(interaction.user.id)
                    ).voice.channel as VoiceChannel,
                );
        } catch (e) {
            this.logger.error(e);

            queue.delete();

            await interaction.followUp({
                content: 'ボイスチャンネルに接続できません。権限などを確認してください。',
            });
        }

        await interaction
            .followUp({
                content: `\`${result.playlist ? 'playlist' : 'track'}\` を読み込んでいます...`,
            })
            .then(async message => {
                const track = result.tracks[0];

                if (!track) return;

                queue.addTrack(result.playlist ? result.tracks : track);

                if (!queue.isPlaying()) await queue.node.play();

                await message.delete().catch(e => this.logger.error(e));
            });
    };

    public override autoCompletion = async (
        interaction: AutocompleteInteraction,
    ): Promise<void> => {
        const song = interaction.options.get('song', true).value;

        if (typeof song !== 'string') return;

        if (!song) {
            await interaction.respond([
                {
                    name: '検索ワードを入力してください！',
                    value: '',
                },
            ]);
            return;
        }

        if (/^.*(youtu.be\/|list=)([^#&?]*).*/.exec(song)) {
            await interaction.respond([
                {
                    name: 'プレイリストURLはこのオプションを選択して送信してください！',
                    value: song.slice(0, 100),
                },
            ]);
            return;
        }

        const results = await this.client.player.search(song);

        await interaction.respond(
            results.tracks.slice(0, 25).map(t => ({
                name: `[${t.author}] ${t.title} - (${t.duration})`.slice(0, 100),
                value: t.url,
            })),
        );
    };
}
