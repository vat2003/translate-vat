export type CreatorToolId = "youtube-prompt-translate" | "youtube-tools";

export type CreatorToolStatus = "active" | "coming-soon";

export type CreatorToolIcon = "clapperboard" | "wrench";

export type CreatorToolView = "youtube-prompt-translate" | "coming-soon";

export type CreatorTool = {
  id: CreatorToolId;
  name: string;
  description: string;
  icon: CreatorToolIcon;
  status: CreatorToolStatus;
  view: CreatorToolView;
};

export const ACTIVE_TOOL_ID: CreatorToolId = "youtube-prompt-translate";

export const CREATOR_TOOLS: CreatorTool[] = [
  {
    id: "youtube-prompt-translate",
    name: "YouTube Prompt Translate",
    description: "Generate translated YouTube titles and descriptions from one source prompt.",
    icon: "clapperboard",
    status: "active",
    view: "youtube-prompt-translate"
  },
  {
    id: "youtube-tools",
    name: "YouTube Tools",
    description: "Additional creator utilities are in development.",
    icon: "wrench",
    status: "coming-soon",
    view: "coming-soon"
  }
];

export const ACTIVE_TOOL = CREATOR_TOOLS.find((tool) => tool.id === ACTIVE_TOOL_ID) ?? CREATOR_TOOLS[0];
