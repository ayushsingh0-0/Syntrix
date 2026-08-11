import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { env } from './env';

const adapter = new PrismaMariaDb({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Shayush123?',
  database: 'syntrix',
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({
  adapter,
});

export default prisma;
