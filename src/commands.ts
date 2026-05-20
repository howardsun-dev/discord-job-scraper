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
    .setDescription('Search for jobs')
    .addStringOption((option) =>
      option
        .setName('keywords')
        .setDescription('Job title or keywords to search for')
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('location')
        .setDescription('City, state, or remote')
        .setRequired(false),
    ),
];
