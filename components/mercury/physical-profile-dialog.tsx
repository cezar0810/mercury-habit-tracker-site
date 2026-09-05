"use client";

import { Activity, Ruler, Scale } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recommendedWaterMl } from "./health-metrics";
import type { MercuryData } from "./state";

export type PhysicalProfileValues = {
  weightKg: number;
  heightCm: number;
};

export function withPhysicalProfile(data: MercuryData, values: PhysicalProfileValues): MercuryData {
  const suggestedGoal = recommendedWaterMl(values.weightKg);
  return {
    ...data,
    weightKg: values.weightKg,
    heightCm: values.heightCm,
    physicalProfilePrompted: true,
    waterGoalMl: data.waterGoalCustomized ? data.waterGoalMl : suggestedGoal,
    waterGoalHistory: data.waterGoalCustomized
      ? data.waterGoalHistory
      : [...data.waterGoalHistory.filter(item => item.from !== data.trackingSince), { from: data.trackingSince, goalMl: suggestedGoal }].sort((a, b) => a.from.localeCompare(b.from)),
  };
}

export function PhysicalProfileDialog({
  open,
  data,
  onSave,
  onSkip,
}: {
  open: boolean;
  data: MercuryData;
  onSave: (values: PhysicalProfileValues) => void;
  onSkip: () => void;
}) {
  const [weight, setWeight] = useState(data.weightKg?.toString() || "");
  const [height, setHeight] = useState(data.heightCm?.toString() || "");

  useEffect(() => {
    if (!open) return;
    setWeight(data.weightKg?.toString() || "");
    setHeight(data.heightCm?.toString() || "");
  }, [open, data.weightKg, data.heightCm]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const weightKg = Number(weight.replace(",", "."));
    const heightCm = Number(height.replace(",", "."));
    if (weightKg < 25 || weightKg > 350 || heightCm < 100 || heightCm > 250) return;
    onSave({ weightKg: Math.round(weightKg * 10) / 10, heightCm: Math.round(heightCm) });
  }

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false} className="border-white/[0.12] bg-[#11141a] p-6 text-white sm:max-w-md" onEscapeKeyDown={event => event.preventDefault()} onPointerDownOutside={event => event.preventDefault()}>
        <DialogHeader className="text-left">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#153164] text-[#8bb7ff]"><Activity className="size-6" /></div>
          <DialogTitle className="mt-3 text-2xl">Precisamos conhecer seu corpo</DialogTitle>
          <DialogDescription className="leading-6 text-white/55">
            Peso e altura deixam as estimativas de água, passos e treinos mais próximas de você. Os dados ficam somente neste navegador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-2 space-y-4">
          <label className="block text-sm font-semibold">Peso
            <span className="relative mt-2 block"><Scale className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" /><input required type="number" min={25} max={350} step="0.1" inputMode="decimal" value={weight} onChange={event => setWeight(event.target.value)} placeholder="Ex.: 70" className="min-h-12 w-full rounded-xl border border-white/[0.13] bg-black/30 pl-10 pr-12 text-base outline-none focus:border-[#4b8cff]" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">kg</span></span>
          </label>
          <label className="block text-sm font-semibold">Altura
            <span className="relative mt-2 block"><Ruler className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" /><input required type="number" min={100} max={250} step="1" inputMode="numeric" value={height} onChange={event => setHeight(event.target.value)} placeholder="Ex.: 175" className="min-h-12 w-full rounded-xl border border-white/[0.13] bg-black/30 pl-10 pr-12 text-base outline-none focus:border-[#4b8cff]" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">cm</span></span>
          </label>
          <p className="text-xs leading-5 text-white/42">São estimativas de bem-estar, não medições clínicas. Você poderá editar os valores e a meta de água.</p>
          <button type="submit" className="min-h-12 w-full rounded-xl bg-[#347cf6] text-sm font-black">Calcular minhas metas</button>
          <button type="button" onClick={onSkip} className="min-h-11 w-full text-sm font-semibold text-white/55">Agora não</button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
