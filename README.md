# Leveling System

A gamified task management application that turns your productivity into an RPG-like experience. Complete tasks, earn EXP, and level up your life.

## Features

- **Horizontal Calendar View** - Intuitive day-by-day task planning with full-height columns
- **Google OAuth 2.0** - Secure authentication with Google accounts
- **EXP & Leveling System** - Earn experience points by completing tasks
- **Task Priorities** - Five levels from Trivial to Critical, each with different EXP rewards
- **Task Status Tracking** - TODO, In Progress, Completed, Failed, Rescheduled, and more
- **Reschedule Limits** - Built-in accountability with configurable reschedule limits

## Tech Stack

### Backend
- **Python 3.13** - Latest Python version
- **FastAPI** - Modern, high-performance web framework
- **SQLAlchemy 2.0** - Async ORM with PostgreSQL
- **Pydantic** - Data validation
- **JWT** - Token-based authentication

### Frontend
- **React 19** - Latest React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Vite** - Fast build tool
- **React Router 7** - Client-side routing

### Infrastructure
- **PostgreSQL 16** - Primary database
- **Docker** - Containerized database

## Project Structure

```
LevelingSystem/
├── backend/
│   ├── db/                 # Database configuration
│   ├── models/             # SQLAlchemy models
│   ├── schemas/            # Pydantic schemas
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic
│   ├── resolvers/          # API endpoints
│   ├── middleware/         # Auth middleware
│   ├── main.py             # FastAPI app
│   ├── config.py           # Configuration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── pages/          # Page components
│   │   └── App.tsx         # Main app
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

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/{id}` | Get task |
| PATCH | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| POST | `/api/tasks/{id}/start` | Start task |
| POST | `/api/tasks/{id}/complete` | Complete task |
| POST | `/api/tasks/{id}/fail` | Fail task |
| POST | `/api/tasks/{id}/reschedule` | Reschedule task |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/{id}` | Get user |
| PATCH | `/api/users/{id}` | Update user |
| POST | `/api/users/{id}/add-exp` | Add EXP to user |

## EXP System

| Task Importance | EXP Value |
|-----------------|-----------|
| Trivial | 10 |
| Low | 25 |
| Medium | 50 |
| High | 100 |
| Critical | 200 |

**Leveling Formula:** Each level requires `level × 100` EXP

## License

MIT License - feel free to use this project for personal or commercial purposes.
