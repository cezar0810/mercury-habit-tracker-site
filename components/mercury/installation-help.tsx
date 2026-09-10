"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Share2 } from "lucide-react";

export function installationContext(userAgent: string, platform = "", touchPoints = 0) {
  return {
    ios: /iPhone|iPad|iPod/i.test(userAgent) || (platform === "MacIntel" && touchPoints > 1),
    inApp: /Instagram|FBAN|FBAV|FB_IAB|TikTok|Bytedance|musical_ly|Twitter|Snapchat|\bLine\//i.test(userAgent),
  };
}

export function useInstallationContext() {
  const [context, setContext] = useState({ ios: false, inApp: false });
  useEffect(() => {
    setContext(installationContext(navigator.userAgent, navigator.platform, navigator.maxTouchPoints));
  }, []);
  return context;
}

export function InstallationHelp() {
  const { ios, inApp } = useInstallationContext();
  const [copied, setCopied] = useState(false);
  const [copyFallback, setCopyFallback] = useState("");
  const copy = async () => {
    const url = new URL("/download", window.location.href).href;
    try { await navigator.clipboard.writeText(url); setCopied(true); }
    catch { setCopyFallback(url); }
  };
  return (
    <div className="mt-5 space-y-4 text-sm leading-6">
      <details open={inApp} className="rounded-2xl border border-white/15 p-4">
        <summary className="min-h-8 cursor-pointer font-semibold text-white">Abriu pelo Instagram, TikTok ou outra rede social?</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-white/75">
          <li>Abra o menu da rede social, geralmente nos três pontinhos (⋯ ou ⋮).</li>
          <li>Escolha <strong className="text-white">Abrir no navegador</strong>, <strong className="text-white">Abrir no Chrome</strong> ou <strong className="text-white">Abrir no Safari</strong>. O nome e a posição variam conforme o app.</li>
          <li>No navegador, volte à área de instalação. No Android, toque em baixar o APK; no iPhone, siga as instruções abaixo.</li>
        </ol>
        <p className="mt-3 text-white/65">Se essa opção não aparecer, copie o endereço e cole diretamente no Safari ou Chrome.</p>
        <button type="button" onClick={copy} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-3 font-semibold text-[#a8c8ff]">
          <Copy className="size-4" />{copied ? "Link copiado" : "Copiar endereço do site"}
        </button>
        {copyFallback && <label className="mt-3 block text-white/75">Selecione e copie o endereço<input readOnly value={copyFallback} onFocus={event => event.target.select()} className="mt-1 w-full rounded-lg border border-white/20 bg-black p-2 text-base text-white" /></label>}
        <span className="sr-only" role="status">{copied ? "Endereço copiado para abrir no navegador." : ""}</span>
      </details>

      <details id="instalar-no-iphone" open={ios} className="scroll-mt-5 rounded-2xl border border-white/15 p-4">
        <summary className="min-h-8 cursor-pointer font-semibold text-white">iPhone: adicionar à Tela de Início</summary>
        <p className="mt-3 text-white/75">No iPhone, use a versão web do Mercury. O arquivo APK é para Android.</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-white/75">
          <li>Abra este site no <strong className="text-white">Safari</strong>.</li>
          <li>Toque em <strong className="text-white">Compartilhar</strong> <Share2 aria-hidden="true" className="inline size-4" />. Em alguns layouts, ele fica dentro do botão Mais (⋯).</li>
          <li>Procure <strong className="text-white">Adicionar à Tela de Início</strong>. Se não aparecer, abra Editar Ações no fim da lista e inclua essa opção.</li>
          <li>Ative <strong className="text-white">Abrir como App da Web</strong>, se disponível, e toque em <strong className="text-white">Adicionar</strong>.</li>
        </ol>
        <p className="mt-3 text-white/65">Depois, abra o Mercury pelo ícone criado. Os registros ficam no navegador ou app da web utilizado; não há sincronização automática entre eles.</p>
        <a href="https://support.apple.com/pt-br/guide/iphone/iphea86e5236/ios" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-[#a8c8ff] underline underline-offset-4">Instruções oficiais da Apple <ExternalLink className="size-4" /></a>
      </details>
    </div>
  );
}
