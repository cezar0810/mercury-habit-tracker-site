import type { Metadata } from "next";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { ApkDownload } from "@/components/mercury/apk-download";
import { appRelease } from "@/lib/app-release";

export const metadata: Metadata = {
  title: "Atualizar aplicativo | Mercury Habit Tracker",
  description: "Confira a versão disponível do Mercury e baixe a atualização para Android.",
};

export default function UpdatePage() {
  return (
    <main className="min-h-dvh bg-[#050607] px-5 py-6 text-white sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <a href="/" className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#74a7ff]">
            <img src="/mercury-app-icon.png" alt="" width={44} height={44} className="rounded-xl" />
            <span className="font-semibold tracking-tight">Mercury Habit Tracker</span>
          </a>
          <a href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-white/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#74a7ff]">
            <ArrowLeft aria-hidden="true" className="size-4" /> Ir para o site
          </a>
        </header>

        <section aria-labelledby="update-title" className="py-10 sm:py-14">
          <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-[#347cf6]/30 bg-[#347cf6]/10 text-[#74a7ff]">
            <RefreshCw aria-hidden="true" className="size-8" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#74a7ff]">Atualização do aplicativo</p>
          <h1 id="update-title" className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Atualize seu Mercury.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
            Já tem o app instalado? Baixe o instalador da versão disponível e abra no seu Android para atualizar.
          </p>

          <div className="mt-8 rounded-3xl border border-white/10 bg-[#101112] p-6 sm:p-8">
            <p className="text-sm text-white/60">Versão disponível</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">{appRelease.version_name}</p>
            <p className="mt-1 text-sm text-white/55">Android · Versão interna {appRelease.version_code}</p>
            <p className="mt-5 border-t border-white/10 pt-5 text-base leading-7 text-white/75">{appRelease.message}</p>
            <ApkDownload label="Baixar atualização" className="mt-6" />
            <p className="mt-4 text-sm leading-6 text-white/60">
              É o mesmo APK do download principal do site. O arquivo é hospedado no GitHub Releases.
            </p>
          </div>
        </section>

        <section aria-labelledby="install-title" className="pb-10">
          <h2 id="install-title" className="text-xl font-semibold tracking-tight">Como atualizar</h2>
          <ol className="mt-5 list-decimal space-y-4 pl-5 text-base leading-7 text-white/75 marker:font-bold marker:text-[#74a7ff]">
            <li>Toque em <strong className="text-white">Baixar atualização</strong> no celular Android.</li>
            <li>Abra o APK baixado. Se o Android solicitar, permita a instalação por esse navegador.</li>
            <li>Confirme a instalação e abra o Mercury novamente.</li>
          </ol>
          <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.025] p-5 text-sm leading-6 text-white/70">
            <p className="mb-3"><strong className="text-white">Não desinstale seu app atual antes de tentar a atualização.</strong> Primeiro, abra o novo APK sobre a instalação existente para preservar seus dados.</p>
            <p><strong className="text-white">Atenção para instalações antigas:</strong> a versão 2.0.0 usa uma nova assinatura. Se aparecer conflito de assinatura, será necessário desinstalar a versão antiga antes de instalar. A desinstalação apaga os dados salvos localmente.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
