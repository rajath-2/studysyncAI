# StudySync AI — Comprehensive Project Documentation

> **Generated:** 2026-06-07  
> **Project:** StudySync AI — AI-powered study group matching platform  
> **Root:** `/home/rajath/projects/studysyncAI`

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Critical Architectural Decisions](#critical-architectural-decisions)
4. [Entry Point & Core Setup](#entry-point--core-setup)
5. [Route Mounting](#route-mounting)
6. [Backend Middleware](#backend-middleware)
7. [Backend Configuration](#backend-configuration)
8. [Database Schema](#database-schema)
9. [AI System](#ai-system)
10. [Compatibility Scoring System](#compatibility-scoring-system)
11. [Authentication](#authentication)
12. [Frontend Navigation](#frontend-navigation)
13. [Frontend State Management](#frontend-state-management)
14. [Frontend API Layer](#frontend-api-layer)
15. [Frontend UI Patterns](#frontend-ui-patterns)
16. [Environment Variables](#environment-variables)
17. [Development Conventions](#development-conventions)
18. [Critical Gotchas & Footguns](#critical-gotchas--footguns)
19. [How to Run](#how-to-run)
20. [Tests](#tests)
21. [AI Model Summary](#ai-model-summary)
22. [Deployment](#deployment)

---

## Project Overview

**StudySync AI** is a full-stack AI-powered study group matching platform. It helps students find and create study groups based on their preferences, subjects, availability, and learning goals. The platform uses AI (Groq API with Llama 3.3-70B) to generate personalized group recommendations and a math-based compatibility scoring system for instant match display.

**Purpose:** Connect students into optimal study groups based on shared goals, learning styles, schedules, and subjects.

**Alternative Names:** mini-prj, StudySync AI

---

## Tech Stack

### Backend

| Technology | Use Case |
|---|---|
| **FastAPI** (Python 3.12) | REST API framework — async-capable, auto-generated OpenAPI docs |
| **Supabase** (PostgreSQL + pgvector) | Primary database — managed Postgres with vector extension for embeddings |
| **Groq API** | AI inference — powers group matching recommendations via Llama 3.3-70B |
| **python-jose + passlib[bcrypt]** | JWT token creation/validation + password hashing |
| **Alembic** | Database migration management |
| **pydantic + pydantic-settings** | Request/response validation + environment config |
| **httpx / websockets** | HTTP client + WebSocket support |
| **SQLAlchemy (advisory)** | Listed in deps but not actively used (Supabase JS client used instead) |

### Frontend

| Technology | Use Case |
|---|---|
| **Next.js 16.2.6** (App Router) | React framework with server components, file-based routing |
| **React 19.2.4** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS 4** | Utility-first CSS with `@theme` directives |
| **Framer Motion** | Animations — page transitions, button hover, staggered lists |
| **Zustand + persist middleware** | Client-side state management (auth tokens & user data) |
| **@supabase/supabase-js** | Supabase client for real-time subscriptions |
| **Lucide React** | Icon library |
| **clsx + tailwind-merge** | Class name merging utility |

---

## Critical Architectural Decisions

1. **Supabase JS client over SQLAlchemy** — The backend uses the Supabase JavaScript-style client (`supabase-py`) for all database operations rather than SQLAlchemy ORM. SQLAlchemy and asyncpg are listed as dependencies but are only used by Alembic for migrations. This means raw Supabase table operations with chained filters.

2. **AI matching is a two-tier system:**
   - **Compatibility Service (`compatibility_service.py`)** — Fast math-based scoring (0-100) used for instant display on group discovery. Scores are deterministic and computed client-side or server-side.
   - **Matching Service (`matching_service.py`)** — AI-powered recommendations using Groq API. Called on-demand for personalized recommendations. Slower but richer.

3. **Auth bypasses Supabase Auth** — Despite using Supabase as the database, authentication is custom JWT-based (python-jose + bcrypt), not Supabase Auth. This means no RLS policy reliance — the service role key is used for all DB operations.

4. **Rate limiting is in-memory** — The `RateLimiter` class stores request timestamps in a `defaultdict(list)` in process memory. All data resets on server restart and doesn't scale across multiple instances.

5. **Feedback embeddings are a placeholder** — The `feedback_embeddings` table exists in the schema and the `EmbeddingService` exists in code, but the actual pgvector embedding generation returns a `[0.0] * 1024` placeholder. The matching service retrieves feedback by hardcoded criteria (rating >= 4) rather than vector similarity search.

6. **Two auth stores** — The frontend has TWO Zustand stores for auth: `src/store/auth.ts` (unused) and `src/stores/authStore.ts` (actually used via `useAuthStore`). The `useAuth` hook wraps `authStore`.

7. **Real-time messaging via Supabase Realtime** — Messages use Supabase's PostgreSQL change subscription (`postgres_changes` on the `messages` table) rather than WebSocket from the backend.

---

## Entry Point & Core Setup

### Backend Entry Point — `backend/app/main.py`

```python
# Import order:
# 1. FastAPI & CORSMiddleware
# 2. Settings from config
# 3. All 8 routers from app.routers
# 4. Create FastAPI instance
# 5. Add CORS middleware (before routers)
# 6. Include all routers under "/v1" prefix
# 7. Health check endpoints
```

**Middleware pipeline (exact order):**
1. `CORSMiddleware` — CORS handling

**Gotchas:**
- CORS origins differ by environment: localhost:3000/3001 for dev, `https://studysync.ai` for production
- There is NO custom middleware — no auth middleware at the app level. Auth is per-endpoint via `Depends(get_current_user)`.
- No error handler middleware is registered. All error handling is via `HTTPException`.
- No request logging middleware.

### Frontend Entry Point — `frontend/src/app/layout.tsx`

- Wraps all pages in `<Navbar>` component
- Sets `dark` class on `<html>` element
- Uses Geist Sans + Geist Mono fonts

---

## Route Mounting

All routers are mounted under the `/v1` prefix with no per-router sub-prefixing (each router internally defines its own prefix).

| Prefix | Router File | Internal Prefix | Notes |
|---|---|---|---|
| `/v1/auth/` | `app/routers/auth.py` | `/auth` | register, login, logout, me |
| `/v1/groups/` | `app/routers/groups.py` | `/groups` | CRUD, discover, compatibility, members, requests |
| `/v1/messages/` | `app/routers/messages.py` | `/messages` | per-group get + send |
| `/v1/sessions/` | `app/routers/sessions.py` | `/sessions` | CRUD, upcoming, complete |
| `/v1/users/` | `app/routers/users.py` | `/users` | profile + preferences |
| `/v1/feedback/` | `app/routers/feedback.py` | `/feedback` | submit + history + summary |
| `/v1/notifications/` | `app/routers/notifications.py` | `/notifications` | list, mark read |
| `/v1/matching/` | `app/routers/matching.py` | `/matching` | recommend, suggest-merge, regenerate |
| `/health` | inline in `main.py` | — | health check |
| `/ready` | inline in `main.py` | — | readiness check |

### Complete Registered Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/v1/auth/register` | No | Register new user |
| POST | `/v1/auth/login` | No | Login user |
| POST | `/v1/auth/logout` | No | Logout (no-op) |
| GET | `/v1/auth/me` | Yes | Get current user profile |
| GET | `/v1/groups/my` | Yes | Get user's groups |
| GET | `/v1/groups/` | Yes | List all groups (with subject/status/limit/offset) |
| POST | `/v1/groups/` | Yes | Create group |
| GET | `/v1/groups/discover` | Yes | Discover groups (excludes user's, sorted by compatibility) |
| GET | `/v1/groups/compatibility/{id}` | Yes | Compatibility score for a group |
| GET | `/v1/groups/{id}` | Yes | Get group details |
| PATCH | `/v1/groups/{id}` | Yes (admin) | Update group |
| DELETE | `/v1/groups/{id}` | Yes (admin) | Delete group |
| GET | `/v1/groups/{id}/members` | Yes | Get accepted members |
| GET | `/v1/groups/{id}/pending-requests` | Yes (admin) | Get pending join requests |
| POST | `/v1/groups/{id}/join` | Yes | Request to join group |
| POST | `/v1/groups/{id}/leave` | Yes | Leave group |
| POST | `/v1/groups/{id}/accept/{user_id}` | Yes (admin) | Accept join request |
| POST | `/v1/groups/{id}/reject/{user_id}` | Yes (admin) | Reject member |
| DELETE | `/v1/groups/{id}/requests/{user_id}` | Yes (admin) | Reject pending request |
| PATCH | `/v1/groups/{id}/close` | Yes (admin) | Close/archive group |
| GET | `/v1/messages/{group_id}` | Yes (member) | Get messages (paginated via `before` param) |
| POST | `/v1/messages/{group_id}` | Yes (member) | Send message |
| GET | `/v1/sessions/upcoming` | Yes | Get upcoming sessions for user's groups |
| GET | `/v1/sessions/` | Yes | List sessions (filtered by group_id/status) |
| POST | `/v1/sessions/` | Yes (member) | Create session |
| GET | `/v1/sessions/{id}` | Yes | Get session details |
| PATCH | `/v1/sessions/{id}` | Yes (member) | Update session |
| DELETE | `/v1/sessions/{id}` | Yes (member) | Cancel session |
| PATCH | `/v1/sessions/{id}/complete` | No | Mark session completed |
| GET | `/v1/users/{id}` | Yes | Get user profile |
| PATCH | `/v1/users/{id}` | Yes (self) | Update user profile |
| GET | `/v1/users/{id}/preferences` | Yes | Get user preferences |
| PATCH | `/v1/users/{id}/preferences` | Yes (self) | Update preferences (marks onboarding complete) |
| POST | `/v1/feedback/` | Yes (member) | Submit feedback |
| GET | `/v1/feedback/{group_id}` | Yes (member) | Get group feedback |
| GET | `/v1/feedback/user/history` | Yes | Get user's feedback history |
| GET | `/v1/feedback/{group_id}/summary` | Yes (member) | Get average rating for group |
| GET | `/v1/notifications/` | Yes | List notifications |
| PATCH | `/v1/notifications/{id}/read` | Yes | Mark notification read |
| PATCH | `/v1/notifications/read-all` | Yes | Mark all notifications read |
| POST | `/v1/matching/recommend` | Yes | Get AI recommendations |
| POST | `/v1/matching/suggest-merge` | Yes (admin) | Suggest group merge |
| POST | `/v1/matching/regenerate` | Yes | Regenerate recommendations |
| GET | `/health` | No | Health check |
| GET | `/ready` | No | Readiness check |

---

## Backend Middleware

### Auth Flow

Auth is **not** a middleware; it's a dependency injected via `Depends(get_current_user)`.

1. Client sends JWT in `Authorization: Bearer <token>` header
2. `get_current_user` decodes the token using `jose.jwt.decode()` with `HS256`
3. Extracts `sub` claim as `user_id`
4. Returns `{"user_id": user_id}`
5. If token is missing, expired, or invalid → `401 Invalid token`

### Error Handling

- No global exception handler
- All errors are `HTTPException` raised inline in route handlers
- HTTP status codes used: 400, 401, 403, 404, 429, 500

### Rate Limiter

- `RateLimiter` class in `app/services/rate_limiter.py`
- Two instances: `rate_limiter` (50 req/min) and `rate_limiter_matching` (10 req/min)
- Only applied to `/matching/recommend` endpoint
- All timestamps stored in process memory → **resets on server restart**

---

## Backend Configuration

### Settings — `app/config.py`

Loaded from `.env` via `pydantic-settings`. Cached with `@lru_cache()`.

| Setting | Default | Description |
|---|---|---|
| `supabase_url` | `""` | Supabase project URL |
| `supabase_anon_key` | `""` | Supabase anonymous key |
| `supabase_service_key` | `""` | Supabase service role key |
| `supabase_db_password` | `""` | DB password for Alembic migrations |
| `groq_api_key` | `""` | Groq API key |
| `app_env` | `"development"` | Environment (`development` / `production`) |
| `log_level` | `"INFO"` | Logging level |
| `rate_limit_per_minute` | `50` | General rate limit |
| `rate_limit_matching_per_minute` | `10` | Matching endpoint rate limit |
| `jwt_secret` | `"dev-secret-change-in-production"` | JWT signing secret |
| `jwt_algorithm` | `"HS256"` | JWT algorithm |
| `access_token_expire_minutes` | `30` | Token expiry |

**Note:** `Config.extra = "ignore"` means extra env vars are silently ignored.

### Supabase Clients — `app/database.py`

Two clients:
- `get_supabase()` — uses `anon_key` (unauthenticated)
- `get_supabase_admin()` — uses `service_key` (bypasses RLS, used for ALL operations)

**All router code uses `get_supabase_admin()`** — there is no RLS enforcement.

### Alembic Database URL — `alembic/env.py`

Constructs a pooler connection URL from `supabase_url` + `supabase_db_password`:
```
postgresql://postgres:{password}@{host}.supabase.co:65432/postgres
```
Port 65432 is the Supabase connection pooler (not the default 5432).

### In-Memory Services

| Service | File | Persistence | Notes |
|---|---|---|---|
| `RateLimiter` | `app/services/rate_limiter.py` | In-memory | Resets on restart |
| `CacheService` | `app/services/cache_service.py` | In-memory | TTL-based, resets on restart |
| `EmbeddingService` | `app/services/embedding_service.py` | Groq API | Currently returns placeholder vectors |

---

## Database Schema

All tables are in Supabase (PostgreSQL). The schema is defined in two places:
1. `backend/scripts/setup-database.sql` — Run manually in Supabase SQL Editor
2. `backend/alembic/versions/001_initial_schema.py` — Migration (should be equivalent)

### Table: `users`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK, `gen_random_uuid()` |
| `email` | TEXT | Unique, NOT NULL |
| `password_hash` | TEXT | Nullable (OAuth users) |
| `full_name` | TEXT | NOT NULL |
| `avatar_url` | TEXT | Nullable |
| `bio` | TEXT | Nullable |
| `university` | TEXT | Nullable |
| `preferences` | JSONB | Default `{}` |
| `is_onboarding_complete` | BOOLEAN | Default `FALSE` |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |

**Indexes:** `idx_users_email` on `email`  
**Constraints:** `UNIQUE(email)`  
**Trigger:** `update_users_updated_at` before UPDATE

### Table: `groups`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | NOT NULL |
| `subject` | TEXT | NOT NULL |
| `description` | TEXT | Nullable |
| `max_members` | INTEGER | Default `6`, CHECK 3-6 |
| `goal` | TEXT | Nullable |
| `goal_deadline` | TIMESTAMPTZ | Nullable |
| `status` | TEXT | Default `'active'`, CHECK: active/closed/archived |
| `inactivity_days` | INTEGER | Default `14` |
| `created_by` | UUID | FK → users(id) |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |
| `updated_at` | TIMESTAMPTZ | Auto-updated via trigger |
| `study_format` | TEXT | Added later — virtual/in_person/hybrid |
| `session_timing` | JSONB | Added later — array of time slots |
| `meeting_frequency` | INTEGER | Added later — meetings per week |

**Indexes:** `idx_groups_status` on `status`, `idx_groups_subject` on `subject`  
**Trigger:** `update_groups_updated_at` before UPDATE

### Table: `group_members`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `group_id` | UUID | FK → groups(id) ON DELETE CASCADE |
| `user_id` | UUID | FK → users(id) ON DELETE CASCADE |
| `role` | TEXT | Default `'member'`, CHECK: admin/member |
| `status` | TEXT | Default `'pending'`, CHECK: pending/accepted/rejected |
| `joined_at` | TIMESTAMPTZ | Default `NOW()` |
| `join_message` | TEXT | Added later — intro message |
| `preferences_snapshot` | JSONB | Added later — user preferences at join time |

**Constraints:** `UNIQUE(group_id, user_id)`  
**Indexes:** `idx_group_members_user` on `user_id`, `idx_group_members_group` on `group_id`

### Table: `sessions`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `group_id` | UUID | FK → groups(id) ON DELETE CASCADE |
| `scheduled_at` | TIMESTAMPTZ | NOT NULL |
| `duration_minutes` | INTEGER | Default `60` |
| `meeting_link` | TEXT | Nullable |
| `status` | TEXT | Default `'scheduled'`, CHECK: scheduled/completed/cancelled |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

**No indexes defined beyond PK.**

### Table: `messages`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `group_id` | UUID | FK → groups(id) ON DELETE CASCADE |
| `user_id` | UUID | FK → users(id) ON DELETE SET NULL |
| `content` | TEXT | NOT NULL |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

**Indexes:** `idx_messages_group` on `group_id`  
**Supabase Realtime:** The `supabase_realtime` publication includes this table (`ALTER PUBLICATION supabase_realtime ADD TABLE messages`)

### Table: `feedback`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `group_id` | UUID | FK → groups(id) ON DELETE CASCADE |
| `user_id` | UUID | FK → users(id) ON DELETE CASCADE |
| `session_id` | UUID | FK → sessions(id) ON DELETE SET NULL, nullable |
| `rating` | INTEGER | CHECK 1-5, nullable |
| `what_worked` | TEXT | Nullable |
| `what_could_improve` | TEXT | Nullable |
| `is_submitted` | BOOLEAN | Default `FALSE` |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

**Constraints:** `UNIQUE(user_id, group_id, session_id)`  
**Indexes:** `idx_feedback_group` on `group_id`, `idx_feedback_user` on `user_id`

### Table: `notifications`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users(id) ON DELETE CASCADE |
| `type` | TEXT | NOT NULL |
| `title` | TEXT | NOT NULL |
| `message` | TEXT | Nullable |
| `is_read` | BOOLEAN | Default `FALSE` |
| `data` | JSONB | Default `{}` |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

**Indexes:** `idx_notifications_user` on `user_id` (filtered: `WHERE is_read = FALSE`)

### Table: `feedback_embeddings`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `feedback_id` | UUID | FK → feedback(id) ON DELETE CASCADE |
| `embedding` | JSONB | Nullable — placeholder, not vector type |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

**Note:** The embedding column is JSONB, not vector type. pgvector is enabled (`CREATE EXTENSION IF NOT EXISTS vector`) but unused in this table.

---

## AI System

### Matching Service — `app/services/matching_service.py`

**Flow:**
1. User calls `POST /v1/matching/recommend`
2. Rate limiter check (10 req/min per user)
3. Fetch user preferences from `users` table
4. Fetch relevant feedback (simplified: last 10 feedback entries with rating >= 4)
5. Get user's group memberships to exclude already-joined groups
6. Fetch active groups (limit 20) not in user's groups
7. Build prompt with preferences, feedback, and available groups
8. Call Groq API (`llama-3.3-70b-versatile`) with the prompt
9. Parse response JSON (handles ```json code blocks)
10. Return array of recommendations with `group_id`, `match_score`, `reasoning`, `suggested_improvements`

**Prompt structure:**
- System prompt: "You are a study group matching assistant..."
- Includes: student preferences, similar successful matches from past feedback, available groups
- Output: JSON array with group_id, match_score (1-100), reasoning, suggested_improvements

**Logging:** Comprehensive logging at INFO level for debugging (preferences, feedback count, groups, prompt length, AI response, each recommendation).

**Gotcha:** The feedback retrieval is simplified — it doesn't use actual vector search from `feedback_embeddings` and doesn't filter by subject relevance.

### Get Match Reasoning — `matching_service.get_match_reasoning()`

- Called per-group to generate detailed reasoning for a specific group
- Takes user preferences, group details, and member preferences
- Returns JSON with `reasoning` and `suggestions`
- Uses Groq with 512 max_tokens

### Compatibility Scoring — `app/services/compatibility_service.py`

**Fast math-based scoring (0-100) for instant display:**

| Component | Max Points | How It's Calculated |
|---|---|---|
| Subject Match | 40 | 40 if group subject is in user's subjects, else 0 |
| Availability Overlap | 30 | (matching slots / total user slots) × 30 |
| Format Match | 15 | 15 if exact match, 7.5 if hybrid, else 0 |
| Member Alignment | 15 | Average across members: learning style (5) + availability overlap (5) + level compatibility (5) |
| **Total** | **100** | Capped at 100, includes `matching_slots` |

**Frontend equivalent:** `frontend/src/services/compatibility.ts` has an identical implementation.

---

## Compatibility Scoring System

The platform has two compatibility systems that coexist:

### 1. Math-Based Compatibility (`compatibility_service.py`)
- **Purpose:** Fast, deterministic scoring for instant display
- **Where used:** Group discovery (`/groups/discover`), pending requests, group detail, join flow
- **Latency:** <10ms (no external calls)
- **Algorithm:** Weighted sum of subject match + availability + format + member alignment
- **Range:** 0-100

### 2. AI-Powered Matching (`matching_service.py`)
- **Purpose:** Rich, contextual recommendations with reasoning
- **Where used:** `/matching/recommend` endpoint
- **Latency:** 1-5 seconds (Groq API call)
- **Algorithm:** LLM analyzes preferences, past feedback, and available groups
- **Range:** 1-100 (returned as `match_score`)

**Frontend UI uses both:**
- Groups page Discover tab shows `compatibility_score` (from math-based)
- Matching page shows AI recommendations with `match_score` and AI-generated reasoning

---

## Authentication

### Registration Flow
1. `POST /v1/auth/register` with `{email, password, full_name}`
2. Check if email already exists → 400 if so
3. Hash password with bcrypt
4. Insert user into `users` table with `preferences: {}`, `is_onboarding_complete: false`
5. Generate JWT with `sub: user_id`, expiry 30 minutes
6. Return `TokenResponse` with access_token and user data

### Login Flow
1. `POST /v1/auth/login` with `{email, password}`
2. Look up user by email → 401 if not found
3. Verify password with bcrypt → 401 if no match
4. Generate JWT
5. Return `TokenResponse`

### Logout
1. `POST /v1/auth/logout`
2. **No-op** — returns `{"message": "Logged out successfully"}`
3. No token blacklisting implemented

### JWT Details
- Algorithm: `HS256`
- Secret: `JWT_SECRET` from settings (default: `"studysync-ai-secret-key-change-in-production-2026"`)
- Payload: `{"sub": user_id, "exp": expiry_timestamp}`
- Expiry: 30 minutes from `access_token_expire_minutes`

### `/me` Endpoint
- Requires valid JWT
- Fetches full user record from `users` table by `user_id`
- Returns `UserResponse`

### Frontend Auth Flow
1. User fills email/password on SignIn or SignUp page
2. Calls `authService.login()` or `authService.register()` (hits backend)
3. On success, Zustand store persists `{user, token, isAuthenticated}` to localStorage under key `auth-storage`
4. After login, checks `user.is_onboarding_complete`:
   - If false → redirect to `/onboarding`
   - If true → redirect to `/dashboard`
5. After registration → always redirect to `/onboarding`
6. On logout → clears store, redirects to `/`

**Gotcha:** The token is stored in localStorage under key `auth-storage` via Zustand persist. Components frequently read it with `JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.token` instead of using the store directly.

---

## Frontend Navigation

### Router Structure (Next.js App Router)

```
/                          Landing Page (public)
├── /signin                Sign In (public)
├── /signup                Sign Up (public)
├── /onboarding            Onboarding wizard (auth required)
├── /matching              AI Matching page (auth required)
└── /dashboard             Dashboard layout (auth required, sidebar)
    ├── /dashboard         Overview/Stats
    ├── /dashboard/groups  My Groups + Discover + Requests
    ├── /dashboard/matching  AI Matches
    ├── /dashboard/messages  Group Messaging
    └── /dashboard/settings  Profile Settings
```

### Dashboard Sidebar Navigation

| Icon | Label | Path | Active Indicator |
|---|---|---|---|
| LayoutDashboard | Overview | `/dashboard` | Blue accent bar |
| Users | My Groups | `/dashboard/groups` | Blue accent bar |
| Sparkles | AI Matches | `/dashboard/matching` | Blue accent bar |
| MessageSquare | Messages | `/dashboard/messages` | Blue accent bar |
| Settings | Settings | `/dashboard/settings` | Blue accent bar |

### Top Header (inside Dashboard)
- Search bar (placeholder — doesn't actually search)
- Notification bell with badge (placeholder — no functionality)
- User avatar with initials from `user.full_name`

### Navbar (global, shown on all pages)
- Logo: "StudySyncAI" with BookOpen icon
- Nav links: Dashboard, Find Groups, About (placeholder links)
- Conditionally shows Sign In / Sign Up buttons when not on dashboard/onboarding
- **Bug:** The Navbar determines authentication by checking if pathname starts with `/dashboard` or `/onboarding`, NOT by actual auth state.

### Gotchas
- `/about` route — linked in Navbar but doesn't exist (404)
- `/matching` route — separate page outside dashboard, but also `/dashboard/matching` exists inside dashboard (two matching pages)
- `/signup` route — exists and is functional, linked from signin page
- Dashboard layout doesn't redirect if unauthenticated (no auth guard)

---

## Frontend State Management

### Zustand Stores

**Primary: `stores/authStore.ts`** (used by the app)

| State | Type | Persisted |
|---|---|---|
| `user` | User \| null | Yes |
| `token` | string \| null | Yes |
| `isAuthenticated` | boolean | Yes |
| `isLoading` | boolean | No |
| `error` | string \| null | No |

**Actions:** `login()`, `register()`, `logout()`, `setUser()`, `clearError()`

**Persist config:** `name: 'auth-storage'`, partialize: `{token, user, isAuthenticated}`

**Secondary: `store/auth.ts`** (UNUSED — duplicate with slightly different API)

- Same structure but with `logout()` as async and `setUser()` action
- Not imported anywhere in the codebase

**Persist bucket key:** `auth-storage` in localStorage. Components frequently use:
```typescript
const authData = JSON.parse(localStorage.getItem('auth-storage') || '{}');
const actualToken = authData.state?.token || token;
```
This is a workaround pattern repeated across many components — suggests the Zustand store's `.token` might sometimes be stale.

### React Contexts

None — the app uses Zustand exclusively for state management.

### Hooks

- `useAuth()` — wraps `useAuthStore` with a cleaner interface
- `useRealtimeMessages(groupId, initialMessages)` — subscribes to Supabase Realtime `postgres_changes` on the `messages` table for a specific group, returns updated message list

---

## Frontend API Layer

### API Client — `src/lib/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

fetchAPI<T>(endpoint, { token, ...fetchOptions }): Promise<T>
```

- Automatically adds `Authorization: Bearer <token>` if token provided
- Sets `Content-Type: application/json`
- All errors throw with `errorData.detail` or status code
- Full URL is constructed as `{API_BASE_URL}{endpoint}`
- Logs every request to console (`[API] GET /groups/my`)

### Service Files

| Service File | Imports From | Key Functions |
|---|---|---|
| `services/auth.ts` | `@/lib/api` | `login()`, `register()`, `getMe()`, `logout()` |
| `services/groups.ts` | `@/lib/api` | `getMyGroups()`, `listGroups()`, `getDiscoverGroups()`, `getGroup()`, `createGroup()`, `getMembers()`, `joinGroup()`, `joinGroupWithMessage()`, `leaveGroup()`, `getPendingRequests()`, `getCompatibility()`, `acceptRequest()`, `rejectRequest()` |
| `services/messages.ts` | `@/lib/api` | `getMessages()`, `sendMessage()` |
| `services/matching.ts` | `@/lib/api` | `getRecommendations()` |
| `services/users.ts` | `@/lib/api` | `getUser()`, `updateUser()`, `getPreferences()`, `updatePreferences()` |
| `services/compatibility.ts` | — (pure functions) | `calculateCompatibilityScore()`, `getCompatibilityColor()`, `getCompatibilityLabel()`, `getCompatibilityBadgeClass()` |

### Supabase Client — `src/lib/supabase.ts`

```typescript
const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Used only for real-time message subscriptions, not for any API calls or auth.

---

## Frontend UI Patterns

### Theme

- **Dark mode only** — forced via `<html className="dark">` and CSS `:root` variable definitions
- **Color palette:**
  - `--background`: `#000000` (pure black)
  - `--foreground`: `#ffffff`
  - `--card`: `#0a0a0a`
  - `--primary`: `#4f46e5` (indigo/blue)
  - `--muted`: `#171717`
  - `--muted-foreground`: `#a3a3a3`
  - `--border`: `#262626`
- **Typography:** Geist Sans (via Next.js font optimization)
- **Background pattern:** Radial gradient dots on landing page `[background-size:16px_16px]`

### Key Components

| Component | Path | Variants |
|---|---|---|
| `Button` | `components/ui/Button.tsx` | default, secondary, outline, ghost, link; sizes: default, sm, lg, icon; uses Framer Motion hover/tap animations |
| `Card` | `components/ui/Card.tsx` | With Header, Title, Description, Content, Footer sub-components |
| `Input` | `components/ui/Input.tsx` | Styled with focus ring, file support |
| `Label` | `components/ui/Label.tsx` | Form label with accessibility |
| `Navbar` | `components/Navbar.tsx` | Sticky header with backdrop blur, animated entrance |
| `FeedbackForm` | `components/FeedbackForm.tsx` | Rating 1-5 with emojis, what worked/what could improve textareas |
| `MatchRecommendation` | `components/MatchRecommendation.tsx` | Display card for AI match with score, reasoning, join button |
| `CompatibilityBadge` | `components/groups/CompatibilityBadge.tsx` | Colored badge showing score percentage |

### Responsive Design
- Mobile-first approach
- Sidebar hidden on mobile (`md:flex`)
- Grid layouts adapt via `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Dashboard layout uses `w-0 flex-1` overflow pattern for content area

### Animation Patterns
- Framer Motion `motion.div` with `initial/animate` for page sections
- `AnimatePresence` for onboarding step transitions
- Staggered children via `variants` pattern
- Button hover/tap scale animations
- Sidebar active indicator with `layoutId` ("sidebar-active") for smooth transitions

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Required | Purpose | Example |
|---|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL | `https://nqihwjruqxshrjcllkbp.supabase.co` |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key | `eyJ...` |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key (admin bypass) | `eyJ...` |
| `SUPABASE_DB_PASSWORD` | Yes | Database password for Alembic migrations | `#aWN25iQgfGc2?X` |
| `GROQ_API_KEY` | Yes | Groq API key for AI matching | `gsk_...` |
| `APP_ENV` | No (default: development) | Environment mode | `development` / `production` |
| `LOG_LEVEL` | No (default: INFO) | Logging level | `INFO` / `DEBUG` |
| `RATE_LIMIT_PER_MINUTE` | No (default: 50) | General rate limit | `50` |
| `RATE_LIMIT_MATCHING_PER_MINUTE` | No (default: 10) | Matching endpoint rate limit | `10` |

### Backend — `JWT_SECRET` (in Settings, not .env.example)

| Variable | Required | Purpose | Current Value |
|---|---|---|---|
| `JWT_SECRET` | No (has default) | JWT signing secret | `"studysync-ai-secret-key-change-in-production-2026"` |
| `JWT_ALGORITHM` | No | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token expiry | `30` |

**⚠️ Security Warning:** The JWT secret in code is a default development value. Must be changed in production.

### Frontend — `frontend/.env.local`

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | No (default: localhost:8000/v1) | Backend API URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |

---

## Development Conventions

### File Naming
- **Backend:** snake_case for all files (`auth.py`, `matching_service.py`, `rate_limiter.py`)
- **Frontend:** camelCase for services/hooks (`authStore.ts`, `useAuth.ts`, `compatibility.ts`), PascalCase for components (`Button.tsx`, `Navbar.tsx`, `CompatibilityBadge.tsx`)
- Next.js App Router: `page.tsx`, `layout.tsx`

### Backend Patterns
- Every router file exports a router variable with `_router` suffix (e.g., `auth_router`)
- All router functions are async and use `Depends(get_current_user)` for auth
- Supabase admin client used for all DB operations (no RLS)
- Passwords hashed with bcrypt via passlib
- JWT tokens use `python-jose` (not PyJWT)

### Frontend Patterns
- Components live in `src/components/`, organized by domain (`groups/`, `ui/`)
- API services use dedicated files under `src/services/`
- Reusable utilities in `src/lib/` (`api.ts`, `supabase.ts`, `utils.ts`)
- Hooks in `src/hooks/`
- All pages are `"use client"` components (no server components except `layout.tsx`)
- Token passed explicitly through service functions (not via a global interceptor)
- `cn()` utility used for class merging

---

## Critical Gotchas & Footguns

1. **Duplicate auth stores** — `src/store/auth.ts` and `src/stores/authStore.ts` both exist. Only `authStore.ts` is used via `useAuthStore`. The other is dead code.

2. **Token extraction pattern** — Multiple frontend components use `JSON.parse(localStorage.getItem('auth-storage')).state.token` instead of reading from the Zustand store's `token` property. This suggests the store's token may be stale, or this is a workaround for hydration mismatches.

3. **Auth check in Navbar** — The Navbar determines auth state by checking if the pathname starts with `/dashboard` or `/onboarding`, NOT by checking the actual auth store. This means non-dashboard pages will show "Sign In" / "Sign Up" buttons even when logged in.

4. **Migrations vs SQL script** — The schema exists in two places (`setup-database.sql` and `alembic/001_initial_schema.py`). They may have diverged — the SQL script has more features (session_timing, study_format, join_message, preferences_snapshot columns) than the Alembic migration. The SQL script should be considered the source of truth.

5. **No auth guard** — The dashboard layout and protected pages do not check authentication. If a user navigates directly to `/dashboard` without logging in, they'll see the UI without data (or errors).

6. **In-memory rate limiting** — Resets on every server restart. Not suitable for production or multi-instance deployments.

7. **Placeholder embeddings** — The `EmbeddingService.generate_feedback_embedding()` returns `[0.0] * 1024`. The `feedback_embeddings` table and the pgvector extension exist but are unused.

8. **`/sessions/{id}/complete` endpoint has no auth** — The `complete_session` function doesn't use `Depends(get_current_user)` or verify membership. Anybody can mark any session as completed.

9. **CORS not locked in production** — If `app_env` is set to `"development"`, allowed origins include localhost:3000, 127.0.0.1:3000, and localhost:3001. In production, it uses `["https://studysync.ai"]`. But `expose_headers: ["*"]` is set regardless.

10. **Two matching pages** — The frontend has both `/matching` (standalone) and `/dashboard/matching` (inside dashboard). Both call the same API but render differently.

11. **`groups/` endpoint returns total with `len(groups)`** — The `list_groups` endpoint returns `total: len(groups)` which is the count of returned items, not the total available in the database. Pagination metadata is inaccurate.

12. **`update_data["updated_at"] = "now()"`** — The string `"now()"` is passed directly to Supabase. This works because Supabase's REST API passes raw strings to PostgreSQL, but it's fragile.

13. **Frontend loading states** — Many components have partial or missing loading/error states. The dashboard page has a loading spinner, but groups/messages/settings pages often show empty states before data loads.

14. **Zustand persist + SSR** — Since Zustand persist uses localStorage, the store may not hydrate immediately during server-side rendering. The `mounted` state pattern in `dashboard/layout.tsx` handles this for the avatar but not for route guards.

---

## How to Run

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with actual credentials

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**URLs:**
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health: http://localhost:8000/health

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Create .env.local with NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

# Start development server
npm run dev
# or
npm run build && npm start
```

**URLs:**
- Frontend: http://localhost:3000

### Database Setup

Run the SQL script in Supabase SQL Editor:
```bash
# Copy contents of backend/scripts/setup-database.sql
# Paste into https://supabase.com/dashboard/project/{PROJECT_ID}/sql/new
# Execute
```

Or run migrations:
```bash
cd backend
alembic upgrade head
```

---

## Tests

### Test Framework
- **Backend:** pytest with `TestClient` (FastAPI's test client)
- **Frontend:** No tests configured

### Backend Tests — `backend/tests/`

| File | Tests |
|---|---|
| `test_auth.py` | Health check, register validation, login validation (3 tests) |
| `test_groups.py` | Auth requirements for list/create (2 tests) |
| `test_messages.py` | Auth requirement for messages (basic) |
| `test_sessions.py` | Session CRUD tests |
| `test_users.py` | User profile tests |
| `test_matching.py` | Matching endpoint tests |
| `test_matching_router.py` | Matching router tests |
| `test_feedback.py` | Feedback tests |
| `test_feedback_service.py` | Feedback service tests |
| `test_cache.py` | Cache service tests |
| `test_rate_limiter.py` | Rate limiter tests |
| `test_compatibility_service.py` | Compatibility scoring tests |
| `test_notifications.py` | Notification tests |
| `test_embedding.py` | Embedding service tests |

### Running Tests

```bash
cd backend
pytest tests/ -v
```

**Test gotcha:** Tests use real Supabase connection (no mocking). If Supabase credentials are invalid, tests will fail with 500 errors.

---

## AI Model Summary

| Model | Use Case | Where Configured |
|---|---|---|
| `llama-3.3-70b-versatile` | Group matching recommendations | `matching_service.py` — `get_recommendations()` and `get_match_reasoning()` |
| `llama-3.3-70b-versatile` | Feedback embedding generation | `embedding_service.py` (placeholder — returns dummy vectors) |

**Model configuration details:**
- Temperature: 0.7 (both services)
- Max tokens: 2048 (recommendations), 512 (match reasoning)
- Provider: Groq API (`client = Groq(api_key=settings.groq_api_key)`)
- No fine-tuning — pure zero-shot prompting

---

## Deployment

### Current Platform
- Not deployed to any production platform
- Configured for potential Vercel deployment (frontend has `vercel.svg` in public/)
- Backend designed for any Python ASGI server (uvicorn)

### Deployment Config Files
- `frontend/next.config.ts` — Almost empty (no custom config)
- `frontend/postcss.config.mjs` — Tailwind CSS v4 PostCSS plugin
- `frontend/eslint.config.mjs` — ESLint v9 with Next.js config

### Docker
- No Dockerfile exists

### Production Checklist
1. Change `JWT_SECRET` to a strong, random value
2. Set up proper RLS policies in Supabase (currently bypassed with service key)
3. Implement proper vector search with pgvector
4. Replace in-memory rate limiter with Redis or database-backed solution
5. Add proper CORS origins for production domain
6. Add request logging middleware
7. Add proper error handling middleware
8. Add authentication guards to frontend pages
9. Remove duplicate `store/auth.ts`
10. Add frontend tests
