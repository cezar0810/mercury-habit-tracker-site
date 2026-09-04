import type { Metadata } from "next";
import { MercuryWaterApp } from "@/components/mercury/water-app";

export const metadata: Metadata = {
  title: "Água | Mercury Habit Tracker",
  description: "Registre sua água e acompanhe sua meta diária de hidratação.",
};

export default function WaterPage() {
  return <MercuryWaterApp />;
}
