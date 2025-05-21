/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configure webpack to properly handle Monaco Editor
  webpack: (config, { isServer }) => {
    // Add Monaco Editor webpack loader configurations
    config.resolve.alias = {
      ...config.resolve.alias,
      'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api'
    };
    
    return config;
  }
}

export default nextConfig
