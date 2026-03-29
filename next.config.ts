import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // Optimize development experience
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Optimize module resolution
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  
  // Skip type checking during build (run separately)
  typescript: {
    // Only enable if you have type errors slowing build
    // ignoreBuildErrors: true,
  },
  
  // Optimize production builds
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['@radix-ui/react-icons', 'date-fns', 'recharts'],
  },
};

export default nextConfig;
