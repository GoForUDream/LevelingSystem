export interface Badge {
  name: string;
  category: string;
  requirement: string;
  tagline: string;
  image?: string;
}

export interface RankSection {
  rank: string;
  subtitle: string;
  color: string;
  glowColor: string;
  borderColor: string;
  ledColor: string;
  badges: Badge[];
}

export const ranks: RankSection[] = [
  {
    rank: "E-Rank",
    subtitle: "The Awakening",
    color: "text-gray-300",
    glowColor: "",
    borderColor: "border-gray-300/30",
    ledColor: "rgba(209,213,219,0.8)",
    badges: [
      {
        name: "Awakened",
        category: "Streak",
        requirement: "3-day streak",
        tagline: "The system has noticed you",
        image: "/badges/E-Rank-Awakened.png",
      },
      {
        name: "First Blood",
        category: "Tasks",
        requirement: "10 tasks completed",
        tagline: "Your first shadows rise",
        image: "/badges/E-Rank-First-Blood.png",
      },
      {
        name: "Gate Finder",
        category: "Goals",
        requirement: "Complete 1 goal",
        tagline: "Your first gate cleared",
        image: "/badges/E-Rank-Gate-Finder.png",
      },
      {
        name: "Dawn Waker",
        category: "Early Bird",
        requirement: "5 tasks before 7 AM",
        tagline: "The early hunter catches prey",
        image: "/badges/E-Rank-Dawn-Waker.png",
      },
      {
        name: "Night Walker",
        category: "Night Owl",
        requirement: "5 tasks after 10 PM",
        tagline: "Shadows welcome you",
      },
      {
        name: "Second Chance",
        category: "Comeback",
        requirement: "Return after 3 days inactive",
        tagline: "You came back",
      },
      {
        name: "Clean Sweep",
        category: "Perfect Day",
        requirement: "3 perfect days",
        tagline: "No task left behind",
      },
      {
        name: "Quick Start",
        category: "Speed",
        requirement: "5 instant completions",
        tagline: "No hesitation",
      },
    ],
  },
  {
    rank: "D-Rank",
    subtitle: "The Grind Begins",
    color: "text-green-300",
    glowColor: "shadow-[0_0_10px_rgba(74,222,128,0.3)]",
    borderColor: "border-green-300/30",
    ledColor: "rgba(74,222,128,0.8)",
    badges: [
      {
        name: "Persistent",
        category: "Streak",
        requirement: "7-day streak",
        tagline: "A week of discipline",
        image: "/badges/D-Rank-Persistent.png",
      },
      {
        name: "Squad Leader",
        category: "Tasks",
        requirement: "50 tasks completed",
        tagline: "A small army forms",
        image: "/badges/D-Rank-Squad-Leader.png",
      },
      {
        name: "Gate Raider",
        category: "Goals",
        requirement: "Complete 5 goals",
        tagline: "You hunt for challenges",
        image: "/badges/D-Rank-Gate-Raider.png",
      },
      {
        name: "Morning Strike",
        category: "Early Bird",
        requirement: "20 tasks before 7 AM",
        tagline: "Discipline starts at sunrise",
        image: "/badges/D-Rank-Morning-Strike.png",
      },
      {
        name: "Dusk Hunter",
        category: "Night Owl",
        requirement: "20 tasks after 10 PM",
        tagline: "You thrive in darkness",
      },
      {
        name: "Resilient",
        category: "Comeback",
        requirement: "Return after 7 days inactive",
        tagline: "Setbacks don't define you",
      },
      {
        name: "Full Clear",
        category: "Perfect Day",
        requirement: "10 perfect days",
        tagline: "You clear every dungeon",
      },
      {
        name: "Rapid Fire",
        category: "Speed",
        requirement: "20 instant completions",
        tagline: "Think, act, done",
      },
    ],
  },
  {
    rank: "C-Rank",
    subtitle: "Rising Hunter",
    color: "text-blue-400",
    glowColor: "shadow-[0_0_10px_rgba(0,163,255,0.2)]",
    borderColor: "border-blue-400/30",
    ledColor: "rgba(96,165,250,0.8)",
    badges: [
      {
        name: "Relentless",
        category: "Streak",
        requirement: "14-day streak",
        tagline: "You don't know how to quit",
        image: "/badges/C-Rank-Relentless.png",
      },
      {
        name: "Platoon Commander",
        category: "Tasks",
        requirement: "150 tasks completed",
        tagline: "They march at your command",
        image: "/badges/C-Rank-Platoon-Commander.png",
      },
      {
        name: "Gate Breaker",
        category: "Goals",
        requirement: "Complete 15 goals",
        tagline: "No gate can hold you",
        image: "/badges/C-Rank-Gate-Breaker.png",
      },
      {
        name: "First Light",
        category: "Early Bird",
        requirement: "50 tasks before 7 AM",
        tagline: "You own the morning",
        image: "/badges/C-Rank-First-Light.png",
      },
      {
        name: "Midnight Striker",
        category: "Night Owl",
        requirement: "50 tasks after 10 PM",
        tagline: "The night fuels you",
      },
      {
        name: "Reborn",
        category: "Comeback",
        requirement: "Return after 14 days inactive",
        tagline: "A new awakening",
      },
      {
        name: "Zero Escape",
        category: "Perfect Day",
        requirement: "25 perfect days",
        tagline: "Nothing escapes your grasp",
      },
      {
        name: "Blitz",
        category: "Speed",
        requirement: "50 instant completions",
        tagline: "Speed is your weapon",
      },
    ],
  },
  {
    rank: "B-Rank",
    subtitle: "Elite Hunter",
    color: "text-purple-400",
    glowColor: "shadow-[0_0_10px_rgba(123,44,191,0.3)]",
    borderColor: "border-purple-400/30",
    ledColor: "rgba(192,132,252,0.8)",
    badges: [
      {
        name: "Unstoppable",
        category: "Streak",
        requirement: "30-day streak",
        tagline: "A month of dominance",
        image: "/badges/B-Rank-Unstoppable.png",
      },
      {
        name: "Legion General",
        category: "Tasks",
        requirement: "500 tasks completed",
        tagline: "An army awaits your orders",
        image: "/badges/B-Rank-Legion-General.png",
      },
      {
        name: "Dungeon Master",
        category: "Goals",
        requirement: "Complete 30 goals",
        tagline: "Dungeons fear your name",
        image: "/badges/B-Rank-Dungeon-Master.png",
      },
      {
        name: "Sunrise Hunter",
        category: "Early Bird",
        requirement: "100 tasks before 7 AM",
        tagline: "Dawn is your domain",
        image: "/badges/B-Rank-Sunrise-Hunter.png",
      },
      {
        name: "Shadow Stalker",
        category: "Night Owl",
        requirement: "100 tasks after 10 PM",
        tagline: "Darkness is your weapon",
      },
      {
        name: "Phoenix",
        category: "Comeback",
        requirement: "Return after 30 days inactive",
        tagline: "From ashes, you rise",
      },
      {
        name: "Absolute",
        category: "Perfect Day",
        requirement: "50 perfect days",
        tagline: "Perfection is habit",
      },
      {
        name: "Lightning",
        category: "Speed",
        requirement: "100 instant completions",
        tagline: "Faster than thought",
      },
    ],
  },
  {
    rank: "A-Rank",
    subtitle: "National Level",
    color: "text-orange-300",
    glowColor: "shadow-[0_0_10px_rgba(251,146,60,0.3)]",
    borderColor: "border-orange-300/30",
    ledColor: "rgba(253,186,116,0.8)",
    badges: [
      {
        name: "Unbreakable",
        category: "Streak",
        requirement: "90-day streak",
        tagline: "Nothing can shatter your will",
        image: "/badges/A-Rank-Unbreakable.png",
      },
      {
        name: "Shadow Marshal",
        category: "Tasks",
        requirement: "1,500 tasks completed",
        tagline: "Thousands rise for you",
        image: "/badges/A-Rank-Shadow-Marshal.png",
      },
      {
        name: "Rift Walker",
        category: "Goals",
        requirement: "Complete 60 goals",
        tagline: "You walk between worlds",
        image: "/badges/A-Rank-Rift-Walker.png",
      },
      {
        name: "Aurora Knight",
        category: "Early Bird",
        requirement: "250 tasks before 7 AM",
        tagline: "Light follows your lead",
        image: "/badges/A-Rank-Aurora-Knight.png",
      },
      {
        name: "Void Knight",
        category: "Night Owl",
        requirement: "250 tasks after 10 PM",
        tagline: "You rule the silent hours",
      },
      {
        name: "Undying",
        category: "Comeback",
        requirement: "Return after 60 days inactive",
        tagline: "Death cannot hold you",
      },
      {
        name: "Flawless",
        category: "Perfect Day",
        requirement: "100 perfect days",
        tagline: "Error is not in your code",
      },
      {
        name: "Flash Step",
        category: "Speed",
        requirement: "250 instant completions",
        tagline: "You move like shadow",
      },
    ],
  },
  {
    rank: "S-Rank",
    subtitle: "Monarch Level",
    color: "text-red-400",
    glowColor: "shadow-[0_0_15px_rgba(230,57,70,0.4)]",
    borderColor: "border-red-400/30",
    ledColor: "rgba(248,113,113,0.8)",
    badges: [
      {
        name: "Immortal",
        category: "Streak",
        requirement: "365-day streak",
        tagline: "Time bends to your discipline",
        image: "/badges/S-Rank-Immortal.png",
      },
      {
        name: "Monarch's Army",
        category: "Tasks",
        requirement: "5,000 tasks completed",
        tagline: "Infinite shadows, one ruler",
        image: "/badges/S-Rank-Monarchs-Army.png",
      },
      {
        name: "Gate Sovereign",
        category: "Goals",
        requirement: "Complete 100 goals",
        tagline: "All gates bow to you",
        image: "/badges/S-Rank-Gate-Sovereign.png",
      },
      {
        name: "Sun Sovereign",
        category: "Early Bird",
        requirement: "500 tasks before 7 AM",
        tagline: "The sun rises for you",
        image: "/badges/S-Rank-Sun-Sovereign.png",
      },
      {
        name: "Night Monarch",
        category: "Night Owl",
        requirement: "500 tasks after 10 PM",
        tagline: "The night belongs to you",
      },
      {
        name: "Eternal Return",
        category: "Comeback",
        requirement: "Return after 90+ days inactive",
        tagline: "Legends never truly fall",
      },
      {
        name: "Perfect Monarch",
        category: "Perfect Day",
        requirement: "250 perfect days",
        tagline: "Perfection incarnate",
      },
      {
        name: "Time Bender",
        category: "Speed",
        requirement: "500 instant completions",
        tagline: "Time obeys your will",
      },
    ],
  },
];

export const categoryIcons: Record<string, string> = {
  Streak: "🔥",
  Tasks: "⚔️",
  Goals: "🏁",
  "Early Bird": "🌅",
  "Night Owl": "🌙",
  Comeback: "💀",
  "Perfect Day": "✨",
  Speed: "⚡",
};
