import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Трекер посещаемости",
  description: "Минималистичный трекер посещаемости",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased min-h-screen bg-white text-black selection:bg-black selection:text-white">
        {children}
      </body>
    </html>
  );
}
