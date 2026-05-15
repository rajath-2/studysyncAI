# StudySync AI - Frontend Context & Project Overview

## Project Overview

**StudySync AI** is an AI-powered study group formation platform built with Next.js 16. The application helps students find compatible study partners based on shared goals, learning styles, and schedules.

**Tech Stack:**
- Next.js 16.2.6 (App Router)
- React 19.2.4
- TypeScript
- Tailwind CSS 4 (with CSS variables)
- Framer Motion for animations
- Lucide React for icons

---

## User Flows & Page Breakdown

### 1. Landing Page (`/`) - Public
**Purpose:** Marketing homepage to attract new users.

**Elements:**
- Hero section with gradient background and CTA buttons
- "Get Started" button → navigates to `/signin`
- "How it works" button → (placeholder, no route yet)
- Three feature cards: Smart Matching, Active Groups, Boost Grades
- Navigation: links to Dashboard, Find Groups, About (mostly placeholder)

**Key Features:**
- Animated entrance with Framer Motion
- Visual gradient backgrounds
- Responsive layout (mobile-first)

---

### 2. Sign In Page (`/signin`) - Public
**Purpose:** User authentication entry point.

**Elements:**
- Email + Password form with validation
- "Remember me" checkbox
- "Forgot password?" link
- OAuth options: Google, GitHub (mock buttons)
- "Sign up for free" link → `/signup` (not implemented)

**Mock Behavior:**
- On submit, navigates to `/onboarding` (no real auth)
- Google/GitHub buttons also mock → `/onboarding`

**Missing Implementation:**
- `/signup` route
- Actual OAuth flow
- Backend auth integration

---

### 3. Onboarding Page (`/onboarding`) - 3-Step Wizard
**Purpose:** Collect user preferences for AI matching.

**Step 1 - Study Priorities:**
- Multi-select options: Exam Preparation, Homework Help, Deep Learning, Project Collaboration, Accountability, Interview Prep

**Step 2 - Study Hours:**
- Multi-select time slots: Early Morning, Morning, Afternoon, Evening, Night, Night Owl

**Step 3 - Subjects:**
- Multi-select grid: Mathematics, Computer Science, Physics, Chemistry, Biology, Literature, History, Economics, Psychology

**Behavior:**
- Progress bar with step icons
- AnimatePresence for slide transitions
- "Back" / "Continue" / "Complete Setup" navigation
- On completion, redirects to `/dashboard`
- Selection state stored in local `useState` (not persisted)

**Missing Implementation:**
- Actual data persistence to backend
- User profile update API call

---

### 4. Dashboard Layout (`/dashboard`) - Shell
**Purpose:** Layout wrapper for all authenticated pages.

**Elements:**
- **Sidebar Navigation:**
  - Overview (dashboard)
  - My Groups
  - Messages
  - Settings
- **Top Header:**
  - Search bar (placeholder)
  - Notification bell with badge
  - User avatar (initials "JS")
- **Main Content Area:** Renders child pages

**Design Features:**
- Active route indicator with motion animation
- Responsive (sidebar hidden on mobile)

---

### 5. Dashboard Overview (`/dashboard`) - Main Dashboard
**Purpose:** At-a-glance summary of user's study activity.

**Elements:**
- **Welcome Header:** "Welcome back, John"
- **Stats Cards (4):**
  - Active Groups: 3 (+1 since last week)
  - Upcoming Sessions: 2 (next in 2 hours)
  - Study Hours: 14.5 (top 20% this week)
  - AI Match: 1 new recommendation (clickable)
- **Recent Activity Feed:** Shows group updates with timestamps
- **Upcoming Sessions List:** Next 2 scheduled sessions

**All data is hardcoded (mock).**

---

### 6. Groups Page (`/dashboard/groups`)
**Purpose:** Manage and view study groups.

**Elements:**
- "Find New Group" button
- Grid of 3 mock study group cards:
  1. Calculus 101 Midterm Prep (Mathematics)
  2. Physics Lab Group (Physics)
  3. Data Structures (Computer Science)

**Each Card Shows:**
- Subject badge with color
- Group name
- Next meeting time
- Member list
- "Join Session" button
- Overflow menu (three dots)

**Missing Implementation:**
- Create/join group functionality
- Real group data from backend
- Session joining flow

---

### 7. Messages Page (`/dashboard/messages`)
**Purpose:** In-app group messaging system.

**Layout:** Two-column (sidebar + main chat)

**Left Sidebar - Chat List:**
- Search bar
- List of 3 mock conversations:
  1. Calculus 101 Midterm Prep (2 unread)
  2. Physics Lab Group
  3. Data Structures
- Each shows: icon, name, last message, timestamp, unread badge

**Main Chat Area:**
- Header with group name, phone/video icons
- Message thread with bubbles:
  - User messages (right, primary color)
  - Others' messages (left, muted color)
  - Initials avatar, timestamp
- Message input with send button

**Missing Implementation:**
- Real-time messaging (WebSocket/SSE)
- Message history API
- Send message API

---

### 8. Settings Page (`/dashboard/settings`)
**Purpose:** User account management.

**Elements:**
- **Navigation Tabs:** Profile, Notifications, Security
- **Profile Section:**
  - First name, Last name (defaults: John Smith)
  - Email (default: john.smith@university.edu)
  - Bio field
  - "Save changes" button
- **Danger Zone:**
  - Log out button
  - Redirects to landing page on click

**Missing Implementation:**
- Save changes API call
- Notifications tab content
- Security tab content
- Account deletion flow

---

## Shared Components

### UI Components (`/src/components/ui/`)
| Component | Description |
|-----------|-------------|
| `Button` | Variants: default, secondary, outline, ghost, link. Sizes: default, sm, lg, icon. Includes framer-motion scale animation. |
| `Card` | Container with header, content, footer, title, description sub-components. |
| `Input` | Styled text input with focus ring. |
| `Label` | Form label with proper accessibility. |

### Utilities (`/src/lib/utils.ts`)
- `cn()` - Tailwind class merger using clsx + tailwind-merge

### Layout Components
- `Navbar` - Global navigation header with conditional auth display

---

## Design System

**Color Palette:**
```
--background: #000000 (black)
--foreground: #ffffff (white)
--card: #0a0a0a (near-black)
--primary: #4f46e5 (indigo)
--muted: #171717 (dark gray)
--border: #262626 (border gray)
```

**Theme:** Dark mode only (forced via body class)

**Typography:** Geist Sans (Next.js default)

**Animations:** Framer Motion for page transitions, button interactions, staggered lists

---

## Current Backend Requirements

Based on the frontend, here's what the backend needs to support:

### Authentication
- Sign in with email/password
- Sign up (not implemented in frontend yet)
- OAuth (Google/GitHub)
- Session management
- Logout

### User Management
- Get user profile
- Update profile (name, email, bio)
- Store onboarding preferences (priorities, hours, subjects)

### Groups
- List user's groups
- Get group details
- Create group
- Join group
- Leave group
- AI-powered group recommendations/matching

### Sessions/Meetings
- Get upcoming sessions for a group
- Schedule new session
- Join session (video call link?)

### Messaging
- List conversations
- Get message history
- Send message
- Real-time message delivery (WebSocket/SSE)

### Notifications
- Get user notifications
- Mark as read
- Real-time notification updates

---

## Frontend Gaps & Placeholders

| Area | Status | Notes |
|------|--------|-------|
| `/signup` route | Missing | Linked from signin but doesn't exist |
| `/about` route | Missing | Linked in nav but doesn't exist |
| `/matching` route | Missing | Linked in nav but doesn't exist |
| Real authentication | Not implemented | All mocked |
| Real data fetching | Not implemented | All hardcoded mock data |
| API integration | Not implemented | No API calls made anywhere |
| Error handling | Not implemented | No loading/error states |
| Form validation | Minimal | Only HTML5 `required` |

---

## Next Steps for Backend Development

To discuss and plan:
1. Authentication approach (JWT? Session tokens? OAuth provider?)
2. Database schema design
3. Real-time features (messages, notifications)
4. AI matching algorithm requirements
5. API design (REST? GraphQL?)
6. Deployment considerations