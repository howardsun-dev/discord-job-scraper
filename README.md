# Discord Job Scraper Bot

[![GitHub license](https://img.shields.io/github/license/howardsun-dev/discord-job-scraper)](./LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/howardsun-dev/discord-job-scraper)](https://github.com/howardsun-dev/discord-job-scraper/issues)
[![GitHub stars](https://img.shields.io/github/stars/howardsun-dev/discord-job-scraper)](https://github.com/howardsun-dev/discord-job-scraper/stars)
[![GitHub last commit](https://img.shields.io/github/last-commit/howardsun-dev/discord-job-scraper)](https://github.com/howardsun-dev/discord-job-scraper/commits/main)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.js.org/#/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-40B5A4?style=flat&logo=puppeteer&logoColor=white)](https://pptr.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonaws&logoColor=white)](https://aws.amazon.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat&logo=github-actions&logoColor=white)](https://github.com/howardsun-dev/discord-job-scraper/actions)

## Overview

**Discord Job Scraper Bot** is an automated job hunting assistant that scrapes major job boards (LinkedIn, Indeed, Glassdoor) and delivers relevant opportunities directly to your Discord server. Built with TypeScript and designed for extensibility, this bot demonstrates full-stack development skills including web scraping, automation, database integration, and Discord bot development.

## 🎯 Current Status

🟡 **In Development** - Core Discord bot functionality implemented with `/ping` and `/jobs` commands. Next phase adds job scraping, filtering, and persistence.

## ✨ Planned Features

### 🤖 Discord Bot Core
- **Slash Command Interface** - Modern Discord interactions with `/jobs`, `/settings`, `/help`
- **Persistent Storage** - PostgreSQL database for user preferences and job history
- **Scheduled Operations** - Cron-based scraping at configurable intervals
- **Smart Filtering** - Keyword-based matching with inclusion/exclusion rules
- **Duplicate Prevention** - Avoid reposting already-shared opportunities
- **Rich Embed Formatting** - Professional job postings with company, location, apply links

###�� Web Scraping Engine
- **Multi-Source Support** - LinkedIn, Indeed, Glassdoor (planned)
- **Headless Browser Automation** - Puppeteer for dynamic content handling
- **Anti-Bot Measures** - User agent rotation, delay randomization
- **Data Validation** - Structured job data parsing and cleaning
- **Error Handling** - Graceful degradation for site changes or blocks

### 💾 Data Persistence
- **PostgreSQL Integration** - Relational database for scalable storage
- **ORM Layer** - TypeORM or Prisma for type-safe database interactions
- **Migration System** - Schema evolution with version control
- **Connection Pooling** - Efficient database resource management

### ☁️ Deployment & DevOps
- **Docker Containerization** - Consistent environments across dev/prod
- **GitHub Actions CI/CD** - Automated testing, building, and deployment
- **AWS Deployment** - EC2/ECS with RDS for production hosting
- **Health Checks** - Endpoint monitoring for service availability
- **Logging & Monitoring** - Structured logs with rotation and alerting

## 🛠️ Tech Stack

### Runtime & Language
- **Node.js >= 18** - JavaScript runtime with ES modules
- **TypeScript 5+** - Static typing for enhanced developer experience and safety

### Discord Integration
- **discord.js v14** - Official Discord API interaction library
- **Slash Commands** - Modern command interface with autocomplete
- **Buttons & Select Menus** - Interactive components for rich UX
- **Modal Forms** - User input collection for settings and filters

### Web Scraping & Automation
- **Puppeteer** - Headless Chrome for JavaScript-heavy sites
- **Cheerio** (fallback) - Fast HTML parsing for static content
- **axios** - HTTP client for API-based scraping where available
- **user-agents** - Rotating user agent strings to avoid detection

### Data Storage
- **PostgreSQL** - Reliable, ACID-compliant relational database
- **TypeORM/Prisma** - Type-safe ORM for Node.js/TypeScript applications
- **dotenv** - Environment variable configuration management

### Infrastructure
- **Docker** - Containerization for consistent deployment
- **GitHub Actions** - Automated workflows for CI/CD
- **AWS EC2/ECS** - Compute services for production deployment
- **Amazon RDS** - Managed PostgreSQL service (planned)
- **Nginx** - Reverse proxy for SSL termination and load balancing

## 📐 Architecture Overview

```
┌─────────────────┐    Discord API    ┌─────────────────┐
│   Discord Client│◄──────────────►│   Bot Application │
│   (User App)    │    Gateway/WebSocket│  (Node.js/TS)   │
└─────────────────┘                 └─────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │  Scheduler      │
                           │ (node-cron)     │
                           └─────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │  Scraper Engine │
                           │ (Puppeteer/Cheerio)│
                           └─────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │  Data Processor │
                           │ (Validation,    │
                           │  Deduplication) │
                           └─────────────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │  PostgreSQL DB  │
                           │ (Jobs, Users,   │
                           │  Settings,      │
                           │  History)       │
                           └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- Discord Developer Application
- PostgreSQL database (local or cloud)
- GitHub account for Actions

### Setup Instructions

1. **Create Discord Bot**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create New Application → Bot → Add Bot
   - Enable Required Intents:
     - Message Content Intent
     - Server Members Intent (recommended)
   - Copy Bot Token (keep secure!)

2. **Setup Environment**
   ```bash
   git clone https://github.com/howardsun-dev/discord-job-scraper.git
   cd discord-job-scraper
   npm install
   
   cp .env.example .env
   # Edit .env with:
   # DISCORD_TOKEN=your_bot_token
   # CLIENT_ID=your_application_id
   # GUILD_ID=your_test_guild_id
   # DB_HOST=localhost
   # DB_PORT=5432
   # DB_USER=postgres
   # DB_PASSWORD=your_password
   # DB_NAME=jobscraper
   ```

3. **Database Setup**
   ```bash
   # Create database and user
   createdb jobscraper
   # Run migrations (when implemented)
   # npm run db:migrate
   ```

4. **Development Mode**
   ```bash
   # Start bot with hot reload
   npm run dev
   # Uses ts-node-dev for TypeScript execution
   ```

### Docker Deployment
```bash
# Build image
docker build -t discord-job-scraper .

# Run container
docker run -d \
  --name job-scraper-bot \
  -e DISCORD_TOKEN=your_token \
  -e DB_HOST=your_db_host \
  -e DB_NAME=jobscraper \
  -e DB_USER=postgres \
  -e DB_PASSWORD=your_password \
  discord-job-scraper
```

## 🧪 Testing Strategy

```bash
# Linting
npm run lint

# Type checking
npm run typecheck

# Unit tests (when implemented)
npm test

# End-to-end tests (planned)
npm run test:e2e
```

## 📚 Skills Demonstrated

This project showcases expertise in:
- **Discord Bot Development** - Modern slash commands, interactions, and rich embeds
- **Web Scraping & Automation** - Headless browsers, anti-bot evasion, data extraction
- **TypeScript Backend** - End-to-end type safety, modular architecture, async/await patterns
- **Database Design** - Relational schema design, ORM usage, connection pooling
- **DevOps Practices** - Containerization, CI/CD pipelines, environment management
- **Security Awareness** - Token protection, input validation, rate limiting concepts
- **RESTful API Design** - Internal service communication patterns
- **Error Handling & Logging** - Structured error reporting and recovery strategies

## 🔮 Future Enhancements

- [ ] AI-powered job matching (NLP for relevance scoring)
- [ ] User preferences dashboard (web interface)
- [ ] Export capabilities (CSV/JSON reports)
- [ ] Notification preferences (DM vs channel, frequency)
- [ ] Job application tracking integration
- [ ] Salary estimation and comparison features
- [ ] Remote/hybrid work filtering
- [ ] Company reputation scoring (Glassdoor integration)

## 📞 Get in Touch

**Questions?** Open an [Issue](https://github.com/howardsun-dev/discord-job-scraper/issues)  
**Contributions?** Fork and submit a [Pull Request](https://github.com/howardsun-dev/discord-job-scraper/pulls)  
**Email:** howardsun.swe@gmail.com

---

*Built by Howard Sun — Full-Stack Engineer focused on TypeScript, automation, and developer productivity tools.*
