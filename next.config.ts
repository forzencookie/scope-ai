import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  
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
