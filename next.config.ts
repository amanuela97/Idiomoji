import type { NextConfig } from "next";
import webpack from "webpack";
import type { Configuration } from "webpack";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          net: false,
          tls: false,
          fs: false,
          http: false,
          https: false,
          crypto: false,
          process: require.resolve("process/browser"),
          path: false,
          stream: false,
          zlib: false,
          buffer: require.resolve("buffer/"),
        },
        alias: {
          ...config.resolve?.alias,
          process: "process/browser",
          "node:process": "process/browser",
          "node:buffer": "buffer",
          "node:stream": false,
          "node:util": false,
          "node:url": false,
          "node:https": false,
          "node:http": false,
          "node:path": false,
          "node:crypto": false,
          "node:zlib": false,
        },
      };

      config.plugins = [
        ...(config.plugins || []),
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
