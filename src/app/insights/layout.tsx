import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '../globals.css';

/**
 * Standalone root layout for the private /insights dashboard. It lives outside
 * the localized ([locale]) routes, so it provides its own <html>/<body>.
 * Access is restricted at the edge (Caddy basic-auth); noindex as a backstop.
 */
export const metadata: Metadata = {
  title: 'Chat Insights — SteelfullAI',
  robots: { index: false, follow: false },
};

export default function InsightsLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink-900 antialiased">{children}</body>
    </html>
  );
}
