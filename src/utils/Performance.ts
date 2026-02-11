/**
 * WidgetCraft - Performance Utilities
 * Optimization helpers for the app
 */

import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';

// ============================================
// Memoization Utilities
// ============================================

/**
 * Deep comparison memo wrapper
 * Use for components with complex props that need deep equality checks
 */
export function deepMemo<P extends object>(
    Component: React.ComponentType<P>,
    propsAreEqual?: (prevProps: P, nextProps: P) => boolean
): React.NamedExoticComponent<P> {
    return memo(Component, propsAreEqual || deepEqual) as React.NamedExoticComponent<P>;
}

/**
 * Simple deep equality check for memoization
 */
function deepEqual(prevProps: any, nextProps: any): boolean {
    if (prevProps === nextProps) return true;
    if (typeof prevProps !== 'object' || typeof nextProps !== 'object') return false;
    if (prevProps === null || nextProps === null) return false;

    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) return false;

    for (const key of prevKeys) {
        if (key === 'children') continue; // Skip children comparison
        if (!nextKeys.includes(key)) return false;

        const prevValue = prevProps[key];
        const nextValue = nextProps[key];

        // Skip function comparison (assume stable refs)
        if (typeof prevValue === 'function' && typeof nextValue === 'function') continue;

        if (typeof prevValue === 'object' && typeof nextValue === 'object') {
            if (!deepEqual(prevValue, nextValue)) return false;
        } else if (prevValue !== nextValue) {
            return false;
        }
    }

    return true;
}

// ============================================
// Lazy Loading Utilities
// ============================================

/**
 * Defer heavy work until after interactions complete
 */
export function useAfterInteractions<T>(
    createValue: () => T,
    dependencies: any[] = []
): T | null {
    const [value, setValue] = useState<T | null>(null);

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            setValue(createValue());
        });

        return () => task.cancel();
    }, dependencies);

    return value;
}

/**
 * Lazy initialize a value with a factory function
 */
export function useLazyRef<T>(factory: () => T): React.MutableRefObject<T> {
    const ref = useRef<T | null>(null);

    if (ref.current === null) {
        ref.current = factory();
    }

    return ref as React.MutableRefObject<T>;
}

/**
 * Debounce a callback
 */
export function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Update callback ref on each render
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const debouncedCallback = useCallback(
        ((...args: any[]) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        }) as T,
        [delay]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedCallback;
}

/**
 * Throttle a callback
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const lastRunRef = useRef<number>(0);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    const throttledCallback = useCallback(
        ((...args: any[]) => {
            const now = Date.now();
            if (now - lastRunRef.current >= delay) {
                lastRunRef.current = now;
                callbackRef.current(...args);
            }
        }) as T,
        [delay]
    );

    return throttledCallback;
}

// ============================================
// Render Optimization
// ============================================

/**
 * Hook to detect unnecessary re-renders in development
 */
export function useRenderCount(componentName: string): void {
    const renderCount = useRef(0);
    renderCount.current += 1;

    if (__DEV__) {
        console.log(`[Render] ${componentName}: ${renderCount.current}`);
    }
}

/**
 * Hook to track which props changed
 */
export function useWhyDidYouUpdate(name: string, props: Record<string, any>): void {
    const previousProps = useRef<Record<string, any>>({});

    useEffect(() => {
        if (__DEV__ && previousProps.current) {
            const allKeys = Object.keys({ ...previousProps.current, ...props });
            const changedProps: Record<string, { from: any; to: any }> = {};

            allKeys.forEach((key) => {
                if (previousProps.current[key] !== props[key]) {
                    changedProps[key] = {
                        from: previousProps.current[key],
                        to: props[key],
                    };
                }
            });

            if (Object.keys(changedProps).length > 0) {
                console.log('[WhyDidYouUpdate]', name, changedProps);
            }
        }

        previousProps.current = props;
    });
}

// ============================================
// Data Caching
// ============================================

interface CacheEntry<T> {
    value: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Simple in-memory cache with TTL
 */
export const MemoryCache = {
    get<T>(key: string, ttlMs: number = 5 * 60 * 1000): T | null {
        const entry = cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > ttlMs) {
            cache.delete(key);
            return null;
        }

        return entry.value;
    },

    set<T>(key: string, value: T): void {
        cache.set(key, { value, timestamp: Date.now() });
    },

    delete(key: string): void {
        cache.delete(key);
    },

    clear(): void {
        cache.clear();
    },

    has(key: string): boolean {
        return cache.has(key);
    },
};

/**
 * Hook for cached async data fetching
 */
export function useCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
    const [data, setData] = useState<T | null>(() => MemoryCache.get<T>(key, ttlMs));
    const [loading, setLoading] = useState(!data);
    const [error, setError] = useState<Error | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetcher();
            MemoryCache.set(key, result);
            setData(result);
        } catch (e) {
            setError(e instanceof Error ? e : new Error(String(e)));
        } finally {
            setLoading(false);
        }
    }, [key, fetcher]);

    useEffect(() => {
        if (!data) {
            fetch();
        }
    }, []);

    return { data, loading, error, refetch: fetch };
}

// ============================================
// List Optimization
// ============================================

/**
 * Virtualized list item key extractor with memoization
 */
export const createKeyExtractor = <T extends { id: string }>(
    prefix: string = ''
) => {
    return (item: T, index: number): string => {
        return item.id ? `${prefix}${item.id}` : `${prefix}index-${index}`;
    };
};

/**
 * Generate getItemLayout for fixed height lists
 */
export const createGetItemLayout = (itemHeight: number, headerHeight: number = 0) => {
    return (_: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index + headerHeight,
        index,
    });
};

// ============================================
// Image Optimization
// ============================================

/**
 * Calculate optimal image dimensions while maintaining aspect ratio
 */
export const calculateOptimalImageSize = (
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
): { width: number; height: number } => {
    const aspectRatio = originalWidth / originalHeight;

    let width = maxWidth;
    let height = maxWidth / aspectRatio;

    if (height > maxHeight) {
        height = maxHeight;
        width = maxHeight * aspectRatio;
    }

    return { width: Math.round(width), height: Math.round(height) };
};

// ============================================
// Export
// ============================================

export const Performance = {
    deepMemo,
    deepEqual,
    useAfterInteractions,
    useLazyRef,
    useDebounce,
    useThrottle,
    useRenderCount,
    useWhyDidYouUpdate,
    MemoryCache,
    useCachedData,
    createKeyExtractor,
    createGetItemLayout,
    calculateOptimalImageSize,
};

export default Performance;
