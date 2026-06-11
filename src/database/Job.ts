import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { JobSource } from '../types/job';

@Entity('jobs')
@Unique(['source', 'externalId'])
@Index(['postedDate'])
@Index(['title', 'company'])
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 500 })
  title!: string;

  @Column({ length: 200 })
  company!: string;

  @Column({ length: 200 })
  location!: string;

  @Column('text')
  description!: string;

  @Column({ length: 1000 })
  url!: string;

  @Column({
    type: 'enum',
    enum: ['indeed', 'linkedin', 'glassdoor', 'reddit'],
  })
  source!: JobSource;

  @Column({ length: 100 })
  externalId!: string;

  @Column({ type: 'timestamp', nullable: true })
  postedDate!: Date | null;

  @Column({ length: 200, nullable: true })
  salary!: string | null;

  @Column({ default: false })
  remote!: boolean;

  @Column('simple-array', { nullable: true })
  keywords!: string[];

  @Column({ default: false })
  postedToDiscord!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  postedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}