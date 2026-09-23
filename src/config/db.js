import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.js';

/**
 * One PrismaClient for the process. `node --watch` re-imports modules on every
 * save, and a fresh client per reload would leak a connection pool each time,
 * so the instance is cached on globalThis in development.
 *
 * Prisma 7 requires a driver adapter: `new PrismaClient()` with no options
 * throws. The connection string lives here for the runtime client and in
 * prisma.config.ts for the CLI; both read DATABASE_URL.
 */
const globalForPrisma = globalThis;

function createClient() {
  const adapter = new PrismaPg({ connectionString: env.databaseUrl });
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

export const prisma = globalForPrisma.__lekkerPrisma ?? createClient();

if (!env.isProduction) globalForPrisma.__lekkerPrisma = prisma;

/**
 * Prisma connects lazily on first query, which would turn a bad DATABASE_URL
 * into a confusing 500 on the first request rather than a clear startup
 * failure. Connecting eagerly keeps the old behaviour: the server refuses to
 * boot if the database is unreachable.
 */
export async function connectDatabase() {
  await prisma.$connect();
  const [{ db }] = await prisma.$queryRaw`SELECT current_database() AS db`;
  console.log(`[db] connected to ${db}`);
  return prisma;
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

/** Backs the /api/health database field. */
export async function databaseStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch {
    return 'disconnected';
  }
}
