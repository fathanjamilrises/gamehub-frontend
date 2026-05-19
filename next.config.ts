process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.11', 
    '192.168.1.14', 
    '192.168.1.0/24', 
    'localhost',
    '101.128.102.231',
    '*.serveousercontent.com',
    '*.serveo.net'
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async rewrites() {
    const baseApiUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

    return [
      {
        source: "/api/auth/:path*",
        destination: `${baseApiUrl}/api/auth/:path*`,
      },
      {
        source: "/api-proxy/admin/:path*",
        destination: `${baseApiUrl}/api/admin/:path*`,
      },
      {
        source: "/api-proxy/games/:path*",
        destination: `${baseApiUrl}/api/games/:path*`,
      },
      {
        source: "/api-proxy/:path*",
        destination: `${baseApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
