# Frontend Architecture & State

The Big Outsource EIMS frontend is a Single Page Application (SPA) built with React 19 and Vite. 

## 1. Core Technology Stack
- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v7 (`react-router-dom`)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion (`motion/react`)
- **Icons:** Lucide React

## 2. State Management

The application completely avoids heavy global state managers like Redux or Zustand. Instead, it relies on a combination of React Context, local state, and module-level variables for caching.

### Contexts (`frontend/src/contexts/`)
Global application state is managed via specific Context Providers:
- `AuthContext`: Manages the current user session, capabilities, logout logic, and inactivity timers.
- `ThemeContext`: Handles light/dark mode preferences.
- `TextSizeContext`: Manages global typography scaling preferences.
- `PresenceContext`: Manages user online/offline status via websockets.

### Module-Level Caching
For specific complex views like `EmployeeImportReview.tsx`, the application uses simple module-level variables (`importReviewCache`) to retain state across unmounts/remounts without needing a global store.

## 3. Realtime Architecture
The frontend uses `socket.io-client` to connect to the backend server.
Custom hooks like `useRealtimeSubscription` wrap this connection to listen for specific database events.
- Used in `AuthContext` to instantly log out users if their access is revoked by an admin.
- Used in `AuditLogs.tsx` to refresh the table automatically when new actions occur.

## 4. API Communication
API calls are abstracted into feature-specific service objects (e.g., `authService.ts`, `employeeService.ts`, `employeeImportService.ts`).
These services use a common `fetch` wrapper (or axios equivalent) that automatically injects the JWT Bearer token into the `Authorization` header.
