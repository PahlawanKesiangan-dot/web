import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Firebase Admin is on Next.js' automatic server-external list. Bundling it
  // prevents Vercel Functions from looking for a missing generated external
  // module (for example, `firebase-admin-<hash>`).
  transpilePackages: ['firebase-admin'],
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      ],
    }];
  },
};

export default nextConfig;
