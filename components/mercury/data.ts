import {
  BookOpen,
  CalendarDays,
  Circle,
  Coffee,
  Dumbbell,
  Grid2X2,
  Home,
  ListChecks,
  Moon,
  Sparkles,
  Sun,
  TimerReset,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type Tab = "inicio" | "habitos" | "planejar" | "foco";

export const tabs: Array<{ id: Tab; label: string; icon: LucideIcon }> = [
  { id: "inicio", label: "Início", icon: Home },
  { id: "habitos", label: "Hábitos", icon: Grid2X2 },
  { id: "planejar", label: "Planejar", icon: CalendarDays },
  { id: "foco", label: "Foco", icon: TimerReset },
];

export const habitRows = [
  { id: "ler", label: "Ler 20 páginas", icon: BookOpen, initial: false },
  { id: "treinar", label: "Treinar", icon: Dumbbell, initial: true },
  {
    id: "meditar",
    label: "Meditar 10 minutos",
    icon: Sparkles,
    initial: true,
  },
  { id: "agua", label: "Beber água", icon: Circle, initial: true },
  { id: "estudar", label: "Estudar", icon: Trophy, initial: false },
  { id: "pedalar", label: "Pedalar", icon: ListChecks, initial: false },
];

export const plannerGroups = [
  {
    title: "Prioridades",
    icon: Sparkles,
    tasks: ["Entregar atividade", "Estudar Flutter"],
  },
  { title: "Manhã", icon: Sun, tasks: ["Ler 20 páginas"] },
  { title: "Tarde", icon: Coffee, tasks: ["Revisar conteúdo da aula"] },
  { title: "Noite", icon: Moon, tasks: ["Preparar o dia seguinte"] },
];
