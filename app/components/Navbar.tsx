'use client'

import Link from 'next/link'

interface NavbarProps {
  currentUserId?: number
}

export default function Navbar({ currentUserId }: NavbarProps) {

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Trelis
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/messages"
              className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Messages
            </Link>
            {currentUserId && (
              <Link
                href="/my-profile"
                className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                My Profile
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
