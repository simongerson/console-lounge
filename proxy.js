import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'console_lounge_secret'
)

const OWNER_ROUTES = [
  '/dashboard', '/consoles', '/rates', '/staff',
  '/reports', '/expenses', '/cashouts', '/debts',
  '/customers', '/notifications', '/monitoring', '/income',
]

// Renamed from middleware() to proxy() — Next.js 16 deprecated the
// middleware.js file convention. A leftover middleware.js is silently
// ignored (no build error), meaning this route protection was NOT
// actually running at all until this rename. This was a critical,
// currently-live security gap: every owner-only page was reachable
// with no login required.
export async function proxy(request) {
  const { pathname } = request.nextUrl

  const isOwnerRoute = OWNER_ROUTES.some(r =>
    pathname === r || pathname.startsWith(r + '/')
  )
  const isLoginPage = pathname === '/login'

  if (!isOwnerRoute && !isLoginPage) return NextResponse.next()

  const token = request.cookies.get('owner_token')?.value

  if (isOwnerRoute && !token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET)
      if (isLoginPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      return NextResponse.next()
    } catch {
      if (isOwnerRoute) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('owner_token')
        return response
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*', '/consoles/:path*', '/rates/:path*',
    '/staff/:path*', '/reports/:path*', '/expenses/:path*',
    '/cashouts/:path*', '/debts/:path*', '/customers/:path*',
    '/notifications/:path*', '/monitoring/:path*', '/income/:path*',
  ],
}
