/**
 * WidgetCraft - Widget Storage Service
 * Handles saving, loading, and managing widgets in local storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CanvasElement } from '@canvas/CanvasContext';

// Storage keys
const STORAGE_KEYS = {
    WIDGETS: '@widgetcraft/widgets',
    WIDGET_PREFIX: '@widgetcraft/widget_',
};

// Widget metadata stored in the list
export interface WidgetMetadata {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    thumbnail?: string; // Base64 thumbnail (optional)
    width: number;
    height: number;
    elementCount: number;
}

// Full widget data including elements
export interface SavedWidget extends WidgetMetadata {
    elements: Record<string, CanvasElement>;
    elementOrder: string[];
    canvasSize: { width: number; height: number };
}

// Generate unique widget ID
const generateWidgetId = (): string => {
    return `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const sanitizeElementsForStorage = (elements: Record<string, CanvasElement>): Record<string, CanvasElement> => {
    return Object.fromEntries(
        Object.entries(elements).map(([id, element]) => {
            if (!element) {
                return [id, element];
            }
            const { scriptOutput, ...rest } = element;
            return [id, rest as CanvasElement];
        })
    );
};

/**
 * Get list of all saved widget metadata
 */
export const getWidgetList = async (): Promise<WidgetMetadata[]> => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEYS.WIDGETS);
        if (data) {
            return JSON.parse(data);
        }
        return [];
    } catch (error) {
        console.error('Error loading widget list:', error);
        return [];
    }
};

/**
 * Save widget list metadata
 */
const saveWidgetList = async (widgets: WidgetMetadata[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(STORAGE_KEYS.WIDGETS, JSON.stringify(widgets));
    } catch (error) {
        console.error('Error saving widget list:', error);
        throw error;
    }
};

/**
 * Get a specific widget by ID
 */
export const getWidget = async (id: string): Promise<SavedWidget | null> => {
    try {
        const data = await AsyncStorage.getItem(`${STORAGE_KEYS.WIDGET_PREFIX}${id}`);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Error loading widget:', error);
        return null;
    }
};

/**
 * Save a new widget or update existing one
 */
export const saveWidget = async (
    widget: Omit<SavedWidget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; name?: string }
): Promise<SavedWidget> => {
    try {
        const now = Date.now();
        const isNew = !widget.id;
        const id = widget.id || generateWidgetId();
        const sanitizedElements = sanitizeElementsForStorage(widget.elements);

        // Get existing widget for createdAt if updating
        let createdAt = now;
        if (!isNew) {
            const existing = await getWidget(id);
            if (existing) {
                createdAt = existing.createdAt;
            }
        }

        const savedWidget: SavedWidget = {
            ...widget,
            elements: sanitizedElements,
            id,
            name: widget.name || `Widget ${new Date(now).toLocaleDateString()}`,
            createdAt,
            updatedAt: now,
            width: widget.canvasSize.width,
            height: widget.canvasSize.height,
            elementCount: widget.elementOrder.length,
        };

        // Save full widget data
        await AsyncStorage.setItem(
            `${STORAGE_KEYS.WIDGET_PREFIX}${id}`,
            JSON.stringify(savedWidget)
        );

        // Update widget list
        const widgetList = await getWidgetList();
        const metadata: WidgetMetadata = {
            id: savedWidget.id,
            name: savedWidget.name,
            createdAt: savedWidget.createdAt,
            updatedAt: savedWidget.updatedAt,
            thumbnail: savedWidget.thumbnail,
            width: savedWidget.width,
            height: savedWidget.height,
            elementCount: savedWidget.elementCount,
        };

        const existingIndex = widgetList.findIndex(w => w.id === id);
        if (existingIndex >= 0) {
            widgetList[existingIndex] = metadata;
        } else {
            widgetList.unshift(metadata); // Add to beginning (newest first)
        }

        await saveWidgetList(widgetList);

        return savedWidget;
    } catch (error) {
        console.error('Error saving widget:', error);
        throw error;
    }
};

/**
 * Delete a widget
 */
export const deleteWidget = async (id: string): Promise<void> => {
    try {
        // Remove widget data
        await AsyncStorage.removeItem(`${STORAGE_KEYS.WIDGET_PREFIX}${id}`);

        // Update widget list
        const widgetList = await getWidgetList();
        const filtered = widgetList.filter(w => w.id !== id);
        await saveWidgetList(filtered);
    } catch (error) {
        console.error('Error deleting widget:', error);
        throw error;
    }
};

/**
 * Duplicate a widget
 */
export const duplicateWidget = async (id: string): Promise<SavedWidget | null> => {
    try {
        const original = await getWidget(id);
        if (!original) return null;

        const duplicate = await saveWidget({
            ...original,
            id: undefined, // Generate new ID
            name: `${original.name} (Copy)`,
        });

        return duplicate;
    } catch (error) {
        console.error('Error duplicating widget:', error);
        return null;
    }
};

/**
 * Clear all widgets (for debugging)
 */
export const clearAllWidgets = async (): Promise<void> => {
    try {
        const widgetList = await getWidgetList();

        // Delete all widget data
        await Promise.all(
            widgetList.map(w =>
                AsyncStorage.removeItem(`${STORAGE_KEYS.WIDGET_PREFIX}${w.id}`)
            )
        );

        // Clear widget list
        await AsyncStorage.removeItem(STORAGE_KEYS.WIDGETS);
    } catch (error) {
        console.error('Error clearing widgets:', error);
        throw error;
    }
};

export default {
    getWidgetList,
    getWidget,
    saveWidget,
    deleteWidget,
    duplicateWidget,
    clearAllWidgets,
};
