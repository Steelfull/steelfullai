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
};

export default withNextIntl(nextConfig);
