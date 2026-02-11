/**
 * WidgetCraft - Widget Type Definitions
 * Core types for widget templates, components, and data bindings
 */

import { GradientConfig, ShadowConfig } from '../canvas/CanvasContext';

// ============================================
// Widget Sizes (Android grid units)
// ============================================

export type WidgetSize = 'small' | 'medium' | 'large' | 'extraLarge';

export const WIDGET_SIZES: Record<WidgetSize, { cols: number; rows: number; width: number; height: number }> = {
    small: { cols: 2, rows: 1, width: 180, height: 90 },
    medium: { cols: 2, rows: 2, width: 180, height: 180 },
    large: { cols: 4, rows: 2, width: 360, height: 180 },
    extraLarge: { cols: 4, rows: 4, width: 360, height: 360 },
};

// ============================================
// Widget Categories
// ============================================

export type WidgetCategory =
    | 'time'
    | 'weather'
    | 'utility'
    | 'media'
    | 'productivity'
    | 'social'
    | 'shortcuts'
    | 'script';

// ============================================
// Data Binding Types
// ============================================

export type DataBindingKey =
    // Time
    | 'time.hours'
    | 'time.minutes'
    | 'time.seconds'
    | 'time.formatted12'
    | 'time.formatted24'
    | 'time.ampm'
    | 'date.day'
    | 'date.dayName'
    | 'date.dayShort'
    | 'date.month'
    | 'date.monthName'
    | 'date.monthShort'
    | 'date.year'
    | 'date.formatted'
    // Battery
    | 'battery.level'
    | 'battery.isCharging'
    | 'battery.icon'
    // Weather (mock)
    | 'weather.temp'
    | 'weather.condition'
    | 'weather.icon'
    | 'weather.high'
    | 'weather.low'
    // Device
    | 'device.name'
    | 'device.greeting'
    // Music (mock)
    | 'music.title'
    | 'music.artist'
    | 'music.album'
    | 'music.isPlaying';

// ============================================
// Component Types
// ============================================

export type WidgetComponentType =
    | 'text'
    | 'curvedText'
    | 'shape'
    | 'line'
    | 'path'
    | 'icon'
    | 'image'
    | 'dataDisplay'
    | 'container'
    | 'clock'
    | 'analogClock'
    | 'digitalClock'
    | 'progress'
    | 'gradient'
    | 'scriptWidget';

// Base component properties
export interface WidgetComponentBase {
    id: string;
    type: WidgetComponentType;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
    visible?: boolean;
}

// Text component
export interface TextComponent extends WidgetComponentBase {
    type: 'text';
    content: string; // Can include data bindings like {time.hours}
    fontSize: number;
    fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    fontFamily?: string;
    color: string; // Color token or hex
    textAlign?: 'left' | 'center' | 'right';
    letterSpacing?: number;
    lineHeight?: number;
    shadow?: ShadowConfig;
}

// Curved text component
export interface CurvedTextComponent extends WidgetComponentBase {
    type: 'curvedText';
    content: string;
    fontSize: number;
    fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
    fontFamily?: string;
    color: string;
    curveType?: 'arc' | 'wave' | 'circle' | 'custom';
    curveAmount?: number; // -100 to 100
    startOffset?: number; // 0-100%
    letterSpacing?: number;
}

// Shape component
export interface ShapeComponent extends WidgetComponentBase {
    type: 'shape';
    shapeType: 'rectangle' | 'circle' | 'pill' | 'squircle' | 'blob' | 'cloud' | 'flower';
    fill: string;
    gradient?: GradientConfig;
    fillOpacity?: number;
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number | number[];
    cornerFamily?: 'rounded' | 'cut';
    shadow?: ShadowConfig;
    blur?: number; // Glassmorphism blur
}

// Icon component
export interface IconComponent extends WidgetComponentBase {
    type: 'icon';
    name: string; // Material icon name
    color: string;
    size: number;
}

// Image component
export interface ImageComponent extends WidgetComponentBase {
    type: 'image';
    source: string | { dataBinding: DataBindingKey };
    cornerRadius?: number;
    objectFit?: 'cover' | 'contain' | 'fill';
}

// Progress/Data display component
export interface ProgressComponent extends WidgetComponentBase {
    type: 'progress';
    progressType: 'arc' | 'bar' | 'circle' | 'battery';
    value: number | DataBindingKey;
    maxValue?: number;
    color: string;
    backgroundColor?: string;
    strokeWidth?: number;
    showLabel?: boolean;
}

// Analog Clock Component
export interface AnalogClockComponent extends WidgetComponentBase {
    type: 'analogClock';
    faceStyle?: 'minimal' | 'classic' | 'modern' | 'roman' | 'dots' | 'lines';
    handStyle?: 'classic' | 'modern' | 'thin' | 'bold' | 'arrow';
    showSeconds?: boolean;
    showNumbers?: boolean;
    showTicks?: boolean;
    smoothSeconds?: boolean;
    // Colors
    faceColor?: string;
    hourHandColor?: string;
    minuteHandColor?: string;
    secondHandColor?: string;
    tickColor?: string;
    numberColor?: string;
}

// Digital Clock Component
export interface DigitalClockComponent extends WidgetComponentBase {
    type: 'digitalClock';
    format?: '12h' | '24h';
    showSeconds?: boolean;
    showAmPm?: boolean;
    fontSize: number;
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
    fontFamily?: string;
    color: string;
    textAlign?: 'left' | 'center' | 'right';
}

// Container component (group)
export interface ContainerComponent extends WidgetComponentBase {
    type: 'container';
    children: string[]; // Component IDs
    backgroundColor?: string;
    padding?: number;
    gap?: number;
    flexDirection?: 'row' | 'column';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
    alignItems?: 'flex-start' | 'center' | 'flex-end';
    blur?: number;
    borderRadius?: number;
}

// Script Widget Component
export interface ScriptWidgetComponent extends WidgetComponentBase {
    type: 'scriptWidget';
    script: string;
    refreshIntervalSec?: number;
}

// Union type for all components
export type WidgetComponent =
    | TextComponent
    | CurvedTextComponent
    | ShapeComponent
    | IconComponent
    | ImageComponent
    | ProgressComponent
    | AnalogClockComponent
    | DigitalClockComponent
    | ContainerComponent
    | ScriptWidgetComponent;

// ============================================
// Widget Template
// ============================================

export interface WidgetTemplate {
    id: string;
    name: string;
    description: string;
    category: WidgetCategory;
    size: WidgetSize;
    thumbnail?: string;
    components: Record<string, WidgetComponent>;
    componentOrder: string[];
    backgroundColor: string;
    backgroundBlur?: boolean;
    // Color scheme (uses dynamic color tokens)
    colorScheme: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        onBackground: string;
    };
    // Data requirements
    dataBindings: DataBindingKey[];
    // Animation settings
    animations?: {
        componentId: string;
        type: 'fade' | 'scale' | 'slide' | 'pulse';
        duration: number;
        repeat?: boolean;
    }[];
}

// ============================================
// Widget Instance (saved user widget)
// ============================================

export interface WidgetInstance {
    id: string;
    templateId: string;
    name: string;
    customizations: {
        colorScheme?: Partial<WidgetTemplate['colorScheme']>;
        componentOverrides?: Record<string, Partial<WidgetComponent>>;
    };
    createdAt: number;
    updatedAt: number;
}

// ============================================
// Color Tokens (for dynamic theming)
// ============================================

export const COLOR_TOKENS = {
    // Primary palette
    primary: 'colors.primary',
    onPrimary: 'colors.onPrimary',
    primaryContainer: 'colors.primaryContainer',
    onPrimaryContainer: 'colors.onPrimaryContainer',
    // Secondary palette
    secondary: 'colors.secondary',
    onSecondary: 'colors.onSecondary',
    secondaryContainer: 'colors.secondaryContainer',
    onSecondaryContainer: 'colors.onSecondaryContainer',
    // Tertiary palette
    tertiary: 'colors.tertiary',
    onTertiary: 'colors.onTertiary',
    tertiaryContainer: 'colors.tertiaryContainer',
    onTertiaryContainer: 'colors.onTertiaryContainer',
    // Surface
    surface: 'colors.surface',
    onSurface: 'colors.onSurface',
    surfaceVariant: 'colors.surfaceVariant',
    onSurfaceVariant: 'colors.onSurfaceVariant',
    // Background
    background: 'colors.background',
    onBackground: 'colors.onBackground',
} as const;

export type ColorToken = keyof typeof COLOR_TOKENS;
