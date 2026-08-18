# Real-Time Presence & WebSockets Guide

## 1. Overview
In **v1.5.0** and **v1.10.0**, the EIMS was upgraded from a static REST application to a real-time system using **Socket.io**. This allows the system to instantly push online/offline indicators, real-time employee status changes, and global notifications to all connected administrators without requiring them to refresh the page.

## 2. Architecture

### Backend: `socketServer.js` & `presence.js`
The backend maintains a live registry of connected users in memory.
- When an admin logs in, the React frontend opens a WebSocket connection to the server.
- `socketServer.js` attaches the user's `userId` to their active socket ID.
- The `presence.js` service maintains this dictionary. It tracks who is currently "Online" and broadcasts a global `presence_update` event to everyone else.
- If the user closes the tab or loses internet, the socket disconnects, and the server broadcasts that the user is now "Offline".

### Frontend: `PresenceContext.tsx`
On the frontend, the `PresenceContext` acts as the global listener.
- It intercepts the `presence_update` events from the server.
- It maintains a React Context state `Map` of all online users.
- Anywhere in the app (like the global header or the employee data table), components can check the `PresenceContext` to render a **Green Dot** (🟢) next to a user's name if they are actively connected.

## 3. Real-Time Data Broadcasting (`accessEvents.js`)
We do more than just track online status. We also broadcast database changes in real-time.
- If HR changes an employee's status from "Active" to "Floating" or "Separated", the system calls `accessEvents.js`.
- The backend emits a `session_override` or `status_update` event down the socket.
- The frontend `useRealtimeSubscription.ts` hook listens for this and instantly updates the UI (or forces a logout if the user was just deactivated).

## 4. Troubleshooting
> [!WARNING]
> WebSockets can drop due to poor Wi-Fi or Nginx proxy timeouts.
- **Nginx Setup:** If deploying behind Nginx, ensure that `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "upgrade";` are configured in your `.conf` file. Without this, Socket.io will silently fail to upgrade from HTTP long-polling to WebSockets, causing massive lag.
- **Memory Leaks:** If the backend server reboots, all socket connections are dropped. The frontend is configured to automatically attempt reconnection. Do not store critical permanent data in the `presence.js` memory registry, as it wipes on server restart.
