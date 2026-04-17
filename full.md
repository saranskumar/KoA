# KōA - Technical Documentation

This document provides a comprehensive deep-dive into the technical architecture, data models, and specialized systems of the KōA Study Tracker.

---

## 🏗 Architecture Overview

KōA is built as a **Serverless PWA**.

- **Frontend**: Single Page Application (SPA) using React 19 + Vite.
- **State Management**: 
    - **Global Client State**: Zustand (`src/store/useAppStore.js`) handles view routing, active plan selection, and UI toggles.
    - **Shared Server State**: TanStack Query (`src/hooks/useData.js`) manages all Supabase synchronization, optimistic updates, and caching.
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions).
- **Automation**: Managed via `pg_cron` inside the PostgreSQL instance, triggering Deno-based Edge Functions.

---

## 🗄 Database Schema (Migrations)

The database evolved through a series of focused migrations:

### Core Tables
- `profiles`: Extends Supabase Auth users. Tracks streaks, completed tasks, and PWA onboarding status.
- `subjects`: Study subjects (e.g., "Anatomy", "Calculus").
- `topics`: Hierarchical children of subjects.
- `plans`: User study plans (e.g., "USMLE Step 1 Prep").
- `tasks`: The atomic unit of work. Links topics to specific dates.
- `exam_slots`: Critical dates for specific subjects within a plan.

### System Tables
- `push_subscriptions`: Stores VAPID-compliant browser endpoints for Web Push.
- `notification_preferences`: Stores user-specific timing, offsets, and tone settings.

### Views
- `public_leaderboard`: A security-filtered view for global rankings.
    - **Ranking Formula**: `(current_streak * 15) + (completed_tasks * 2)`.

---

## 🔔 Automated Notification System

KōA uses a precision-timed notification engine.

### 1. The Trigger (`pg_cron`)
A cron job runs every minute (`* * * * *`) inside the database:
```sql
SELECT net.http_post(
  url := '.../functions/v1/send-reminders',
  headers := '{"Content-Type": "application/json", "x-cron-secret": "..."}'
);
```

### 2. The Logic (`send-reminders` Edge Function)
1. **Timezone Normalization**: The function calculates the current UTC hour/minute and compares it against the user's `tz_offset`.
2. **Matching**: It triggers if:
    - User has a custom reminder set for this exact minute.
    - It is exactly 7:00 AM (Morning Wake-up).
    - It is exactly 8:00 PM (Evening Nudge) and opted-in.
3. **Payload Construction**: Generates a JSON payload with a single action: `🚀 Start Session`.
4. **Delivery**: Dispatched via standard Web Push protocol using VAPID keys.

---

## 📱 PWA & Service Worker

### `sw.js` (Service Worker)
- **Caching**: Uses Workbox for precaching assets and runtime caching of images.
- **Push Event**: Listens for `push` events and renders notifications with custom iconography.
- **Interaction**: The `notificationclick` handler opens the app window and focuses on the `Today` view.

### `CustomClockPicker.jsx`
A bespoke UI component designed for mobile-first time selection.
- **Tumbler UI**: Uses CSS `snap-center` and `snap-mandatory` for a smooth physical feel.
- **Scroll-to-Select**: Automatically updates state when the tumbler stops.
- **Tap-to-Scroll**: Programmatic `scrollIntoView` triggered by clicking any number.

---

## 🛠 Directory Structure

```text
src/
├── components/
│   ├── ui/         # Reusable atomic elements (Clock, Modals)
│   ├── views/      # Page-level components (Today, Syllabus, Stats)
│   └── pages/      # Layout wrappers
├── hooks/          # Data fetching & Mutation logic
├── lib/            # Supabase & utility initializations
├── store/          # Zustand store definitions
└── sw.js           # PWA Service Worker logic

supabase/
├── functions/      # Deno Edge Functions
└── migrations/     # SQL Schema history
```

---

## 🔒 Security & Performance
- **RLS (Row Level Security)**: Every table has a `(auth.uid() = user_id)` policy. Public data is only accessible through filtered Views or defined RPCs.
- **Optimistic UI**: Use of TanStack Query `onMutate` ensures that marking a task complete feels instantaneous, even on slow mobile networks.
- **Code Splitting**: Routes are logically divided to minimize initial bundle size for fast mobile loads.
