import type { notes, recordings, mediaFiles, syncQueue, inspirations, categories } from './schema';

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type Recording = typeof recordings.$inferSelect;
export type NewRecording = typeof recordings.$inferInsert;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;

export type SyncQueueItem = typeof syncQueue.$inferSelect;
export type NewSyncQueueItem = typeof syncQueue.$inferInsert;

export type Inspiration = typeof inspirations.$inferSelect;
export type NewInspiration = typeof inspirations.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type MediaType = 'image' | 'video' | 'document';
export type SyncAction = 'create' | 'update' | 'delete';
export type EntityType = 'note' | 'recording' | 'media';
export type NoteType = 'text' | 'voice' | 'camera' | 'attachment';
export type NoteStatus = 'active' | 'archived' | 'snoozed';
