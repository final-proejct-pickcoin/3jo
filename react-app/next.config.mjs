/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // JavaScript 프로젝트 최적화
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    forceSwcTransforms: true,
    optimizePackageImports: ['lucide-react'],
    // 더 빠른 개발 서버
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['node_modules/**', '.next/**', '.git/**']
      }
      
      // 개발 중 더 안정적인 핫 리로딩
      config.cache = false
    }
    return config
  }
}

export default nextConfig