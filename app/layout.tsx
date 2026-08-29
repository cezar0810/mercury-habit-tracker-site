import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baixar Mercury Habit Tracker",
  description:
    "Download oficial do Mercury Habit Tracker para Android. Organize hábitos, acompanhe sua evolução e mantenha o foco.",
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
