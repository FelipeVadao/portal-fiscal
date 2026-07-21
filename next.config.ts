import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // dashboard.html, index.html e registro.html foram retirados — manda
      // quem tinha o link antigo salvo para as rotas novas.
      { source: "/dashboard.html", destination: "/dashboard", permanent: false },
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/registro.html", destination: "/registro", permanent: false },
    ];
  },
};

export default nextConfig;
