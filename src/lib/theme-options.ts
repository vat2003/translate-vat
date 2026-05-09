import type { ThemeMode } from "@/lib/types";

export type ThemeBaseMode = "light" | "dark";

export type ThemeOption = {
  id: ThemeMode;
  name: string;
  baseMode: ThemeBaseMode;
  preview: string[];
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "light",
    name: "Default Light",
    baseMode: "light",
    preview: ["#f3eee6", "#fbf7ef", "#557fae", "#6f9274"]
  },
  {
    id: "dark",
    name: "Default Dark",
    baseMode: "dark",
    preview: ["#171615", "#25231f", "#7da1c9", "#8cac8a"]
  },
  {
    id: "cat-siamese",
    name: "Cat Theme - Cute Siamese Cat",
    baseMode: "light",
    preview: ["#f4eadb", "#fff7eb", "#8b6a55", "#6f91ad"]
  },
  {
    id: "cat-ginger",
    name: "Cat Theme - Ginger Cat",
    baseMode: "light",
    preview: ["#f6ead8", "#fff8ed", "#c27a3d", "#9c8762"]
  },
  {
    id: "cat-tabby",
    name: "Cat Theme - Tabby Cat",
    baseMode: "light",
    preview: ["#ebe3d4", "#f8f1e6", "#777066", "#7c957d"]
  },
  {
    id: "galaxy",
    name: "Galaxy Theme",
    baseMode: "dark",
    preview: ["#171a2e", "#242542", "#8797d7", "#8b75b9"]
  },
  {
    id: "hacker",
    name: "Hacker Theme",
    baseMode: "dark",
    preview: ["#151915", "#202720", "#7ea87e", "#9cb58f"]
  },
  {
    id: "cute-pink",
    name: "Cute Pink Theme",
    baseMode: "light",
    preview: ["#f7e9ed", "#fff7f5", "#c87591", "#a9886f"]
  },
  {
    id: "anime",
    name: "Anime Theme",
    baseMode: "light",
    preview: ["#efeafb", "#fdf8f2", "#8b93cf", "#df9f8b"]
  },
  {
    id: "football",
    name: "Football Theme",
    baseMode: "dark",
    preview: ["#14231c", "#203329", "#789d76", "#d9cfb2"]
  }
];

export const THEME_OPTION_MAP = new Map(THEME_OPTIONS.map((theme) => [theme.id, theme]));

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && THEME_OPTION_MAP.has(value as ThemeMode);
}

export function getThemeOption(theme: ThemeMode) {
  return THEME_OPTION_MAP.get(theme) ?? THEME_OPTIONS[0];
}

export function getThemeBaseMode(theme: ThemeMode): ThemeBaseMode {
  return getThemeOption(theme).baseMode;
}

