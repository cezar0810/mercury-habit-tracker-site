import { ChevronRight, ShieldCheck } from "lucide-react";
import { appRelease } from "@/lib/app-release";
import { ApkDownload } from "@/components/mercury/apk-download";

export function DownloadArea() {
  return (
    <section
      id="download"
      className="border-t border-white/[0.08] bg-[#090a0b] px-5 py-14 text-white sm:py-20"
    >
      <div className="mx-auto max-w-lg">
        <div className="flex items-start gap-4">
          <img
            src="/mercury-app-icon.png"
            alt=""
            className="size-[68px] rounded-[19px] ring-1 ring-white/10"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4b8cff]">
              Mercury no seu celular
            </p>
            <h2 className="mt-1 text-[27px] font-bold tracking-[-0.035em]">
              Leve seus hábitos com você
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-white/55">
              Instale o APK no Android ou adicione a versão web à Tela de Início do iPhone.
            </p>
          </div>
        </div>

        <div className="mt-7 rounded-[25px] border border-white/[0.1] bg-[#101112] p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-[#4b8cff]" />
            <div>
              <p className="font-semibold">Download oficial</p>
              <p className="text-xs text-white/45">
                Versão {appRelease.version_name} · APK para Android
              </p>
            </div>
          </div>
          <ApkDownload label="Baixar APK para Android" className="mt-5" />
          <p className="mt-3 text-center text-xs leading-5 text-white/42">
            O download começa diretamente pela Release mais recente.
          </p>
          <a href="/atualizacao" className="mt-4 flex min-h-11 items-center justify-center rounded-lg text-sm text-[#74a7ff] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#74a7ff]">
            Já tenho o app — como atualizar
          </a>
        </div>

        <details className="group mt-5 rounded-[22px] border border-white/[0.09] bg-white/[0.025] p-5">
          <summary className="cursor-pointer list-none font-semibold marker:hidden">
            Como instalar o APK no Android
            <ChevronRight className="float-right size-5 transition group-open:rotate-90" />
          </summary>
          <ol className="mt-4 space-y-3 border-t border-white/[0.08] pt-4 text-sm leading-6 text-white/58">
            <li>
              <strong className="mr-2 text-[#4b8cff]">1.</strong>Baixe o APK
              pelo navegador do celular.
            </li>
            <li>
              <strong className="mr-2 text-[#4b8cff]">2.</strong>Quando o
              Android pedir, permita temporariamente instalar apps desse
              navegador.
            </li>
            <li>
              <strong className="mr-2 text-[#4b8cff]">3.</strong>Abra o
              arquivo baixado e toque em “Instalar”.
            </li>
          </ol>
        </details>
      </div>
    </section>
  );
}
