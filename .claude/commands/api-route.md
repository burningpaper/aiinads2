# /api-route - Express Route + Service Generator

Generate an Express route with service layer for the AI in Advertising conference system.

## Arguments
- `$ARGUMENTS` - Resource name and operations (e.g., "segments CRUD", "votes create,count", "decisions open,close")

## Instructions

Parse arguments to extract:
1. Resource name (plural, lowercase)
2. Operations: `CRUD` expands to create/read/update/delete, or specify individual ops

Generate files:
- `server/src/routes/{resource}.ts` - Express router
- `server/src/services/{resource}Service.ts` - Business logic

## Route Template

```typescript
import { Router } from 'express'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
import { resourceService } from '../services/resourceService'
import { io } from '../socket'

const router = Router()

// Protected route (admin only)
router.post('/', ClerkExpressRequireAuth(), async (req, res, next) => {
  try {
    const result = await resourceService.create(req.body)

    // Emit socket event for real-time update
    io.to(`show:${result.showId}`).emit('resource:created', result)

    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

// Public route
router.get('/:id', async (req, res, next) => {
  try {
    const result = await resourceService.getById(req.params.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export { router as resourceRouter }
```

## Service Template

```typescript
import { db } from '../lib/db'
import { AppError } from '../lib/errors'

export const resourceService = {
  async create(data: CreateResourceDto) {
    const [result] = await db`
      INSERT INTO resources (column1, column2)
      VALUES (${data.column1}, ${data.column2})
      RETURNING *
    `
    return result
  },

  async getById(id: string) {
    const [result] = await db`
      SELECT * FROM resources WHERE id = ${id}
    `
    if (!result) {
      throw new AppError('Resource not found', 404)
    }
    return result
  },

  async update(id: string, data: UpdateResourceDto) {
    const [result] = await db`
      UPDATE resources
      SET column1 = ${data.column1}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return result
  },

  async delete(id: string) {
    await db`DELETE FROM resources WHERE id = ${id}`
  },
}
```

## Key Patterns

1. **Clerk auth middleware** on mutating admin routes
2. **Socket.io emit** after state-changing operations
3. **Neon tagged template** for SQL queries (`db\`...\``)
4. **Error handling** with custom AppError class
5. **DTOs** for input validation (create types as needed)

## Socket Events to Emit

| Operation | Event |
|-----------|-------|
| Create segment content | `content:changed` |
| Activate segment | `segment:activated` |
| Open decision | `decision:opened` |
| Close decision | `decision:closed` |
| Submit vote | `vote:counted` |
| Submit comment | `comment:received` |

## Output

Create both route and service files with proper patterns for Neon, Clerk, and Socket.io.
