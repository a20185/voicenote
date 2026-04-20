import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content'),
  type: text('type', { enum: ['text', 'voice', 'camera', 'attachment'] }).notNull().default('text'),
  status: text('status', { enum: ['active', 'archived', 'snoozed'] }).notNull().default('active'),
  tags: text('tags'), // JSON array stored as text
  audioDuration: integer('audio_duration'), // in milliseconds, for voice notes
  categoryIds: text('category_ids'), // JSON array of category IDs stored as text
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  statusIdx: index('notes_status_idx').on(table.status),
  typeIdx: index('notes_type_idx').on(table.type),
}));

export const recordings = sqliteTable('recordings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  noteId: integer('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  uri: text('uri').notNull(),
  duration: integer('duration').notNull(), // in milliseconds
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const mediaFiles = sqliteTable('media_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  noteId: integer('note_id').references(() => notes.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['image', 'video', 'document'] }).notNull(),
  uri: text('uri').notNull(),
  thumbnailUri: text('thumbnail_uri'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  width: integer('width'),
  height: integer('height'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const syncQueue = sqliteTable('sync_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entityType: text('entity_type', { enum: ['note', 'recording', 'media'] }).notNull(),
  entityId: integer('entity_id').notNull(),
  action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
  payload: text('payload'), // JSON string
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  retryCount: integer('retry_count').default(0),
  lastError: text('last_error'),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color'),
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const inspirations = sqliteTable('inspirations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  analysisData: text('analysis_data').notNull(), // JSON: EnhancedAIAnalysisResult
  sourceNoteIds: text('source_note_ids').notNull(), // JSON: number[]
  sourceNotes: text('source_notes').notNull(), // JSON: AISourceNote[]
  isRefined: integer('is_refined', { mode: 'boolean' }).notNull().default(false),
  refinementHistory: text('refinement_history'), // JSON: string[]
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
