/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use static export for production builds
  ...(process.env.NODE_ENV === 'production' && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true
    }
  }),
  eslint: {
    dirs: ['pages', 'components', 'lib', 'hooks', 'stores', 'types']
  },
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig
