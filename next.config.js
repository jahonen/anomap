/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {},
  webpack: (config) => {
    // This is needed for leaflet.offline to work properly
    config.resolve.fallback = { fs: false, path: false };
    
    // Exclude leaflet.css from PostCSS processing
    config.module.rules.forEach((rule) => {
      if (rule.oneOf) {
        rule.oneOf.forEach((oneOfRule) => {
          if (
            oneOfRule.test &&
            oneOfRule.test.toString().includes('css') &&
            oneOfRule.use &&
            Array.isArray(oneOfRule.use)
          ) {
            const cssLoader = oneOfRule.use.find(
              (loader) => loader.loader && loader.loader.includes('css-loader')
            );
            if (cssLoader) {
              if (!cssLoader.options) {
                cssLoader.options = {};
              }
              if (!cssLoader.options.modules) {
                cssLoader.options.modules = {};
              }
              // Add leaflet.css to the exclude list
              if (!cssLoader.options.modules.auto) {
                cssLoader.options.modules.auto = (resourcePath) => {
                  return !resourcePath.includes('leaflet.css');
                };
              }
            }
          }
        });
      }
    });
    
    return config;
  },
}

module.exports = nextConfig
