"use client";

import { Bell, Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

type FocusMode = "trabalho" | "descanso";

export function FocusScreen({
  onWorkComplete,
}: {
  onWorkComplete: (minutes: number) => void;
}) {
  const [mode, setMode] = useState<FocusMode>("trabalho");
  const [duration, setDuration] = useState(25);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [notificationState, setNotificationState] = useState<
    "unsupported" | "default" | "granted" | "denied"
  >("unsupported");

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationState(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setSeconds((current) => {
        if (current > 1) return current - 1;

        setRunning(false);
        if (mode === "trabalho") {
          onWorkComplete(duration);
        }
        if (
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification("Mercury Habit Tracker", {
            body:
              mode === "trabalho"
                ? "Seu período de trabalho terminou. Bom descanso!"
                : "Seu descanso terminou. Pronto para voltar?",
          });
        }
        return duration * 60;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [duration, mode, onWorkComplete, running]);

  const setFocus = (nextMode: FocusMode, minutes: number) => {
    setRunning(false);
    setMode(nextMode);
    setDuration(minutes);
    setSeconds(minutes * 60);
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationState(permission);
  };

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  const progress = Math.max(0, Math.min(100, ((duration * 60 - seconds) / (duration * 60)) * 100));

  return (
    <div>
      <div className="flex items-start">
        <div>
          <h1 className="text-[34px] font-bold tracking-[-0.045em]">Foco</h1>
          <p className="mt-2 text-[16px] text-white/55">
            Um Pomodoro de cada vez.
          </p>
        </div>
        {notificationState === "default" && (
          <button
            type="button"
            onClick={requestNotifications}
            className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/[0.12] px-3 text-[11px] font-semibold text-white/70"
          >
            <Bell className="size-4 text-[#347cf6]" /> Avisos
          </button>
        )}
      </div>

      <section className="mt-10 rounded-[30px] border border-[#234680] bg-[#080c16] p-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFocus("trabalho", 25)}
            className={
              "rounded-[18px] py-4 text-[16px] font-bold " +
              (mode === "trabalho"
                ? "bg-[#347cf6] shadow-[0_10px_25px_rgba(52,124,246,0.34)]"
                : "border border-white/[0.1] bg-black/25 text-white/68")
            }
          >
            ▣ Trabalho
          </button>
          <button
            type="button"
            onClick={() => setFocus("descanso", 5)}
            className={
              "rounded-[18px] py-4 text-[16px] font-bold " +
              (mode === "descanso"
                ? "bg-[#347cf6]"
                : "border border-white/[0.1] bg-black/25 text-white/68")
            }
          >
            ☕ Descanso
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFocus(mode, mode === "trabalho" ? 25 : 5)}
            className={
              "rounded-[16px] border py-3 text-[14px] font-semibold " +
              (duration === (mode === "trabalho" ? 25 : 5)
                ? "border-[#347cf6] text-[#82b1ff]"
                : "border-white/[0.1] text-white/55")
            }
          >
            Curto · {mode === "trabalho" ? "25" : "5"} min
          </button>
          <button
            type="button"
            onClick={() => setFocus(mode, mode === "trabalho" ? 50 : 15)}
            className={
              "rounded-[16px] border py-3 text-[14px] font-semibold " +
              (duration === (mode === "trabalho" ? 50 : 15)
                ? "border-[#347cf6] text-[#82b1ff]"
                : "border-white/[0.1] text-white/55")
            }
          >
            Longo · {mode === "trabalho" ? "50" : "15"} min
          </button>
        </div>

        <p className="mt-14 text-center text-[70px] font-bold leading-none tracking-[-0.08em]">
          {minutes}:{remainingSeconds}
        </p>
        <p className="mt-7 text-center text-[16px] font-semibold text-[#4b8cff]">
          {mode === "trabalho"
            ? "Período de trabalho"
            : "Pausa para descansar"}
        </p>
        <div className="mt-12 h-2 overflow-hidden rounded-full bg-white/[0.12]">
          <div
            className="h-full rounded-full bg-[#347cf6] transition-[width] duration-300"
            style={{ width: progress + "%" }}
          />
        </div>
        <div className="mt-7 grid grid-cols-[1fr_auto] gap-3">
          <button
            type="button"
            onClick={() => setRunning((value) => !value)}
            className="flex min-h-[68px] items-center justify-center gap-3 rounded-[22px] bg-[#347cf6] text-[19px] font-bold shadow-[0_13px_32px_rgba(52,124,246,0.35)]"
          >
            {running ? (
              <Pause className="size-6 fill-current" />
            ) : (
              <Play className="size-6 fill-current" />
            )}
            {running ? "Pausar" : "Iniciar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setSeconds(duration * 60);
            }}
            aria-label="Reiniciar cronômetro"
            className="grid min-h-[68px] w-[68px] place-items-center rounded-[22px] border border-white/[0.12] text-white/65 transition hover:bg-white/[0.06]"
          >
            <RotateCcw className="size-5" />
          </button>
        </div>
      </section>

      <p className="mx-auto mt-12 max-w-xs text-center text-[14px] leading-6 text-white/50">
        Apenas períodos de trabalho concluídos entram no seu tempo de foco da
        tela inicial.
      </p>
    </div>
  );
}
