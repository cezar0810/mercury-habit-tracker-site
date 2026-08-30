"use client";

import { useEffect, useRef } from "react";

const ADSTERRA_KEY = "9f638f6846aefc97bc991b4d39110738";

export function AdsterraBanner() {
  const adSlot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = adSlot.current;
    if (!container) return;

    container.replaceChildren();

    const optionsScript = document.createElement("script");
    optionsScript.type = "text/javascript";
    optionsScript.text = `atOptions = {
      'key': '${ADSTERRA_KEY}',
      'format': 'iframe',
      'height': 250,
      'width': 300,
      'params': {}
    };`;

    const adScript = document.createElement("script");
    adScript.type = "text/javascript";
    adScript.src = `https://www.highperformanceformat.com/${ADSTERRA_KEY}/invoke.js`;
    adScript.async = false;

    container.append(optionsScript, adScript);

    return () => {
      container.replaceChildren();
    };
  }, []);

  return (
    <aside
      aria-label="Publicidade"
      className="mx-auto w-full max-w-[332px] rounded-[22px] border border-white/[0.09] bg-[#0b0c0d] p-4"
    >
      <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
        Publicidade
      </p>
      <div
        ref={adSlot}
        className="mx-auto h-[250px] w-[300px] max-w-full overflow-hidden"
      />
    </aside>
  );
}
