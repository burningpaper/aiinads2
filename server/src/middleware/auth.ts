import type { Request, Response, NextFunction } from 'express'
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node'
import { UnauthorizedError } from '../lib/errors.js'

export const requireAuth = ClerkExpressRequireAuth({
  onError: () => {
    throw new UnauthorizedError('Authentication required')
  },
})

export function optionalAuth(_req: Request, _res: Response, next: NextFunction) {
  // Auth is already populated by ClerkExpressWithAuth middleware
  next()
}
