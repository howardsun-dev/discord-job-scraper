import {
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

type SlashCommand =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>;

export const commands: SlashCommand[] = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is alive'),

  new SlashCommandBuilder()
    .setName('jobs')
    .setDescription('Search stored jobs and optionally scrape fresh listings')
    .addStringOption((option) =>
      option
        .setName('keywords')
        .setDescription('Comma-separated job titles or keywords')
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('location')
        .setDescription('City, state, or remote')
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName('remote_only')
        .setDescription('Only show remote jobs')
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('source')
        .setDescription('Job board source')
        .setRequired(false)
        .addChoices(
          { name: 'All sources', value: 'all' },
          { name: 'Indeed', value: 'indeed' },
          { name: 'LinkedIn', value: 'linkedin' },
          { name: 'Glassdoor', value: 'glassdoor' },
        ),
    )
    .addBooleanOption((option) =>
      option
        .setName('scrape_now')
        .setDescription('Fetch fresh results before searching the database')
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show job database statistics'),
];