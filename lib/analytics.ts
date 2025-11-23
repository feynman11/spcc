import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trpc } from "./trpc/client";

/**
 * Hook to track page views automatically
 * Call this hook in page components to track views
 * Prevents duplicate tracking even in React StrictMode
 */
export function usePageViewTracking() {
  const pathname = usePathname();
  const { data: currentUser } = trpc.members.getCurrentUser.useQuery();
  const trackPageView = trpc.stats.trackPageView.useMutation();
  const lastTrackedRef = useRef<{ path: string; userId?: string } | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const userId = currentUser?.id || undefined;
    const trackingKey = `${pathname}:${userId || 'anonymous'}`;
    
    // Only track if this is a different pathname or user than last tracked
    const lastKey = lastTrackedRef.current 
      ? `${lastTrackedRef.current.path}:${lastTrackedRef.current.userId || 'anonymous'}`
      : null;

    if (trackingKey !== lastKey) {
      lastTrackedRef.current = { path: pathname, userId };
      
      // Track the page view
      trackPageView.mutate({
        path: pathname,
        userId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentUser?.id]);
}

