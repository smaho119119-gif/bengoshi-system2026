// サーバー/ビルド時のタイムゾーンを日本時間に固定
process.env.TZ = "Asia/Tokyo";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
};

export default nextConfig;
