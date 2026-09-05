"use client";

import { useEffect, useRef, useState } from "react";
import {
  bannerUnits,
  contentAdPlacement,
  sidebarAdFits,
  type BannerPlacement,
} from "./adsterra-config";

function useSlotSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, viewportWidth: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const width = element.getBoundingClientRect().width;
      const viewportWidth = window.innerWidth;
      setSize((previous) =>
        previous.width === width && previous.viewportWidth === viewportWidth
          ? previous
          : { width, viewportWidth },
      );
    };
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(measure);
    observer?.observe(element);
    const initialMeasure = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(initialMeasure);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  return { ref, ...size };
}

export function AdsterraBannerFrame({ placement }: { placement: BannerPlacement }) {
  const unit = bannerUnits[placement];
  return (
    <iframe
      title={`Publicidade ${unit.width} por ${unit.height}`}
      data-ad-placement={placement}
      width={unit.width}
      height={unit.height}
      src={`/api/banner/${placement}`}
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
      style={{ display: "block", width: unit.width, height: unit.height, border: 0, margin: "0 auto" }}
    />
  );
}

function AdLabel() {
  return <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Publicidade</p>;
}

export function AdsterraSidebarAd() {
  const { ref, width, viewportWidth } = useSlotSize();
  return (
    <aside aria-label="Publicidade lateral" className="mx-auto w-full max-w-[332px] rounded-[22px] border border-white/[0.09] bg-[#0b0c0d] p-[15px]">
      <AdLabel />
      <div ref={ref} className="min-w-0">
        {sidebarAdFits(width, viewportWidth) && <AdsterraBannerFrame placement="sidebar" />}
      </div>
    </aside>
  );
}

export function AdsterraContentAd() {
  const { ref, width } = useSlotSize();
  const placement = contentAdPlacement(width);
  return (
    <aside aria-label="Publicidade abaixo do conteúdo" className="relative left-1/2 w-screen min-w-0 -translate-x-1/2 sm:left-auto sm:w-full sm:translate-x-0">
      <AdLabel />
      <div ref={ref} className="min-w-0">
        {placement && <AdsterraBannerFrame key={placement} placement={placement} />}
      </div>
    </aside>
  );
}

export function AdsterraAppAd() {
  const { ref, width } = useSlotSize();
  return (
    <section aria-label="Publicidade" className="w-full">
      <p className="h-5 text-center text-[9px] leading-5 tracking-wider text-white/40">PUBLICIDADE</p>
      <div ref={ref} className="min-h-[50px] w-full">
        {width >= 320 && <AdsterraBannerFrame placement="app" />}
        {width > 0 && width < 320 && (
          <p role="status" className="text-center text-xs text-white/40">Reserve pelo menos 320 px de largura para o anúncio.</p>
        )}
      </div>
    </section>
  );
}
