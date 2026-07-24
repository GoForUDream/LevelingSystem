import type { GoalSummary } from "@/types/goal"

export interface GoalTheme {
  color: string
  border: string
  bg: string
  glow: string
  progress: string
  progressGradient: string
}

export const GOAL_THEME: Record<GoalSummary["rank"], GoalTheme> = {
  S: {
    color: "text-sl-red",
    border: "border-sl-red/30",
    bg: "bg-sl-red/5",
    glow: "shadow-[0_0_20px_rgba(230,57,70,0.15)]",
    progress: "#E63946",
    progressGradient: "linear-gradient(to right, #E63946, #FF6B6B)",
  },
  A: {
    color: "text-[#FF6B00]",
    border: "border-[#FF6B00]/30",
    bg: "bg-[#FF6B00]/5",
    glow: "shadow-[0_0_20px_rgba(255,107,0,0.15)]",
    progress: "#FF6B00",
    progressGradient: "linear-gradient(to right, #FF6B00, #FFA040)",
  },
  B: {
    color: "text-sl-purple",
    border: "border-sl-purple/30",
    bg: "bg-sl-purple/5",
    glow: "shadow-[0_0_20px_rgba(123,44,191,0.15)]",
    progress: "#7B2CBF",
    progressGradient: "linear-gradient(to right, #7B2CBF, #A855F7)",
  },
  C: {
    color: "text-sl-blue",
    border: "border-sl-blue/30",
    bg: "bg-sl-blue/5",
    glow: "",
    progress: "#00A3FF",
    progressGradient: "linear-gradient(to right, #00A3FF, #60CFFF)",
  },
  D: {
    color: "text-sl-silver-muted",
    border: "border-sl-gray-muted",
    bg: "bg-sl-gray/30",
    glow: "",
    progress: "#00A3FF",
    progressGradient: "linear-gradient(to right, #00A3FF, #60CFFF)",
  },
}
