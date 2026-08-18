# Component Library

The frontend utilizes a customized, highly reusable component architecture. It does not rely heavily on massive third-party UI libraries like Material-UI or Ant Design, favoring instead standard HTML/Tailwind styling combined with specific Headless UI elements where needed.

## 1. Directory Structure (`frontend/src/components/`)
- `layout/`: Contains structural components like `PageLayout`, sidebars, and navigation elements.
- `ui/`: Contains atomic, reusable base UI elements (e.g., standard buttons, inputs, modals).
- Root-level components: Specialized, frequently used global elements (`CustomSelect`, `Pagination`, `ErrorBoundary`, `GlobalNotifications`, `SkeletonLoadingMessage`).

## 2. Key Custom Components

### `PageLayout`
The primary wrapper for all authenticated views. It handles the sidebar layout, responsive spacing, and consistent page headers.

### `CustomSelect`
A heavily styled select dropdown used throughout the application to replace the default browser `<select>` element for better aesthetics and uniform cross-browser rendering.

### `SkeletonLoadingMessage`
Used extensively during async data fetching to prevent layout shift. It provides a visual shimmer effect while data is loading.

### `Pagination`
A standardized pagination control used across tables (Employee Directory, Audit Logs, Evaluations, etc.).

## 3. Styling Paradigm
- **Tailwind CSS:** The primary styling mechanism. All components are styled using utility classes.
- **Framer Motion (`motion/react`):** Used for micro-interactions, page transitions, and modal animations.
- **clsx / tailwind-merge:** Used to elegantly merge base Tailwind classes with dynamic overrides passed via props (typically encapsulated in a `cn()` utility function).
