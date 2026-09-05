export type HabitLink = "none" | "water" | "workout";

export function recognizeHabit(title: string): HabitLink {
  const text = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
  // Match whole words and positive actions; do not link plants, shopping or classes.
  if (/\b(nao|evitar|comprar|pagar|regar|plantas?|cabelo|pele|academico|academica|prova|curso)\b/.test(text)) return "none";
  if (/\b(academia|musculacao|malhar|treinar|treino|treinos)\b/.test(text) && !/\b(voz|canto|idioma|programacao|futebol|corrida)\b/.test(text)) return "workout";
  if (/^(agua|hidratacao|hidratar(?:-me)?)$/.test(text) || /\b(beber|tomar|consumir)\b.*\bagua\b/.test(text)) return "water";
  return "none";
}

export const habitLinkLabels: Record<HabitLink, string> = {
  none: "Sem ligação", water: "Água", workout: "Treinos",
};

export const habitEmojis = ["✅", "💧", "🏋️", "📚", "🎓", "🧘", "😴", "🏃", "🚴", "🥗", "💊", "🎨", "🎵", "💻", "🧹", "📝", "🌱", "🐾", "❤️", "☀️", "🦷", "💰", "🙏", "⭐"];
