import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EXIT · Central de Eventos",
  description: "Adicione e gerencie eventos do site EXIT Eventos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="preload" as="font" href="/fonts/NeueEinstellung-Regular.woff2" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" as="font" href="/fonts/RedHatDisplay-Bold.woff2" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
