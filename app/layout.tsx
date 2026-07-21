import type { Metadata } from "next";
import { inter } from "./fonts";
import GlowBackground from "@/components/ui/GlowBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Fiscal",
  description: "Plataforma multi-contador para envio de documentos fiscais (IRPF).",
};

const THEME_INIT_SCRIPT = `
(function() {
  var t = localStorage.getItem('pf_theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/no-danger -- roda antes da hidratação para evitar flash de tema, mesma técnica do site atual */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <GlowBackground />
        {children}
      </body>
    </html>
  );
}
