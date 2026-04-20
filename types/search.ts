export interface SearchDocument {
  id: string;
  type: 'note';
  status: 'active' | 'archived' | 'snoozed';
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  contentSnippet: string;
}

export interface SearchResult extends SearchDocument {
  score: number;
}

export interface GroupedSearchResults {
  notes: {
    active: SearchResult[];
    archived: SearchResult[];
    snoozed: SearchResult[];
  };
  totalResults: number;
  query: string;
}
