import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 moved the datasource URL out of schema.prisma. This file is what the
 * CLI reads for `migrate`, `studio` and `db` commands; the runtime client gets
 * its connection separately through the adapter in src/config/db.js.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
