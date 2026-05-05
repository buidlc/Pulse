import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@backend/lib/jwt';

const PROTECTED = ['/upload', '/dashboard', '/admin'];

export const config = {
  matcher: ['/upload/:path*', '/dashboard/:path*', '/admin/:path*'],
};

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const protect = PROTECTED.some((p) => path === p || path.startsWith(p + '/'));
  if (!protect) return NextResponse.next();

  const token = req.cookies.get('pulse_token')?.value;
  if (!token) return redirectHome(req);

  const payload = await verifyJWT(token);
  if (!payload) return clearAndRedirect(req);

  if (path.startsWith('/admin') && payload.role !== 'admin') {
    return redirectHome(req);
  }

  const res = NextResponse.next();
  res.headers.set('x-pulse-wallet', payload.wallet);
  res.headers.set('x-pulse-role', payload.role);
  return res;
}

function redirectHome(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = '/';
  url.searchParams.set('signin', 'required');
  return NextResponse.redirect(url);
}

function clearAndRedirect(req: NextRequest) {
  const res = redirectHome(req);
  res.cookies.set('pulse_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return res;
}
