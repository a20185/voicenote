import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as schema from './schema';
import migrations from '../drizzle/migrations';

const expoDb = openDatabaseSync('voicenote.db');

export const db = drizzle(expoDb, { schema });

// Run migrations
migrate(db, migrations);

export type Database = typeof db;
