/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 es un módulo nativo; debe ser tratado como externo.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
