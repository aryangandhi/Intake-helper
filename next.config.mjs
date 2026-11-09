/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  // Let teammates open the dev server through a Cloudflare quick tunnel.
  allowedDevOrigins: ["*.trycloudflare.com"],
};
export default nextConfig;
