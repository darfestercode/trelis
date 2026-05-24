import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

const protectedRoutes = ['/dashboard', '/my-profile', '/messages', '/discover', '/networks', '/roadmap']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtected) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth_token')?.value

  if (!token || !verifyJWT(token)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/my-profile/:path*', '/messages/:path*', '/discover/:path*', '/networks/:path*', '/roadmap/:path*'],
}
