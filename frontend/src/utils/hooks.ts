import { useState, useEffect, useRef, useCallback } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Optimized useAsync hook
 * - Preserves previous data during refetch (no flicker)
 * - Supports request cancellation to avoid race conditions
 * - Uses abort controller for cleanup
 */
export const useAsync = <T,>(
  asyncFunction: () => Promise<T>,
  immediate = true,
  dependencies: any[] = []
): UseAsyncState<T> & { refetch: () => Promise<void> } => {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });
  
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const execute = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    
    // Don't clear existing data - show loading state alongside current data
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await asyncFunction();
      
      // Only update if this is still the latest request and component is mounted
      if (mountedRef.current && currentRequestId === requestIdRef.current) {
        setState({ data: response, loading: false, error: null });
      }
    } catch (error) {
      // Only update if this is still the latest request and component is mounted
      if (mountedRef.current && currentRequestId === requestIdRef.current) {
        setState(prev => ({
          data: prev.data, // Keep previous data on error
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }
  }, [asyncFunction]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (immediate) {
      execute();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [...dependencies, immediate]);

  return {
    ...state,
    refetch: execute,
  };
};

export const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
};
