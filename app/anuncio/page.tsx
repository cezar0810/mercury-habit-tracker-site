import type { Metadata } from "next";
import { AdsterraBanner } from "@/components/mercury/adsterra-banner";

export const metadata: Metadata = {
  title: "Publicidade | Mercury Habit Tracker",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaginaAnuncio() {
  return (
    <main className="grid min-h-screen place-items-center bg-black p-2 text-white">
      <AdsterraBanner />
    </main>
  );
}
