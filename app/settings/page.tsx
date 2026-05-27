'use client'

import AppShell from '@/app/components/AppShell'
import { useTheme } from '@/app/components/ThemeProvider'

export default function SettingsPage() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Manage your app preferences.</p>

        {/* Appearance */}
        <section className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-[#334155] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#334155]">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Appearance</h2>
          </div>

          <div className="px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#0f172a] flex items-center justify-center">
                {isDark ? (
                  /* Moon icon */
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  /* Sun icon */
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Dark Mode</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {isDark ? 'Dark theme is on' : 'Light theme is on'}
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              onClick={toggle}
              role="switch"
              aria-checked={isDark}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2 dark:focus:ring-offset-[#1e293b] ${
                isDark ? 'bg-[#1e3a5f]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* Theme preview */}
        <section className="bg-white dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-[#334155] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#334155]">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">Preview</h2>
          </div>
          <div className="px-6 py-5 space-y-3">
            <div className="h-3 w-2/3 rounded-full bg-gray-200 dark:bg-[#334155]" />
            <div className="h-3 w-1/2 rounded-full bg-gray-100 dark:bg-[#1e3a5f]/40" />
            <div className="h-3 w-3/4 rounded-full bg-gray-200 dark:bg-[#334155]" />
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-20 rounded-lg bg-[#1e3a5f] opacity-80" />
              <div className="h-8 w-20 rounded-lg border border-gray-200 dark:border-[#334155]" />
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
