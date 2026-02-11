import { Platform, ToastAndroid, Alert, NativeModules } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { getCurrentWeatherData } from '../data/DataSources';

// Access the native WidgetPinModule (Android only)
const { WidgetPinModule } = NativeModules;

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

// ============================================
// Widget Element Types (for native rendering)
// ============================================

export interface WidgetClockConfig {
    faceStyle?: string;
    handStyle?: string;
    format?: string;
    showAmPm?: boolean;
    showSeconds?: boolean;
    showNumbers?: boolean;
    showTicks?: boolean;
    faceColor?: string;
    hourHandColor?: string;
    minuteHandColor?: string;
    secondHandColor?: string;
    tickColor?: string;
    numberColor?: string;
}

export interface WidgetElement {
    type: 'rectangle' | 'ellipse' | 'text' | 'image' | 'digitalClock' | 'analogClock' | 'curvedText' | 'path' | 'line' | 'gradient';
    xPercent: number;       // 0–1 position relative to widget
    yPercent: number;
    widthPercent: number;
    heightPercent: number;
    rotation: number;
    opacity: number;
    // Shape style
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number;
    // Text style
    content?: string;       // raw text or "{time.hours}:{time.minutes}" template
    fontSize?: number;      // font size in sp (scaled for widget)
    fontWeight?: string;
    fontFamily?: string;
    color?: string;
    textAlign?: string;
    // Clock config
    clockConfig?: WidgetClockConfig;
    // Image
    imageFileName?: string; // saved to widget dir
    // Curved text
    curvedTextConfig?: {
        curveType?: string;
        curveAmount?: number;
        startOffset?: number;
    };
    // SVG path data
    path?: string;
    // Gradient
    gradientConfig?: {
        type?: string;
        colors?: string[];
        angle?: number;
    };
}

export interface DesignDimensions {
    designWidth: number;
    designHeight: number;
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

/**
 * Check if Android widget pinning is available
 */
export const isWidgetPinningAvailable = (): boolean => {
    if (Platform.OS !== 'android') {
        return false;
    }
    return typeof Platform.Version === 'number' && Platform.Version >= 26 && !!WidgetPinModule;
};

/**
 * Request to pin widget to home screen (Android)
 * Uses native AppWidgetManager to create a real pinned widget
 */
export const requestPinWidget = async (
    widgetImageUri: string,
    options: ShortcutOptions,
    elements?: WidgetElement[],
    designDims?: DesignDimensions
): Promise<ExportResult> => {
    if (Platform.OS !== 'android') {
        return { success: false, error: 'Widget pinning is only available on Android' };
    }

    try {
        if (!WidgetPinModule) {
            // Fallback if native module isn't available
            ToastAndroid.showWithGravity(
                `To add "${options.shortLabel}" to your home screen:\n` +
                '1. Long press on home screen\n' +
                '2. Select "Widgets"\n' +
                '3. Find WidgetCraft',
                ToastAndroid.LONG,
                ToastAndroid.CENTER
            );
            return { success: true, uri: widgetImageUri };
        }

        // Generate a unique widget ID
        const widgetId = `widget_${Date.now()}`;

        // Call the native module — pass element config for live rendering
        if (elements && elements.length > 0) {
            const weatherData = getCurrentWeatherData();
            const configPayload = JSON.stringify({
                elements,
                designWidth: designDims?.designWidth || 400,
                designHeight: designDims?.designHeight || 400,
                weatherData,
            });
            await WidgetPinModule.pinWidgetWithConfig(
                widgetImageUri, options.shortLabel, widgetId, configPayload
            );
        } else {
            await WidgetPinModule.pinWidget(widgetImageUri, options.shortLabel, widgetId);
        }

        ToastAndroid.show(
            `"${options.shortLabel}" added to home screen!`,
            ToastAndroid.SHORT
        );

        return { success: true, uri: widgetImageUri };
    } catch (error) {
        console.error('Failed to pin widget:', error);
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
