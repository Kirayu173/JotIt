import { useEffect } from 'react';

import { useAppStore } from '@/store/useAppStore';

export function useAppBootstrap() {
  const initialize = useAppStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);
}
