import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [new URL('https://chjpgalnmarmxuqmlzup.supabase.co/storage/v1/object/public/**')],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400,
  },
}

export default nextConfig
