import { useState, useCallback, useRef, useEffect } from 'react';

const useInfiniteScroll = (fetchMore, hasMore) => {
  const [isLoading, setIsLoading] = useState(false);
  // Use a ref to store the latest fetchMore function without making it a dependency of useCallback
  const fetchMoreRef = useRef(fetchMore);

  // Keep fetchMoreRef updated with the latest fetchMore prop
  useEffect(() => {
    fetchMoreRef.current = fetchMore;
  }, [fetchMore]);

  // Public function to trigger loading more data
  const loadMore = useCallback(() => {
    // Only attempt to load more if not already loading and if there is more data available
    if (!isLoading && hasMore) {
      setIsLoading(true);
      fetchMoreRef.current()
        .finally(() => {
          // Log completion, consistent with original style
          console.log('✅ fetchMore completed');
          setIsLoading(false);
        });
    } else {
      // Log why loadMore was not triggered, consistent with original style
      console.log('❌ Not triggering loadMore - isLoading:', isLoading, 'hasMore:', hasMore);
    }
  }, [isLoading, hasMore]); // Dependencies: isLoading (internal state) and hasMore (prop)

  // Return loading state, the loadMore function, and the hasMore status
  return { isLoading, loadMore, hasMore };
};

export default useInfiniteScroll;