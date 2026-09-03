"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appRelease } from "@/lib/app-release";
import { formatApkSize, loadApkRelease, type ApkReleaseInfo } from "@/lib/apk-release";

let cached: { value: ApkReleaseInfo; expiresAt: number } | undefined;
let pending: Promise<ApkReleaseInfo> | undefined;

function currentApk(): Promise<ApkReleaseInfo> {
  if (cached && Date.now() < cached.expiresAt) return Promise.resolve(cached.value);
  if (!pending) {
    pending = loadApkRelease(appRelease.download_url).then((value) => {
      // Cache só em memória. Também evita consultas duplicadas entre componentes.
      cached = { value, expiresAt: Date.now() + (value.status === "available" ? 300_000 : 30_000) };
      pending = undefined;
      return value;
    });
  }
  return pending;
}

export function ApkDownload({ label, className }: { label: string; className?: string }) {
  const [info, setInfo] = useState<ApkReleaseInfo | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void currentApk().then((value) => { if (active) setInfo(value); });
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const missing = info?.status === "unpublished";
  const sizeLabel = info?.status === "available"
    ? `Tamanho do APK: ${formatApkSize(info.sizeBytes)}`
    : missing ? "O APK ainda não foi publicado."
    : info ? "Tamanho indisponível no momento."
    : "Consultando tamanho do APK…";

  return (
    <div className={className}>
      {missing ? (
        <Button disabled className="h-auto min-h-14 w-full whitespace-normal rounded-2xl px-5 py-4 text-base font-bold">
          APK ainda não disponível
        </Button>
      ) : (
        <Button asChild className="h-auto min-h-14 w-full whitespace-normal rounded-2xl bg-[#347cf6] px-5 py-4 text-base font-bold text-white hover:bg-[#2466d7] focus-visible:ring-[#74a7ff]">
          <a href={appRelease.download_url}>
            <Download aria-hidden="true" className="size-5" /> {label}
          </a>
        </Button>
      )}
      <p role="status" aria-live="polite" className="mt-3 text-center text-sm text-white/60">{sizeLabel}</p>
    </div>
  );
}
