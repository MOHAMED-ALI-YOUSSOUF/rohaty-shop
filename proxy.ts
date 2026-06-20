import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ===============================
  // 1. IGNORE STATIC FILES
  // ===============================
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // ===============================
  // 2. DASHBOARD PROTECTION
  // ===============================
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('sb-access-token')?.value

    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/connexion'
      return NextResponse.redirect(url)
    }
  }

  // ===============================
  // 3. STORE SLUG DETECTION (SaaS multi-tenant)
  // ===============================
  const match = pathname.match(/^\/([a-zA-Z0-9-]+)/)

  if (match) {
    const storeSlug = match[1]

    const response = NextResponse.next()

    // inject store context
    response.headers.set('x-store-slug', storeSlug)

    return response
  }

  // ===============================
  // 4. DEFAULT
  // ===============================
  return NextResponse.next()
}

// ===============================
// CONFIG MATCHER
// ===============================
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}