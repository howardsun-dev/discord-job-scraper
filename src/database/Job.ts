import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { JOB_SOURCES, type JobSource } from '../types/job.js';

@Entity('jobs')
@Unique(['source', 'externalId'])
@Index(['postedDate'])
@Index(['title', 'company'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 500 })
  title!: string;

  @Column({ type: 'varchar', length: 200 })
  company!: string;

  @Column({ type: 'varchar', length: 200 })
  location!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'text' })
  url!: string;

  @Column({
    type: 'enum',
    enum: JOB_SOURCES,
  })
  source!: JobSource;

  @Column({ type: 'varchar', length: 100 })
  externalId!: string;

  @Column({ type: 'timestamp', nullable: true })
  postedDate!: Date | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  salary!: string | null;

  @Column({ type: 'boolean', default: false })
  remote!: boolean;

  @Column('simple-array', { nullable: true })
  keywords!: string[] | null;

  @Column({ type: 'boolean', default: false })
  postedToDiscord!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  postedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}