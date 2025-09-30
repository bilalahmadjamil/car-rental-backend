import { registerAs } from '@nestjs/config';

export const DatabaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  type: 'postgres',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
}));
