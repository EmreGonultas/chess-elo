# Chess ELO - Multiplayer Chess Platform

A full-stack, real-time multiplayer chess application with ELO rating system, friend challenges, AI opponents, and admin controls. Built with modern web technologies and deployed on cloud platforms.

**Live Demo:** [https://chess-elo-alpha.vercel.app](https://chess-elo-alpha.vercel.app)

---

## 📋 Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Architecture](#architecture)
- [Local Development Setup](#local-development-setup)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Technical Implementation](#technical-implementation)
- [Database Schema](#database-schema)
- [Future Enhancements](#future-enhancements)

---

## ✨ Features

### Core Gameplay
- **Real-time Multiplayer Chess**: Play against other players in real-time with WebSocket connections
- **AI Opponent**: Practice against an AI with multiple difficulty levels (Easy, Medium, Hard, Master)
- **Time Controls**: Ranked games with 5-minute or 10-minute options, unlimited time for casual games
- **Move Validation**: Full chess rules implementation including castling, en passant, and promotion

### Social Features
- **Friend System**: Add friends, send/accept friend requests, see who's online
- **Direct Challenges**: Challenge friends to casual games with custom time controls
- **Match History**: View all your past games with ELO changes and results

### Rating System
- **ELO Rating**: Standard chess ELO calculation (K-factor 32)
- **Starting ELO**: All new players begin at 800 ELO
- **Rank Tiers**: 
  - **Pulse** (< 1000) - Entry level, blue badge
  - **Rift** (1000-1499) - Intermediate, green badge
  - **Eclipse** (1500-1999) - Advanced, purple badge with glow
  - **Ascendant** (2000-2499) - Expert, red badge with strong glow
  - **Paragon** (2500+) - Elite, animated RGB rainbow effect
- **Leaderboard**: Global ranking of top players

### Matchmaking
- **Ranked Queue**: Automatic matchmaking with similar time control preference
- **Time Controls**: Choose between 5-minute or 10-minute games
- **Casual Games**: Play without affecting your rating (friend challenges)
- **Auto-resign on Disconnect**: Games are automatically resolved if a player leaves

### Admin Panel
- **User Management**: View all registered users
- **Ban/Unban Users**: Moderate player behavior with instant logout for banned users
- **ELO Editing**: Manually adjust player ratings
- **Admin-only Access**: Secure access with role-based permissions

---

## 🛠️ Technologies Used

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool and dev server
- **Socket.IO Client** - Real-time bidirectional communication
- **React Router** - Client-side routing
- **Axios** - HTTP requests
- **Chess.js** - Chess move validation and game logic
- **Tailwind CSS** - Utility-first styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web server framework
- **Socket.IO** - WebSocket server for real-time gameplay
- **TypeScript** - Type-safe backend code
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcrypt** - Password hashing

### Database
- **SQLite** - Development database (local file-based)
- **PostgreSQL** - Production database (Render.com hosted)
- **pg (node-postgres)** - PostgreSQL driver

### Deployment
- **Vercel** - Frontend hosting with automatic GitHub deployments
- **Render.com** - Backend hosting with PostgreSQL database
- **GitHub** - Version control and CI/CD trigger

---

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Vercel         │  HTTPS  │  Render.com      │  SQL    │  PostgreSQL     │
│  (Frontend)     │◄────────┤  (Backend)       │◄────────┤  Database       │
│                 │         │                  │         │                 │
│  - React App    │         │  - Express API   │         │  - Users        │
│  - Static Files │         │  - Socket.IO     │         │  - Matches      │
│  - Client Logic │         │  - Auth & Game   │         │  - Friends      │
└─────────────────┘         └──────────────────┘         └─────────────────┘
        ▲                            ▲
        │                            │
        │     WebSocket (Socket.IO)  │
        │                            │
        └────────────────────────────┘
              Real-time Game Events
```

### Communication Flow
1. **HTTP/REST API**: User auth, match history, leaderboard, admin actions
2. **WebSocket (Socket.IO)**: Real-time game moves, matchmaking, friend notifications
3. **Database**: Persistent storage for users, games, friendships

### Environment-Based Configuration
- **Development**: Uses `localhost:3000` for backend
- **Production**: Uses `chess-elo.onrender.com` for backend
- **Auto-detection**: Checks `window.location.hostname` to determine environment

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/EmreGonultas/chess-elo.git
   cd chess-elo
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Environment Variables**
   
   Create `server/.env` file:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=3000
   ```

5. **Start the Backend Server**
   ```bash
   cd server
   npm run dev
   ```
   Backend will run on `http://localhost:3000`

6. **Start the Frontend (in a new terminal)**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

7. **Open in Browser**
   Navigate to `http://localhost:5173`

### Local Database
- SQLite database is automatically created at `server/chess.db`
- No additional setup required
- Data persists between server restarts

---

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Connect GitHub Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Vite configuration

2. **Automatic Deployments**
   - Every push to `main` branch triggers a new deployment
   - Preview deployments for pull requests
   - Build command: `npm run build`
   - Output directory: `dist`

### Backend Deployment (Render.com)

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Create new "Web Service"
   - Connect GitHub repository
   - Root directory: `server`

2. **Configuration**
   - Build command: `npm install; npm run build`
   - Start command: `npm start`
   - Environment: Node.js
   - Region: Choose closest to users

3. **Environment Variables (Render Dashboard)**
   ```
   DATABASE_URL=<automatically-provided-by-render>
   JWT_SECRET=<your-production-secret>
   CORS_ORIGIN=https://chess-elo-alpha.vercel.app
   ```

4. **Add PostgreSQL Database**
   - Click "New" → "PostgreSQL"
   - Link to your web service
   - Database migrations run automatically on startup

### CORS Configuration
Backend is configured to accept requests from:
- `https://chess-elo-alpha.vercel.app` (production frontend)
- `http://localhost:5173` (development frontend)
- `http://localhost:3000` (development frontend alternative)

---

## 📁 Project Structure

```
chess2/
├── src/                          # Frontend source code
│   ├── components/              # React components
│   │   ├── Navbar.tsx          # Navigation bar
│   │   ├── MultiplayerChessBoard.tsx  # Real-time chess board
│   │   ├── ChallengeToast.tsx  # Challenge notification UI
│   │   └── ...
│   ├── pages/                   # Page components
│   │   ├── LandingPage.tsx     # Home page
│   │   ├── LoginPage.tsx       # User login
│   │   ├── RegisterPage.tsx    # User registration
│   │   ├── DashboardPage.tsx   # User stats
│   │   ├── MultiplayerGamePage.tsx  # Live game UI
│   │   ├── SocialPage.tsx      # Friends & challenges
│   │   ├── AdminPage.tsx       # Admin control panel
│   │   └── ...
│   ├── context/                 # React context providers
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── SocketContext.tsx   # WebSocket connection
│   ├── ai/                      # AI opponent logic
│   │   └── bot-engine.ts       # Move generation & evaluation
│   ├── utils/                   # Utility functions
│   │   └── rank-utils.ts       # ELO rank calculation
│   ├── config.ts               # Environment configuration
│   └── App.tsx                 # Main app component
│
├── server/                      # Backend source code
│   ├── index.ts                # Express server setup
│   ├── db.ts                   # Database abstraction layer
│   ├── auth.ts                 # Authentication routes
│   ├── admin.ts                # Admin API routes
│   ├── socket-handlers.ts      # WebSocket event handlers
│   ├── matchmaking.ts          # Matchmaking queue logic
│   ├── gameRoom.ts             # Game state management
│   ├── elo.ts                  # ELO calculation
│   ├── friends.ts              # Friend system API
│   ├── match-history.ts        # Match history API
│   ├── setup.ts                # Admin promotion endpoint
│   └── package.json            # Backend dependencies
│
├── public/                      # Static assets
├── index.html                  # HTML template
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind CSS config
├── tsconfig.json               # TypeScript config (frontend)
└── package.json                # Frontend dependencies
```

---

## 🔧 Technical Implementation

### Authentication System
- **JWT Tokens**: Stateless authentication with 24-hour expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Protected Routes**: Middleware checks for valid tokens
- **Admin Roles**: `is_admin` boolean flag in user record

### Real-Time Gameplay
```typescript
// Socket.IO event flow for a move:
1. Player clicks piece → Frontend validates move locally
2. Frontend emits 'make_move' event with {gameId, from, to}
3. Backend validates move with chess.js
4. Backend updates game state
5. Backend emits 'move_made' to both players
6. Both frontends update board simultaneously
```

### ELO Calculation
```typescript
// Standard chess ELO formula:
expectedScore = 1 / (1 + 10^((opponentElo - playerElo) / 400))
newRating = oldRating + K × (actualScore - expectedScore)

// Where:
// K = 32 (standard chess K-factor)
// actualScore = 1 (win), 0.5 (draw), 0 (loss)
```

### Database Abstraction
- **Single Interface**: `query()`, `run()`, `get()` functions work with both SQLite and PostgreSQL
- **Automatic Conversion**: SQL parameter placeholders (`?`) converted to PostgreSQL style (`$1, $2, ...`)
- **Environment Detection**: Uses PostgreSQL in production, SQLite in development

### State Management
- **React Context**: Global auth state and socket connection
- **Local State**: Component-level UI state
- **Server State**: Game state managed on backend for authority

---

## 💾 Database Schema

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    elo INTEGER DEFAULT 800,
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Matches Table
```sql
CREATE TABLE matches (
    id TEXT PRIMARY KEY,
    white_player_id TEXT NOT NULL,
    black_player_id TEXT NOT NULL,
    white_player_name TEXT NOT NULL,
    black_player_name TEXT NOT NULL,
    result TEXT NOT NULL,            -- 'win' or 'draw'
    winner_id TEXT,                  -- NULL for draws
    pgn TEXT NOT NULL,               -- JSON with moves and ELO data
    white_elo_before INTEGER NOT NULL,
    black_elo_before INTEGER NOT NULL,
    white_elo_after INTEGER NOT NULL,
    black_elo_after INTEGER NOT NULL,
    casual INTEGER DEFAULT 0,        -- 0 = ranked, 1 = casual
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(white_player_id) REFERENCES users(id),
    FOREIGN KEY(black_player_id) REFERENCES users(id),
    FOREIGN KEY(winner_id) REFERENCES users(id)
);
```

### Friends Table
```sql
CREATE TABLE friends (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    friend_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(friend_id) REFERENCES users(id),
    UNIQUE(user_id, friend_id)
);
```

---

## 🎓 Learning Outcomes

This project demonstrates modern software development through **AI-assisted collaboration**:

### AI Collaboration & Prompt Engineering
- **Effective AI Communication**: Iterative problem-solving through detailed prompts and technical discussions
- **Requirement Translation**: Converting high-level ideas into implementable technical specifications
- **Debugging Partnership**: Identifying and fixing complex bugs through systematic AI-assisted troubleshooting
- **Code Review with AI**: Understanding code structure, patterns, and best practices through guided learning

### System Design & Architecture
- **Full-Stack Understanding**: Comprehending how frontend, backend, and database layers interact
- **Real-Time Systems**: Grasping WebSocket communication patterns and event-driven architecture
- **Database Design**: Understanding relational schemas, queries, and data relationships
- **Authentication Flow**: Learning JWT tokens, password hashing, and security principles

### Modern Development Workflows
- **Version Control**: Git workflow with commits, branches, and GitHub collaboration
- **Cloud Deployment**: CI/CD pipelines with Vercel (frontend) and Render (backend)
- **Environment Management**: Configuration, environment variables, and production vs development
- **API Design**: RESTful endpoints and real-time communication patterns

### Problem-Solving & Technical Decision-Making
- **Bug Analysis**: Root cause analysis and systematic debugging approaches
- **Performance Optimization**: Understanding race conditions, timer synchronization, and state management
- **Security Awareness**: Learning about SQL injection, XSS, authentication, and data protection
- **Trade-off Evaluation**: Balancing features, complexity, and maintainability

### Technology Stack Comprehension
- **Frontend**: React component architecture, TypeScript type safety, state management
- **Backend**: Node.js/Express server architecture, Socket.IO real-time communication
- **Database**: PostgreSQL schema design, query optimization
- **Algorithms**: ELO rating calculation, AI move generation logic

**Key Takeaway**: Successfully orchestrated a complex full-stack application by combining AI capabilities with system design thinking, demonstrating that modern development is about **understanding, decision-making, and effective collaboration** rather than just writing code from scratch.

---

## 🔮 Future Enhancements

- **Chess Variants**: Fischer Random, Three-Check, King of the Hill
- **Tournament System**: Bracket-style competitions
- **Puzzle Trainer**: Daily chess puzzles for practice
- **Opening Explorer**: Study common opening moves
- **Game Analysis**: Post-game analysis with best moves
- **Chat System**: In-game messaging
- **Spectator Mode**: Watch live games
- **Mobile App**: React Native iOS/Android apps
- **Email Verification**: Account security enhancement
- **Password Reset**: Forgot password flow
- **Profile Customization**: Avatars, themes, bio

---

## 👨‍💻 Author

**Emre Gönüldaş**
- GitHub: [@EmreGonultas](https://github.com/EmreGonultas)
- Education: Industrial Engineering, Medeniyet Üniversitesi, İstanbul, Türkiye
- Portfolio Project: Full-stack development showcase

---

## 📝 License

**Educational Use Only - Non-Commercial License**

This project is a personal portfolio piece created to demonstrate full-stack development skills. 

**Permissions:**
- ✅ View and study the code for educational purposes
- ✅ Fork and modify for learning purposes
- ✅ Use as inspiration for your own projects

**Restrictions:**
- ❌ Commercial use is **NOT permitted**
- ❌ Monetization is **NOT allowed**
- ❌ Redistribution for profit is **prohibited**

This code is provided as-is for educational and learning purposes only. If you wish to use this project commercially, please contact the author.

---

## 🙏 Acknowledgments

- Chess.js library for move validation
- Socket.IO for real-time communication
- Vercel and Render for hosting
- Open-source community for React, TypeScript, and other tools

---

## 📞 Support

For questions or issues:
1. Check the [Issues](https://github.com/EmreGonultas/chess-elo/issues) page
2. Review the code comments
3. Contact the author

**Last Updated:** December 2025
