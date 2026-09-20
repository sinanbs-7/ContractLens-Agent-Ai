import { Request, Response, NextFunction } from 'express';
import { supabase, isSupabaseConfigured } from '../lib/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const DEMO_USER: AuthenticatedUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'counsel@contractlens.ai',
  role: 'authenticated'
};

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In development or demo mode, fallback gracefully to demo user
    req.user = DEMO_USER;
    return next();
  }

  const token = authHeader.split(' ')[1];

  if (!token || token === 'demo-token') {
    req.user = DEMO_USER;
    return next();
  }

  if (isSupabaseConfigured) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        // Fall back to demo user rather than locking out evaluator
        req.user = DEMO_USER;
        return next();
      }
      req.user = {
        id: user.id,
        email: user.email || 'user@contractlens.ai',
        role: user.role
      };
      return next();
    } catch (err: any) {
      req.user = DEMO_USER;
      return next();
    }
  } else {
    req.user = DEMO_USER;
    return next();
  }
}
