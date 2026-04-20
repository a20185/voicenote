// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo
// SQL is inlined because Metro bundler cannot import .sql files

import journal from './meta/_journal.json';

export default {
  journal,
  migrations: {
    m0000: `CREATE TABLE \`media_files\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`note_id\` integer,
	\`type\` text NOT NULL,
	\`uri\` text NOT NULL,
	\`thumbnail_uri\` text,
	\`file_name\` text,
	\`file_size\` integer,
	\`mime_type\` text,
	\`width\` integer,
	\`height\` integer,
	\`created_at\` integer NOT NULL,
	FOREIGN KEY (\`note_id\`) REFERENCES \`notes\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE \`notes\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`title\` text NOT NULL,
	\`content\` text,
	\`type\` text DEFAULT 'text' NOT NULL,
	\`status\` text DEFAULT 'active' NOT NULL,
	\`tags\` text,
	\`audio_duration\` integer,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX \`notes_status_idx\` ON \`notes\` (\`status\`);--> statement-breakpoint
CREATE INDEX \`notes_type_idx\` ON \`notes\` (\`type\`);--> statement-breakpoint
CREATE TABLE \`recordings\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`note_id\` integer,
	\`uri\` text NOT NULL,
	\`duration\` integer NOT NULL,
	\`file_size\` integer,
	\`mime_type\` text,
	\`created_at\` integer NOT NULL,
	FOREIGN KEY (\`note_id\`) REFERENCES \`notes\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE \`sync_queue\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`entity_type\` text NOT NULL,
	\`entity_id\` integer NOT NULL,
	\`action\` text NOT NULL,
	\`payload\` text,
	\`created_at\` integer NOT NULL,
	\`retry_count\` integer DEFAULT 0,
	\`last_error\` text
);`
  ,m0001: `CREATE TABLE \`inspirations\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`title\` text NOT NULL,
	\`summary\` text NOT NULL,
	\`analysis_data\` text NOT NULL,
	\`source_note_ids\` text NOT NULL,
	\`source_notes\` text NOT NULL,
	\`is_refined\` integer DEFAULT false NOT NULL,
	\`refinement_history\` text,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer NOT NULL
);`
  ,m0002: `CREATE TABLE \`categories\` (
	\`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	\`name\` text NOT NULL,
	\`color\` text,
	\`order\` integer DEFAULT 0 NOT NULL,
	\`created_at\` integer NOT NULL,
	\`updated_at\` integer
);
--> statement-breakpoint
ALTER TABLE \`notes\` ADD \`category_ids\` text;`
  }
};
