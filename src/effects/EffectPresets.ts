/**
 * WidgetCraft - Effect Presets & Styles
 * Pre-designed style combinations for quick widget styling
 */

import { ViewStyle, TextStyle } from 'react-native';
import { SHADOW_PRESETS, GlassEffect, GradientEffect, GlowEffect, GradientDirection } from './VisualEffects';

// ============================================
// Style Preset Types
// ============================================

export interface StylePreset {
    id: string;
    name: string;
    category: StyleCategory;
    preview: PreviewStyle;
    containerStyle: ViewStyle;
    textStyle?: TextStyle;
    effects?: StyleEffects;
}

export interface StyleEffects {
    shadow?: keyof typeof SHADOW_PRESETS;
    glass?: GlassEffect;
    gradient?: GradientEffect;
    glow?: GlowEffect;
}

export interface PreviewStyle {
    backgroundColor: string;
    accentColor: string;
    textColor: string;
}

export type StyleCategory =
    | 'minimal'
    | 'glass'
    | 'gradient'
    | 'dark'
    | 'light'
    | 'neon'
    | 'professional'
    | 'playful';

// ============================================
// Color Palettes
// ============================================

export const COLOR_PALETTES = {
    // Material You inspired
    materialPurple: {
        primary: '#6750A4',
        secondary: '#CCC2DC',
        tertiary: '#EFB8C8',
        surface: '#FFFBFE',
        onSurface: '#1C1B1F',
    },
    materialBlue: {
        primary: '#1976D2',
        secondary: '#90CAF9',
        tertiary: '#B3E5FC',
        surface: '#FAFAFA',
        onSurface: '#212121',
    },
    materialGreen: {
        primary: '#388E3C',
        secondary: '#A5D6A7',
        tertiary: '#C8E6C9',
        surface: '#F1F8E9',
        onSurface: '#1B5E20',
    },

    // Dark themes
    darkNeutral: {
        primary: '#BB86FC',
        secondary: '#03DAC6',
        tertiary: '#CF6679',
        surface: '#121212',
        onSurface: '#E1E1E1',
    },
    darkOcean: {
        primary: '#64B5F6',
        secondary: '#4DD0E1',
        tertiary: '#80DEEA',
        surface: '#0D1B2A',
        onSurface: '#E0E1DD',
    },
    darkForest: {
        primary: '#81C784',
        secondary: '#A5D6A7',
        tertiary: '#C8E6C9',
        surface: '#1B2721',
        onSurface: '#E8F5E9',
    },

    // Vibrant themes
    neonPink: {
        primary: '#FF006E',
        secondary: '#FB5607',
        tertiary: '#FFBE0B',
        surface: '#1A1A2E',
        onSurface: '#FFFFFF',
    },
    neonCyan: {
        primary: '#00F5FF',
        secondary: '#00D9FF',
        tertiary: '#00BFFF',
        surface: '#0A0A0F',
        onSurface: '#FFFFFF',
    },
    sunset: {
        primary: '#FF6B35',
        secondary: '#F7C59F',
        tertiary: '#FFB563',
        surface: '#2E294E',
        onSurface: '#FFFFFF',
    },
};

// ============================================
// Style Presets
// ============================================

export const STYLE_PRESETS: StylePreset[] = [
    // Minimal Styles
    {
        id: 'minimal-light',
        name: 'Clean Light',
        category: 'minimal',
        preview: {
            backgroundColor: '#FFFFFF',
            accentColor: '#6750A4',
            textColor: '#1C1B1F',
        },
        containerStyle: {
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
        },
        textStyle: {
            color: '#1C1B1F',
        },
        effects: {
            shadow: 'soft',
        },
    },
    {
        id: 'minimal-dark',
        name: 'Clean Dark',
        category: 'minimal',
        preview: {
            backgroundColor: '#1C1B1F',
            accentColor: '#D0BCFF',
            textColor: '#E6E1E5',
        },
        containerStyle: {
            backgroundColor: '#1C1B1F',
            borderRadius: 16,
            padding: 16,
        },
        textStyle: {
            color: '#E6E1E5',
        },
        effects: {
            shadow: 'subtle',
        },
    },

    // Glass Styles
    {
        id: 'glass-light',
        name: 'Frosted Light',
        category: 'glass',
        preview: {
            backgroundColor: 'rgba(255,255,255,0.4)',
            accentColor: '#6750A4',
            textColor: '#1C1B1F',
        },
        containerStyle: {
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)',
        },
        textStyle: {
            color: '#1C1B1F',
        },
        effects: {
            glass: { type: 'glass', opacity: 0.2, blur: 'medium', tint: 'light' },
            shadow: 'medium',
        },
    },
    {
        id: 'glass-dark',
        name: 'Frosted Dark',
        category: 'glass',
        preview: {
            backgroundColor: 'rgba(0,0,0,0.4)',
            accentColor: '#D0BCFF',
            textColor: '#FFFFFF',
        },
        containerStyle: {
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
        },
        textStyle: {
            color: '#FFFFFF',
        },
        effects: {
            glass: { type: 'glass', opacity: 0.25, blur: 'medium', tint: 'dark' },
            shadow: 'medium',
        },
    },

    // Gradient Styles
    {
        id: 'gradient-sunset',
        name: 'Sunset',
        category: 'gradient',
        preview: {
            backgroundColor: '#FF512F',
            accentColor: '#FFFFFF',
            textColor: '#FFFFFF',
        },
        containerStyle: {
            borderRadius: 20,
            padding: 16,
        },
        textStyle: {
            color: '#FFFFFF',
            textShadowColor: 'rgba(0,0,0,0.3)',
            textShadowRadius: 4,
        },
        effects: {
            gradient: { type: 'gradient', colors: ['#FF512F', '#DD2476'], direction: 'diagonal' },
            shadow: 'strong',
        },
    },
    {
        id: 'gradient-ocean',
        name: 'Ocean',
        category: 'gradient',
        preview: {
            backgroundColor: '#2193b0',
            accentColor: '#FFFFFF',
            textColor: '#FFFFFF',
        },
        containerStyle: {
            borderRadius: 20,
            padding: 16,
        },
        textStyle: {
            color: '#FFFFFF',
        },
        effects: {
            gradient: { type: 'gradient', colors: ['#2193b0', '#6dd5ed'], direction: 'vertical' },
            shadow: 'medium',
        },
    },
    {
        id: 'gradient-purple',
        name: 'Royal Purple',
        category: 'gradient',
        preview: {
            backgroundColor: '#667eea',
            accentColor: '#FFFFFF',
            textColor: '#FFFFFF',
        },
        containerStyle: {
            borderRadius: 20,
            padding: 16,
        },
        textStyle: {
            color: '#FFFFFF',
        },
        effects: {
            gradient: { type: 'gradient', colors: ['#667eea', '#764ba2'], direction: 'diagonal' },
            shadow: 'medium',
        },
    },
    {
        id: 'gradient-mint',
        name: 'Fresh Mint',
        category: 'gradient',
        preview: {
            backgroundColor: '#11998e',
            accentColor: '#FFFFFF',
            textColor: '#FFFFFF',
        },
        containerStyle: {
            borderRadius: 20,
            padding: 16,
        },
        textStyle: {
            color: '#FFFFFF',
        },
        effects: {
            gradient: { type: 'gradient', colors: ['#11998e', '#38ef7d'], direction: 'horizontal' },
            shadow: 'medium',
        },
    },

    // Neon Styles
    {
        id: 'neon-pink',
        name: 'Neon Pink',
        category: 'neon',
        preview: {
            backgroundColor: '#1A1A2E',
            accentColor: '#FF006E',
            textColor: '#FF006E',
        },
        containerStyle: {
            backgroundColor: '#1A1A2E',
            borderRadius: 16,
            padding: 16,
            borderWidth: 2,
            borderColor: '#FF006E',
        },
        textStyle: {
            color: '#FF006E',
        },
        effects: {
            shadow: 'subtle',
            glow: { type: 'glow', color: '#FF006E', radius: 20, intensity: 0.6 },
        },
    },
    {
        id: 'neon-cyan',
        name: 'Neon Cyan',
        category: 'neon',
        preview: {
            backgroundColor: '#0A0A0F',
            accentColor: '#00F5FF',
            textColor: '#00F5FF',
        },
        containerStyle: {
            backgroundColor: '#0A0A0F',
            borderRadius: 16,
            padding: 16,
            borderWidth: 2,
            borderColor: '#00F5FF',
        },
        textStyle: {
            color: '#00F5FF',
        },
        effects: {
            shadow: 'subtle',
            glow: { type: 'glow', color: '#00F5FF', radius: 20, intensity: 0.6 },
        },
    },

    // Professional Styles
    {
        id: 'professional-slate',
        name: 'Slate',
        category: 'professional',
        preview: {
            backgroundColor: '#334155',
            accentColor: '#94A3B8',
            textColor: '#F1F5F9',
        },
        containerStyle: {
            backgroundColor: '#334155',
            borderRadius: 12,
            padding: 16,
        },
        textStyle: {
            color: '#F1F5F9',
        },
        effects: {
            shadow: 'medium',
        },
    },
    {
        id: 'professional-charcoal',
        name: 'Charcoal',
        category: 'professional',
        preview: {
            backgroundColor: '#27272A',
            accentColor: '#A1A1AA',
            textColor: '#FAFAFA',
        },
        containerStyle: {
            backgroundColor: '#27272A',
            borderRadius: 12,
            padding: 16,
        },
        textStyle: {
            color: '#FAFAFA',
        },
        effects: {
            shadow: 'soft',
        },
    },

    // Playful Styles
    {
        id: 'playful-candy',
        name: 'Candy',
        category: 'playful',
        preview: {
            backgroundColor: '#FFF0F5',
            accentColor: '#FF69B4',
            textColor: '#FF1493',
        },
        containerStyle: {
            backgroundColor: '#FFF0F5',
            borderRadius: 24,
            padding: 16,
            borderWidth: 2,
            borderColor: '#FFB6C1',
        },
        textStyle: {
            color: '#FF1493',
        },
        effects: {
            shadow: 'medium',
        },
    },
    {
        id: 'playful-bubblegum',
        name: 'Bubblegum',
        category: 'playful',
        preview: {
            backgroundColor: '#E8D5FF',
            accentColor: '#9B59B6',
            textColor: '#6A1B9A',
        },
        containerStyle: {
            backgroundColor: '#E8D5FF',
            borderRadius: 20,
            padding: 16,
        },
        textStyle: {
            color: '#6A1B9A',
        },
        effects: {
            shadow: 'soft',
        },
    },
];

// ============================================
// Preset Helpers
// ============================================

export const getPresetById = (id: string): StylePreset | undefined => {
    return STYLE_PRESETS.find(preset => preset.id === id);
};

export const getPresetsByCategory = (category: StyleCategory): StylePreset[] => {
    return STYLE_PRESETS.filter(preset => preset.category === category);
};

export const getAllCategories = (): StyleCategory[] => {
    return [...new Set(STYLE_PRESETS.map(preset => preset.category))];
};

export const CATEGORY_LABELS: Record<StyleCategory, string> = {
    minimal: 'Minimal',
    glass: 'Glass',
    gradient: 'Gradient',
    dark: 'Dark',
    light: 'Light',
    neon: 'Neon',
    professional: 'Professional',
    playful: 'Playful',
};

// ============================================
// Export
// ============================================

export const EffectPresets = {
    STYLE_PRESETS,
    COLOR_PALETTES,
    CATEGORY_LABELS,
    getPresetById,
    getPresetsByCategory,
    getAllCategories,
};

export default EffectPresets;
