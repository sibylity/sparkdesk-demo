import type { Context, Next } from 'hono'

export async function serviceAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.INTERNAL_API_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}
