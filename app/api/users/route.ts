import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import pool from '@/lib/db'
import { verifyJWT } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') || searchParams.get('q') || ''
  const country = searchParams.get('country') || ''
  const university = searchParams.get('university') || ''
  const year = searchParams.get('year') || ''
  const tagsParam = searchParams.get('tags') || ''
  const tagNames = tagsParam ? tagsParam.split(',').map(t => t.trim()).filter(Boolean) : []

  // Get current user id to exclude from results
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value
  const payload = token ? verifyJWT(token) : null
  const currentUserId = payload?.userId ?? null

  try {
    const params: unknown[] = []
    let p = 1

    const conditions: string[] = []

    // Always exclude the logged-in user
    if (currentUserId) {
      conditions.push(`u.id != $${p}`)
      params.push(currentUserId)
      p++
    }

    if (search) {
      conditions.push(`(u.name ILIKE $${p} OR u.university ILIKE $${p} OR u.major ILIKE $${p})`)
      params.push(`%${search}%`)
      p++
    }

    if (country) {
      conditions.push(`u.country ILIKE $${p}`)
      params.push(`%${country}%`)
      p++
    }

    // Support both single ?university= and comma-separated ?universities=
    const universitiesParam = searchParams.get('universities') || ''
    const universityList = universitiesParam
      ? universitiesParam.split(',').map(u => u.trim()).filter(Boolean)
      : university ? [university] : []

    if (universityList.length === 1) {
      conditions.push(`u.university ILIKE $${p}`)
      params.push(`%${universityList[0]}%`)
      p++
    } else if (universityList.length > 1) {
      const orClauses = universityList.map(() => `u.university ILIKE $${p++}`).join(' OR ')
      conditions.push(`(${orClauses})`)
      universityList.forEach(u => params.push(`%${u}%`))
    }

    if (year) {
      conditions.push(`u.year = $${p}`)
      params.push(parseInt(year))
      p++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // If tag filters, use subquery to find users who have at least one matching tag
    const tagSubquery = tagNames.length > 0
      ? `AND u.id IN (
          SELECT ut2.user_id FROM user_tags ut2
          JOIN tags t2 ON ut2.tag_id = t2.id
          WHERE t2.name ILIKE ANY(ARRAY[${tagNames.map(() => `$${p++}`).join(',')}])
        )`
      : ''
    if (tagNames.length > 0) {
      tagNames.forEach(name => params.push(`%${name}%`))
    }

    const query = `
      SELECT u.id, u.name, u.university, u.major, u.year, u.country, u.bio, u.profile_photo_url, u.created_at,
        COALESCE(
          json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM users u
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
      ${whereClause} ${tagSubquery}
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `

    const result = await pool.query(query, params)
    return Response.json({ users: result.rows })
  } catch (err) {
    console.error('Get users error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
