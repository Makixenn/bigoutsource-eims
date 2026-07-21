import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { connectPresenceSocket } from '../services/realtimeService';

export interface PresenceUser {
  user_id: string;
  email: string;
  full_name: string;
  online_at: string;
}

interface PresenceContextType {
  onlineUsers: PresenceUser[];
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setOnlineUsers([]);
      return;
    }

    const cleanup = connectPresenceSocket({
      onSync: (users: PresenceUser[]) => {
        setOnlineUsers(users);
      },
      onJoin: (joinedUser: PresenceUser) => {
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.user_id === joinedUser.user_id)) return prev;
          return [...prev, joinedUser];
        });
      },
      onLeave: ({ user_id }: { user_id: string }) => {
        setOnlineUsers((prev) => prev.filter((u) => u.user_id !== user_id));
      }
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [user?.uid]);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}
