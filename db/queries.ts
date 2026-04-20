import { eq, desc, isNull, sql } from 'drizzle-orm';
import { db } from './client';
import { notes, recordings, mediaFiles, syncQueue, inspirations, categories } from './schema';
import type { NewNote, NewRecording, NewMediaFile, NewSyncQueueItem, NewInspiration, NewCategory } from './index';

// Note queries
export const noteQueries = {
  async getAll() {
    return db.select().from(notes).orderBy(desc(notes.updatedAt));
  },

  async getByStatus(status: 'active' | 'archived' | 'snoozed') {
    return db.select().from(notes)
      .where(eq(notes.status, status))
      .orderBy(desc(notes.updatedAt));
  },

  async getByType(type: 'text' | 'voice' | 'camera' | 'attachment') {
    return db.select().from(notes)
      .where(eq(notes.type, type))
      .orderBy(desc(notes.updatedAt));
  },

  async getByStatusAndType(status: 'active' | 'archived' | 'snoozed', type: 'text' | 'voice' | 'camera' | 'attachment') {
    return db.select().from(notes)
      .where(sql`${notes.status} = ${status} AND ${notes.type} = ${type}`)
      .orderBy(desc(notes.updatedAt));
  },

  async getById(id: number) {
    const result = await db.select().from(notes).where(eq(notes.id, id));
    return result[0];
  },

  async create(data: NewNote) {
    const now = new Date();
    const result = await db.insert(notes).values({
      ...data,
      type: data.type ?? 'text',
      status: data.status ?? 'active',
      createdAt: now,
      updatedAt: now,
    }).returning();
    return result[0];
  },

  async update(id: number, data: Partial<Omit<NewNote, 'createdAt'>>) {
    const result = await db.update(notes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(notes.id, id))
      .returning();
    return result[0];
  },

  async delete(id: number) {
    await db.delete(notes).where(eq(notes.id, id));
  },

  async search(query: string) {
    return db.select().from(notes)
      .where(eq(notes.title, query))
      .orderBy(desc(notes.updatedAt));
  },
};

// Recording queries
export const recordingQueries = {
  async getByNoteId(noteId: number) {
    return db.select().from(recordings).where(eq(recordings.noteId, noteId));
  },

  async getById(id: number) {
    const result = await db.select().from(recordings).where(eq(recordings.id, id));
    return result[0];
  },

  async create(data: NewRecording) {
    const result = await db.insert(recordings).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  },

  async delete(id: number) {
    await db.delete(recordings).where(eq(recordings.id, id));
  },

  async getAll() {
    return db.select().from(recordings).orderBy(desc(recordings.createdAt));
  },
};

// Media file queries
export const mediaQueries = {
  async getByNoteId(noteId: number) {
    return db.select().from(mediaFiles).where(eq(mediaFiles.noteId, noteId));
  },

  async getById(id: number) {
    const result = await db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return result[0];
  },

  async create(data: NewMediaFile) {
    const result = await db.insert(mediaFiles).values({
      ...data,
      createdAt: new Date(),
    }).returning();
    return result[0];
  },

  async delete(id: number) {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, id));
  },

  async getCountsByNoteIds(noteIds: number[]): Promise<Record<number, number>> {
    if (noteIds.length === 0) return {};
    const results = await db
      .select({
        noteId: mediaFiles.noteId,
        count: sql<number>`count(*)`,
      })
      .from(mediaFiles)
      .where(sql`${mediaFiles.noteId} IN (${sql.join(noteIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(mediaFiles.noteId);
    const counts: Record<number, number> = {};
    for (const row of results) {
      if (row.noteId != null) counts[row.noteId] = row.count;
    }
    return counts;
  },
};

// Sync queue queries
export const syncQueries = {
  async getPending() {
    return db.select().from(syncQueue)
      .where(isNull(syncQueue.lastError))
      .orderBy(syncQueue.createdAt);
  },

  async addToQueue(data: NewSyncQueueItem) {
    const result = await db.insert(syncQueue).values({
      ...data,
      createdAt: new Date(),
      retryCount: 0,
    }).returning();
    return result[0];
  },

  async markSuccess(id: number) {
    await db.delete(syncQueue).where(eq(syncQueue.id, id));
  },

  async markFailed(id: number, error: string) {
    await db.update(syncQueue)
      .set({
        lastError: error,
        retryCount: sql`${syncQueue.retryCount} + 1`
      })
      .where(eq(syncQueue.id, id));
  },
};

// Inspiration queries
export const inspirationQueries = {
  async getAll() {
    return db.select().from(inspirations).orderBy(desc(inspirations.updatedAt));
  },

  async getById(id: number) {
    const result = await db.select().from(inspirations).where(eq(inspirations.id, id));
    return result[0];
  },

  async create(data: NewInspiration) {
    const now = new Date();
    const result = await db.insert(inspirations).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return result[0];
  },

  async update(id: number, data: Partial<Omit<NewInspiration, 'createdAt'>>) {
    const result = await db.update(inspirations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(inspirations.id, id))
      .returning();
    return result[0];
  },

  async delete(id: number) {
    await db.delete(inspirations).where(eq(inspirations.id, id));
  },
};

// Category queries
export const categoryQueries = {
  async getAll() {
    return db.select().from(categories).orderBy(categories.order);
  },

  async getById(id: number) {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  },

  async create(data: NewCategory) {
    const now = new Date();
    const result = await db.insert(categories).values({
      ...data,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return result[0];
  },

  async update(id: number, data: Partial<Omit<NewCategory, 'createdAt'>>) {
    const result = await db.update(categories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return result[0];
  },

  async delete(id: number) {
    // Remove this category from all notes' categoryIds
    const allNotes = await db.select().from(notes);
    for (const note of allNotes) {
      if (!note.categoryIds) continue;
      try {
        const ids: number[] = JSON.parse(note.categoryIds);
        if (ids.includes(id)) {
          const filtered = ids.filter((cid) => cid !== id);
          await db.update(notes)
            .set({ categoryIds: filtered.length > 0 ? JSON.stringify(filtered) : null })
            .where(eq(notes.id, note.id));
        }
      } catch { /* skip malformed */ }
    }
    await db.delete(categories).where(eq(categories.id, id));
  },

  async reorder(orderedIds: number[]) {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(categories)
        .set({ order: i, updatedAt: new Date() })
        .where(eq(categories.id, orderedIds[i]));
    }
  },

  async assignNotesToCategory(noteIds: number[], categoryId: number) {
    for (const noteId of noteIds) {
      const note = await db.select().from(notes).where(eq(notes.id, noteId)).then(r => r[0]);
      if (!note) continue;
      let ids: number[] = [];
      if (note.categoryIds) {
        try { ids = JSON.parse(note.categoryIds); } catch { ids = []; }
      }
      if (!ids.includes(categoryId)) {
        ids.push(categoryId);
        await db.update(notes)
          .set({ categoryIds: JSON.stringify(ids), updatedAt: new Date() })
          .where(eq(notes.id, noteId));
      }
    }
  },

  async removeNotesFromCategory(noteIds: number[], categoryId: number) {
    for (const noteId of noteIds) {
      const note = await db.select().from(notes).where(eq(notes.id, noteId)).then(r => r[0]);
      if (!note || !note.categoryIds) continue;
      try {
        const ids: number[] = JSON.parse(note.categoryIds);
        const filtered = ids.filter((cid) => cid !== categoryId);
        await db.update(notes)
          .set({ categoryIds: filtered.length > 0 ? JSON.stringify(filtered) : null, updatedAt: new Date() })
          .where(eq(notes.id, noteId));
      } catch { /* skip */ }
    }
  },
};
