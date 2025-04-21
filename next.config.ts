import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 빌드 시 ESLint 경고를 무시하도록 설정
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 타입 체크 오류를 무시하도록 설정
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
