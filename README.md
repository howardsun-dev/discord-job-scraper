# Discord Job Scraper Bot

A Discord bot that scrapes job sites (LinkedIn, Indeed, Glassdoor) on a schedule and posts matching job listings to configured Discord channels.

## Status

🟡 In Progress — Episode 1: Discord API & basic bot setup

## Tech Stack

- **Runtime:** Node.js 20 + TypeScript
- **Discord:** discord.js v14
- **Database:** PostgreSQL (planned)
- **Scraping:** Puppeteer / Cheerio (planned)
- **Deployment:** Docker → AWS EC2/ECS
- **CI/CD:** GitHub Actions

## Quick Start

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → give it a name
3. Go to "Bot" tab → click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
   - **Message Content Intent**
   - **Server Members Intent** (optional)
5. Copy the **Bot Token**
6. Go to "OAuth2" → "URL Generator":
   - Scopes: `bot`, `applications.commands`
   - Bot Permissions: `Send Messages`, `Read Messages/View Channels`
7. Open the generated URL to invite the bot to your server

### 2. Get Your IDs

- **Client ID:** Discord Developer Portal → Application → General Information → Application ID
- **Guild ID:** In Discord, right-click your server name → "Copy Server ID" (enable Developer Mode in Discord settings first)
- **Channel ID:** Right-click a channel → "Copy Channel ID"

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your token and IDs
```

### 4. Install & Run

```bash
npm install
npm run dev          # Development with hot reload
npm run build        # Production build
npm start            # Run production build
```

### 5. Register Slash Commands

```bash
npx tsx src/deploy-commands.ts
```

### 6. Talk to Your Bot

In your Discord server, type `/ping` — the bot should reply "🏓 Pong!"

## Project Structure

```
src/
├── index.ts            # Bot entry point — client setup, event handlers
├── commands.ts         # Slash command definitions
└── deploy-commands.ts  # Script to register slash commands with Discord API
```

## Roadmap

- [x] Episode 1: Discord bot setup, slash commands, ping/pong
- [ ] Episode 2: Web scraping job sites (LinkedIn, Indeed, Glassdoor)
- [ ] Episode 3: Filters, scheduling, deduplication
- [ ] Episode 4: Docker + AWS deployment with CI/CD
- [ ] Episode 5: AI job matching with RAG

## License

MIT
