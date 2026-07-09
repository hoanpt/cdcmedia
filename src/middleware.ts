import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Thêm Security Headers cơ bản để phòng thủ
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // Rate Limiting cơ bản ở mức Edge (Chống spam API)
  // Thực tế ở quy mô 5000 users, khuyên dùng Cloudflare WAF.

  return response;
}

export const config = {
  matcher: [
    // Bỏ qua các file tĩnh và _next
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
