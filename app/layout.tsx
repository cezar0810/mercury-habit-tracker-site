import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mercury Habit Tracker",
  description:
    "A versão web do Mercury Habit Tracker. Organize hábitos, acompanhe sua evolução e mantenha o foco.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Mercury", statusBarStyle: "black-translucent" },
  icons: {
    icon: "/mercury-app-icon.png",
    apple: "/mercury-app-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
