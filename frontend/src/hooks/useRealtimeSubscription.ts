import { useEffect } from 'react';
import { connectTableSocket } from '../services/realtimeService';

// Types mock to prevent TS errors
type RealtimePostgresChangesPayload<T> = any;

type RealtimeConfig = {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onChange: (payload: RealtimePostgresChangesPayload<any>) => void;
  enabled?: boolean;
};

export function useRealtimeSubscription({
  table,
  schema = 'public',
  event = '*',
  onChange,
  enabled = true
}: RealtimeConfig) {
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = connectTableSocket({
      onTableChange: (data: any) => {
        if (data.table === table) {
          if (event === '*' || data.action === event || data.event === event) {
            onChange(data);
          }
        }
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [table, schema, event, onChange, enabled]);
}
