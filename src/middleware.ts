import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes
  // - the private /insights dashboard (its own non-localized root layout)
  // - Next.js internals (_next, _vercel)
  // - static files (containing a dot)
  matcher: ['/((?!api|insights|_next|_vercel|.*\\..*).*)'],
};
