import type { Metadata } from "next";
import { MercuryWorkoutsApp } from "@/components/mercury/workouts-app";

export const metadata: Metadata = {
  title: "Treinos | Mercury Habit Tracker",
  description: "Monte seus treinos, escolha exercícios e acompanhe cada série.",
};

export default function WorkoutsPage() {
  return <MercuryWorkoutsApp />;
}
