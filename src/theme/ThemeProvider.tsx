/**
 * WidgetCraft - Theme Provider & Context
 * Provides Material You theming throughout the app with dynamic color support
 */

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
    ReactNode,
} from 'react';
import { useColorScheme, Appearance, Platform } from 'react-native';
import {
    MD3DarkTheme,
    MD3LightTheme,
    PaperProvider,
    MD3Theme,
    configureFonts,
} from 'react-native-paper';
import {
    generateColorSchemes,
    MaterialYouScheme,
    PRESET_SEED_COLORS,
} from './colorScheme';
import { TYPOGRAPHY } from '@constants/index';

// ============================================
// Dynamic Color Utils (Material You)
// ============================================

/**
 * On Android 12+, Material You allows apps to use colors derived from the user's wallpaper.
 * This provides a personalized, cohesive experience across the device.
 * 
 * When running on Android, the app will use the device's Material You seed color
 * if available, otherwise falls back to our default purple.
 * 
 * On iOS/Web, users can manually select their preferred seed color from the settings.
 */
const getDeviceDynamicColor = (): string | null => {
    // On Android 12+ (API 31+), Material You is available
    // For now, we use the default seed color, but this can be extended
    // to read from native module that extracts wallpaper colors
    if (Platform.OS === 'android' && Platform.Version >= 31) {
        // In a production app, you would use a native module here to get
        // the actual wallpaper-derived color using Android's DynamicColors API
        // For now, we return null to use our default
        return null;
    }
    return null;
};

// ============================================
// Types
// ============================================

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeContextType {
    theme: MD3Theme;
    themeMode: ThemeMode;
    isDark: boolean;
    seedColor: string;
    colors: MaterialYouScheme;
    useDynamicColors: boolean;
    setThemeMode: (mode: ThemeMode) => void;
    setSeedColor: (color: string) => void;
    setUseDynamicColors: (use: boolean) => void;
    toggleTheme: (newValue?: boolean) => void;
}

// ============================================
// Font Configuration (Material Design 3)
// ============================================

const fontConfig = {
    displayLarge: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.displayLarge.fontSize,
        lineHeight: TYPOGRAPHY.displayLarge.lineHeight,
        letterSpacing: TYPOGRAPHY.displayLarge.letterSpacing,
        fontWeight: '400' as const,
    },
    displayMedium: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.displayMedium.fontSize,
        lineHeight: TYPOGRAPHY.displayMedium.lineHeight,
        letterSpacing: TYPOGRAPHY.displayMedium.letterSpacing,
        fontWeight: '400' as const,
    },
    displaySmall: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.displaySmall.fontSize,
        lineHeight: TYPOGRAPHY.displaySmall.lineHeight,
        letterSpacing: TYPOGRAPHY.displaySmall.letterSpacing,
        fontWeight: '400' as const,
    },
    headlineLarge: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.headlineLarge.fontSize,
        lineHeight: TYPOGRAPHY.headlineLarge.lineHeight,
        letterSpacing: TYPOGRAPHY.headlineLarge.letterSpacing,
        fontWeight: '400' as const,
    },
    headlineMedium: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.headlineMedium.fontSize,
        lineHeight: TYPOGRAPHY.headlineMedium.lineHeight,
        letterSpacing: TYPOGRAPHY.headlineMedium.letterSpacing,
        fontWeight: '400' as const,
    },
    headlineSmall: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.headlineSmall.fontSize,
        lineHeight: TYPOGRAPHY.headlineSmall.lineHeight,
        letterSpacing: TYPOGRAPHY.headlineSmall.letterSpacing,
        fontWeight: '400' as const,
    },
    titleLarge: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.titleLarge.fontSize,
        lineHeight: TYPOGRAPHY.titleLarge.lineHeight,
        letterSpacing: TYPOGRAPHY.titleLarge.letterSpacing,
        fontWeight: '500' as const,
    },
    titleMedium: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.titleMedium.fontSize,
        lineHeight: TYPOGRAPHY.titleMedium.lineHeight,
        letterSpacing: TYPOGRAPHY.titleMedium.letterSpacing,
        fontWeight: '500' as const,
    },
    titleSmall: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.titleSmall.fontSize,
        lineHeight: TYPOGRAPHY.titleSmall.lineHeight,
        letterSpacing: TYPOGRAPHY.titleSmall.letterSpacing,
        fontWeight: '500' as const,
    },
    labelLarge: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.labelLarge.fontSize,
        lineHeight: TYPOGRAPHY.labelLarge.lineHeight,
        letterSpacing: TYPOGRAPHY.labelLarge.letterSpacing,
        fontWeight: '500' as const,
    },
    labelMedium: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.labelMedium.fontSize,
        lineHeight: TYPOGRAPHY.labelMedium.lineHeight,
        letterSpacing: TYPOGRAPHY.labelMedium.letterSpacing,
        fontWeight: '500' as const,
    },
    labelSmall: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.labelSmall.fontSize,
        lineHeight: TYPOGRAPHY.labelSmall.lineHeight,
        letterSpacing: TYPOGRAPHY.labelSmall.letterSpacing,
        fontWeight: '500' as const,
    },
    bodyLarge: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.bodyLarge.fontSize,
        lineHeight: TYPOGRAPHY.bodyLarge.lineHeight,
        letterSpacing: TYPOGRAPHY.bodyLarge.letterSpacing,
        fontWeight: '400' as const,
    },
    bodyMedium: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.bodyMedium.fontSize,
        lineHeight: TYPOGRAPHY.bodyMedium.lineHeight,
        letterSpacing: TYPOGRAPHY.bodyMedium.letterSpacing,
        fontWeight: '400' as const,
    },
    bodySmall: {
        fontFamily: 'System',
        fontSize: TYPOGRAPHY.bodySmall.fontSize,
        lineHeight: TYPOGRAPHY.bodySmall.lineHeight,
        letterSpacing: TYPOGRAPHY.bodySmall.letterSpacing,
        fontWeight: '400' as const,
    },
    default: {
        fontFamily: 'System',
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0.25,
        fontWeight: '400' as const,
    },
};

// ============================================
// Theme Context
// ============================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// ============================================
// Create MD3 Theme from Color Scheme
// ============================================

const createMD3Theme = (
    colors: MaterialYouScheme,
    isDark: boolean
): MD3Theme => {
    const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;

    return {
        ...baseTheme,
        dark: isDark,
        roundness: 16,
        colors: {
            ...baseTheme.colors,
            primary: colors.primary,
            onPrimary: colors.onPrimary,
            primaryContainer: colors.primaryContainer,
            onPrimaryContainer: colors.onPrimaryContainer,
            secondary: colors.secondary,
            onSecondary: colors.onSecondary,
            secondaryContainer: colors.secondaryContainer,
            onSecondaryContainer: colors.onSecondaryContainer,
            tertiary: colors.tertiary,
            onTertiary: colors.onTertiary,
            tertiaryContainer: colors.tertiaryContainer,
            onTertiaryContainer: colors.onTertiaryContainer,
            error: colors.error,
            onError: colors.onError,
            errorContainer: colors.errorContainer,
            onErrorContainer: colors.onErrorContainer,
            background: colors.background,
            onBackground: colors.onBackground,
            surface: colors.surface,
            onSurface: colors.onSurface,
            surfaceVariant: colors.surfaceVariant,
            onSurfaceVariant: colors.onSurfaceVariant,
            outline: colors.outline,
            outlineVariant: colors.outlineVariant,
            inverseSurface: colors.inverseSurface,
            inverseOnSurface: colors.inverseOnSurface,
            inversePrimary: colors.inversePrimary,
            elevation: {
                level0: 'transparent',
                level1: colors.surfaceContainerLow,
                level2: colors.surfaceContainer,
                level3: colors.surfaceContainerHigh,
                level4: colors.surfaceContainerHigh,
                level5: colors.surfaceContainerHighest,
            },
            surfaceDisabled: `${colors.onSurface}1F`, // 12% opacity
            onSurfaceDisabled: `${colors.onSurface}61`, // 38% opacity
            backdrop: `${colors.scrim}52`, // 32% opacity
        },
        fonts: configureFonts({ config: fontConfig }),
    };
};

// ============================================
// Theme Provider Component
// ============================================

interface ThemeProviderProps {
    children: ReactNode;
    defaultSeedColor?: string;
    defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
    children,
    defaultSeedColor = PRESET_SEED_COLORS.purple,
    defaultMode = 'light',
}) => {
    const systemColorScheme = useColorScheme();
    const [themeMode, setThemeMode] = useState<ThemeMode>(defaultMode);
    const [seedColor, setSeedColor] = useState<string>(defaultSeedColor);
    const [useDynamicColors, setUseDynamicColors] = useState<boolean>(true);

    // Try to get device's Material You color on mount
    useEffect(() => {
        if (useDynamicColors) {
            const deviceColor = getDeviceDynamicColor();
            if (deviceColor) {
                setSeedColor(deviceColor);
            }
        }
    }, [useDynamicColors]);

    // Determine if dark mode based on theme mode and system preference
    const isDark = useMemo(() => {
        if (themeMode === 'system') {
            return systemColorScheme === 'dark';
        }
        return themeMode === 'dark';
    }, [themeMode, systemColorScheme]);

    // Generate color schemes from seed color
    const colorSchemes = useMemo(() => {
        return generateColorSchemes(seedColor);
    }, [seedColor]);

    // Get current color scheme
    const colors = useMemo(() => {
        return isDark ? colorSchemes.dark : colorSchemes.light;
    }, [isDark, colorSchemes]);

    // Create MD3 theme
    const theme = useMemo(() => {
        return createMD3Theme(colors, isDark);
    }, [colors, isDark]);

    // Toggle between light and dark
    const toggleTheme = useCallback((newValue?: boolean) => {
        if (typeof newValue === 'boolean') {
            // Called from switch with explicit value
            setThemeMode(newValue ? 'dark' : 'light');
        } else {
            setThemeMode(prev => {
                if (prev === 'light') return 'dark';
                if (prev === 'dark') return 'light';
                // If system, switch to opposite of current system preference
                return systemColorScheme === 'dark' ? 'light' : 'dark';
            });
        }
    }, [systemColorScheme]);

    // Context value
    const contextValue = useMemo<ThemeContextType>(
        () => ({
            theme,
            themeMode,
            isDark,
            seedColor,
            colors,
            useDynamicColors,
            setThemeMode,
            setSeedColor,
            setUseDynamicColors,
            toggleTheme,
        }),
        [theme, themeMode, isDark, seedColor, colors, useDynamicColors, toggleTheme]
    );

    return (
        <ThemeContext.Provider value={contextValue}>
            <PaperProvider theme={theme}>{children}</PaperProvider>
        </ThemeContext.Provider>
    );
};

// ============================================
// Export Default & Named
// ============================================

export { PRESET_SEED_COLORS };
export type { MaterialYouScheme };
