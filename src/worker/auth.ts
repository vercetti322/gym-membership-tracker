import { createMiddleware } from 'hono/factory';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { Context } from 'hono';
import {
  DELETE_SESSION_TOKEN,
  GET_SESSION_TOKEN,
  PERSIST_SESSION_TOKEN,
} from './queries';

const COOKIE = 'gym_session';
const SESSION_SECONDS = 60 * 60 * 24 * 30;

async function hash(token: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  );

  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const login = async (c: Context) => {
  let body: { password?: unknown };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request' }, 400);
  }

  if (
    typeof body.password !== 'string' ||
    body.password.length > 1024 ||
    body.password !== c.env.ADMIN_PASSWORD
  ) {
    return c.json({ error: 'Invalid password' }, 401);
  }

  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await c.env.gym_tracker_db
    .prepare(PERSIST_SESSION_TOKEN)
    .bind(await hash(token), Math.floor(Date.now() / 1000) + SESSION_SECONDS)
    .run();

  setCookie(c, COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_SECONDS,
  });

  return c.json({ ok: true });
};

export const logout = async (c: Context) => {
  const token = getCookie(c, COOKIE);

  if (token) {
    await c.env.gym_tracker_db
      .prepare(DELETE_SESSION_TOKEN)
      .bind(await hash(token))
      .run();
  }

  deleteCookie(c, COOKIE, {
    path: '/',
    secure: true,
    sameSite: 'Lax',
  });

  return c.json({ ok: true });
};

export const requireAuth = createMiddleware(async (c, next) => {
  const token = getCookie(c, COOKIE);

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const session = await c.env.gym_tracker_db
    .prepare(GET_SESSION_TOKEN)
    .bind(await hash(token), Math.floor(Date.now() / 1000))
    .first();

  if (!session) {
    deleteCookie(c, COOKIE, {
      path: '/',
      secure: true,
      sameSite: 'Lax',
    });

    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});
