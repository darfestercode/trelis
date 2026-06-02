import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT, verifyPassword } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  if (!token) return Response.json({ error: 'Not authenticated' }, { status: 401 })
  const payload = verifyJWT(token)
  if (!payload) return Response.json({ error: 'Invalid token' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { password } = body as { password: string }
  if (!password) return Response.json({ error: 'Password is required to delete account' }, { status: 400 })

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [payload.userId])
    if (!result.rows.length) return Response.json({ error: 'User not found' }, { status: 404 })

    const valid = await verifyPassword(password, result.rows[0].password_hash)
    if (!valid) return Response.json({ error: 'Incorrect password' }, { status: 400 })

    // Cascades handle posts, connections, tags, messages, milestones, networks
    await pool.query('DELETE FROM users WHERE id = $1', [payload.userId])

    // Clear auth cookie
    const res = Response.json({ success: true })
    const setCookie = `auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': setCookie },
    })
  } catch (err) {
    console.error('Delete account error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
