import { NextResponse } from "next/server";


export function middleware(req) {
  const token = req.cookies.get('access_token')?.value;

  const isLoginPage = req.nextUrl.pathname.startsWith('/admin');
  const isProtected = req.nextUrl.pathname.startsWith('/dashboard');

  // 로그인 안 되어 있고 보호된 경로 접근 시 → 로그인 페이지로 리다이렉트
  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // 로그인 페이지 접근했는데 이미 로그인 되어 있으면 → 대시보드로
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'], // 미들웨어 적용 경로
};
