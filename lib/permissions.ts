export const P = {
  VIEW_CHANNEL:    1 << 0,  // 1
  SEND_MESSAGES:   1 << 1,  // 2
  MANAGE_MESSAGES: 1 << 2,  // 4
  MANAGE_CHANNELS: 1 << 3,  // 8
  MANAGE_ROLES:    1 << 4,  // 16
  KICK_MEMBERS:    1 << 5,  // 32
  MANAGE_NETWORK:  1 << 6,  // 64
  ADMINISTRATOR:   1 << 7,  // 128
  ALL:             0xFF,    // 255
} as const

export type PermKey = 'VIEW_CHANNEL' | 'SEND_MESSAGES' | 'MANAGE_MESSAGES' |
  'MANAGE_CHANNELS' | 'MANAGE_ROLES' | 'KICK_MEMBERS' | 'MANAGE_NETWORK' | 'ADMINISTRATOR'

export const PERM_INFO: Record<PermKey, { label: string; desc: string; dangerous?: boolean }> = {
  ADMINISTRATOR:   { label: 'Administrator',   desc: 'Grants all permissions and bypasses channel overrides.', dangerous: true },
  MANAGE_NETWORK:  { label: 'Manage Network',  desc: 'Edit the network name and description.' },
  MANAGE_CHANNELS: { label: 'Manage Channels', desc: 'Create, edit, and delete channels.' },
  MANAGE_ROLES:    { label: 'Manage Roles',    desc: 'Create, edit, delete, and assign roles.' },
  KICK_MEMBERS:    { label: 'Kick Members',    desc: 'Remove members from this network.' },
  MANAGE_MESSAGES: { label: 'Manage Messages', desc: "Delete other members' messages." },
  VIEW_CHANNEL:    { label: 'View Channel',    desc: 'Read messages in text channels.' },
  SEND_MESSAGES:   { label: 'Send Messages',   desc: 'Post messages in text channels.' },
}

export const PERM_KEYS: PermKey[] = [
  'ADMINISTRATOR', 'MANAGE_NETWORK', 'MANAGE_CHANNELS', 'MANAGE_ROLES',
  'KICK_MEMBERS', 'MANAGE_MESSAGES', 'VIEW_CHANNEL', 'SEND_MESSAGES',
]

export function has(perms: number, flag: number): boolean {
  return (perms & P.ADMINISTRATOR) !== 0 || (perms & flag) !== 0
}

export const DEFAULT_EVERYONE_PERMS = P.VIEW_CHANNEL | P.SEND_MESSAGES // 3
export const DEFAULT_MODERATOR_PERMS = P.VIEW_CHANNEL | P.SEND_MESSAGES | P.MANAGE_MESSAGES // 7
export const DEFAULT_ADMIN_PERMS = P.ALL & ~P.ADMINISTRATOR // 127

export const ROLE_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#ff73fa', '#607d8b', '#99aab5',
]
