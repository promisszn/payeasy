const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-slider",
      "react-select",
      "@supabase/supabase-js",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Minimize output by excluding source maps in production
  productionBrowserSourceMaps: false,

  webpack(config, { isServer }) {
    config.resolve.alias = config.resolve.alias || {};

    // Tree-shake mapbox-gl CSS import on the server
    if (isServer) {
      config.resolve.alias["mapbox-gl/dist/mapbox-gl.css"] = false;
    }

    // Create an alias for bidi-js to provide a default export wrapper
    config.resolve.alias['bidi-js'] = require.resolve('./node_modules/bidi-js/dist/bidi.js');

    // Also add to the externals to ensure proper resolution
    if (!config.externals) config.externals = [];
    config.externals.push({
      'bidi-js': 'bidi-js',
    });

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
