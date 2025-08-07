// next.config.js
const nextConfig = {
  reactStrictMode: false, // 임시로 Strict Mode 비활성화
  swcMinify: false, // SWC 최적화 비활성화
  webpack: (config, { dev }) => {
    if (dev) {
      // 핫 리로딩 비활성화
      config.watchOptions = {
        ignored: ['**/*'] // 모든 파일 변경 감지 비활성화
      }
    }
    return config
  }
}