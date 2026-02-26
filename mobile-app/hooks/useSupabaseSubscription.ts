import { useEffect } from 'react';
import { supabase } from "../lib/supabase";

/**
 * Generic Supabase realtime subscription hook.
 * @param channelName unique name for the channel (used internally by supabase)
 * @param filter configuration object for postgres_changes
 * @param handler callback invoked when payload arrives
 */
export function useSupabaseSubscription(
  channelName: string,
  filter: { event: string; schema: string; table: string; filter?: string },
  handler: (payload: any) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', filter, handler)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, JSON.stringify(filter), handler]);
}

// default export to keep compatibility with earlier imports
export default useSupabaseSubscription;

