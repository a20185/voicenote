# Directory Structure

> Module organization and file layout for the VoiceNote app

---

## Project Structure

```
voicenote/
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Tab navigation group
│   │   ├── _layout.tsx    # Tab navigator configuration
│   │   ├── index.tsx      # Home screen (/)
│   │   ├── record.tsx     # Record screen (/record)
│   │   ├── notes.tsx      # Notes screen (/notes)
│   │   └── settings.tsx   # Settings screen (/settings)
│   ├── _layout.tsx        # Root layout with providers
│   └── index.tsx          # Initial/redirect route
│
├── components/            # Reusable UI components
│   ├── ui/               # Generic UI components
│   │   ├── Button.tsx    # Button component
│   │   ├── Input.tsx     # Input component
│   │   ├── Card.tsx      # Card component
│   │   └── index.ts      # Re-exports
│   ├── audio/            # Audio-related components
│   │   ├── AudioPlayer.tsx
│   │   └── index.ts
│   ├── camera/           # Camera-related components
│   │   ├── CameraView.tsx
│   │   └── index.ts
│   └── index.ts          # Re-exports all components
│
├── hooks/                 # Custom React hooks
│   ├── useAudioRecorder.ts
│   ├── useCamera.ts
│   ├── useFilePicker.ts
│   ├── useFileUpload.ts
│   └── index.ts          # Re-exports all hooks
│
├── store/                 # Zustand stores (UI state)
│   ├── useAuthStore.ts
│   ├── useRecordingStore.ts
│   ├── useSettingsStore.ts
│   └── index.ts          # Re-exports all stores
│
├── services/              # External service integrations
│   ├── api/              # API client
│   │   ├── client.ts     # Axios instance
│   │   ├── endpoints.ts  # API endpoint constants
│   │   ├── queries.ts    # React Query hooks
│   │   └── index.ts
│   ├── upload/           # File upload service
│   └── index.ts
│
├── db/                    # Database layer (Drizzle ORM)
│   ├── schema/           # Table definitions
│   │   └── index.ts
│   ├── client.ts         # Database connection
│   ├── queries.ts        # Query functions
│   └── index.ts
│
├── types/                 # TypeScript type definitions
│   ├── index.ts          # Domain types (Note, Recording, etc.)
│   └── navigation.ts     # Navigation types
│
├── utils/                 # Utility functions
│   ├── format.ts         # Formatting utilities
│   ├── validation.ts     # Validation helpers
│   └── index.ts
│
├── theme/                 # Theme configuration
│   ├── colors.ts         # Color palette
│   ├── spacing.ts        # Spacing, border-radius, shadows
│   ├── typography.ts     # Typography config
│   ├── tamagui.config.ts # Tamagui configuration
│   └── index.ts
│
└── assets/               # Static assets (images, fonts)
```

---

## Routing Convention (Expo Router)

Routes are determined by file structure:

| File Path | Route |
|-----------|-------|
| `app/index.tsx` | `/` |
| `app/(tabs)/index.tsx` | `/` (within tabs) |
| `app/(tabs)/record.tsx` | `/record` |
| `app/note/[id].tsx` | `/note/:id` (dynamic) |

### Layout Files

- `app/_layout.tsx` - Root layout (providers, theme)
- `app/(tabs)/_layout.tsx` - Tab navigator configuration

---

## Component Organization

Organize by **feature domain**, not by type:

```
components/
├── ui/           # Generic, reusable UI components
├── audio/        # Audio domain components
└── camera/       # Camera domain components
```

### When to Create a New Directory

Create a new feature directory when:
- You have 3+ related components
- Components share domain-specific types/hooks
- Components are not used outside this domain

---

## Barrel Files (index.ts)

Every directory has an `index.ts` that re-exports:

```typescript
// components/index.ts
export * from './ui';
export * from './audio';
export * from './camera';

// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
export type { ButtonProps } from './Button';
```

**Why?** Enables clean imports:

```typescript
// Instead of:
import { Button } from '@components/ui/Button';

// Use:
import { Button } from '@components/ui';
// Or even:
import { Button, AudioPlayer } from '@components';
```

---

## File Naming

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `AudioPlayer.tsx` |
| Hook | camelCase with `use` prefix | `useAudioRecorder.ts` |
| Store | camelCase with `use` prefix | `useSettingsStore.ts` |
| Utility | camelCase | `format.ts` |
| Type | camelCase | `types/index.ts` |
| Constant | camelCase | `colors.ts` |

---

## Anti-Patterns

### Don't: Deep Nested Imports

```typescript
// Avoid
import { Button } from '@components/ui/Button/Button';
```

### Don't: Mix Concerns in Components

```typescript
// Avoid - component with direct API calls
function NoteList() {
  const [notes, setNotes] = useState([]);
  useEffect(() => {
    fetch('/api/notes').then(r => r.json()).then(setNotes);
  }, []);
}
```

### Do: Use Barrel Files and Hooks

```typescript
// Preferred
import { Button } from '@components/ui';
import { useNotes } from '@services/api';

function NoteList() {
  const { data: notes } = useNotes();
}
```
