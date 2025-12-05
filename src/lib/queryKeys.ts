export const queryKeys = {
  bookings: {
    all: ['bookings'] as const,
    user: (userId: string) => ['bookings', 'user', userId] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
  },
  profiles: {
    current: ['profiles', 'current'] as const,
    detail: (id: string) => ['profiles', 'detail', id] as const,
    role: ['profiles', 'role'] as const,
  },
  concepts: {
    all: ['concepts'] as const,
    user: (userId: string) => ['concepts', 'user', userId] as const,
    detail: (id: string) => ['concepts', 'detail', id] as const,
  },
  events: {
    all: ['events'] as const,
    public: ['events', 'public'] as const,
    upcoming: (userId: string) => ['events', 'upcoming', userId] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
  },
  files: {
    profile: (userId: string, type?: string) => 
      type 
        ? ['files', 'profile', userId, type] as const
        : ['files', 'profile', userId] as const,
    concept: (conceptId: string) => ['files', 'concept', conceptId] as const,
  },
} as const;
