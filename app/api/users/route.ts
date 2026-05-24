import { NextRequest } from 'next/server'
import pool from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const field = searchParams.get('field')
  const role = searchParams.get('role')
  const experience = searchParams.get('experience')
  const country = searchParams.get('country')
  const search = searchParams.get('search')

  try {
    let query = `
      SELECT u.id, u.email, u.name, u.university, u.major, u.year, u.country, u.bio, u.profile_photo_url, u.created_at,
        COALESCE(
          json_agg(json_build_object('id', t.id, 'name', t.name, 'category', t.category))
          FILTER (WHERE t.id IS NOT NULL), '[]'
        ) AS tags
      FROM users u
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
    `
    const conditions: string[] = []
    const params: unknown[] = []
    let paramIdx = 1

    if (search) {
      conditions.push(`(u.name ILIKE $${paramIdx} OR u.university ILIKE $${paramIdx})`)
      params.push(`%${search}%`)
      paramIdx++
    }

    if (country) {
      conditions.push(`u.country ILIKE $${paramIdx}`)
      params.push(`%${country}%`)
      paramIdx++
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' GROUP BY u.id'

    // Filter by tag category after grouping
    if (field || role || experience) {
      const havingClauses: string[] = []
      if (field) {
        havingClauses.push(
          `bool_or(t.category = 'field' AND t.name ILIKE $${paramIdx})`
        )
        params.push(`%${field}%`)
        paramIdx++
      }
      if (role) {
        havingClauses.push(
          `bool_or(t.category = 'role' AND t.name ILIKE $${paramIdx})`
        )
        params.push(`%${role}%`)
        paramIdx++
      }
      if (experience) {
        havingClauses.push(
          `bool_or(t.category = 'experience' AND t.name ILIKE $${paramIdx})`
        )
        params.push(`%${experience}%`)
        paramIdx++
      }
      query += ' HAVING ' + havingClauses.join(' AND ')
    }

    query += ' ORDER BY u.created_at DESC'

    const result = await pool.query(query, params)
    return Response.json({ users: result.rows })
  } catch (err) {
    console.error('Get users error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
