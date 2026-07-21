import 'reflect-metadata';
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Job } from './Job.js';
import { CreateJobsTable1784650000000 } from './migrations/1784650000000-CreateJobsTable.js';

const isProduction = process.env.NODE_ENV === 'production';

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'jobscraper',
  entities: [Job],
  migrations: [CreateJobsTable1784650000000],
  migrationsRun: isProduction && process.env.DB_RUN_MIGRATIONS !== 'false',
  synchronize: !isProduction,
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : false,
};

export const AppDataSource = new DataSource(config);

export async function initializeDatabase(): Promise<DataSource> {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    return AppDataSource;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export function getJobRepository() {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized: call initializeDatabase() before getJobRepository()');
  }
  return AppDataSource.getRepository(Job);
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
}