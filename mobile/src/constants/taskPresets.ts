import { TaskImportance } from '../types/task'

export { TaskImportance }

export interface TaskPreset {
  title: string
  importance: TaskImportance
  description: string
}

export interface TaskPresetCategory {
  id: string
  label: string
  emoji: string
  presets: TaskPreset[]
}

export const TASK_PRESET_CATEGORIES: TaskPresetCategory[] = [
  {
    id: 'home',
    label: 'Home & Chores',
    emoji: '🏠',
    presets: [
      {
        title: 'Clean the house',
        importance: TaskImportance.LOW,
        description: 'Full tidy-up — wipe surfaces, sweep, and declutter all rooms',
      },
      {
        title: 'Take out trash',
        importance: TaskImportance.TRIVIAL,
        description: 'Empty bins and take bags to the disposal point',
      },
      {
        title: 'Do laundry',
        importance: TaskImportance.LOW,
        description: 'Wash, dry, and fold a full load of clothes',
      },
      {
        title: 'Wash dishes',
        importance: TaskImportance.TRIVIAL,
        description: 'Clear the sink and clean all dishes and cookware',
      },
      {
        title: 'Vacuum floors',
        importance: TaskImportance.TRIVIAL,
        description: 'Run the vacuum through all rooms and corners',
      },
      {
        title: 'Grocery shopping',
        importance: TaskImportance.LOW,
        description: 'Restock essentials and pick up weekly ingredients',
      },
    ],
  },
  {
    id: 'health',
    label: 'Health & Fitness',
    emoji: '💪',
    presets: [
      {
        title: 'Morning workout',
        importance: TaskImportance.HIGH,
        description: 'Full training session to start the day with strength',
      },
      {
        title: 'Go for a run',
        importance: TaskImportance.MEDIUM,
        description: '20–40 min cardio run at a comfortable, steady pace',
      },
      {
        title: 'Meditate',
        importance: TaskImportance.LOW,
        description: '10–15 min mindfulness or breathing session to reset',
      },
      {
        title: 'Drink 2L of water',
        importance: TaskImportance.TRIVIAL,
        description: 'Hit your daily hydration target throughout the day',
      },
      {
        title: 'Sleep by 11pm',
        importance: TaskImportance.LOW,
        description: 'Protect your sleep schedule and overnight recovery',
      },
      {
        title: 'Stretch & mobility',
        importance: TaskImportance.TRIVIAL,
        description: '10 min full-body stretch to stay loose and prevent injury',
      },
    ],
  },
  {
    id: 'work',
    label: 'Work & Study',
    emoji: '💼',
    presets: [
      {
        title: 'Deep work session',
        importance: TaskImportance.HIGH,
        description: '90 min of uninterrupted, distraction-free focused work',
      },
      {
        title: 'Review emails',
        importance: TaskImportance.LOW,
        description: 'Clear your inbox and respond to all pending messages',
      },
      {
        title: 'Study session',
        importance: TaskImportance.MEDIUM,
        description: '1 hour of focused reading, practice, or learning',
      },
      {
        title: 'Plan tomorrow',
        importance: TaskImportance.LOW,
        description: 'Set your top priorities and tasks for the next day',
      },
      {
        title: 'Read for 30 min',
        importance: TaskImportance.MEDIUM,
        description: 'Books, research articles, or learning material',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    emoji: '💰',
    presets: [
      {
        title: 'Review budget',
        importance: TaskImportance.LOW,
        description: 'Check spending vs. plan and adjust allocations if needed',
      },
      {
        title: 'Pay bills',
        importance: TaskImportance.MEDIUM,
        description: 'Settle outstanding payments, subscriptions, or invoices',
      },
      {
        title: 'Track expenses',
        importance: TaskImportance.TRIVIAL,
        description: "Log today's spending into your budget tracker or app",
      },
    ],
  },
  {
    id: 'personal',
    label: 'Personal',
    emoji: '🧘',
    presets: [
      {
        title: 'Journal',
        importance: TaskImportance.LOW,
        description: 'Write thoughts, reflections, or a recap of your day',
      },
      {
        title: 'Call family',
        importance: TaskImportance.LOW,
        description: 'Check in and spend quality time with someone you care about',
      },
      {
        title: 'Digital detox hour',
        importance: TaskImportance.MEDIUM,
        description: 'No screens — read, walk, or simply rest and recharge',
      },
    ],
  },
]
