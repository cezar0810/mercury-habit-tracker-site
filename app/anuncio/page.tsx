import type { Metadata } from "next";
import { AdsterraAppAd } from "@/components/mercury/adsterra-banner";

export const metadata: Metadata = {
  title: "Publicidade | Mercury Habit Tracker",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaginaAnuncio() {
  return (
    <main className="min-h-[70px] w-full bg-black text-white">
      <AdsterraAppAd />
    </main>
  );
}
