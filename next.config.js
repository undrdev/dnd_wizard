/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    dirs: ['pages', 'components', 'lib', 'hooks', 'stores', 'types']
  },
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig
