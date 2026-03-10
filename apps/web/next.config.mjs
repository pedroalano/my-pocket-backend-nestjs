import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // 'unsafe-inline' required by Next.js hydration
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src 'self' ${API_URL}`,
  "frame-ancestors 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@my-pocket/shared'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // CSP only in production — Turbopack dev server requires inline scripts for HMR
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Content-Security-Policy', value: CSP_DIRECTIVES }]
            : []),
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
