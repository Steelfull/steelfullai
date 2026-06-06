import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Erzeugt einen schlanken, eigenständigen Server-Build (.next/standalone)
  // für das Hosting im Docker-Container auf dem VPS.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Keep the native better-sqlite3 module out of the bundle so its prebuilt
  // binary is traced into the standalone output and loaded at runtime.
  serverExternalPackages: ['better-sqlite3'],
};

export default withNextIntl(nextConfig);
