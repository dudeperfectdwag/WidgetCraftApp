/**
 * WidgetCraft - Material You Color Scheme Generator
 * Creates dynamic color palettes from a seed color following Material Design 3
 */

import { hexToRgba, adjustColorBrightness } from '@utils/index';

// ============================================
// HCT Color Space Utilities (Simplified)
// ============================================

interface RGB {
    r: number;
    g: number;
    b: number;
}

interface HSL {
    h: number;
    s: number;
    l: number;
}

/**
 * Convert hex to RGB
 */
export const hexToRgb = (hex: string): RGB => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
};

/**
 * Convert RGB to hex
 */
export const rgbToHex = (r: number, g: number, b: number): string => {
    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
};

/**
 * Convert RGB to HSL
 */
export const rgbToHsl = (r: number, g: number, b: number): HSL => {
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

    return { h: h * 360, s: s * 100, l: l * 100 };
};

/**
 * Convert HSL to RGB
 */
export const hslToRgb = (h: number, s: number, l: number): RGB => {
    h /= 360;
    s /= 100;
    l /= 100;

    let r: number, g: number, b: number;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255),
    };
};

/**
 * Generate a tonal palette from a source color
 * Creates tones from 0 (white) to 100 (black)
 */
export const generateTonalPalette = (
    sourceHex: string
): Record<number, string> => {
    const rgb = hexToRgb(sourceHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    const tones: Record<number, string> = {};
    // Material Design 3 tone values — tone 0 = black (L=0), tone 100 = white (L=100)
    const toneValues = [0, 4, 6, 10, 12, 17, 20, 22, 24, 25, 30, 35, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100];

    toneValues.forEach(tone => {
        // Tone maps directly to lightness: tone 0 = L0 (black), tone 100 = L100 (white)
        const lightness = tone;
        const { r, g, b } = hslToRgb(hsl.h, hsl.s, lightness);
        tones[tone] = rgbToHex(r, g, b);
    });

    return tones;
};

// ============================================
// Color Role Generation
// ============================================

export interface TonalPalette {
    primary: Record<number, string>;
    secondary: Record<number, string>;
    tertiary: Record<number, string>;
    neutral: Record<number, string>;
    neutralVariant: Record<number, string>;
    error: Record<number, string>;
}

/**
 * Generate complementary colors for secondary and tertiary
 */
const getHarmonyColors = (
    sourceHex: string
): { secondary: string; tertiary: string } => {
    const rgb = hexToRgb(sourceHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Secondary: Shift hue by 60°, reduce saturation
    const secondaryHsl = {
        h: (hsl.h + 60) % 360,
        s: Math.max(hsl.s * 0.6, 20),
        l: hsl.l,
    };
    const secondaryRgb = hslToRgb(secondaryHsl.h, secondaryHsl.s, secondaryHsl.l);

    // Tertiary: Shift hue by 120°
    const tertiaryHsl = {
        h: (hsl.h + 120) % 360,
        s: Math.max(hsl.s * 0.8, 30),
        l: hsl.l,
    };
    const tertiaryRgb = hslToRgb(tertiaryHsl.h, tertiaryHsl.s, tertiaryHsl.l);

    return {
        secondary: rgbToHex(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
        tertiary: rgbToHex(tertiaryRgb.r, tertiaryRgb.g, tertiaryRgb.b),
    };
};

/**
 * Generate neutral colors from source
 */
const getNeutralColor = (sourceHex: string): string => {
    const rgb = hexToRgb(sourceHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Neutral: Keep hue, drastically reduce saturation
    const neutralRgb = hslToRgb(hsl.h, 8, 50);
    return rgbToHex(neutralRgb.r, neutralRgb.g, neutralRgb.b);
};

/**
 * Generate neutral variant from source
 */
const getNeutralVariantColor = (sourceHex: string): string => {
    const rgb = hexToRgb(sourceHex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Neutral Variant: Keep hue, slightly reduce saturation
    const neutralVariantRgb = hslToRgb(hsl.h, 16, 50);
    return rgbToHex(neutralVariantRgb.r, neutralVariantRgb.g, neutralVariantRgb.b);
};

/**
 * Generate full tonal palettes from a seed color
 */
export const generateTonalPalettes = (seedColor: string): TonalPalette => {
    const { secondary, tertiary } = getHarmonyColors(seedColor);
    const neutral = getNeutralColor(seedColor);
    const neutralVariant = getNeutralVariantColor(seedColor);
    const errorColor = '#BA1A1A'; // Standard Material error red

    return {
        primary: generateTonalPalette(seedColor),
        secondary: generateTonalPalette(secondary),
        tertiary: generateTonalPalette(tertiary),
        neutral: generateTonalPalette(neutral),
        neutralVariant: generateTonalPalette(neutralVariant),
        error: generateTonalPalette(errorColor),
    };
};

// ============================================
// Material You Color Scheme
// ============================================

export interface MaterialYouScheme {
    // Primary
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;

    // Secondary
    secondary: string;
    onSecondary: string;
    secondaryContainer: string;
    onSecondaryContainer: string;

    // Tertiary
    tertiary: string;
    onTertiary: string;
    tertiaryContainer: string;
    onTertiaryContainer: string;

    // Error
    error: string;
    onError: string;
    errorContainer: string;
    onErrorContainer: string;

    // Background & Surface
    background: string;
    onBackground: string;
    surface: string;
    onSurface: string;
    surfaceVariant: string;
    onSurfaceVariant: string;

    // Surface containers (new in Material 3)
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;

    // Outline
    outline: string;
    outlineVariant: string;

    // Inverse
    inverseSurface: string;
    inverseOnSurface: string;
    inversePrimary: string;

    // Special
    scrim: string;
    shadow: string;

    // Surface tint (for elevation)
    surfaceTint: string;
}

/**
 * Generate a light color scheme from tonal palettes
 */
export const generateLightScheme = (palettes: TonalPalette): MaterialYouScheme => {
    return {
        // Primary
        primary: palettes.primary[40],
        onPrimary: palettes.primary[100],
        primaryContainer: palettes.primary[90],
        onPrimaryContainer: palettes.primary[10],

        // Secondary
        secondary: palettes.secondary[40],
        onSecondary: palettes.secondary[100],
        secondaryContainer: palettes.secondary[90],
        onSecondaryContainer: palettes.secondary[10],

        // Tertiary
        tertiary: palettes.tertiary[40],
        onTertiary: palettes.tertiary[100],
        tertiaryContainer: palettes.tertiary[90],
        onTertiaryContainer: palettes.tertiary[10],

        // Error
        error: palettes.error[40],
        onError: palettes.error[100],
        errorContainer: palettes.error[90],
        onErrorContainer: palettes.error[10],

        // Background & Surface
        background: palettes.neutral[98],
        onBackground: palettes.neutral[10],
        surface: palettes.neutral[98],
        onSurface: palettes.neutral[10],
        surfaceVariant: palettes.neutralVariant[90],
        onSurfaceVariant: palettes.neutralVariant[30],

        // Surface containers (Material Design 3 spec)
        surfaceContainerLowest: palettes.neutral[100],
        surfaceContainerLow: palettes.neutral[96],
        surfaceContainer: palettes.neutral[94],
        surfaceContainerHigh: palettes.neutral[92],
        surfaceContainerHighest: palettes.neutral[90],

        // Outline
        outline: palettes.neutralVariant[50],
        outlineVariant: palettes.neutralVariant[80],

        // Inverse
        inverseSurface: palettes.neutral[20],
        inverseOnSurface: palettes.neutral[95],
        inversePrimary: palettes.primary[80],

        // Special
        scrim: '#000000',
        shadow: '#000000',

        // Surface tint
        surfaceTint: palettes.primary[40],
    };
};

/**
 * Generate a dark color scheme from tonal palettes
 */
export const generateDarkScheme = (palettes: TonalPalette): MaterialYouScheme => {
    return {
        // Primary
        primary: palettes.primary[80],
        onPrimary: palettes.primary[20],
        primaryContainer: palettes.primary[30],
        onPrimaryContainer: palettes.primary[90],

        // Secondary
        secondary: palettes.secondary[80],
        onSecondary: palettes.secondary[20],
        secondaryContainer: palettes.secondary[30],
        onSecondaryContainer: palettes.secondary[90],

        // Tertiary
        tertiary: palettes.tertiary[80],
        onTertiary: palettes.tertiary[20],
        tertiaryContainer: palettes.tertiary[30],
        onTertiaryContainer: palettes.tertiary[90],

        // Error
        error: palettes.error[80],
        onError: palettes.error[20],
        errorContainer: palettes.error[30],
        onErrorContainer: palettes.error[90],

        // Background & Surface (Material Design 3 spec)
        background: palettes.neutral[6],
        onBackground: palettes.neutral[90],
        surface: palettes.neutral[6],
        onSurface: palettes.neutral[90],
        surfaceVariant: palettes.neutralVariant[30],
        onSurfaceVariant: palettes.neutralVariant[80],

        // Surface containers (Material Design 3 spec)
        surfaceContainerLowest: palettes.neutral[4],
        surfaceContainerLow: palettes.neutral[10],
        surfaceContainer: palettes.neutral[12],
        surfaceContainerHigh: palettes.neutral[17],
        surfaceContainerHighest: palettes.neutral[22],

        // Outline
        outline: palettes.neutralVariant[60],
        outlineVariant: palettes.neutralVariant[30],

        // Inverse
        inverseSurface: palettes.neutral[90],
        inverseOnSurface: palettes.neutral[20],
        inversePrimary: palettes.primary[40],

        // Special
        scrim: '#000000',
        shadow: '#000000',

        // Surface tint
        surfaceTint: palettes.primary[80],
    };
};

/**
 * Generate both light and dark schemes from a seed color
 */
export const generateColorSchemes = (seedColor: string) => {
    const palettes = generateTonalPalettes(seedColor);
    return {
        light: generateLightScheme(palettes),
        dark: generateDarkScheme(palettes),
        palettes,
    };
};

// ============================================
// Preset Seed Colors (Material You Expressive)
// ============================================

export const PRESET_SEED_COLORS = {
    purple: '#6750A4',
    blue: '#0061A4',
    teal: '#006A60',
    green: '#386A20',
    yellow: '#695F00',
    orange: '#8B5000',
    red: '#BA1A1A',
    pink: '#984061',
    cyan: '#006876',
    deepPurple: '#5B46B2',
    indigo: '#3F51B5',
    violet: '#7B1FA2',
} as const;

/**
 * Get a random expressive color
 */
export const getRandomExpressiveColor = (): string => {
    const colors = Object.values(PRESET_SEED_COLORS);
    return colors[Math.floor(Math.random() * colors.length)];
};
