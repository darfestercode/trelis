'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { useTheme } from '@/app/components/ThemeProvider'
import { useUser } from '@/app/components/UserContext'
import { User } from '@/types'


function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-[#334155] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-[#334155]">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-4 sm:px-6 py-5">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-[#334155] rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#335293]/25 focus:border-[#335293] transition-colors ${props.className ?? ''}`}
    />
  )
}

function StatusMsg({ msg }: { msg: { type: 'success' | 'error'; text: string } | null }) {
  if (!msg) return null
  return (
    <div className={`text-sm px-4 py-2.5 rounded-xl ${
      msg.type === 'success'
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
    }`}>
      {msg.text}
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'
  const { user: authUser, loggedOut } = useUser()

  const [user, setUser] = useState<User | null>(null)

  // Email form
  const [profile, setProfile] = useState({ email: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password form
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })

  // Delete account
  const [deleteModal, setDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (loggedOut) { router.push('/login'); return }
    if (authUser) {
      setUser(authUser)
      setProfile({ email: authUser.email ?? '' })
    }
  }, [loggedOut, authUser, router])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMsg(null)
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email.trim() }),
      })
      const d = await res.json()
      if (!res.ok) { setProfileMsg({ type: 'error', text: d.error }); return }
      setProfileMsg({ type: 'success', text: 'Email updated successfully.' })
      setUser(prev => prev ? { ...prev, ...d.user } : prev)
    } catch {
      setProfileMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setProfileSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return }
    if (pwForm.next.length < 8) { setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return }
    setPwSaving(true)
    setPwMsg(null)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      })
      const d = await res.json()
      if (!res.ok) { setPwMsg({ type: 'error', text: d.error }); return }
      setPwMsg({ type: 'success', text: 'Password changed successfully.' })
      setPwForm({ current: '', next: '', confirm: '' })
    } catch {
      setPwMsg({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setPwSaving(false)
    }
  }

  async function deleteAccount() {
    if (deleteConfirmText !== 'delete my account') {
      setDeleteMsg({ type: 'error', text: 'Please type the confirmation phrase exactly.' })
      return
    }
    setDeleting(true)
    setDeleteMsg(null)
    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      })
      const d = await res.json()
      if (!res.ok) { setDeleteMsg({ type: 'error', text: d.error }); setDeleting(false); return }
      router.push('/login')
    } catch {
      setDeleteMsg({ type: 'error', text: 'Network error. Please try again.' })
      setDeleting(false)
    }
  }

  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {show ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      )}
    </svg>
  )

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div className="w-6 h-6 border-2 border-[#335293] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-5 sm:py-10 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences.</p>
        </div>

        {/* ── Email ── */}
        <Section title="Email Address" description="Change the email you use to log in">
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <Field label="Email">
              <Input
                type="email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                placeholder="you@example.com"
                required
              />
            </Field>
            <StatusMsg msg={profileMsg} />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileSaving}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity"
                style={{ background: '#335293' }}
              >
                {profileSaving ? 'Saving…' : 'Update Email'}
              </button>
            </div>
          </form>
        </Section>

        {/* ── Appearance ── */}
        <Section title="Appearance">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#0f172a] flex items-center justify-center">
                {isDark ? (
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Dark Mode</p>
                <p className="text-xs text-gray-400 mt-0.5">{isDark ? 'Using dark theme' : 'Using light theme'}</p>
              </div>
            </div>
            <button
              onClick={toggle}
              role="switch"
              aria-checked={isDark}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                isDark ? 'bg-[#335293]' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </Section>

        {/* ── Security ── */}
        <Section title="Security" description="Change your login password">
          <form onSubmit={changePassword} className="flex flex-col gap-4">
            {(['current', 'next', 'confirm'] as const).map(field => (
              <Field key={field} label={field === 'current' ? 'Current Password' : field === 'next' ? 'New Password' : 'Confirm New Password'}>
                <div className="relative">
                  <Input
                    type={showPw[field] ? 'text' : 'password'}
                    value={pwForm[field]}
                    onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={field === 'current' ? 'Enter current password' : field === 'next' ? 'At least 8 characters' : 'Repeat new password'}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <EyeIcon show={showPw[field]} />
                  </button>
                </div>
              </Field>
            ))}
            <StatusMsg msg={pwMsg} />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity"
                style={{ background: '#335293' }}
              >
                {pwSaving ? 'Changing…' : 'Change Password'}
              </button>
            </div>
          </form>
        </Section>

        {/* ── Danger Zone ── */}
        <section className="bg-white dark:bg-[#1e293b] rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-red-100 dark:border-red-900/40">
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
            <p className="text-xs text-gray-400 mt-0.5">These actions are permanent and cannot be undone.</p>
          </div>
          <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Delete Account</p>
              <p className="text-xs text-gray-400 mt-0.5">Permanently delete your account, profile, posts, and all data.</p>
            </div>
            <button
              onClick={() => setDeleteModal(true)}
              className="shrink-0 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </section>

      </div>

      {/* ── Delete Account Modal ── */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-[#334155] p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Account</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">This cannot be undone.</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Confirm with your password"
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-[#334155] rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/25 focus:border-red-400 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Type <span className="font-mono text-red-500">delete my account</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="delete my account"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-[#334155] rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400/25 focus:border-red-400 transition-colors"
                />
              </div>

              <StatusMsg msg={deleteMsg} />

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setDeleteModal(false); setDeletePassword(''); setDeleteConfirmText(''); setDeleteMsg(null) }}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#0f172a] rounded-xl hover:bg-gray-200 dark:hover:bg-[#0a1120] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleting || !deletePassword || deleteConfirmText !== 'delete my account'}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {deleting ? 'Deleting…' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
