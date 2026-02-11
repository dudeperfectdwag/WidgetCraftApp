/**
 * WidgetCraft - Share Service
 * Enhanced sharing capabilities for widgets
 */

import { Platform, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from '@utils/HapticService';
import { SavedWidget } from '@services/WidgetStorage';

// ============================================
// Types
// ============================================

export interface ShareOptions {
    format: 'image' | 'json' | 'link';
    quality?: 'low' | 'medium' | 'high';
    includeMetadata?: boolean;
}

export interface ShareResult {
    success: boolean;
    method?: string;
    error?: string;
}

export type SharePlatform =
    | 'twitter'
    | 'instagram'
    | 'whatsapp'
    | 'telegram'
    | 'copy'
    | 'more';

const sanitizeElementsForExport = (elements: SavedWidget['elements']): SavedWidget['elements'] => {
    return Object.fromEntries(
        Object.entries(elements).map(([id, element]) => {
            if (!element) {
                return [id, element];
            }
            const { scriptOutput, ...rest } = element as any;
            return [id, rest];
        })
    ) as SavedWidget['elements'];
};

// ============================================
// Share Utilities
// ============================================

/**
 * Share widget via native share dialog
 */
export const shareWidget = async (
    widget: SavedWidget,
    imageUri?: string,
    options?: ShareOptions
): Promise<ShareResult> => {
    try {
        const message = `Check out my "${widget.name}" widget made with WidgetCraft! 🎨`;

        if (imageUri) {
            // Share image with message
            const result = await Share.share({
                message,
                url: imageUri, // iOS only
            });

            return {
                success: result.action !== Share.dismissedAction,
                method: result.action,
            };
        } else {
            // Share just the message
            const result = await Share.share({ message });
            return {
                success: result.action !== Share.dismissedAction,
                method: result.action,
            };
        }
    } catch (error) {
        console.error('Share failed:', error);
        return { success: false, error: String(error) };
    }
};

/**
 * Copy widget configuration to clipboard as JSON
 */
export const copyWidgetToClipboard = async (widget: SavedWidget): Promise<ShareResult> => {
    try {
        const sanitizedElements = sanitizeElementsForExport(widget.elements);
        const widgetData = {
            name: widget.name,
            elements: sanitizedElements,
            elementOrder: widget.elementOrder,
            canvasSize: widget.canvasSize,
            version: '1.0',
            exportedAt: new Date().toISOString(),
        };

        await Clipboard.setStringAsync(JSON.stringify(widgetData, null, 2));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        return { success: true, method: 'clipboard' };
    } catch (error) {
        console.error('Copy to clipboard failed:', error);
        return { success: false, error: String(error) };
    }
};

/**
 * Copy shareable link to clipboard
 */
export const copyShareLink = async (widget: SavedWidget): Promise<ShareResult> => {
    try {
        // In a real app, this would be a deep link or web URL
        const shareLink = `widgetcraft://widget/${widget.id}`;
        await Clipboard.setStringAsync(shareLink);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        return { success: true, method: 'link' };
    } catch (error) {
        console.error('Copy link failed:', error);
        return { success: false, error: String(error) };
    }
};

/**
 * Export widget as shareable JSON string
 */
export const exportWidgetAsJson = (widget: SavedWidget): string => {
    const sanitizedElements = sanitizeElementsForExport(widget.elements);
    const exportData = {
        version: '1.0',
        type: 'widgetcraft-export',
        name: widget.name,
        createdAt: widget.createdAt,
        elements: sanitizedElements,
        elementOrder: widget.elementOrder,
        canvasSize: widget.canvasSize,
    };

    return JSON.stringify(exportData);
};

/**
 * Import widget from JSON string
 */
export const importWidgetFromJson = (jsonString: string): Partial<SavedWidget> | null => {
    try {
        const data = JSON.parse(jsonString);

        if (data.type !== 'widgetcraft-export') {
            throw new Error('Invalid widget format');
        }

        const elements = data.elements || {};
        const elementOrder = Array.isArray(data.elementOrder)
            ? data.elementOrder
            : Object.keys(elements);

        return {
            name: data.name,
            elements,
            elementOrder,
            canvasSize: data.canvasSize,
        };
    } catch (error) {
        console.error('Import failed:', error);
        return null;
    }
};

// ============================================
// Social Platform Helpers
// ============================================

const PLATFORM_URLS: Record<SharePlatform, (message: string) => string | null> = {
    twitter: (message) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
    whatsapp: (message) => `whatsapp://send?text=${encodeURIComponent(message)}`,
    telegram: (message) => `tg://msg?text=${encodeURIComponent(message)}`,
    instagram: () => null, // Instagram doesn't support direct text sharing
    copy: () => null,
    more: () => null,
};

/**
 * Get share URL for specific platform
 */
export const getShareUrl = (platform: SharePlatform, message: string): string | null => {
    const urlGenerator = PLATFORM_URLS[platform];
    return urlGenerator ? urlGenerator(message) : null;
};

/**
 * Share to specific platform
 */
export const shareToSpecificPlatform = async (
    platform: SharePlatform,
    widget: SavedWidget,
    imageUri?: string
): Promise<ShareResult> => {
    const message = `Check out my "${widget.name}" widget made with WidgetCraft! 🎨`;

    switch (platform) {
        case 'copy':
            await Clipboard.setStringAsync(message);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return { success: true, method: 'clipboard' };

        case 'more':
            return shareWidget(widget, imageUri);

        default:
            // For other platforms, use native share
            return shareWidget(widget, imageUri);
    }
};

// ============================================
// Export
// ============================================

export const ShareService = {
    shareWidget,
    copyWidgetToClipboard,
    copyShareLink,
    exportWidgetAsJson,
    importWidgetFromJson,
    getShareUrl,
    shareToSpecificPlatform,
};

export default ShareService;
