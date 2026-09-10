import type { Metadata } from "next";
import { ArrowLeft, Download } from "lucide-react";
import { DownloadArea } from "@/components/mercury/download-area";

export const metadata: Metadata = {
  title: "Download oficial | Mercury Habit Tracker",
  description: "Conheça as telas reais e baixe o Mercury Habit Tracker para Android.",
};

export default function DownloadPage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_-30%,rgba(48,126,255,0.18),transparent_62%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-7">
        <header className="flex items-center justify-between rounded-[22px] border border-white/[0.11] bg-[#090a0b]/95 px-3 py-3 backdrop-blur-xl sm:px-4">
          <a href="/" className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white">
            <ArrowLeft className="size-4" /> Voltar ao app
          </a>
          <div className="flex items-center gap-2 pr-2 text-sm font-bold">
            <Download className="size-4 text-[#347cf6]" /> Download
          </div>
        </header>
        <section className="mt-5 overflow-hidden rounded-[30px] border border-white/[0.11] bg-[#050607]/95">
          <DownloadArea />
        </section>
        <footer className="py-7 text-center text-xs text-white/35">
          Mercury Habit Tracker · download oficial
        </footer>
      </div>
    </main>
  );
}
