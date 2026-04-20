# Component Guidelines

> How components are built in this project.

---

## Overview

This project uses **Tamagui** for UI components with the `styled()` function pattern. Components are built using Tamagui's primitives with variants for different visual states.

---

## Component Structure

Components follow this structure:

```typescript
// 1. Import Tamagui primitives and types
import { styled, GetProps, Button as TamaguiButton } from 'tamagui';

// 2. Define styled component with variants
export const Button = styled(TamaguiButton, {
  name: 'Button',
  borderRadius: 8,
  fontWeight: '600',

  variants: {
    variant: {
      primary: {
        backgroundColor: '#6366f1',
        color: 'white',
      },
      secondary: {
        backgroundColor: '$background',
        color: '$color',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$color',
      },
    },
    size: {
      sm: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 14,
      },
      md: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
      },
      lg: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        fontSize: 18,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

// 3. Export props type for consumers
export type ButtonProps = GetProps<typeof Button>;
```

---

## Props Conventions

- Use `GetProps<typeof Component>` to derive props types from styled components
- Do not manually define interface props for styled components
- For feature components, use explicit TypeScript interfaces:

```typescript
interface AudioPlayerProps {
  uri: string;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
}
```

- Optional props should use `?` syntax with defaults in destructuring
- Event handlers follow `on<EventName>` naming convention

---

## Styling Patterns

### Tamagui Theme Tokens

Use theme tokens for colors:

```typescript
backgroundColor: '$background'  // Theme-aware
color: '$color'                 // Theme-aware
borderColor: '$borderColor'     // Theme-aware
```

### Hardcoded Colors

For brand colors not in theme:

```typescript
backgroundColor: '#6366f1'  // Primary brand color
color: '#ef4444'            // Error/danger color
```

### Responsive Styling

Use Tamagui's responsive syntax:

```typescript
fontSize: {
  xs: 14,
  md: 16,
  lg: 18,
}
```

---

## Accessibility

- Use native accessibility props from Tamagui primitives
- Provide `accessibilityLabel` for interactive elements
- Ensure touch targets are at least 44x44 points

---

## Common Mistakes

1. **Manually defining props interface for styled components**
   - Use `GetProps<typeof Component>` instead

2. **Using inline styles**
   - Use Tamagui's styled() or props directly

3. **Not using theme tokens**
   - Use `$background`, `$color`, `$borderColor` for theme-aware colors

4. **Creating new components for variants**
   - Use variants in a single styled component instead
