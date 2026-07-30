import { useEffect, useState } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('resize', handler);
    mq.addEventListener('change', handler);
    return () => {
      mq.removeEventListener('resize', handler);
      mq.removeEventListener('change', handler);
    };
  }, []);

  return isMobile;
}
