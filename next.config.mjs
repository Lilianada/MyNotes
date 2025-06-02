import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configure webpack to properly handle Monaco Editor and fix dependencies
  webpack: (config, { isServer }) => {
    import path from 'path';
    
    // Add Monaco Editor webpack loader configurations
    config.resolve.alias = {
      ...config.resolve.alias,
      'monaco-editor': 'monaco-editor/esm/vs/editor/editor.api',
      // Fix for escape-string-regexp import in mdast-util-find-and-replace
      'escape-string-regexp': path.resolve('./lib/patches/escape-string-regexp-fix.js')
    };
    
    return config;
  }
}

export default nextConfig
