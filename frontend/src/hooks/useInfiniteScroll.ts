import { useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  isLoading: boolean
) {
  const observerRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, isLoading]
  );

  useEffect(() => {
    const element = observerRef.current;
    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '300px',
      threshold: 0.1,
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [handleObserver, hasMore]);

  return observerRef;
}
