import { useState, useEffect, useCallback, useRef } from 'react';

const useInfiniteScroll = (fetchMore, hasMore) => {
  const [isLoading, setIsLoading] = useState(false);
  const fetchMoreRef = useRef(fetchMore);
  const hasMoreRef = useRef(hasMore);
  const isLoadingRef = useRef(isLoading);

  // Keep refs updated
  useEffect(() => {
    fetchMoreRef.current = fetchMore;
    hasMoreRef.current = hasMore;
    isLoadingRef.current = isLoading;
  }, [fetchMore, hasMore, isLoading]);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY || window.pageYOffset;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
    
    console.log('Scroll event detected:', {
      scrollTop,
      windowHeight,
      documentHeight,
      distanceFromBottom,
      hasMore: hasMoreRef.current,
      isLoading: isLoadingRef.current
    });
    
    // Simple check: if we're within 100px of bottom and have more content
    if (distanceFromBottom <= 100) {
      console.log('Near bottom - checking conditions...');
      if (hasMoreRef.current && !isLoadingRef.current) {
        console.log('✅ Triggering fetchMore!');
        setIsLoading(true);
        fetchMoreRef.current().finally(() => {
          console.log('✅ fetchMore completed');
          setIsLoading(false);
        });
      } else {
        console.log('❌ Not triggering - hasMore:', hasMoreRef.current, 'isLoading:', isLoadingRef.current);
      }
    }
  }, []); // Empty dependency array since we use refs

  useEffect(() => {
    console.log('📋 Setting up scroll listener');
    
    // Simple scroll listener
    const scrollListener = () => {
      console.log('🎯 Scroll event fired!');
      handleScroll();
    };
    
    // Add listeners to multiple targets to ensure detection
    window.addEventListener('scroll', scrollListener, { passive: true });
    document.addEventListener('scroll', scrollListener, { passive: true });
    document.body.addEventListener('scroll', scrollListener, { passive: true });
    
    // Test immediately to see if we can detect scroll
    console.log('🧪 Testing scroll detection...');
    handleScroll();
    
    return () => {
      console.log('🧹 Cleaning up scroll listeners');
      window.removeEventListener('scroll', scrollListener);
      document.removeEventListener('scroll', scrollListener);
      document.body.removeEventListener('scroll', scrollListener);
    };
  }, [handleScroll]); // Include handleScroll dependency

  return { isLoading };
};

export default useInfiniteScroll;
