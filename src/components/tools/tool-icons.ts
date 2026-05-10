import { Clapperboard, Image as ImageIcon, type LucideIcon, Wrench } from "lucide-react";
import type { CreatorToolIcon } from "@/lib/creator-tools";

export const TOOL_ICONS: Record<CreatorToolIcon, LucideIcon> = {
  clapperboard: Clapperboard,
  image: ImageIcon,
  wrench: Wrench
};
