import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mybasket-secret-key-change-in-production';

// Paths that do NOT require authentication
const PUBLIC_PATHS = [
  '/api/users/register',
  '/api/users/login',
  '/api/products',
  '/health',
  '/info',
  '/api-docs',
  '/api-docs.json',
];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((publicPath) => path.startsWith(publicPath));
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip auth for public paths
  if (isPublicPath(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please login.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    // Inject user info into headers for downstream services
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-username'] = decoded.username;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
    return;
  }
}
