<div>
  <h1>ConnectX</h1>
  <p><em>Conversations, Simplified.</em></p>

  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.IO" />
    <img src="https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" alt="Build Passing" />
    <img src="https://img.shields.io/badge/Coverage-80%25%2B-brightgreen?style=flat-square" alt="Coverage 80%+" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" />
    <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
  </p>
  <p>
    <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square" alt="Version 1.0.0" />
    <img src="https://img.shields.io/github/last-commit/yourusername/connectx?style=flat-square" alt="Last Commit" />
    <img src="https://img.shields.io/github/repo-size/yourusername/connectx?style=flat-square" alt="Repo Size" />
  </p>
</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [API Documentation](#api-documentation)
9. [Socket.IO Events](#socketio-events)
10. [Security](#security)
11. [Background Jobs](#background-jobs)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Screenshots](#screenshots)
15. [Contributing](#contributing)
16. [Known Issues](#known-issues)
17. [Roadmap](#roadmap)
18. [License](#license)
19. [Author](#author)

---

## Overview

**ConnectX** is a feature-rich, real-time communication platform designed to provide a seamless, secure, and highly interactive messaging experience. At its core, ConnectX aims to solve the problem of fragmented digital communication by combining standard instant messaging features with intelligent integrations and robust privacy controls.

Built specifically for students, agile teams, and friend groups, it bridges the gap between casual chat apps and professional collaboration tools. What sets ConnectX apart from platforms like WhatsApp, Telegram, or Discord is its unique blend of features: AI-driven smart capabilities, a PIN-locked message vault for ultimate privacy, engaging gamification elements to keep interactions lively, and rich integrations like Spotify and GitHub.


---

## Features

### 💬 Core Messaging
- **Real-time 1-on-1 and group messaging via WebSockets** - Instant communication with minimal latency.
- **Message reactions, reply threads, read receipts (✓ ✓✓)** - Expressive and organized chat experiences.
- **Typing indicators with animated dot display** - Real-time feedback when a user is typing.
- **Soft message deletion with "Message deleted" placeholder** - Graceful handling of removed content.
- **Online/offline presence with last seen timestamps** - Stay aware of contact availability.

### 🔐 Privacy & Security
- **🔒 Message Vault** — PIN-lock conversations, hidden from the main list for sensitive chats.
- **👻 Ghost Mode** — Browse invisibly, no online or last seen status updates.
- **End-to-end encrypted Secret Chat mode (per-session key)** - Maximum security for private conversations.
- **JWT auth with HTTP-only cookies (XSS resistant)** - Robust session management.
- **Refresh token rotation with reuse detection** - Prevents token theft and replay attacks.

### 🎙️ Rich Media
- **🎤 Voice Messages** — Record audio, visualize as an animated waveform.
- **🖼️ Image sharing with Cloudinary CDN delivery** - Fast, optimized media handling.
- **📍 Live Location Sharing** — Real-time map integration with Leaflet.js.
- **🎭 Custom Sticker Packs** — Upload and share sticker collections per group.

### ✍️ Message Composition
- **⏰ Message Scheduling** — Send messages at a predefined future date and time.
- **Markdown Formatting** — Support for **bold**, _italic_, `code`, and > blockquotes.
- **😄 Emoji Picker with emoji-mart** - Comprehensive emoji support.
- **🔗 Link Previews with AI-generated 2-line summaries (Claude API)** - Smart, context-aware link rendering.

### 👥 Groups & Collaboration
- **📊 Native Polls with real-time animated vote bars** - Quick consensus building in groups.
- **📌 Pinned Messages with a pin board drawer** - Easy access to important group announcements.
- **✅ Shared Group To-Do List with live collaborative updates** - Task management right within the chat.
- **Role-based permissions (Admin, Moderator, Member)** - Granular control over group administration.
- **Group events with RSVP** - Built-in event coordination.

### 🎮 Gamification
- **🔥 Daily Streak Counter between conversation partners** - Encourages daily interaction.
- **💛 Vibe Meter** — Relationship score dynamically calculated based on message frequency.
- **🗓️ Weekly Recap card every Sunday with personal stats** - A fun review of your communication patterns.
- **🎉 Message Milestones with confetti celebrations** - Rewarding long-term engagement.
- **🏅 Profile Badges (Early Adopter, Night Owl, Chatterbox, etc.)** - Unlockable achievements.

### 🔔 Smart Notifications
- **🌙 Focus Mode** — Snooze all notifications with auto-resume capability.
- **⭐ Priority Contacts** — Allow crucial contacts to break through Focus Mode (max 5).
- **📬 Smart Notification Digest** — Hourly group summaries instead of constant pinging.
- **🔔 Keyword Alerts** — Notify only when specific predefined words are mentioned.

### 🔗 Integrations
- **🎵 Spotify** — Share now-playing tracks with a 30s inline audio preview.
- **🐙 GitHub** — Rich interactive cards for PRs, Issues, and Repositories.
- **🗺️ OpenStreetMap** — Free, reliable map tiles for location sharing.
- **☁️ Cloudinary** — Scalable media storage and delivery network.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18 (Vite), TailwindCSS, Framer Motion, Zustand |
| **UI Components** | Radix UI primitives, react-markdown, emoji-mart |
| **Backend** | Node.js 18, Express.js, Socket.IO |
| **Database** | MongoDB (Atlas), Mongoose ODM |
| **Authentication** | JWT (access + refresh), bcrypt, HTTP-only cookies |
| **File Storage** | Cloudinary (images, audio, stickers) |
| **AI** | Anthropic Claude API (claude-sonnet-4-20250514) |
| **Maps** | Leaflet.js + OpenStreetMap Nominatim (free) |
| **Music** | Spotify Web API (OAuth 2.0) |
| **Scheduling** | node-cron (background jobs) |
| **DevOps** | Docker, docker-compose, GitHub Actions CI |
| **Testing** | Jest, Supertest, Vitest, React Testing Library, Playwright |

---

## Architecture

```text
  ┌─────────────┐     HTTPS/WSS      ┌──────────────────┐
  │   React     │◄──────────────────►│  Express.js API  │
  │   (Vite)    │                    │  + Socket.IO     │
  └─────────────┘                    └────────┬─────────┘
                                              │
                    ┌───────────────┬─────────┴────┐
                    ▼               ▼              ▼
              ┌──────────┐  ┌────────────┐  ┌──────────────┐
              │ MongoDB  │  │ Cloudinary │  │ Spotify API  │
              │ (Atlas)  │  │ (Media CDN)│  │ (OAuth 2.0)  │
              └──────────┘  └────────────┘  └──────────────┘
```

**Socket.IO Event Flow:**

```text
  CLIENT                          SERVER
    │                               │
    │──── send_message ────────────►│
    │                               │── saves to MongoDB
    │                               │── checks keyword alerts
    │                               │── checks milestones
    │◄─── new_message (broadcast) ──│
    │◄─── milestone_reached ────────│ (if applicable)
    │◄─── keyword_alert ────────────│ (if applicable)
```

---

## Project Structure

```text
connectx/
├── 📁 client/                    # React frontend (Vite)
│   ├── 📁 public/                # Static assets
│   ├── 📁 src/
│   │   ├── 📁 components/        # Reusable UI components
│   │   │   ├── chat/             # MessageBubble, MessageInput, etc.
│   │   │   ├── layout/           # Sidebar, Header, Drawer
│   │   │   ├── media/            # VoiceMessage, LocationBubble, etc.
│   │   │   ├── gamification/     # StreakBadge, VibeMeter, RecapCard
│   │   │   └── ui/               # Button, Modal, Toast, Avatar
│   │   ├── 📁 pages/             # Login, Register, Chat, Profile, Vault
│   │   ├── 📁 context/           # AuthContext, SocketContext, ThemeContext
│   │   ├── 📁 hooks/             # useChat, useSocket, useAuth, useVault
│   │   ├── 📁 store/             # Zustand stores (messages, conversations)
│   │   ├── 📁 utils/             # formatTime, detectURLs, markdown, cn()
│   │   └── 📁 assets/            # Icons, notification sounds
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── 📁 server/                    # Node.js + Express backend
│   ├── 📁 controllers/           # Route handler logic
│   │   ├── authController.js
│   │   ├── messageController.js
│   │   ├── conversationController.js
│   │   ├── vaultController.js
│   │   ├── pollController.js
│   │   └── integrationController.js
│   ├── 📁 models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Message.js
│   │   ├── Conversation.js
│   │   ├── StickerPack.js
│   │   ├── TodoList.js
│   │   ├── WeeklyRecap.js
│   │   └── LinkPreviewCache.js
│   ├── 📁 routes/                # Express routers
│   ├── 📁 middleware/            # auth, error, upload, rateLimit
│   ├── 📁 socket/                # Socket.IO event handlers
│   │   ├── socket.js             # Main connection handler
│   │   ├── messageEvents.js
│   │   ├── presenceEvents.js
│   │   └── locationEvents.js
│   ├── 📁 jobs/                  # node-cron background jobs
│   │   ├── pollCloser.js
│   │   ├── streakUpdater.js
│   │   ├── badgeEvaluator.js
│   │   ├── weeklyRecap.js
│   │   └── scheduledMessages.js
│   ├── 📁 config/                # DB, Cloudinary, badges config
│   ├── 📁 utils/                 # Token generation, geocode, waveform
│   ├── 📁 scripts/               # migrate.js, seed.js
│   └── server.js                 # Entry point
│
├── 📁 e2e/                       # Playwright E2E tests
├── 📁 .github/workflows/         # CI/CD pipelines
├── docker-compose.yml
├── Dockerfile.client
├── Dockerfile.server
├── .env.example                  # Template for all env vars
├── .gitignore
├── package.json                  # Root scripts
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 6.0 (local) or MongoDB Atlas account
- Git >= 2.38

### 1 — Clone the Repository
```bash
git clone https://github.com/yourusername/connectx.git
cd connectx
```

### 2 — Environment Setup
```bash
cp .env.example .env
# Open .env and fill in all required values
# See Environment Variables section for details
```

### 3 — Install Dependencies
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 4 — Database Setup
```bash
# Option A: Local MongoDB
mongod --dbpath ./data/db

# Option B: MongoDB Atlas
# Add your Atlas URI to .env as MONGODB_URI
```

### 5 — Run Database Migration
```bash
cd server && npm run migrate
# Safely adds new schema fields to existing documents
```

### 6 — Start Development Servers
```bash
# From root directory (runs both concurrently)
npm run dev

# Or separately:
cd server && npm run dev   # http://localhost:5000
cd client && npm run dev   # http://localhost:5173
```

### 7 — Run with Docker (Recommended)
```bash
# Build and start all services
docker-compose up --build

# Stop
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

---

## Environment Variables

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| **GROUP: App** | | | |
| `PORT` | Yes | Server port | `5000` |
| `NODE_ENV` | Yes | Environment | `development` |
| `CLIENT_URL` | Yes | Frontend origin | `http://localhost:5173` |
| **GROUP: Database** | | | |
| `MONGODB_URI` | Yes | MongoDB connection URI | `mongodb://localhost:27017/connectx` |
| **GROUP: Authentication** | | | |
| `JWT_ACCESS_SECRET` | Yes | Access token secret (32+ chars) | `<random string>` |
| `JWT_REFRESH_SECRET` | Yes | Refresh token secret (32+ chars) | `<random string>` |
| `JWT_ACCESS_EXPIRY` | Yes | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRY` | Yes | Refresh token TTL | `7d` |
| **GROUP: Cloudinary** | | | |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloud name from dashboard | `mycloud` |
| `CLOUDINARY_API_KEY` | Yes | API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Yes | API secret | `abc123xyz` |
| **GROUP: Claude AI** | | | |
| `CLAUDE_API_KEY` | Yes | From console.anthropic.com | `sk-ant-...` |
| **GROUP: Spotify** | | | |
| `SPOTIFY_CLIENT_ID` | Yes | From Spotify Developer Dashboard | `abc123` |
| `SPOTIFY_CLIENT_SECRET` | Yes | Client secret | `xyz789` |
| `SPOTIFY_REDIRECT_URI` | Yes | Must match dashboard setting | `http://localhost:5000/api/integrations/spotify/callback` |
| **GROUP: Security** | | | |
| `BCRYPT_SALT_ROUNDS` | No | bcrypt rounds (higher = slower) | `12` |
| `RATE_LIMIT_WINDOW` | No | Rate limit window (ms) | `900000` |
| `RATE_LIMIT_MAX` | No | Max requests per window | `100` |
| `VAULT_JWT_SECRET` | Yes | Vault session JWT secret | `<random string>` |
| `VAULT_JWT_EXPIRY` | Yes | Vault session TTL | `15m` |
| `CRON_SECRET` | No | Secure cron endpoint (if needed) | `<random string>` |
| **GROUP: Push Notifications** | | | |
| `VAPID_PUBLIC_KEY` | No | Web Push VAPID public key | `<generated>` |
| `VAPID_PRIVATE_KEY` | No | Web Push VAPID private key | `<generated>` |

> **Note:** NEVER commit your `.env` file. It is in `.gitignore`. Rotate all secrets before deploying to production.

---

## API Documentation

| Method | Endpoint | Auth Required | Description |
| --- | --- | --- | --- |
| **Auth Routes** | | | |
| `POST` | `/api/auth/register` | No | Register a new user |
| `POST` | `/api/auth/login` | No | Login and receive tokens |
| `POST` | `/api/auth/logout` | Yes | Clear auth cookies |
| `POST` | `/api/auth/refresh` | No (Requires Cookie) | Get a new access token |
| **Message Routes** | | | |
| `GET` | `/api/messages/:conversationId`| Yes | Get message history |
| `POST` | `/api/messages` | Yes | Send a new message |
| `PATCH`| `/api/messages/:messageId` | Yes | Edit/delete a message |
| **Conversation Routes**| | | |
| `GET` | `/api/conversations` | Yes | List user conversations |
| `POST` | `/api/conversations` | Yes | Create 1-on-1 or group chat |
| **Vault Routes** | | | |
| `POST` | `/api/vault/setup` | Yes | Configure vault PIN |
| `POST` | `/api/vault/unlock` | Yes | Verify PIN, get vault session |
| `GET` | `/api/vault/conversations` | Vault JWT | List locked conversations |
| **Poll Routes** | | | |
| `POST` | `/api/polls` | Yes | Create a new poll |
| `POST` | `/api/polls/:pollId/vote` | Yes | Cast a vote |
| **Todo Routes** | | | |
| `POST` | `/api/todos` | Yes | Add item to shared todo list |
| `PATCH`| `/api/todos/:todoId` | Yes | Toggle completion status |
| **User Routes** | | | |
| `GET` | `/api/users/me` | Yes | Get current user profile |
| `PATCH`| `/api/users/me` | Yes | Update profile settings |
| **Integration Routes** | | | |
| `GET` | `/api/integrations/spotify/callback`| Yes | Spotify OAuth callback |
| `GET` | `/api/integrations/links/preview`| Yes | Generate AI link summary |
| **Location Routes** | | | |
| `POST` | `/api/location/share` | Yes | Broadcast live location |

---

## Socket.IO Events

**Table 1 — Client → Server (Emitted by frontend):**

| Event | Payload | Description |
| --- | --- | --- |
| `join_conversation` | `{ conversationId }` | Subscribes client to a chat room |
| `send_message` | `{ conversationId, text, ... }` | Emits a new message |
| `typing_start` | `{ conversationId }` | User started typing |
| `typing_stop` | `{ conversationId }` | User stopped typing |
| `message_read` | `{ messageId, conversationId }` | Marks a message as read |
| `add_reaction` | `{ messageId, emoji }` | Adds a reaction to a message |
| `location_update` | `{ lat, lng, conversationId }` | Sends live location coordinates |
| `stop_location_share`| `{ conversationId }` | Ends location broadcasting |
| `vote_poll` | `{ pollId, optionIndex }` | Submits a poll vote |

**Table 2 — Server → Client (Emitted by backend):**

| Event | Payload | Triggered When |
| --- | --- | --- |
| `new_message` | `MessageObject` | A new message is sent to a joined room |
| `typing_start` | `{ userId }` | Another user starts typing |
| `typing_stop` | `{ userId }` | Another user stops typing |
| `message_read` | `{ messageId, userId }` | A recipient reads a message |
| `reaction_added` | `{ messageId, emoji, userId }` | Someone reacts to a message |
| `presence_update` | `{ userId, status, lastSeen }`| A user connects/disconnects |
| `location_update` | `{ userId, lat, lng }` | Receiving live location data |
| `poll_updated` | `PollObject` | Poll vote counts change |
| `milestone_reached` | `{ milestone, reward }` | Users hit a messaging milestone |
| `badge_earned` | `{ badgeName, icon }` | A new profile badge is unlocked |
| `streak_updated` | `{ currentStreak }` | Daily streak counter increments |
| `keyword_alert` | `{ messagePreview, room }` | Monitored keyword is mentioned |
| `digest_notification`| `[NotificationObjects]` | Hourly focus mode digest delivery|
| `message_preview_ready`| `{ messageId, preview }` | AI link preview generation finishes|

---

## Security

**Authentication:**
- Passwords hashed with bcrypt (saltRounds: 12)
- JWT stored in HTTP-only, Secure, SameSite=Strict cookies
- Refresh token rotation — old token invalidated after use
- Reuse detection: if old refresh token reused, all sessions revoked
- Vault uses a separate short-lived JWT (15 min, memory-only on client)

**Data Protection:**
- Input validation on all POST/PATCH routes (express-validator)
- MongoDB query sanitization (express-mongo-sanitize)
- Helmet.js sets all recommended HTTP security headers
- CORS locked to CLIENT_URL only (no wildcard)
- All user-generated content sanitized with DOMPurify before render

**Rate Limiting:**
- Global: 100 requests / 15 min per IP (express-rate-limit)
- Auth routes stricter: 10 requests / 15 min per IP
- Socket.IO: connection throttling per userId

**Media:**
- Cloudinary signed uploads (server-side signature required)
- File type validation: images (jpg/png/webp), audio (webm/ogg), max 10MB
- Sticker pack: max 30 stickers per pack, 500KB per sticker

**API Keys:**
- Claude and Spotify keys never sent to frontend
- GitHub API calls proxied through backend (rate limit management)
- All secrets loaded from `.env`, never hardcoded

**Socket.IO:**
- All socket connections authenticated with JWT middleware
- userId verified server-side before every emit action
- Conversation membership validated before message delivery

---

## Background Jobs

| Job | Schedule | Description | File |
| --- | --- | --- | --- |
| Poll Closer | Every 1 min | Closes expired polls | `jobs/pollCloser.js` |
| Scheduled Messages | Every 1 min | Delivers scheduled messages | `jobs/scheduledMessages.js` |
| Focus Mode Ender | Every 1 min | Ends expired focus mode sessions | `jobs/focusModeEnder.js` |
| Streak Updater | Daily 00:01 | Recalculates streak counts | `jobs/streakUpdater.js` |
| Vibe Score | Daily 00:05 | Updates conversation vibe scores | `jobs/vibeScorer.js` |
| Badge Evaluator | Daily 02:00 | Awards newly earned badges | `jobs/badgeEvaluator.js` |
| Weekly Recap | Sun 08:00 | Generates and delivers recap cards | `jobs/weeklyRecap.js` |
| Link Cache Cleanup | Daily 03:00 | Removes 24h+ old link previews | `jobs/linkCacheCleanup.js` |
| Notification Digest| Every 60 min | Flushes buffered group notifs | `jobs/notificationDigest.js` |

---

## Testing

```bash
# Run all backend unit + integration tests
cd server && npm test

# Run with coverage report
cd server && npm run test:coverage

# Run frontend tests
cd client && npm test

# Run E2E tests (requires both servers running)
npm run test:e2e

# Run full suite
npm run test:all
```

**Coverage targets:** Lines 80% | Functions 80% | Branches 75%

---

## Deployment

**Docker Production:**
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

**Manual (VPS / EC2):**
```bash
# Server
cd server
NODE_ENV=production npm start

# Client (build static files)
cd client
npm run build
# Serve /dist with nginx or serve
```

**MongoDB Atlas:**
- Use `MONGODB_URI` from Atlas connection string
- Whitelist server IP in Atlas Network Access
- Enable Atlas backups (recommended)

**Recommended Hosting Pairs:**
- **Frontend** : Vercel / Netlify (free tier)
- **Backend**  : Railway / Render / EC2
- **Database** : MongoDB Atlas (free M0 cluster)
- **Media**    : Cloudinary (free tier)

---

## Screenshots

<!-- 1. Login Page -->
<!-- ![Login Page](docs/screenshots/login.png) -->

<!-- 2. Main Chat View (dark mode) -->
<!-- ![Main Chat View](docs/screenshots/chat-dark.png) -->

<!-- 3. Voice Message with Waveform -->
<!-- ![Voice Message](docs/screenshots/voice-message.png) -->

<!-- 4. Poll in Group Chat -->
<!-- ![Poll in Group Chat](docs/screenshots/poll.png) -->

<!-- 5. Vault PIN Entry Screen -->
<!-- ![Vault PIN Entry](docs/screenshots/vault-pin.png) -->

<!-- 6. Weekly Recap Card -->
<!-- ![Weekly Recap](docs/screenshots/weekly-recap.png) -->

<!-- 7. Badge Collection Page -->
<!-- ![Badge Collection](docs/screenshots/badges.png) -->

<!-- 8. Spotify Now Playing Card -->
<!-- ![Spotify Now Playing](docs/screenshots/spotify-card.png) -->

*(Screenshots coming soon)*

---

## Contributing

We welcome contributions! Please follow this guide:

1. Fork and clone the repository
2. Create branch: `git checkout -b feat/your-feature-name`
3. Follow **Conventional Commits** (see below)
4. Write tests for new features
5. Run full test suite: `npm run test:all`
6. Open a Pull Request with the description template

**Commit Format (Conventional Commits):**
- `feat(scope): add voice message waveform`
- `fix(auth): resolve refresh token cookie expiry`
- `docs(readme): update environment variables table`
- `test(socket): add typing indicator event tests`
- `chore(deps): upgrade socket.io to 4.7.2`
- `refactor(vault): extract pin validation to utility`

---

## Known Issues
- **Safari:** Web Audio API MediaRecorder uses a different codec (requires polyfill for cross-browser playback).
- **Mobile Firefox:** Page Visibility API has limited support affecting vault auto-lock reliability.
- **Spotify:** Free accounts utilizing the now-playing API require a Premium subscription for full functionality.

---

## Roadmap

- ✅ Phase 1: Core messaging, auth, real-time
- ✅ Phase 2: Voice, scheduling, markdown, stickers
- ✅ Phase 3: Polls, pins, to-do lists
- ✅ Phase 4: Gamification (streaks, badges, recap)
- ✅ Phase 5: Smart notifications
- ✅ Phase 6: Integrations (Spotify, GitHub, maps)
- 🔄 Phase 7: AI smart replies (in progress)
- 📋 Phase 8: Mobile app (React Native)
- 📋 Phase 9: Video/audio calls (WebRTC)
- 📋 Phase 10: Public API + webhooks

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Farhan** — Founder, FRK Productions  
GitHub: [@yourusername](https://github.com/yourusername) | LinkedIn: [@yourprofile](https://linkedin.com/in/yourprofile)
