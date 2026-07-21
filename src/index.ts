import 'reflect-metadata';
import 'dotenv/config';
import { Client, EmbedBuilder, Events, GatewayIntentBits } from 'discord.js';
import { jobService } from './services/JobService.js';
import { scraperScheduler } from './jobs/ScraperScheduler.js';
import { scraperManager } from './scrapers/index.js';
import { JOB_SOURCES, type JobSearchFilters, type JobSource } from './types/job.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);

  try {
    await jobService.initialize();
    console.log('✅ Job service initialized');

    if (process.env.SCRAPER_ENABLED === 'true') {
      scraperScheduler.start({
        schedule: process.env.SCRAPER_SCHEDULE || '0 */4 * * *',
        enabled: true,
      });
    }
  } catch (error) {
    console.error('❌ Startup initialization failed:', error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'ping':
      await interaction.reply('🏓 Pong!');
      break;

    case 'jobs': {
      await interaction.deferReply();

      const keywords = interaction.options.getString('keywords') || 'software engineer';
      const location = interaction.options.getString('location') || 'remote';
      const remoteOnly = interaction.options.getBoolean('remote_only') ?? false;
      const source = interaction.options.getString('source');
      const scrapeNow = interaction.options.getBoolean('scrape_now') ?? false;
      const selectedSource = source && source !== 'all' && JOB_SOURCES.includes(source as JobSource)
        ? source as JobSource
        : undefined;

      try {
        if (scrapeNow) {
          await interaction.editReply('🔍 Scraping job boards now. This can take a minute...');
          const scrapedJobs = await scraperManager.runExclusive((manager) =>
            manager.scrapeAllSources(
              keywords,
              location,
              selectedSource ? { sources: [selectedSource] } : {},
              1
            )
          );

          const bySource = new Map<JobSource, typeof scrapedJobs>();
          for (const job of scrapedJobs) {
            if (!job.source) continue;
            const sourceJobs = bySource.get(job.source) || [];
            sourceJobs.push(job);
            bySource.set(job.source, sourceJobs);
          }

          for (const [jobSource, sourceJobs] of bySource) {
            await jobService.saveJobs(sourceJobs, jobSource);
          }
        }

        const filters: JobSearchFilters = {
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          location,
          remoteOnly,
          sources: selectedSource ? [selectedSource] : undefined,
          maxAgeDays: 14,
        };

        const jobs = await jobService.findJobs(filters, 5);

        if (jobs.length === 0) {
          await interaction.editReply(
            `No jobs found for "${keywords}" in "${location}". Try /jobs with scrape_now:true to fetch fresh listings.`
          );
          return;
        }

        const embeds = jobs.map((job) =>
          new EmbedBuilder()
            .setTitle(job.title)
            .setURL(job.url)
            .setDescription(job.description.slice(0, 500) || 'No description available')
            .addFields(
              { name: 'Company', value: job.company || 'Unknown', inline: true },
              { name: 'Location', value: job.location || 'Unknown', inline: true },
              { name: 'Source', value: job.source, inline: true },
              { name: 'Salary', value: job.salary || 'Not listed', inline: true },
              { name: 'Remote', value: job.remote ? 'Yes' : 'No', inline: true }
            )
            .setTimestamp(job.postedDate || job.createdAt)
        );

        await interaction.editReply({
          content: `Found ${jobs.length} matching jobs for "${keywords}" in "${location}".`,
          embeds,
        });
      } catch (error) {
        console.error('Error handling /jobs:', error);
        await interaction.editReply('❌ Failed to search jobs. Check bot logs for details.');
      }
      break;
    }

    case 'stats': {
      try {
        const stats = await jobService.getJobStats();
        await interaction.reply(
          `📊 Job stats: ${stats.total} total, ${stats.unposted} unposted\n` +
          Object.entries(stats.bySource).map(([src, count]) => `${src}: ${count}`).join('\n')
        );
      } catch (error) {
        console.error('Error handling /stats:', error);
        await interaction.reply('❌ Failed to fetch stats.');
      }
      break;
    }

    default:
      await interaction.reply(`Unknown command: ${interaction.commandName}`);
  }
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  scraperScheduler.stop();
  await scraperManager.close();
  await client.destroy();
  process.exit(0);
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('❌ DISCORD_TOKEN is missing. Check your .env file.');
  process.exit(1);
}

client.login(token);