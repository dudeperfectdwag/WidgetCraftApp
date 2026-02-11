/**
 * WidgetCraft - Utility Functions
 * Common helper functions used throughout the app
 */

export * from './Performance';
export { default as Performance } from './Performance';

export * from './Constants';
export { default as Constants } from './Constants';

import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// Responsive Design Utilities
// ============================================

/**
 * Normalize size based on screen width
 * Base width: 375 (iPhone standard)
 */
export const normalizeSize = (size: number): number => {
    const scale = SCREEN_WIDTH / 375;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Normalize font size with consideration for pixel density
 */
export const normalizeFontSize = (size: number): number => {
    const scale = SCREEN_WIDTH / 375;
    const fontScale = PixelRatio.getFontScale();
    return Math.round(PixelRatio.roundToNearestPixel(size * scale / fontScale));
};

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
    const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
    return SCREEN_WIDTH >= 768 || aspectRatio < 1.6;
};

/**
 * Get safe screen dimensions
 */
export const getScreenDimensions = () => ({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isLandscape: SCREEN_WIDTH > SCREEN_HEIGHT,
});

// ============================================
// Color Utilities
// ============================================

/**
 * Convert hex color to RGBA
 */
export const hexToRgba = (hex: string, opacity: number = 1): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${opacity})`;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Convert RGB to HSL
 */
export const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

/**
 * Lighten or darken a color
 */
export const adjustColorBrightness = (hex: string, amount: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Get contrast color (black or white) based on background
 */
export const getContrastColor = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#000000';

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Get a contrasting preview background for a given foreground color.
 * Light foreground → dark background, dark foreground → light background.
 */
export const getContrastBackground = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#1C1B1F';

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    // Light text → dark bg, dark text → light bg
    return luminance > 0.5 ? '#1C1B1F' : '#FFFBFE';
};

// ============================================
// ID & String Utilities
// ============================================

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Convert to title case
 */
export const toTitleCase = (text: string): string => {
    return text
        .toLowerCase()
        .split(' ')
        .map(word => capitalize(word))
        .join(' ');
};

// ============================================
// Math Utilities
// ============================================

/**
 * Clamp a value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Linear interpolation
 */
export const lerp = (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
};

/**
 * Map a value from one range to another
 */
export const mapRange = (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number => {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Convert degrees to radians
 */
export const degToRad = (degrees: number): number => {
    return (degrees * Math.PI) / 180;
};

/**
 * Convert radians to degrees
 */
export const radToDeg = (radians: number): number => {
    return (radians * 180) / Math.PI;
};

// ============================================
// Date & Time Utilities
// ============================================

/**
 * Format time with leading zeros
 */
export const formatTime = (date: Date, use24Hour: boolean = false): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (use24Hour) {
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
    const options: Intl.DateTimeFormatOptions = format === 'long'
        ? { weekday: 'long', month: 'long', day: 'numeric' }
        : { month: 'short', day: 'numeric' };

    return date.toLocaleDateString('en-US', options);
};

// ============================================
// Validation Utilities
// ============================================

/**
 * Check if a value is a valid color hex
 */
export const isValidHex = (hex: string): boolean => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
};

/**
 * Check if platform is Android
 */
export const isAndroid = Platform.OS === 'android';

/**
 * Check if platform is iOS
 */
export const isIOS = Platform.OS === 'ios';

// ============================================
// Delay Utilities
// ============================================

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), wait);
    };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};
