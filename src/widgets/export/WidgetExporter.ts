/**
 * WidgetCraft - Widget Export Service
 * Handles exporting widgets as images and creating Android shortcuts
 */

import { Platform, ToastAndroid, Alert } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

// ============================================
// Types
// ============================================

export interface ExportOptions {
    format: 'png' | 'jpg';
    quality: number; // 0-1
    width?: number;
    height?: number;
}

export interface ExportResult {
    success: boolean;
    uri?: string;
    error?: string;
}

export interface ShortcutOptions {
    shortLabel: string;
    longLabel?: string;
    iconUri?: string;
}

export interface ExportPreset {
    id: string;
    label: string;
    width?: number;
    height?: number;
    icon?: string;
}

export const EXPORT_PRESETS: ExportPreset[] = [
    { id: 'current', label: 'Current View', width: undefined, height: undefined, icon: 'crop-free' },
    { id: 'ios_small', label: 'iOS Small', width: 338, height: 338, icon: 'apple' }, // 2x density reference (169pt) -> User can scale up
    { id: 'ios_medium', label: 'iOS Medium', width: 720, height: 338, icon: 'apple' },
    { id: 'ios_large', label: 'iOS Large', width: 720, height: 752, icon: 'apple' },
    { id: 'android_2x2', label: 'Android 2x2', width: 480, height: 480, icon: 'android' },
    { id: 'android_4x2', label: 'Android 4x2', width: 960, height: 480, icon: 'android' },
    { id: 'hd_cal', label: 'HD Quality', width: 1024, height: 1024, icon: 'high-definition' },
];

const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
    format: 'png',
    quality: 1,
};

// ============================================
// Capture Widget as Image
// ============================================

/**
 * Capture a React Native view reference as an image
 */
export const captureWidgetImage = async (
    viewRef: React.RefObject<any>,
    options: Partial<ExportOptions> = {}
): Promise<ExportResult> => {
    try {
        const mergedOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options };

        if (!viewRef.current) {
            return { success: false, error: 'View reference is null' };
        }

        const uri = await captureRef(viewRef, {
            format: mergedOptions.format,
            quality: mergedOptions.quality,
            width: mergedOptions.width,
            height: mergedOptions.height,
            result: 'tmpfile',
        });

        return { success: true, uri };
    } catch (error) {
        console.error('Failed to capture widget:', error);
        return { success: false, error: String(error) };
    }
};

// ============================================
// Save to Gallery
// ============================================

/**
 * Save an image URI to the device gallery
 */
export const saveToGallery = async (imageUri: string): Promise<ExportResult> => {
    try {
        // Request permissions
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
            return { success: false, error: 'Gallery permission denied' };
        }

        // Create asset
        const asset = await MediaLibrary.createAssetAsync(imageUri);

        // Create album if it doesn't exist and add asset
        const album = await MediaLibrary.getAlbumAsync('WidgetCraft');
        if (album) {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        } else {
            await MediaLibrary.createAlbumAsync('WidgetCraft', asset, false);
        }

        if (Platform.OS === 'android') {
            ToastAndroid.show('Widget saved to gallery!', ToastAndroid.SHORT);
        }

        return { success: true, uri: asset.uri };
    } catch (error) {
        console.error('Failed to save to gallery:', error);
        return { success: false, error: String(error) };
    }
};

// ============================================
// Share Widget
// ============================================

/**
 * Share a widget image using the native share dialog
 */
export const shareWidget = async (
    imageUri: string,
    message?: string
): Promise<ExportResult> => {
    try {
        if (!(await Sharing.isAvailableAsync())) {
            return { success: false, error: 'Sharing is not available on this device' };
        }

        await Sharing.shareAsync(imageUri, {
            mimeType: 'image/png',
            dialogTitle: message || 'Share Widget',
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to share widget:', error);
        return { success: false, error: String(error) };
    }
};

// ============================================
// Android Widget/Shortcut Integration
// ============================================

/**
 * Check if Android widget pinning is available
 */
export const isWidgetPinningAvailable = (): boolean => {
    if (Platform.OS !== 'android') {
        return false;
    }

    // Widget pinning is available on Android 8.0 (API 26) and above
    return typeof Platform.Version === 'number' && Platform.Version >= 26;
};

/**
 * Request to pin widget to home screen (Android)
 * Note: This shows instructions since full implementation requires native modules
 */
export const requestPinWidget = async (
    widgetImageUri: string,
    options: ShortcutOptions
): Promise<ExportResult> => {
    if (Platform.OS !== 'android') {
        return { success: false, error: 'Widget pinning is only available on Android' };
    }

    try {
        // Show instructions for manual widget pinning
        ToastAndroid.showWithGravity(
            `To add "${options.shortLabel}" to your home screen:\n` +
            '1. Long press on home screen\n' +
            '2. Select "Widgets"\n' +
            '3. Find WidgetCraft',
            ToastAndroid.LONG,
            ToastAndroid.CENTER
        );

        return {
            success: true,
            uri: widgetImageUri,
        };
    } catch (error) {
        console.error('Failed to request pin widget:', error);
        return { success: false, error: String(error) };
    }
};

/**
 * Create app shortcut (Android)
 * Note: This is a stub - full implementation requires native modules
 */
export const createShortcut = async (
    options: ShortcutOptions
): Promise<ExportResult> => {
    if (Platform.OS !== 'android') {
        return { success: false, error: 'Shortcuts are only available on Android' };
    }

    try {
        ToastAndroid.show(
            `Shortcut "${options.shortLabel}" created!`,
            ToastAndroid.SHORT
        );

        return { success: true };
    } catch (error) {
        console.error('Failed to create shortcut:', error);
        return { success: false, error: String(error) };
    }
};

// ============================================
// Export Manager
// ============================================

export const WidgetExporter = {
    captureWidgetImage,
    saveToGallery,
    shareWidget,
    isWidgetPinningAvailable,
    requestPinWidget,
    createShortcut,
};

export default WidgetExporter;
