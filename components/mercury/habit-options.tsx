"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { habitEmojis, habitLinkLabels, type HabitLink } from "./habit-recognition";
import { habitLink, weekdayChoices, weekdaysForHabit } from "./routine";
import { dateKey, type Habit } from "./state";

export type HabitOptionsChange = { emoji?: string; link?: HabitLink; weekdays?: number[] };

export function HabitOptions({ habit, onChange }: { habit: Habit; onChange: (change: HabitOptionsChange) => void }) {
  const [customEmoji, setCustomEmoji] = useState("");
  const [notice, setNotice] = useState("");
  const days = weekdaysForHabit(habit, dateKey(new Date()));
  const setEmoji = (emoji: string) => {
    onChange({ emoji }); setNotice("Emoji atualizado.");
  };
  const saveCustom = () => {
    const value = customEmoji.trim();
    const segments = [...new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(value)];
    if (segments.length !== 1 || !/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(value)) { setNotice("Escolha um único emoji."); return; }
    setEmoji(value);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Escolher emoji, ligação e dias de ${habit.title}`} className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-xl hover:bg-white/10">{habit.emoji}</button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(340px,calc(100vw-24px))] space-y-4 border-white/20 bg-[#111317] p-4 text-white">
        <h3 className="text-base font-semibold">Personalizar hábito</h3>
        <div className="grid grid-cols-6 gap-1" aria-label="Emojis disponíveis">
          {habitEmojis.map(emoji => <button key={emoji} type="button" onClick={() => setEmoji(emoji)} aria-label={`Usar emoji ${emoji}`} aria-pressed={habit.emoji === emoji} className="grid min-h-11 place-items-center rounded-lg text-xl hover:bg-white/10 aria-pressed:bg-[#1b3969]">{emoji}</button>)}
        </div>
        <div className="flex gap-2"><input value={customEmoji} onChange={event => setCustomEmoji(event.target.value)} aria-label="Outro emoji" placeholder="Outro emoji" className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black p-2 text-base" /><button type="button" onClick={saveCustom} className="min-h-11 rounded-lg bg-[#347cf6] px-3 text-sm font-semibold">Usar</button></div>
        <div><p className="mb-2 text-sm text-white/75">Ligação automática</p>
          <Select value={habitLink(habit)} disabled={habit.source === "workout"} onValueChange={value => onChange({ link: value as HabitLink })}>
            <SelectTrigger aria-label="Ligar hábito a uma função" className="min-h-11 w-full border-white/20"><SelectValue /></SelectTrigger>
            <SelectContent className="border-white/20 bg-[#111317] text-white">{Object.entries(habitLinkLabels).map(([value,label]) => <SelectItem key={value} value={value} className="min-h-11 focus:bg-[#1b3969] focus:text-white">{label}</SelectItem>)}</SelectContent>
          </Select>
          <p className="mt-2 text-xs leading-5 text-white/60">{habitLink(habit) === "water" ? "A meta de água marca este hábito automaticamente." : habitLink(habit) === "workout" ? "Concluir um treino marca este hábito. Abra Treinos para registrar a atividade." : "Você marca este hábito manualmente."}</p>
        </div>
        <div><p className="mb-2 text-sm text-white/75">Dias previstos</p><div className="grid grid-cols-4 gap-1">{weekdayChoices.map(({day,label}) => <button key={day} type="button" aria-pressed={days.includes(day)} onClick={() => onChange({ weekdays: days.includes(day) ? days.filter(value => value !== day) : [...days,day] })} className="min-h-11 rounded-lg border border-white/15 text-sm aria-pressed:border-[#6ca0ff] aria-pressed:bg-[#173768]">{label}</button>)}</div><p className="mt-2 text-xs text-white/60">{days.length ? "Alterações valem a partir de hoje." : "Sem dias definidos. Disponível para fazer quando quiser."}</p></div>
        <p role="status" className="text-xs text-[#a8c8ff]">{notice}</p>
      </PopoverContent>
    </Popover>
  );
}
