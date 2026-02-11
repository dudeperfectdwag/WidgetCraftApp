/**
 * WidgetCraft - Application Constants
 * Central location for all app-wide constants
 */

// ============================================
// App Information
// ============================================

export const APP_NAME = 'WidgetCraft';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Design stunning custom widgets with powerful scripting';

// ============================================
// Layout Constants
// ============================================

export const LAYOUT = {
    SCREEN_PADDING: 16,
    CARD_BORDER_RADIUS: 16,
    BUTTON_BORDER_RADIUS: 12,
    CHIP_BORDER_RADIUS: 8,
    SPACING: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },
    ICON_SIZE: {
        sm: 16,
        md: 24,
        lg: 32,
        xl: 48,
    },
} as const;

// ============================================
// Animation Constants
// ============================================

export const ANIMATION = {
    DURATION: {
        instant: 100,
        fast: 200,
        normal: 300,
        slow: 500,
        verySlow: 800,
    },
    SPRING: {
        damping: 15,
        stiffness: 150,
        mass: 1,
    },
} as const;

// ============================================
// Widget Editor Constants
// ============================================

export const EDITOR = {
    CANVAS: {
        MIN_ZOOM: 0.25,
        MAX_ZOOM: 4,
        DEFAULT_ZOOM: 1,
        GRID_SIZE: 8,
        SNAP_THRESHOLD: 4,
    },
    WIDGET: {
        MIN_SIZE: 50,
        MAX_SIZE: 1000,
        DEFAULT_SIZE: { width: 200, height: 200 },
    },
    LAYER: {
        MAX_LAYERS: 50,
        DEFAULT_OPACITY: 1,
        DEFAULT_ROTATION: 0,
    },
} as const;

// ============================================
// Data Source Constants
// ============================================

export const DATA_SOURCES = {
    WEATHER: {
        REFRESH_INTERVAL: 30 * 60 * 1000, // 30 minutes
        API_TIMEOUT: 10000,
    },
    TIME: {
        REFRESH_INTERVAL: 1000, // 1 second
    },
    BATTERY: {
        REFRESH_INTERVAL: 60 * 1000, // 1 minute
    },
} as const;

// ============================================
// Script Engine Constants
// ============================================

export const SCRIPT_ENGINE = {
    MAX_EXECUTION_TIME: 5000, // 5 seconds
    MAX_MEMORY: 10 * 1024 * 1024, // 10MB
    ALLOWED_APIS: [
        'Math',
        'Date',
        'String',
        'Number',
        'Array',
        'Object',
        'JSON',
    ],
    FORBIDDEN_GLOBALS: [
        'window',
        'document',
        'fetch',
        'XMLHttpRequest',
        'eval',
        'Function',
    ],
} as const;

// ============================================
// Typography Scale (Material Design 3)
// ============================================

export const TYPOGRAPHY = {
    displayLarge: { fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
    displayMedium: { fontSize: 45, lineHeight: 52, letterSpacing: 0 },
    displaySmall: { fontSize: 36, lineHeight: 44, letterSpacing: 0 },
    headlineLarge: { fontSize: 32, lineHeight: 40, letterSpacing: 0 },
    headlineMedium: { fontSize: 28, lineHeight: 36, letterSpacing: 0 },
    headlineSmall: { fontSize: 24, lineHeight: 32, letterSpacing: 0 },
    titleLarge: { fontSize: 22, lineHeight: 28, letterSpacing: 0 },
    titleMedium: { fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
    titleSmall: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
    labelLarge: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
    labelMedium: { fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
    labelSmall: { fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
    bodyLarge: { fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
    bodyMedium: { fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
    bodySmall: { fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
} as const;

// ============================================
// Default Colors (Material You Base)
// ============================================

export const DEFAULT_COLORS = {
    // Seed color for dynamic theming
    SEED: '#6750A4',

    // Static brand colors
    BRAND_PRIMARY: '#6750A4',
    BRAND_SECONDARY: '#625B71',
    BRAND_TERTIARY: '#7D5260',

    // Neutral colors
    BLACK: '#000000',
    WHITE: '#FFFFFF',

    // Surface tones
    SURFACE_TONES: {
        0: '#FFFFFF',
        1: '#F7F2FA',
        2: '#F3EDF7',
        3: '#ECE6F0',
        4: '#E8E0EB',
        5: '#E6DEE9',
    },
} as const;

// ============================================
// Shape Presets
// ============================================

export const SHAPE_PRESETS = [
    { name: 'Rectangle', type: 'rectangle' as const },
    { name: 'Rounded Rectangle', type: 'rounded-rectangle' as const, cornerRadius: 16 },
    { name: 'Circle', type: 'circle' as const },
    { name: 'Ellipse', type: 'ellipse' as const },
    { name: 'Triangle', type: 'polygon' as const, sides: 3 },
    { name: 'Pentagon', type: 'polygon' as const, sides: 5 },
    { name: 'Hexagon', type: 'polygon' as const, sides: 6 },
    { name: 'Star', type: 'star' as const, points: 5, innerRadius: 0.5 },
] as const;

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
    THEME_MODE: '@widgetcraft/theme_mode',
    WIDGETS: '@widgetcraft/widgets',
    USER_SCRIPTS: '@widgetcraft/user_scripts',
    FAVORITES: '@widgetcraft/favorites',
    ONBOARDING_COMPLETE: '@widgetcraft/onboarding_complete',
    RECENT_COLORS: '@widgetcraft/recent_colors',
    SETTINGS: '@widgetcraft/settings',
} as const;
