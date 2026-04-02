import { TaskImportance } from '@/types/task'

export interface RankTheme {
  /** Letter shown in rank badges and buttons: D / C / B / A / S */
  label: string
  /** EXP awarded on completion */
  exp: number
  /** Short subtitle shown in the rank picker */
  subtitle: string
  /** Longer description of what this rank means */
  description: string
  /** Example tasks for this rank */
  examples: string
  /** Tailwind text color class */
  textColor: string
  /** Tailwind solid background class — rank buttons, accent bars */
  bgSolid: string
  /** Tailwind faint background class — badge fills */
  bgFaint: string
  /** Tailwind solid border class — active accent outlines */
  borderSolid: string
  /** Tailwind faint border class — badge borders, default card borders */
  borderFaint: string
  /** Full hover class for TaskCard border + glow shadow */
  cardGlow: string
  /** Combined badge class string: text + bg + border — ready to spread onto className */
  badgeClasses: string
}

export const RANK_THEME: Record<TaskImportance, RankTheme> = {
  [TaskImportance.TRIVIAL]: {
    label: 'D',
    exp: 10,
    subtitle: 'Quick wins, minimal effort',
    description: 'Tasks that take less than 5 minutes and require almost no mental energy.',
    examples: 'Drink water, make bed, reply to a simple message',
    textColor:    'text-sl-silver-muted',
    bgSolid:      'bg-sl-silver-muted',
    bgFaint:      'bg-sl-black/60',
    borderSolid:  'border-sl-silver-muted',
    borderFaint:  'border-sl-gray-muted',
    cardGlow:     'border-sl-gray-muted/50 hover:border-sl-silver-muted',
    badgeClasses: 'text-sl-silver-muted bg-sl-black/60 border border-sl-gray-muted',
  },
  [TaskImportance.LOW]: {
    label: 'C',
    exp: 25,
    subtitle: 'Simple daily habits',
    description: 'Routine tasks that are easy but still require some intention.',
    examples: 'Check emails, 10-min walk, tidy your desk',
    textColor:    'text-sl-blue',
    bgSolid:      'bg-sl-blue',
    bgFaint:      'bg-sl-blue/10',
    borderSolid:  'border-sl-blue',
    borderFaint:  'border-sl-blue/30',
    cardGlow:     'border-sl-blue/30 hover:border-sl-blue hover:shadow-[0_0_15px_rgba(0,163,255,0.3)]',
    badgeClasses: 'text-sl-blue bg-sl-blue/10 border border-sl-blue/30',
  },
  [TaskImportance.MEDIUM]: {
    label: 'B',
    exp: 50,
    subtitle: 'Standard meaningful tasks',
    description: 'Tasks that require focus, time, or effort. Core actions that move your goals forward.',
    examples: 'Work assignment, 30-min exercise, study for an hour',
    textColor:    'text-sl-purple',
    bgSolid:      'bg-sl-purple',
    bgFaint:      'bg-sl-purple/10',
    borderSolid:  'border-sl-purple',
    borderFaint:  'border-sl-purple/30',
    cardGlow:     'border-sl-purple/30 hover:border-sl-purple hover:shadow-[0_0_15px_rgba(123,44,191,0.3)]',
    badgeClasses: 'text-sl-purple bg-sl-purple/10 border border-sl-purple/30',
  },
  [TaskImportance.HIGH]: {
    label: 'A',
    exp: 100,
    subtitle: 'Important and challenging',
    description: 'Tasks that demand significant effort, skill, or courage. Often involve deadlines or stepping outside comfort zone.',
    examples: 'Major project, difficult conversation, job application',
    textColor:    'text-[#FF6B00]',
    bgSolid:      'bg-[#FF6B00]',
    bgFaint:      'bg-[#FF6B00]/10',
    borderSolid:  'border-[#FF6B00]',
    borderFaint:  'border-[#FF6B00]/30',
    cardGlow:     'border-[#FF6B00]/50 hover:border-[#FF6B00] hover:shadow-[0_0_15px_rgba(255,107,0,0.3)]',
    badgeClasses: 'text-[#FF6B00] bg-[#FF6B00]/10 border border-[#FF6B00]/30',
  },
  [TaskImportance.CRITICAL]: {
    label: 'S',
    exp: 200,
    subtitle: 'Life-changing milestones',
    description: "Major achievements with lasting impact. These are the boss fights you've been building toward.",
    examples: 'Pass important exam, launch project, complete certification',
    textColor:    'text-sl-red',
    bgSolid:      'bg-sl-red',
    bgFaint:      'bg-sl-red/10',
    borderSolid:  'border-sl-red',
    borderFaint:  'border-sl-red/30',
    cardGlow:     'border-sl-red/50 hover:border-sl-red hover:shadow-[0_0_15px_rgba(230,57,70,0.3)]',
    badgeClasses: 'text-sl-red bg-sl-red/10 border border-sl-red/30',
  },
}

/**
 * Look up a rank theme by its letter (S / A / B / C / D).
 * Used where the backend returns a letter-based rank (e.g. goal rank).
 */
export const RANK_THEME_BY_LETTER: Record<string, RankTheme> = {
  S: RANK_THEME[TaskImportance.CRITICAL],
  A: RANK_THEME[TaskImportance.HIGH],
  B: RANK_THEME[TaskImportance.MEDIUM],
  C: RANK_THEME[TaskImportance.LOW],
  D: RANK_THEME[TaskImportance.TRIVIAL],
}
