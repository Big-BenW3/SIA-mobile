# Student Itinerary App — Student/CR App

The mobile + web frontend for students and Course Reps, built with Expo so the same codebase ships to iOS, Android, and the web with one shared tab-based navigation experience.

> The Admin Dashboard is a separate web-only app/repo (sidebar layout), not part of this project.

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Expo (managed workflow) + React Native |
| Web output | React Native Web (bundled with Expo) |
| Routing | Expo Router (file-based, tabs on mobile / responsive rail on web) |
| Global/client state | Zustand |
| Server state & caching | TanStack Query (React Query) |
| Forms & validation | React Hook Form + Zod |
| HTTP client | Axios |
| Secure token storage | expo-secure-store |
| Push notifications | expo-notifications (relays through Firebase Cloud Messaging) |
| File picking | expo-document-picker (CR resource uploads) |
| Styling | NativeWind (Tailwind for React Native) |
| Icons | lucide-react-native |

## Features

- One codebase, two role experiences (Student and CR), gated after login
- Level feed of CR posts with course tags, difficulty badges, and due-date countdowns
- Daily and semester calendar views merging official posts with personal tasks
- Personal itinerary with AI-assisted task arrangement by difficulty (via backend → Groq)
- Read-only Resources library for students; upload/manage for CRs
- CGPA calculator with manual grade entry
- Shared in-app notification system (bell icon, not a separate tab) for posts and comments
- CR-only Post tab for creating/editing/deleting announcements

## Prerequisites

- Node.js 20+ and npm
- Expo CLI (`npm install -g expo-cli` — or just use `npx expo`)
- Expo Go app on your phone (for quick device testing) or an Android/iOS simulator
- A running instance of the backend API (see the backend repo's README)

## Getting Started

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd student-cr-app
npm install

# 2. Set up environment variables
cp .env.example .env
# then fill in the values (see below)

# 3. Start the dev server
npx expo start
```

From the Expo dev server output you can:
- Press `a` to open on an Android emulator
- Press `i` to open on an iOS simulator
- Press `w` to open in a web browser
- Scan the QR code with Expo Go on a physical device

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

> All Expo public env vars must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

## Available Scripts

| Command | Description |
|---|---|
| `npx expo start` | Start the Expo dev server |
| `npx expo start --web` | Start directly in web mode |
| `npx expo start --android` | Start directly on an Android emulator/device |
| `npx expo start --ios` | Start directly on an iOS simulator/device |
| `eas build --platform android` | Production Android build (requires EAS setup) |
| `eas build --platform ios` | Production iOS build (requires EAS setup) |
| `npx expo export --platform web` | Export a static web build for hosting |

## Project Structure

```
/app                      # Expo Router file-based routes
  /(auth)                 # login, signup (student/CR), pending-approval
  /(student)               # student tab group: Home, Itinerary, Resources, CGPA, Profile
  /(cr)                    # CR tab group: Home, Post, Itinerary, Resources, Profile
  _layout.tsx              # root layout — auth check + role-based redirect
/components
  /shared                  # Button, Card, Badge, EmptyState, etc.
  /post                    # PostCard, DifficultyBadge, CourseTag, CommentThread
  /itinerary                # TaskCard, AiArrangeButton
  /resources                # FileCard, UploadButton
  /calendar                 # DailyTimeline, SemesterGrid
  /notifications             # NotificationBell, NotificationPanel
/stores                    # Zustand: authStore, notificationStore, semesterStore
/services                  # API layer (Axios instance + per-domain service files)
/hooks                     # TanStack Query hooks (usePosts, useItinerary, etc.)
/schemas                   # Zod schemas mirroring backend validation
/types                     # Shared TypeScript interfaces
/constants                 # theme, colors
```

## State Management Notes

- **Zustand** holds client-only state that doesn't belong to the server cache: the logged-in user object, JWT presence/refresh state, cached current semester label, and unread notification count.
- **TanStack Query** owns all server data — every screen that reads or writes to the API goes through a dedicated hook (e.g. `usePosts()`, `useItinerary()`) rather than manual `useEffect` + `fetch`, giving automatic caching, retries, and background refetching.
- **React Hook Form + Zod** handles every form (login, signup, new post, add task, add CGPA entry) — validation schemas are written to mirror the backend's Zod schemas so client and server agree on what "valid" means.

## Push Notifications

This app uses `expo-notifications`, which relays through Firebase Cloud Messaging on Android without needing to eject from the Expo managed workflow. On first login, the app registers the device's push token with the backend so posts and comments can trigger real notifications.

## Running on Web

Because navigation is built with Expo Router on top of React Navigation, the same tab structure automatically adapts: bottom tabs on narrow/mobile viewports, and a side rail on wider desktop browser windows — no separate web navigation to maintain.

## Deployment

- **Mobile builds:** use [EAS Build](https://docs.expo.dev/build/introduction/) to produce Android/iOS binaries for app store submission.
- **Web build:** `npx expo export --platform web` produces a static bundle deployable to any static host (Render static site, Vercel, Netlify, etc.).

## License

Private/unlicensed — internal department project.
opencode -s ses_f42832a0affeY1NuRstJc6WfJL