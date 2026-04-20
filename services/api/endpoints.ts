export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refreshToken: '/auth/refresh',
    me: '/auth/me',
  },

  // Notes
  notes: {
    list: '/notes',
    detail: (id: number) => `/notes/${id}`,
    create: '/notes',
    update: (id: number) => `/notes/${id}`,
    delete: (id: number) => `/notes/${id}`,
    search: '/notes/search',
  },

  // Recordings
  recordings: {
    list: '/recordings',
    detail: (id: number) => `/recordings/${id}`,
    byNote: (noteId: number) => `/notes/${noteId}/recordings`,
    upload: '/recordings/upload',
    delete: (id: number) => `/recordings/${id}`,
  },

  // Media
  media: {
    list: '/media',
    detail: (id: number) => `/media/${id}`,
    byNote: (noteId: number) => `/notes/${noteId}/media`,
    upload: '/media/upload',
    delete: (id: number) => `/media/${id}`,
  },

  // Sync
  sync: {
    status: '/sync/status',
    push: '/sync/push',
    pull: '/sync/pull',
  },

  // User
  user: {
    profile: '/user/profile',
    settings: '/user/settings',
  },

  // Shares
  shares: {
    create: '/shares',
    detail: (id: string) => `/shares/${id}`,
    delete: (id: string) => `/shares/${id}`,
    list: '/shares',
    presignedUrl: (id: string) => `/shares/${id}/upload-url`,
  },
} as const;
