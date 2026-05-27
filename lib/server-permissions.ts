import pool from './db'
import { P } from './permissions'

export async function getServerPermissions(userId: number, networkId: number): Promise<number> {
  const ownerCheck = await pool.query('SELECT creator_id FROM networks WHERE id = $1', [networkId])
  if (ownerCheck.rows[0]?.creator_id === userId) return P.ALL

  // Check membership
  const memberCheck = await pool.query(
    'SELECT 1 FROM network_members WHERE network_id = $1 AND user_id = $2',
    [networkId, userId]
  )
  if (memberCheck.rows.length === 0) return 0

  // @everyone perms
  let perms = P.VIEW_CHANNEL | P.SEND_MESSAGES // safe default
  try {
    const everyone = await pool.query(
      'SELECT permissions FROM network_roles WHERE network_id = $1 AND is_everyone = true',
      [networkId]
    )
    if (everyone.rows[0]) perms = Number(everyone.rows[0].permissions)
  } catch { /* network_roles table may not exist yet */ }

  // User-assigned roles
  try {
    const roles = await pool.query(
      `SELECT nr.permissions FROM network_member_roles nmr
       JOIN network_roles nr ON nmr.role_id = nr.id
       WHERE nmr.network_id = $1 AND nmr.user_id = $2`,
      [networkId, userId]
    )
    for (const row of roles.rows) perms |= Number(row.permissions)
  } catch { /* network_member_roles table may not exist yet */ }

  return perms
}

export async function getChannelPermissions(userId: number, networkId: number, channelId: number): Promise<number> {
  const serverPerms = await getServerPermissions(userId, networkId)
  if (serverPerms & P.ADMINISTRATOR) return P.ALL

  // Collect role IDs that apply: @everyone + user's roles
  let everyoneId: number | null = null
  let roleIds: number[] = []
  try {
    const everyone = await pool.query(
      'SELECT id FROM network_roles WHERE network_id = $1 AND is_everyone = true',
      [networkId]
    )
    everyoneId = everyone.rows[0]?.id ?? null
  } catch { /* network_roles table may not exist yet */ }

  try {
    const userRoles = await pool.query(
      'SELECT role_id FROM network_member_roles WHERE network_id = $1 AND user_id = $2',
      [networkId, userId]
    )
    roleIds = userRoles.rows.map((r: { role_id: number }) => r.role_id)
  } catch { /* network_member_roles table may not exist yet */ }

  const allRoleIds: number[] = everyoneId ? [everyoneId, ...roleIds] : roleIds

  if (allRoleIds.length === 0) return serverPerms

  let perms = serverPerms
  try {
    const overrides = await pool.query(
      `SELECT cpo.allow, cpo.deny, nr.is_everyone
       FROM channel_permission_overrides cpo
       JOIN network_roles nr ON cpo.role_id = nr.id
       WHERE cpo.channel_id = $1 AND cpo.role_id = ANY($2::int[])
       ORDER BY nr.is_everyone DESC, nr.position ASC`,
      [channelId, allRoleIds]
    )
    // Apply @everyone override first, then assigned roles
    for (const ov of overrides.rows) {
      perms &= ~Number(ov.deny)
      perms |= Number(ov.allow)
    }
  } catch { /* channel_permission_overrides table may not exist yet */ }

  return perms
}
