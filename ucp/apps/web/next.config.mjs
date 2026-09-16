/** @type {import('next').NextConfig} */
const nextConfig = {
  // The workspace packages ship TypeScript source rather than a build step,
  // so Next compiles them alongside the app.
  transpilePackages: ["@ucp/core", "@ucp/data", "@ucp/design"],

  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    // Keeps the shared packages out of the client bundle unless a client
    // component actually imports from them.
    optimizePackageImports: ["@ucp/core", "@ucp/design"],
  },

  images: {
    formats: ["image/avif", "image/webp"],
    // Product media is served as generated SVG from an internal route in
    // this build. Point these at the real CDN when licensed imagery lands.
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      // Arabic is UCP's primary language, so the bare root goes there.
      { source: "/", destination: "/ar", permanent: false },
    ];
  },
};

/**
 * Security headers.
 *
 * The CSP is deliberately strict: no third-party script origins are
 * allowed by default, so adding an analytics vendor is a conscious edit
 * here rather than something that quietly starts working.
 */
const csp = [
  "default-src 'self'",
  // Next's inline bootstrap and RSC payloads need 'unsafe-inline' for
  // styles; scripts use nonce-free 'self' plus the strict-dynamic-free
  // inline Next requires in dev only.
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

export default nextConfig;
