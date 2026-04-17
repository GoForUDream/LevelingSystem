export interface Badge {
  name: string
  badgeId: string
  category: string
  requirement: string
  tagline: string
  image?: string
}

export interface RankSection {
  rank: string
  subtitle: string
  ledColor: string
  badges: Badge[]
}

export interface BadgeInfo {
  badgeId: string
  name: string
  category: string
  tagline: string
  rankColor: string
  rankName: string
}

export const ranks: RankSection[] = [
  {
    rank: 'E-Rank',
    subtitle: 'The Awakening',
    ledColor: 'rgba(209,213,219,0.8)',
    badges: [
      { name: 'Awakened', badgeId: 'streak_e', category: 'Streak', requirement: '3-day streak', tagline: 'The system has noticed you' },
      { name: 'First Blood', badgeId: 'tasks_e', category: 'Tasks', requirement: '10 tasks completed', tagline: 'Your first shadows rise' },
      { name: 'Gate Finder', badgeId: 'goals_e', category: 'Goals', requirement: 'Complete 1 goal', tagline: 'Your first gate cleared' },
      { name: 'Dawn Waker', badgeId: 'early_bird_e', category: 'Early Bird', requirement: '5 tasks before 7 AM', tagline: 'The early hunter catches prey' },
      { name: 'Night Walker', badgeId: 'night_owl_e', category: 'Night Owl', requirement: '5 tasks after 10 PM', tagline: 'Shadows welcome you' },
      { name: 'Second Chance', badgeId: 'comeback_e', category: 'Comeback', requirement: 'Return after 3 days inactive', tagline: 'You came back' },
      { name: 'Clean Sweep', badgeId: 'perfect_day_e', category: 'Perfect Day', requirement: '3 perfect days', tagline: 'No task left behind' },
      { name: 'Quick Start', badgeId: 'speed_e', category: 'Speed', requirement: '5 instant completions', tagline: 'No hesitation' },
    ],
  },
  {
    rank: 'D-Rank',
    subtitle: 'The Grind Begins',
    ledColor: 'rgba(74,222,128,0.8)',
    badges: [
      { name: 'Persistent', badgeId: 'streak_d', category: 'Streak', requirement: '7-day streak', tagline: 'A week of discipline' },
      { name: 'Squad Leader', badgeId: 'tasks_d', category: 'Tasks', requirement: '50 tasks completed', tagline: 'A small army forms' },
      { name: 'Gate Raider', badgeId: 'goals_d', category: 'Goals', requirement: 'Complete 5 goals', tagline: 'You hunt for challenges' },
      { name: 'Morning Strike', badgeId: 'early_bird_d', category: 'Early Bird', requirement: '20 tasks before 7 AM', tagline: 'Discipline starts at sunrise' },
      { name: 'Dusk Hunter', badgeId: 'night_owl_d', category: 'Night Owl', requirement: '20 tasks after 10 PM', tagline: 'You thrive in darkness' },
      { name: 'Resilient', badgeId: 'comeback_d', category: 'Comeback', requirement: 'Return after 7 days inactive', tagline: "Setbacks don't define you" },
      { name: 'Full Clear', badgeId: 'perfect_day_d', category: 'Perfect Day', requirement: '10 perfect days', tagline: 'You clear every dungeon' },
      { name: 'Rapid Fire', badgeId: 'speed_d', category: 'Speed', requirement: '20 instant completions', tagline: 'Think, act, done' },
    ],
  },
  {
    rank: 'C-Rank',
    subtitle: 'Rising Hunter',
    ledColor: 'rgba(96,165,250,0.8)',
    badges: [
      { name: 'Relentless', badgeId: 'streak_c', category: 'Streak', requirement: '14-day streak', tagline: "You don't know how to quit" },
      { name: 'Platoon Commander', badgeId: 'tasks_c', category: 'Tasks', requirement: '150 tasks completed', tagline: 'They march at your command' },
      { name: 'Gate Breaker', badgeId: 'goals_c', category: 'Goals', requirement: 'Complete 15 goals', tagline: 'No gate can hold you' },
      { name: 'First Light', badgeId: 'early_bird_c', category: 'Early Bird', requirement: '50 tasks before 7 AM', tagline: 'You own the morning' },
      { name: 'Midnight Striker', badgeId: 'night_owl_c', category: 'Night Owl', requirement: '50 tasks after 10 PM', tagline: 'The night fuels you' },
      { name: 'Reborn', badgeId: 'comeback_c', category: 'Comeback', requirement: 'Return after 14 days inactive', tagline: 'A new awakening' },
      { name: 'Zero Escape', badgeId: 'perfect_day_c', category: 'Perfect Day', requirement: '25 perfect days', tagline: 'Nothing escapes your grasp' },
      { name: 'Blitz', badgeId: 'speed_c', category: 'Speed', requirement: '50 instant completions', tagline: 'Speed is your weapon' },
    ],
  },
  {
    rank: 'B-Rank',
    subtitle: 'Elite Hunter',
    ledColor: 'rgba(192,132,252,0.8)',
    badges: [
      { name: 'Unstoppable', badgeId: 'streak_b', category: 'Streak', requirement: '30-day streak', tagline: 'A month of dominance' },
      { name: 'Legion General', badgeId: 'tasks_b', category: 'Tasks', requirement: '500 tasks completed', tagline: 'An army awaits your orders' },
      { name: 'Dungeon Master', badgeId: 'goals_b', category: 'Goals', requirement: 'Complete 30 goals', tagline: 'Dungeons fear your name' },
      { name: 'Sunrise Hunter', badgeId: 'early_bird_b', category: 'Early Bird', requirement: '100 tasks before 7 AM', tagline: 'Dawn is your domain' },
      { name: 'Shadow Stalker', badgeId: 'night_owl_b', category: 'Night Owl', requirement: '100 tasks after 10 PM', tagline: 'Darkness is your weapon' },
      { name: 'Phoenix', badgeId: 'comeback_b', category: 'Comeback', requirement: 'Return after 30 days inactive', tagline: 'From ashes, you rise' },
      { name: 'Absolute', badgeId: 'perfect_day_b', category: 'Perfect Day', requirement: '50 perfect days', tagline: 'Perfection is habit' },
      { name: 'Lightning', badgeId: 'speed_b', category: 'Speed', requirement: '100 instant completions', tagline: 'Faster than thought' },
    ],
  },
  {
    rank: 'A-Rank',
    subtitle: 'National Level',
    ledColor: 'rgba(253,186,116,0.8)',
    badges: [
      { name: 'Unbreakable', badgeId: 'streak_a', category: 'Streak', requirement: '90-day streak', tagline: 'Nothing can shatter your will' },
      { name: 'Shadow Marshal', badgeId: 'tasks_a', category: 'Tasks', requirement: '1,500 tasks completed', tagline: 'Thousands rise for you' },
      { name: 'Rift Walker', badgeId: 'goals_a', category: 'Goals', requirement: 'Complete 60 goals', tagline: 'You walk between worlds' },
      { name: 'Aurora Knight', badgeId: 'early_bird_a', category: 'Early Bird', requirement: '250 tasks before 7 AM', tagline: 'Light follows your lead' },
      { name: 'Void Knight', badgeId: 'night_owl_a', category: 'Night Owl', requirement: '250 tasks after 10 PM', tagline: 'You rule the silent hours' },
      { name: 'Undying', badgeId: 'comeback_a', category: 'Comeback', requirement: 'Return after 60 days inactive', tagline: 'Death cannot hold you' },
      { name: 'Flawless', badgeId: 'perfect_day_a', category: 'Perfect Day', requirement: '100 perfect days', tagline: 'Error is not in your code' },
      { name: 'Flash Step', badgeId: 'speed_a', category: 'Speed', requirement: '250 instant completions', tagline: 'You move like shadow' },
    ],
  },
  {
    rank: 'S-Rank',
    subtitle: 'Monarch Level',
    ledColor: 'rgba(248,113,113,0.8)',
    badges: [
      { name: 'Immortal', badgeId: 'streak_s', category: 'Streak', requirement: '365-day streak', tagline: 'Time bends to your discipline' },
      { name: "Monarch's Army", badgeId: 'tasks_s', category: 'Tasks', requirement: '5,000 tasks completed', tagline: 'Infinite shadows, one ruler' },
      { name: 'Gate Sovereign', badgeId: 'goals_s', category: 'Goals', requirement: 'Complete 100 goals', tagline: 'All gates bow to you' },
      { name: 'Sun Sovereign', badgeId: 'early_bird_s', category: 'Early Bird', requirement: '500 tasks before 7 AM', tagline: 'The sun rises for you' },
      { name: 'Night Monarch', badgeId: 'night_owl_s', category: 'Night Owl', requirement: '500 tasks after 10 PM', tagline: 'The night belongs to you' },
      { name: 'Eternal Return', badgeId: 'comeback_s', category: 'Comeback', requirement: 'Return after 90+ days inactive', tagline: 'Legends never truly fall' },
      { name: 'Perfect Monarch', badgeId: 'perfect_day_s', category: 'Perfect Day', requirement: '250 perfect days', tagline: 'Perfection incarnate' },
      { name: 'Time Bender', badgeId: 'speed_s', category: 'Speed', requirement: '500 instant completions', tagline: 'Time obeys your will' },
    ],
  },
]

export function getBadgeDisplayInfo(badgeId: string): BadgeInfo | null {
  for (const section of ranks) {
    for (const badge of section.badges) {
      if (badge.badgeId === badgeId) {
        return {
          badgeId: badge.badgeId,
          name: badge.name,
          category: badge.category,
          tagline: badge.tagline,
          rankColor: section.ledColor,
          rankName: section.rank,
        }
      }
    }
  }
  return null
}
