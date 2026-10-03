import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export const middleware = (req: NextRequest) => updateSession(req);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/report/:path*',
    '/items/:path*',
    '/found/:path*',
    '/claims/:path*',
    '/notifications/:path*',
    '/admin/:path*',
    '/onboarding/:path*',
  ],
};