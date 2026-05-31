/** @type {import('next').NextConfig} */
const nextConfig = {
  // pg no debe empaquetarse por Next; se resuelve desde node_modules en runtime.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
