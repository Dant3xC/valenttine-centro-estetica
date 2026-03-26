/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // No detener build por errores de lint en archivos específicos
    ignoreDuringBuilds: false,
  },
  // Excluir carpeta test del build
  transpilePackages: [],
};

module.exports = nextConfig;