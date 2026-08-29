"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  ArrowDown,
  Check,
  CheckCircle2,
  Download,
  FileDown,
  MoreVertical,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const screenshots = [
  { label: "Visão geral", detail: "Seu progresso em um só lugar" },
  { label: "Hábitos", detail: "Acompanhe cada dia do mês" },
  { label: "Foco", detail: "Pomodoro integrado à rotina" },
  { label: "Perfil", detail: "Nível, sequência e evolução" },
];

const steps = [
  {
    number: "01",
    icon: FileDown,
    title: "Baixe o arquivo",
    text: "Toque em “Baixar APK”. Se o TikTok ou Instagram não iniciar o download, abra o menu ⋮ e escolha “Abrir no navegador”.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Autorize esta fonte",
    text: "O Android pode bloquear a primeira instalação. Toque em “Configurações” e permita temporariamente apps desta fonte para o seu navegador.",
  },
  {
    number: "03",
    icon: Smartphone,
    title: "Instale o Mercury",
    text: "Volte ao download, abra o arquivo e toque em “Instalar”. Ao concluir, você já pode abrir o aplicativo.",
  },
  {
    number: "04",
    icon: CheckCircle2,
    title: "Pronto e seguro",
    text: "Depois da instalação, você pode desativar novamente a permissão de instalar apps desconhecidos nas configurações do Android.",
  },
];

export default function Home() {
  const scrollToGuide = () => {
    document
      .getElementById("como-instalar")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#080b0a] text-white">
      <header className="border-b border-white/8 bg-[#080b0a]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border border-[#98f7bd]/20 bg-[#163b27] text-[#82f3ad]">
              <Check className="size-5 stroke-[3]" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Mercury</p>
              <p className="text-[11px] text-white/45">Site oficial</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-white/60">
            <ShieldCheck className="size-3.5 text-[#75eaa1]" />
            Download verificado
          </div>
        </div>
      </header>

      <section className="relative border-b border-white/8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(59,205,113,0.13),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(29,96,57,0.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.72fr] lg:items-center lg:py-24">
          <div>
            <div className="flex items-start gap-5 sm:gap-7">
              <div className="size-24 shrink-0 overflow-hidden rounded-[26px] border border-[#a3f7c2]/20 bg-black shadow-[0_22px_70px_rgba(46,203,104,0.16)] sm:size-32 sm:rounded-[32px]">
                <img
                  src="/mercury-app-icon.png"
                  alt="Ícone do Mercury Habit Tracker"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 pt-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#75eaa1]">
                  Hábitos & foco
                </p>
                <h1 className="text-3xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-5xl">
                  Mercury Habit Tracker
                </h1>
                <p className="mt-3 text-sm text-white/52 sm:text-base">
                  por Mercury • Android
                </p>
              </div>
            </div>

            <p className="mt-8 max-w-xl text-base leading-7 text-white/66 sm:text-lg sm:leading-8">
              Organize hábitos, acompanhe sua evolução e mantenha o foco em uma
              experiência escura, simples e feita para sua rotina.
            </p>

            <div className="mt-8 grid grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/8 bg-white/[0.035] px-2 py-4 sm:max-w-lg">
              <div className="px-3 text-center">
                <p className="text-sm font-semibold">1.0.0</p>
                <p className="mt-1 text-[11px] text-white/42">Versão</p>
              </div>
              <div className="px-3 text-center">
                <p className="text-sm font-semibold">Android 6+</p>
                <p className="mt-1 text-[11px] text-white/42">Compatível</p>
              </div>
              <div className="px-3 text-center">
                <p className="text-sm font-semibold">APK</p>
                <p className="mt-1 text-[11px] text-white/42">Formato</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-[#111512]/92 p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-semibold">Download oficial</p>
                <p className="mt-1 text-xs text-white/45">Pacote para Android</p>
              </div>
              <ShieldCheck className="size-6 text-[#75eaa1]" />
            </div>

            <a
              href="/mercury-habit-tracker.apk"
              download
              className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#65df92] px-5 py-4 text-base font-bold text-[#07150c] shadow-[0_16px_45px_rgba(64,220,119,0.22)] transition hover:bg-[#7bea9f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#65df92]/30 active:scale-[0.99]"
            >
              <Download className="size-5 stroke-[2.5]" />
              Baixar APK
            </a>

            <button
              type="button"
              onClick={scrollToGuide}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-white/62 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65df92]/50"
            >
              Não sei como instalar
              <ArrowDown className="size-4" />
            </button>

            <div className="mt-5 border-t border-white/8 pt-5">
              <div className="flex gap-3 text-xs leading-5 text-white/46">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#75eaa1]" />
                <p>
                  Arquivo distribuído diretamente pelo desenvolvedor. O Android
                  solicitará sua confirmação antes de instalar.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#0c100d]">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#75eaa1]">
              Primeira atualização
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
              Versão 1.0.0
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/48">
              Lançamento inicial do Mercury para Android.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Gráfico semanal de hábitos concluídos",
              "Personagens dark fantasy masculinos e femininos",
              "Anúncios em momentos naturais da experiência",
              "Aviso obrigatório para futuras atualizações",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-sm leading-6 text-white/62"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#75eaa1]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#75eaa1]">
              Conheça o aplicativo
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Simples de entender. Bom de usar.
            </h2>
          </div>
          <p className="hidden text-sm text-white/40 sm:block">Arraste para ver</p>
        </div>

        <Carousel opts={{ align: "start", dragFree: true }} className="px-0 sm:px-10">
          <CarouselContent className="-ml-3">
            {screenshots.map((screen, index) => (
              <CarouselItem
                key={screen.label}
                className="basis-[78%] pl-3 sm:basis-[42%] lg:basis-[27%]"
              >
                <div className="aspect-[9/18.5] overflow-hidden rounded-[26px] border border-white/10 bg-[#101512] p-3 shadow-xl shadow-black/20">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-[20px] border border-white/8 bg-[linear-gradient(155deg,#151b17,#090c0a)]">
                    <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-white/12" />
                    <div className="flex flex-1 flex-col justify-end p-5">
                      <span className="mb-auto grid size-10 place-items-center rounded-xl border border-[#65df92]/15 bg-[#65df92]/8 text-sm font-semibold text-[#75eaa1]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-lg font-semibold">{screen.label}</p>
                      <p className="mt-1 text-sm leading-5 text-white/45">
                        {screen.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-1 hidden border-white/10 bg-[#121713] text-white hover:bg-[#1a211c] sm:flex" />
          <CarouselNext className="-right-1 hidden border-white/10 bg-[#121713] text-white hover:bg-[#1a211c] sm:flex" />
        </Carousel>
      </section>

      <section id="como-instalar" className="scroll-mt-6 border-y border-white/8 bg-[#0c100d]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#75eaa1]">
              Instalação segura
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Como instalar fora da Play Store
            </h2>
            <p className="mt-4 text-base leading-7 text-white/55">
              O processo leva poucos minutos. Os nomes dos botões podem mudar
              um pouco conforme a marca do seu celular.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article
                  key={step.number}
                  className="group rounded-[24px] border border-white/8 bg-white/[0.025] p-6 transition hover:border-[#65df92]/20 hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between">
                    <div className="grid size-11 place-items-center rounded-2xl bg-[#163b27] text-[#7cf0a8]">
                      <Icon className="size-5" />
                    </div>
                    <span className="text-xs font-semibold tracking-[0.15em] text-white/22">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{step.text}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3 rounded-2xl border border-[#65df92]/12 bg-[#65df92]/[0.045] p-5 text-sm leading-6 text-white/60">
            <MoreVertical className="mt-0.5 size-5 shrink-0 text-[#75eaa1]" />
            <p>
              <strong className="font-semibold text-white">No TikTok ou Instagram:</strong>{" "}
              se nada acontecer ao tocar em baixar, abra o menu do navegador interno
              e selecione <span className="text-white">“Abrir no navegador”</span>.
            </p>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-9 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© 2026 Mercury. Download oficial para Android.</p>
        <p>Versão 1.0.0</p>
      </footer>
    </main>
  );
}
