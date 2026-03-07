# /realtime-hook - Socket.io Subscription Hook Generator

Generate a custom React hook that combines REST fetching with Socket.io real-time updates.

## Arguments
- `$ARGUMENTS` - Hook name and events (e.g., "useShowState show:updated,segment:activated", "useVoteCounts vote:counted")

## Instructions

Parse arguments to extract:
1. Hook name (camelCase, starts with "use")
2. Socket events to subscribe to (comma-separated)

Generate hook at: `client/src/hooks/{hookName}.ts`

## Template

```tsx
import { useEffect, useState, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { socket } from '@/lib/socket'
import { api } from '@/lib/api'

interface HookNameState {
  // state shape based on context
}

export function useHookName(showId: string) {
  const queryClient = useQueryClient()

  // Initial REST fetch
  const { data, isLoading, error } = useQuery({
    queryKey: ['hookname', showId],
    queryFn: () => api.get(`/api/resource/${showId}`),
  })

  // Socket.io subscription
  useEffect(() => {
    if (!showId) return

    const room = `show:${showId}`
    socket.emit('join', { room })

    const handleEvent = (payload: EventPayload) => {
      // Patch React Query cache
      queryClient.setQueryData(['hookname', showId], (old: HookNameState) => ({
        ...old,
        ...payload,
      }))
    }

    socket.on('event:name', handleEvent)

    return () => {
      socket.off('event:name', handleEvent)
      socket.emit('leave', { room })
    }
  }, [showId, queryClient])

  // Auto-reconnect handling
  useEffect(() => {
    const handleReconnect = () => {
      queryClient.invalidateQueries({ queryKey: ['hookname', showId] })
    }

    socket.on('connect', handleReconnect)
    return () => {
      socket.off('connect', handleReconnect)
    }
  }, [showId, queryClient])

  return { data, isLoading, error }
}
```

## Key Patterns

1. **Initial load via REST** - Never rely on sockets alone
2. **Socket patches React Query cache** - Single source of truth
3. **Room-based subscriptions** - Join `show:${showId}` on mount
4. **Reconnect refetch** - Invalidate queries on socket reconnect
5. **Cleanup** - Unsubscribe and leave room on unmount

## Socket Events Reference

- `show:updated` - Show status changed
- `segment:activated` - Segment went live
- `content:changed` - Segment content updated
- `decision:opened` - Voting opened
- `decision:closed` - Voting closed
- `vote:counted` - New vote tallied
- `comment:received` - New comment (admin only)

## Output

Create the hook file with proper Socket.io subscription patterns and React Query integration.
