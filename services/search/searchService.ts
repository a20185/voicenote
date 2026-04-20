import MiniSearch from 'minisearch';
import type { Note } from '@/db';
import type { SearchDocument, SearchResult, GroupedSearchResults } from '@/types/search';

// Chinese text tokenizer: splits into individual chars + bigrams
function chineseTokenizer(text: string): string[] {
  const tokens: string[] = [];
  const words = text.split(/[\s,.!?;:，。！？；：、""''（）【】-]+/).filter(Boolean);

  for (const word of words) {
    if (/[\u4e00-\u9fff]/.test(word)) {
      const chars = [...word].filter((c) => /[\u4e00-\u9fff]/.test(c));
      // Individual characters
      tokens.push(...chars);
      // Bigrams
      for (let i = 0; i < chars.length - 1; i++) {
        tokens.push(chars[i] + chars[i + 1]);
      }
    } else if (word.length > 0) {
      tokens.push(word.toLowerCase());
    }
  }
  return tokens;
}

// MiniSearch indexes string fields. We store tags joined as a space-separated
// string so the tokenizer can process them, but keep the original array in our
// documents map for filtering.
interface IndexableDocument {
  id: string;
  type: string;
  status: string;
  title: string;
  content: string;
  tags: string; // space-joined for indexing
  createdAt: string;
  contentSnippet: string;
}

class SearchService {
  private index: MiniSearch<IndexableDocument>;
  private documents: Map<string, SearchDocument> = new Map();

  constructor() {
    this.index = new MiniSearch<IndexableDocument>({
      fields: ['title', 'content', 'tags'],
      storeFields: ['id'],
      tokenize: chineseTokenizer,
      searchOptions: {
        boost: { title: 2, tags: 1.5, content: 1 },
        fuzzy: 0.2,
        prefix: true,
        tokenize: chineseTokenizer,
      },
    });
  }

  indexDocuments(notes: Note[]): void {
    const newDocs = notes.map(noteToSearchDocument);
    this.index.removeAll();
    this.documents.clear();
    const indexableDocs: IndexableDocument[] = [];
    for (const doc of newDocs) {
      this.documents.set(doc.id, doc);
      indexableDocs.push({
        ...doc,
        tags: doc.tags.join(' '),
      });
    }
    this.index.addAll(indexableDocs);
  }

  search(query: string, tags?: string[]): SearchResult[] {
    if (!query.trim()) return [];

    const results = this.index.search(query);

    // Enrich with full document data and apply tag filter
    const enriched: SearchResult[] = [];
    for (const r of results) {
      const doc = this.documents.get(r.id as string);
      if (!doc) continue;
      if (tags && tags.length > 0) {
        if (!tags.some((tag) => doc.tags.includes(tag))) continue;
      }
      enriched.push({ ...doc, score: r.score });
    }
    return enriched;
  }

  groupResults(results: SearchResult[], query: string): GroupedSearchResults {
    const grouped: GroupedSearchResults = {
      notes: { active: [], archived: [], snoozed: [] },
      totalResults: results.length,
      query,
    };
    for (const result of results) {
      const status = result.status as 'active' | 'archived' | 'snoozed';
      if (grouped.notes[status]) {
        grouped.notes[status].push(result);
      }
    }
    return grouped;
  }

  extractAllTags(): string[] {
    const tagSet = new Set<string>();
    this.documents.forEach((doc) => {
      doc.tags.forEach((tag) => tagSet.add(tag));
    });
    return [...tagSet].sort();
  }

  get isReady(): boolean {
    return this.documents.size > 0;
  }
}

function noteToSearchDocument(note: Note): SearchDocument {
  let tags: string[] = [];
  if (note.tags) {
    try {
      tags = JSON.parse(note.tags);
    } catch {
      tags = [];
    }
  }
  const content = note.content || '';
  return {
    id: `note-${note.id}`,
    type: 'note',
    status: note.status as 'active' | 'archived' | 'snoozed',
    title: note.title || '',
    content,
    tags,
    createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : String(note.createdAt),
    contentSnippet: content.slice(0, 150),
  };
}

export const searchService = new SearchService();
