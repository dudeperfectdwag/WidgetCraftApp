/**
 * WidgetCraft - App Constants
 * Centralized configuration and constants
 */

// ============================================
// App Info
// ============================================

export const APP_INFO = {
    name: 'WidgetCraft',
    version: '1.0.0',
    buildNumber: 1,
    bundleId: 'com.widgetcraft.app',
    storeUrl: {
        android: 'https://play.google.com/store/apps/details?id=com.widgetcraft.app',
        ios: 'https://apps.apple.com/app/widgetcraft/id123456789',
    },
    supportEmail: 'support@widgetcraft.app',
    privacyUrl: 'https://widgetcraft.app/privacy',
    termsUrl: 'https://widgetcraft.app/terms',
};

// ============================================
// Widget Defaults
// ============================================

export const WIDGET_DEFAULTS = {
    // Canvas sizes (in dp)
    sizes: {
        small: { width: 170, height: 170 },
        medium: { width: 350, height: 170 },
        large: { width: 350, height: 350 },
        extraLarge: { width: 350, height: 530 },
    },

    // Grid settings
    grid: {
        size: 10,
        visible: true,
        snap: true,
    },

    // Element defaults
    element: {
        minSize: 20,
        maxSize: 500,
        defaultOpacity: 1,
        defaultBorderRadius: 8,
    },

    // Text defaults
    text: {
        defaultFontSize: 16,
        minFontSize: 8,
        maxFontSize: 72,
        defaultColor: '#FFFFFF',
        defaultFontFamily: 'System',
    },

    // Shape defaults
    shape: {
        defaultFill: '#6750A4',
        defaultStroke: 'transparent',
        defaultStrokeWidth: 0,
    },
};

// ============================================
// Animation Timings
// ============================================

export const ANIMATION = {
    // Durations (ms)
    duration: {
        instant: 100,
        fast: 200,
        normal: 300,
        slow: 500,
        slower: 800,
    },

    // Spring configs
    spring: {
        gentle: { damping: 20, stiffness: 100 },
        bouncy: { damping: 10, stiffness: 180 },
        stiff: { damping: 25, stiffness: 300 },
    },

    // Delays
    stagger: {
        fast: 30,
        normal: 50,
        slow: 100,
    },
};

// ============================================
// Layout Constants
// ============================================

export const LAYOUT = {
    // Spacing scale
    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    // Border radius
    radius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        xxl: 24,
        full: 9999,
    },

    // Component dimensions
    button: {
        heightSm: 36,
        heightMd: 48,
        heightLg: 56,
    },

    // Icon sizes
    icon: {
        xs: 16,
        sm: 20,
        md: 24,
        lg: 32,
        xl: 48,
    },

    // Header heights
    header: {
        height: 56,
        searchBarHeight: 56,
    },

    // Bottom sheet
    bottomSheet: {
        handleHeight: 24,
        maxHeightRatio: 0.9,
    },
};

// ============================================
// Storage Keys
// ============================================

export const STORAGE_KEYS = {
    // User preferences
    THEME_MODE: '@widgetcraft/themeMode',
    HAPTICS_ENABLED: '@widgetcraft/hapticsEnabled',
    ONBOARDING_COMPLETE: '@widgetcraft/onboardingComplete',

    // Editor settings
    SHOW_GRID: '@widgetcraft/showGrid',
    SNAP_TO_GRID: '@widgetcraft/snapToGrid',
    AUTO_SAVE: '@widgetcraft/autoSave',

    // Widget storage
    WIDGETS: '@widgetcraft/widgets',
    WIDGET_PREFIX: '@widgetcraft/widget_',

    // Analytics
    LAST_SESSION: '@widgetcraft/lastSession',
    WIDGET_COUNT: '@widgetcraft/widgetCount',
};

// ============================================
// Limits
// ============================================

export const LIMITS = {
    // Widget limits
    maxWidgets: 50,
    maxElementsPerWidget: 100,
    maxNameLength: 50,

    // File limits
    maxImageSize: 5 * 1024 * 1024, // 5MB
    maxExportSize: 4096, // 4K resolution

    // Performance
    maxUndoSteps: 30,
    debounceDelay: 150,
    throttleDelay: 100,
};

// ============================================
// Feature Flags
// ============================================

export const FEATURES = {
    enableCloudSync: false,
    enableTemplateStore: false,
    enableCollaboration: false,
    enablePremium: false,
    enableAnalytics: __DEV__ ? false : true,
};

// ============================================
// Export
// ============================================

export const Constants = {
    APP_INFO,
    WIDGET_DEFAULTS,
    ANIMATION,
    LAYOUT,
    STORAGE_KEYS,
    LIMITS,
    FEATURES,
};

export default Constants;
