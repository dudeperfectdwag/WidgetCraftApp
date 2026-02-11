/**
 * WidgetCraft - Data Context
 * React context for widget data binding
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { dataProvider, startDataUpdates, stopDataUpdates, parseDataBindings } from './DataSources';
import { DataBindingKey } from '../types';

// ============================================
// Context Type
// ============================================

interface DataContextType {
    getValue: (key: DataBindingKey) => string | number | boolean;
    parseText: (text: string) => string;
    subscribe: (key: DataBindingKey, callback: (value: any) => void) => () => void;
}

const DataContext = createContext<DataContextType | null>(null);

// ============================================
// Data Provider Component
// ============================================

interface DataProviderProps {
    children: React.ReactNode;
}

export const WidgetDataProvider: React.FC<DataProviderProps> = ({ children }) => {
    useEffect(() => {
        // Start live updates when provider mounts
        startDataUpdates();

        return () => {
            // Stop updates when unmounts
            stopDataUpdates();
        };
    }, []);

    const getValue = useCallback((key: DataBindingKey) => {
        return dataProvider.getValue(key);
    }, []);

    const parseText = useCallback((text: string) => {
        return parseDataBindings(text);
    }, []);

    const subscribe = useCallback((key: DataBindingKey, callback: (value: any) => void) => {
        return dataProvider.subscribe(key, callback);
    }, []);

    return (
        <DataContext.Provider value={{ getValue, parseText, subscribe }}>
            {children}
        </DataContext.Provider>
    );
};

// ============================================
// Custom Hooks
// ============================================

export const useWidgetData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useWidgetData must be used within a WidgetDataProvider');
    }
    return context;
};

// Hook for subscribing to a specific data value
export const useDataValue = (key: DataBindingKey): string | number | boolean => {
    const { getValue, subscribe } = useWidgetData();
    const [value, setValue] = useState(() => getValue(key));

    useEffect(() => {
        const unsubscribe = subscribe(key, setValue);
        return unsubscribe;
    }, [key, subscribe]);

    return value;
};

// Hook for parsing text with data bindings (auto-updates)
export const useParsedText = (text: string): string => {
    const { parseText, subscribe } = useWidgetData();
    const [parsed, setParsed] = useState(() => parseText(text));

    // Extract binding keys from text
    const bindingKeys = React.useMemo(() => {
        const regex = /\{([^}]+)\}/g;
        const keys: DataBindingKey[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            keys.push(match[1] as DataBindingKey);
        }
        return keys;
    }, [text]);

    useEffect(() => {
        // Subscribe to all binding keys
        const unsubscribes = bindingKeys.map((key) =>
            subscribe(key, () => {
                setParsed(parseText(text));
            })
        );

        return () => {
            unsubscribes.forEach((unsub) => unsub());
        };
    }, [text, bindingKeys, subscribe, parseText]);

    return parsed;
};

// ============================================
// Export
// ============================================

export { DataContext };
