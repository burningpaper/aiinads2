# /component - React Component Scaffold

Generate a typed React component for the AI in Advertising conference system.

## Arguments
- `$ARGUMENTS` - Component name and interface (e.g., "VoteButton audience", "SegmentList admin", "LiveTally presentation")

## Instructions

Parse arguments to extract:
1. Component name (PascalCase)
2. Interface: `admin`, `audience`, or `presentation`

Generate component at: `client/src/interfaces/{interface}/components/{ComponentName}.tsx`

## Templates

### Admin Component (with Clerk auth)
```tsx
import { useAuth } from '@clerk/clerk-react'

interface ComponentNameProps {
  // props
}

export function ComponentName({ }: ComponentNameProps) {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) return null

  return (
    <div className="">
      {/* component content */}
    </div>
  )
}
```

### Audience Component (mobile-first, 375px)
```tsx
interface ComponentNameProps {
  // props
}

export function ComponentName({ }: ComponentNameProps) {
  return (
    <div className="px-4 py-3">
      {/* mobile-first: touch targets min 44px, readable text */}
    </div>
  )
}
```

### Presentation Component (1920x1080, large text)
```tsx
interface ComponentNameProps {
  // props
}

export function ComponentName({ }: ComponentNameProps) {
  return (
    <div className="text-4xl">
      {/* large screen: 24px+ text, high contrast, no interaction */}
    </div>
  )
}
```

## Patterns

- Use Zustand for global state: `import { useShowStore } from '@/stores/showStore'`
- Use React Query for server data: `import { useQuery, useMutation } from '@tanstack/react-query'`
- Use Socket.io hook: `import { useSocket } from '@/hooks/useSocket'`
- Tailwind for styling, no CSS files
- TypeScript strict mode

## Output

Create the component file with proper imports and structure for the specified interface.
