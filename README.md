# Leveling System

A Solo Leveling-inspired gamified task management application that turns your productivity into an RPG experience. Complete quests, earn EXP, unlock achievements, and level up your life.

## Features

### Core Features
- **Horizontal Calendar View** - Infinite scroll day-by-day task planning with month-based lazy loading
- **Google OAuth 2.0** - Secure authentication with Google accounts
- **EXP & Leveling System** - Earn experience points by completing tasks, level up with progression
- **Rank Titles** - 12 rank tiers from "Awakened One" to "Shadow Monarch" based on your level

### Tasks (Quests)
- **Task Priorities** - Five importance levels (Trivial → Critical) with different EXP rewards
- **Recurring Tasks** - Daily, weekly, or monthly repeating quests
- **Overdue System** - Missed tasks become overdue with EXP penalties
- **Task Cancellation** - Cancel or skip recurring tasks with penalty

### Goals
- **Long-term Goals** - Set S/A/B/C/D rank goals with deadlines
- **Goal Progress** - Link tasks to goals and track completion
- **Goal Achievements** - Earn badges for completing goals

### Achievement System
- **48 Badges** - Across 8 categories with 6 ranks each (E/D/C/B/A/S)
- **Categories**: Tasks, Goals, Early Bird, Night Owl, Speed, Streak, Comeback, Perfect Day
- **Badge Unlock Animations** - Celebratory modal when unlocking new achievements

### Stats & Analytics
- **Hunter Analytics Dashboard** - Comprehensive stats with Recharts visualizations
- **Period Selection** - View stats for 7d, 30d, 90d, or all time
- **Charts**: Tasks over time, completion breakdown, EXP progress, time-of-day distribution
- **Activity Heatmap** - GitHub-style contribution heatmap
- **Period Comparisons** - Monthly and yearly comparisons with trend indicators

### UI/UX
- **Solo Leveling Theme** - Dark theme with blue/purple glow effects, LED borders
- **Responsive Design** - Works on desktop and mobile
- **Toast Notifications** - Sonner-powered feedback for all actions
- **Timezone Support** - Automatic timezone detection and sync

## Tech Stack

### Backend
- **Python 3.13** - Latest Python version
- **FastAPI** - Modern, high-performance web framework
- **SQLAlchemy 2.0** - Async ORM with PostgreSQL
- **Pydantic** - Data validation
- **JWT** - Token-based authentication
- **APScheduler** - Background jobs for overdue checking

### Frontend
- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Vite** - Fast build tool
- **React Router 7** - Client-side routing
- **Recharts** - Data visualization
- **Sonner** - Toast notifications
- **Lucide React** - Icon library

### Infrastructure
- **PostgreSQL 16** - Primary database
- **Docker** - Containerized database

## Project Structure

```
LevelingSystem/
├── backend/
│   ├── db/                 # Database configuration
│   ├── models/             # SQLAlchemy models (user, task, goal, achievement)
│   ├── schemas/            # Pydantic schemas
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic
│   ├── resolvers/          # API endpoints (routers)
│   ├── middleware/         # Auth middleware
│   ├── jobs/               # Background jobs (overdue checker)
│   ├── main.py             # FastAPI app
│   ├── config.py           # Configuration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   │   ├── stats/      # Stats page chart components
│   │   │   └── ui/         # UI primitives (buttons, dialogs, etc.)
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── hooks/          # Custom hooks (useStats)
│   │   ├── types/          # TypeScript type definitions
│   │   ├── constants/      # Achievement definitions
│   │   ├── lib/            # Utilities
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app with routing
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── run.sh
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 18+
- Docker & Docker Compose
- Google Cloud Console account (for OAuth)

### 1. Clone the repository

```bash
git clone <repository-url>
cd LevelingSystem
```

### 2. Set up the database

```bash
docker-compose up -d
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
DATABASE_URL=postgresql+asyncpg://leveling:leveling123@localhost:5433/leveling_system

# Google OAuth - https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback

# JWT
JWT_SECRET=your-secure-random-string

# Frontend
FRONTEND_URL=http://localhost:5173
```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Create OAuth 2.0 credentials (Web application)
4. Add authorized redirect URI: `http://localhost:8000/api/auth/callback`
5. Copy Client ID and Client Secret to `.env`

### 5. Install dependencies

**Backend:**
```bash
cd backend
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 6. Run the application

```bash
# From project root
./run.sh
```

Or run separately:

```bash
# Terminal 1 - Backend
cd backend && source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend && npm run dev
```

### 7. Access the application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/login` | Initiate Google OAuth |
| GET | `/api/auth/callback` | OAuth callback |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/timezone` | Sync user timezone |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/range` | Get tasks in date range |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/{id}` | Get task |
| PATCH | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| POST | `/api/tasks/{id}/complete` | Complete task |
| POST | `/api/tasks/{id}/cancel` | Cancel/skip task |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List all goals |
| POST | `/api/goals` | Create goal |
| PATCH | `/api/goals/{id}` | Update goal |
| DELETE | `/api/goals/{id}` | Delete goal |
| POST | `/api/goals/{id}/toggle` | Toggle goal completion |

### Achievements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/achievements` | Get user achievements & stats |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get analytics data |

## EXP System

| Task Importance | EXP Value |
|-----------------|-----------|
| Trivial | 10 |
| Low | 25 |
| Medium | 50 |
| High | 100 |
| Critical | 200 |

**Leveling Formula:** Each level requires `level × 100` EXP

**Penalties:**
- Overdue task: -20% of task EXP
- Cancelled task: -20% of task EXP

## Rank System

| Level Range | Rank Title |
|-------------|------------|
| 1-5 | Awakened One |
| 6-10 | Beginner Warrior |
| 11-20 | Task Slayer |
| 21-30 | Dungeon Crawler |
| 31-40 | Goal Hunter |
| 41-50 | Elite Achiever |
| 51-60 | S-Rank Executor |
| 61-70 | Master of Habits |
| 71-80 | Sovereign of Will |
| 81-90 | Ruler of Self |
| 91-99 | Monarch's Equal |
| 100+ | Shadow Monarch |

## Achievement Categories

| Category | Description |
|----------|-------------|
| Tasks | Complete tasks (10 → 1000) |
| Goals | Complete goals (1 → 50) |
| Early Bird | Complete tasks before 9 AM |
| Night Owl | Complete tasks after 9 PM |
| Speed | Complete tasks within 1 hour of creation |
| Streak | Maintain daily completion streaks |
| Comeback | Return after inactivity |
| Perfect Day | Complete all tasks for a day |

Each category has 6 ranks: E → D → C → B → A → S

## Development

### Run checks
```bash
cd frontend
npm run check      # TypeScript + ESLint
npm run typecheck  # TypeScript only
npm run lint       # ESLint only
```

### Build for production
```bash
cd frontend
npm run build
```

## License

MIT License - feel free to use this project for personal or commercial purposes.
