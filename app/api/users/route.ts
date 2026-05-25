import { NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const search = searchParams.get('search') || searchParams.get('q') || ''
  const country = searchParams.get('country') || ''
  const university = searchParams.get('university') || ''
  const year = searchParams.get('year') || ''
  // comma-separated tag names e.g. ?tags=RMIT,Python
  const tagsParam = searchParams.get('tags') || ''
  const tagNames = tagsParam ? tagsParam.split(',').map(t => t.trim()).filter(Boolean) : []

  try {
    const params: unknown[] = []
    let p = 1

    const conditions: string[] = []

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

    if (university) {
      conditions.push(`u.university ILIKE $${p}`)
      params.push(`%${university}%`)
      p++
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
