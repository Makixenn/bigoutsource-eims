import { useEffect, useState } from 'react';
import { AppUser } from '../types';

export interface PresenceUser {
  user_id: string;
  email: string;
  full_name: string;
  online_at: string;
}

export function usePresence(currentUser: AppUser | null) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setOnlineUsers([]);
      return;
    }
    // Supabase presence removed in self-hosted migration.
    // We could implement Socket.io presence here later.
    setOnlineUsers([{
      user_id: currentUser.uid,
      email: currentUser.email,
      full_name: currentUser.fullName,
      online_at: new Date().toISOString()
    }]);
  }, [currentUser?.uid, currentUser?.email, currentUser?.fullName]);

  return { onlineUsers };
}
