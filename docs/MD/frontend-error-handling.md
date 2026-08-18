# Frontend Error Handling & Crash Protection

## 1. Overview
In **v1.8.0**, a global error handling architecture was introduced to prevent the React Single Page Application (SPA) from crashing ("white screening") when encountering unexpected data structures from the API or network failures.

## 2. React Error Boundaries (`ErrorBoundary.tsx`)
React unmounts the entire component tree if an error is thrown during rendering and isn't caught. To prevent this, EIMS uses `ErrorBoundary.tsx`.
- **Placement:** The `ErrorBoundary` wraps the entire `<App />` tree, as well as specific heavy components like data tables and modal forms.
- **Fallback UI:** If a child component throws an error (e.g., trying to map over `null` instead of an array), the Error Boundary catches it and renders a safe fallback UI component instead of crashing the whole page.
- **Action:** The fallback UI includes a "Reload Application" button to clear the state and remount safely.

## 3. Global Notification Tray (`GlobalNotifications.tsx`)
Instead of using intrusive browser `alert()` popups for minor API failures, we use a global toaster notification system.
- Failed HTTP requests in `employeeService.js` or `auth.service.js` are caught in a `try/catch` block.
- The `error.message` is dispatched to the Global Notifications store.
- `GlobalNotifications.tsx` automatically slides a red error toast onto the screen for 5 seconds.

## 4. Vercel Routing Fallbacks (`vercel.json`)
Because React Router handles routing dynamically on the client side, if a user navigates directly to a URL like `http://localhost:3000/employee/123`, a static server might return a 404.
- We resolve this by configuring `vercel.json` (or our local Vite setup) to implement "SPA Fallback Routing" via `rewrites`.
- Every unmatched route is rewritten to serve `index.html`.
- React Router takes over upon rendering `index.html` and loads the correct `/employee/123` component logic.

> [!TIP]
> If deploying on Nginx instead of Vercel, you must manually add `try_files $uri $uri/ /index.html;` to your Nginx `.conf` block to achieve the same crash protection against 404s.
