import pool from '@/lib/db'

// One-time cleanup: delete all tags that have any uppercase characters.
// Call once via GET /api/admin/cleanup-tags then delete this file.
export async function GET() {
  try {
    // Remove user_tag associations for uppercase tags first (CASCADE should handle it but be explicit)
    const deleted = await pool.query(
      `DELETE FROM tags WHERE name != lower(name) RETURNING id, name`
    )
    return Response.json({
      deleted: deleted.rows.length,
      tags: deleted.rows,
    })
  } catch (err) {
    console.error('Cleanup tags error:', err)
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
