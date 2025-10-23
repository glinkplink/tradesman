/**
 * Simple admin authentication without external OAuth
 * Uses environment variables for admin credentials
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { Request, Response } from 'express';
import cookie from 'cookie';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-this-secret-in-production'
);

const COOKIE_NAME = 'admin_session';

interface AdminUser {
  email: string;
  role: 'admin';
}

/**
 * Verify admin credentials against environment variables
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('[Auth] ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables');
    return false;
  }

  if (email !== adminEmail) {
    return false;
  }

  // Check if password is already hashed (starts with $2a$ or $2b$)
  if (adminPassword.startsWith('$2a$') || adminPassword.startsWith('$2b$')) {
    return bcrypt.compare(password, adminPassword);
  }

  // Plain text password comparison (for development)
  return password === adminPassword;
}

/**
 * Create JWT token for admin user
 */
export async function createAdminToken(email: string): Promise<string> {
  const token = await new SignJWT({ email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify JWT token and return admin user
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    if (payload.email && payload.role === 'admin') {
      return {
        email: payload.email as string,
        role: 'admin',
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get admin user from request cookies
 */
export async function getAdminFromRequest(req: Request): Promise<AdminUser | null> {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return null;
  }

  return verifyAdminToken(token);
}

/**
 * Set admin session cookie
 */
export function setAdminCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

/**
 * Clear admin session cookie
 */
export function clearAdminCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

