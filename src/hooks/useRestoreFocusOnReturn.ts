import { useEffect, useRef } from 'react';
import Spotlight from '@enact/spotlight';

export function useRestoreFocusOnReturn(containerId: string, childActive: boolean) {
  const wasActive = useRef(false);

  useEffect(() => {
    if (wasActive.current && !childActive) {
      Spotlight.focus(containerId);
    }
    wasActive.current = childActive;
  }, [childActive, containerId]);
}
