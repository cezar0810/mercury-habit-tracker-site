import { CheckCircle2, ChevronRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { appRelease } from "@/lib/app-release";
import { ApkDownload } from "@/components/mercury/apk-download";

const screenshots = [
  { src: "/screenshots/inicio.jpg", alt: "Tela inicial do Mercury com missão diária, progresso e clima", label: "Início" },
  { src: "/screenshots/habitos.jpg", alt: "Planilha mensal de hábitos do Mercury", label: "Hábitos" },
  { src: "/screenshots/relatorio.jpg", alt: "Relatório do Mercury com gráfico teia e indicadores", label: "Relatório" },
  { src: "/screenshots/planejar.jpg", alt: "Planejador diário do Mercury", label: "Planejar" },
  { src: "/screenshots/foco.jpg", alt: "Temporizador de foco do Mercury", label: "Foco" },
];

export function DownloadArea() {
  return (
    <div className="px-5 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="grid items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="flex items-center gap-4">
              <img
                src="/mercury-app-icon.png"
                alt="Ícone do Mercury Habit Tracker"
                className="size-[72px] rounded-[21px] ring-1 ring-white/15"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5595ff]">
                  Aplicativo oficial
                </p>
                <p className="mt-1 text-sm text-white/50">
                  Versão {appRelease.version_name} · Android
                </p>
              </div>
            </div>

            <h1 className="mt-7 max-w-xl text-[40px] font-bold leading-[1.04] tracking-[-0.05em] sm:text-5xl">
              Sua evolução, todos os dias.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/62">
              Hábitos, planejamento, foco, água, treinos e progresso reunidos
              em uma experiência simples e construída para o celular.
            </p>

            <div className="mt-7 rounded-[28px] border border-[#347cf6]/35 bg-[linear-gradient(145deg,rgba(21,54,105,0.72),rgba(7,13,25,0.94))] p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-6 shrink-0 text-[#5595ff]" />
                <div>
                  <p className="font-bold">Download direto e oficial</p>
                  <p className="mt-1 text-sm leading-6 text-white/55">
                    O APK é disponibilizado pelo repositório oficial do Mercury no GitHub Releases.
                  </p>
                </div>
              </div>
              <ApkDownload label="Baixar Mercury para Android" className="mt-5" />
              <div className="mt-4 grid gap-2 text-xs text-white/55 sm:grid-cols-2">
                <p className="flex items-center gap-2"><LockKeyhole className="size-4 text-[#5595ff]" /> Seus dados ficam no dispositivo</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#5595ff]" /> Versão {appRelease.version_name} oficial</p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[330px] overflow-hidden rounded-[38px] border border-white/[0.14] bg-[#070809] p-2 shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
            <img
              src="/screenshots/inicio.jpg"
              alt="Mercury Habit Tracker aberto em um celular Android"
              width={720}
              height={1525}
              className="h-auto w-full rounded-[31px]"
            />
          </div>
        </section>

        <section className="mt-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5595ff]">Por dentro do app</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Veja as telas reais do Mercury</h2>
          <div className="scrollbar-none -mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0">
            {screenshots.map((shot) => (
              <figure key={shot.src} className="w-[76vw] max-w-[280px] shrink-0 snap-center">
                <div className="overflow-hidden rounded-[30px] border border-white/[0.13] bg-[#08090a] p-1.5">
                  <img src={shot.src} alt={shot.alt} width={720} height={1525} loading="lazy" className="h-auto w-full rounded-[25px]" />
                </div>
                <figcaption className="mt-3 text-center text-sm font-semibold text-white/65">{shot.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <details className="group mt-12 rounded-[25px] border border-white/[0.1] bg-[#0c0d0e] p-5">
          <summary className="cursor-pointer list-none font-semibold marker:hidden">
            Como instalar o APK no Android
            <ChevronRight className="float-right size-5 transition group-open:rotate-90" />
          </summary>
          <ol className="mt-4 space-y-3 border-t border-white/[0.08] pt-4 text-sm leading-6 text-white/58">
            <li><strong className="mr-2 text-[#5595ff]">1.</strong>Baixe o APK pelo navegador do celular.</li>
            <li><strong className="mr-2 text-[#5595ff]">2.</strong>Permita a instalação por esse navegador quando o Android solicitar.</li>
            <li><strong className="mr-2 text-[#5595ff]">3.</strong>Abra o arquivo baixado e toque em “Instalar”.</li>
          </ol>
        </details>

        <a href="/atualizacao" className="mt-5 flex min-h-12 items-center justify-center rounded-2xl border border-white/[0.1] text-sm font-semibold text-[#8cb8ff] transition hover:bg-white/[0.04]">
          Já tenho o app — ver instruções de atualização
        </a>
      </div>
    </div>
  );
}
