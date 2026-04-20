import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
  dbCredentials: {
    url: 'voicenote.db',
  },
} satisfies Config;
