'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { P, PERM_KEYS, PERM_INFO, ROLE_COLORS, type PermKey } from '@/lib/permissions'

interface Role {
  id: number; name: string; color: string; position: number
  is_everyone: boolean; permissions: number
}
interface Member {
  id: number; name: string; email: string; role: string
  assigned_roles: { id: number; name: string; color: string }[]
}

type Tab = 'roles' | 'members'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

export default function SettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('roles')
  const [networkName, setNetworkName] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [userPermissions, setUserPermissions] = useState(0)
  const [loading, setLoading] = useState(true)

  // Role editor local state
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#99aab5')
  const [editPerms, setEditPerms] = useState(0)
  const [saving, setSaving] = useState(false)

  // Member role editor
  const [memberRoleMap, setMemberRoleMap] = useState<Record<number, number[]>>({})
  const [roleDropdown, setRoleDropdown] = useState<number | null>(null)

  const selectedRole = roles.find(r => r.id === selectedRoleId) ?? null
  const canManage = (userPermissions & P.ADMINISTRATOR) !== 0 || (userPermissions & P.MANAGE_ROLES) !== 0

  async function load() {
    const [netRes, rolesRes, membersRes] = await Promise.all([
      fetch(`/api/networks/${id}`),
      fetch(`/api/networks/${id}/roles`),
      fetch(`/api/networks/${id}`),
    ])
    const netData = await netRes.json()
    const rolesData = await rolesRes.json()

    setNetworkName(netData.network?.name ?? '')
    setUserPermissions(netData.userPermissions ?? 0)
    setMembers(netData.members ?? [])

    const r: Role[] = rolesData.roles ?? []
    setRoles(r)
    if (r.length > 0 && !selectedRoleId) setSelectedRoleId(r[0].id)

    // Build memberRoleMap from members' assigned_roles
    const map: Record<number, number[]> = {}
    for (const m of (netData.members ?? [])) {
      map[m.id] = (m.assigned_roles ?? []).map((ar: { id: number }) => ar.id)
    }
    setMemberRoleMap(map)
  }

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) router.push('/login')
    })
    load().finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Sync editor when selected role changes
  useEffect(() => {
    if (selectedRole) {
      setEditName(selectedRole.name)
      setEditColor(selectedRole.color)
      setEditPerms(Number(selectedRole.permissions))
    }
  }, [selectedRoleId]) // eslint-disable-line react-hooks/exhaustive-deps

  function togglePerm(flag: number) {
    if (!canManage) return
    // Don't allow toggling perms on @everyone when not admin
    setEditPerms(p => p ^ flag)
  }

  async function saveRole() {
    if (!selectedRoleId || saving) return
    setSaving(true)
    await fetch(`/api/networks/${id}/roles/${selectedRoleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, color: editColor, permissions: editPerms }),
    })
    await load()
    setSaving(false)
  }

  async function createRole() {
    const res = await fetch(`/api/networks/${id}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Role', color: '#99aab5', permissions: 3 }),
    })
    if (res.ok) {
      const data = await res.json()
      await load()
      setSelectedRoleId(data.role.id)
    }
  }

  async function deleteRole() {
    if (!selectedRoleId || selectedRole?.is_everyone) return
    if (!confirm(`Delete role "${selectedRole?.name}"?`)) return
    await fetch(`/api/networks/${id}/roles/${selectedRoleId}`, { method: 'DELETE' })
    setSelectedRoleId(null)
    await load()
  }

  async function saveMemberRoles(memberId: number, newRoleIds: number[]) {
    setMemberRoleMap(prev => ({ ...prev, [memberId]: newRoleIds }))
    await fetch(`/api/networks/${id}/members/${memberId}/roles`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleIds: newRoleIds }),
    })
  }

  const assignableRoles = roles.filter(r => !r.is_everyone)

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell raw>
      <div className="flex flex-col md:flex-row h-full">

        {/* ── Mobile top tabs ── */}
        <div className="md:hidden bg-[#1a2540] flex flex-col shrink-0">
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{networkName}</p>
              <p className="text-gray-400 text-[11px] mt-0.5">Server Settings</p>
            </div>
            <button
              onClick={() => router.push(`/networks/${id}`)}
              className="text-gray-300 hover:text-white text-xs shrink-0 ml-3 underline"
            >
              Back
            </button>
          </div>
          <div className="flex border-b border-white/10">
            {(['roles', 'members'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-2.5 text-sm capitalize transition-colors ${
                  tab === t ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Settings sidebar (desktop) ── */}
        <div className="hidden md:flex w-56 bg-[#1a2540] flex-col shrink-0">
          <div className="px-4 py-4 border-b border-white/10">
            <button
              onClick={() => router.push(`/networks/${id}`)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs mb-3 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to server
            </button>
            <p className="text-white font-semibold text-sm truncate">{networkName}</p>
            <p className="text-gray-400 text-xs mt-0.5">Server Settings</p>
          </div>

          <nav className="flex-1 px-2 py-3 space-y-0.5">
            {(['roles', 'members'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors capitalize ${
                  tab === t ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {t === 'roles' ? 'Roles' : 'Members'}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Main settings content ── */}
        <div className="flex-1 bg-[#f0f2f5] dark:bg-[#0f172a] overflow-hidden flex flex-col min-w-0">

          {/* ─── ROLES TAB ─── */}
          {tab === 'roles' && (
            <div className="flex h-full min-h-0">

              {/* Role list panel */}
              <div className={`w-full md:w-52 bg-white border-r border-gray-200 flex-col overflow-hidden md:shrink-0 ${
                selectedRoleId ? 'hidden md:flex' : 'flex'
              }`}>
                <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Roles</span>
                  {canManage && (
                    <button onClick={createRole} className="text-[#1e3a5f] hover:text-[#162d4a] transition-colors" title="Create role">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  {roles.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRoleId(r.id)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        selectedRoleId === r.id
                          ? 'bg-[#1e3a5f]/8 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                      <span className="truncate">{r.name}</span>
                      {r.is_everyone && <span className="ml-auto text-xs text-gray-400">default</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role editor */}
              {selectedRole ? (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
                  <div className="max-w-2xl">
                    <button
                      type="button"
                      onClick={() => setSelectedRoleId(null)}
                      className="md:hidden mb-3 -ml-1 inline-flex items-center gap-1 text-sm text-gray-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Roles
                    </button>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Edit Role — {selectedRole.name}</h2>
                    {selectedRole.is_everyone && (
                      <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                        @everyone applies to all members. Changes affect the whole server's baseline permissions.
                      </p>
                    )}

                    {/* Name + Color */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Appearance</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-1.5">Role Name</label>
                          <input
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            disabled={selectedRole.is_everyone || !canManage}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 disabled:bg-gray-50 disabled:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide font-medium block mb-1.5">Color</label>
                          <div className="flex gap-1.5 flex-wrap w-44">
                            {ROLE_COLORS.map(c => (
                              <button
                                key={c}
                                onClick={() => canManage && setEditColor(c)}
                                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${editColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Permissions */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Permissions</h3>
                      <p className="text-xs text-gray-400 mb-4">These are the server-level permissions for this role. Channel overrides can restrict or expand these per channel.</p>

                      <div className="space-y-0">
                        {PERM_KEYS.map((key, i) => {
                          const flag = P[key]
                          const enabled = (editPerms & flag) !== 0
                          const info = PERM_INFO[key]
                          return (
                            <div
                              key={key}
                              className={`flex items-start justify-between py-3.5 ${i < PERM_KEYS.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${info.dangerous ? 'text-red-600' : 'text-gray-800'}`}>
                                    {info.label}
                                  </span>
                                  {info.dangerous && (
                                    <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Powerful</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{info.desc}</p>
                              </div>
                              <Toggle
                                checked={enabled}
                                onChange={() => togglePerm(flag)}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      {!selectedRole.is_everyone && canManage ? (
                        <button
                          onClick={deleteRole}
                          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          Delete Role
                        </button>
                      ) : <span />}
                      {canManage && (
                        <button
                          onClick={saveRole}
                          disabled={saving}
                          className="bg-[#1e3a5f] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#162d4a] disabled:opacity-60 transition-colors"
                        >
                          {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 hidden md:flex items-center justify-center text-gray-400">
                  <p className="text-sm">Select a role to edit</p>
                </div>
              )}
            </div>
          )}

          {/* ─── MEMBERS TAB ─── */}
          {tab === 'members' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
              <div className="max-w-2xl">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Members</h2>
                <p className="text-sm text-gray-500 mb-5">Assign roles to control what each member can do.</p>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {members.map((m, i) => {
                    const assignedIds = memberRoleMap[m.id] ?? []
                    const assigned = assignableRoles.filter(r => assignedIds.includes(r.id))
                    const unassigned = assignableRoles.filter(r => !assignedIds.includes(r.id))

                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-3 px-5 py-3.5 ${i < members.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <div className="w-9 h-9 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{m.name}</span>
                            {m.role === 'creator' && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Owner</span>
                            )}
                            {assigned.map(r => (
                              <span
                                key={r.id}
                                className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                                style={{ backgroundColor: r.color + '22', color: r.color }}
                              >
                                {r.name}
                                {canManage && (
                                  <button
                                    onClick={() => saveMemberRoles(m.id, assignedIds.filter(rid => rid !== r.id))}
                                    className="hover:opacity-70"
                                  >
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{m.email}</p>
                        </div>

                        {/* Role dropdown */}
                        {canManage && unassigned.length > 0 && (
                          <div className="relative shrink-0">
                            <button
                              onClick={() => setRoleDropdown(roleDropdown === m.id ? null : m.id)}
                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Role
                            </button>
                            {roleDropdown === m.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-36">
                                {unassigned.map(r => (
                                  <button
                                    key={r.id}
                                    onClick={() => {
                                      saveMemberRoles(m.id, [...assignedIds, r.id])
                                      setRoleDropdown(null)
                                    }}
                                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                                  >
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                                    {r.name}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
