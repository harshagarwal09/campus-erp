import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default_jwt_secret'
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'default_refresh_secret'
);

export interface UserPayload extends JWTPayload {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'STUDENT' | 'CLUB_HEAD' | 'HACKATHON_LEAD' | 'FEST_COORDINATOR';
  entityType: string | null;
  entityId: number | null;
  studentId: string | null;
  requiresPasswordChange: boolean;
}

export interface RefreshPayload extends JWTPayload {
  id: number;
}

// ─── Access Token (15 min) ───────────────────────────────────────────────────

export async function signAccessToken(payload: Omit<UserPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<UserPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as UserPayload;
}

// ─── Refresh Token (7 days) ──────────────────────────────────────────────────

export async function signRefreshToken(userId: number): Promise<string> {
  return new SignJWT({ id: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyRefreshToken(token: string): Promise<RefreshPayload> {
  const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
  return payload as RefreshPayload;
}

// ─── Cookie helpers ──────────────────────────────────────────────────────────

export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export function cookieOptions(maxAge: number) {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge,
  };
}

// ─── User payload builder (mirrors Express createUserPayload) ────────────────

export function buildUserPayload(user: {
  id: number;
  username: string;
  email?: string;
  role: string;
  entityType?: string | null;
  entityId?: number | null;
  studentId?: string | null;
  isFirstLogin?: boolean | number | null;
}): Omit<UserPayload, keyof JWTPayload> {
  const studentId = user.studentId || user.entityId?.toString() || null;
  return {
    id: user.id,
    username: user.username,
    email: user.email || '',
    role: user.role as UserPayload['role'],
    entityType: user.entityType ?? null,
    entityId: user.entityId ?? null,
    studentId: user.role === 'STUDENT' ? studentId : null,
    requiresPasswordChange: Boolean(user.isFirstLogin),
  };
}
