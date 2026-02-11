/**
 * WidgetCraft - Theme Hooks
 * Custom hooks for accessing theme values with convenience methods
 */

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme, MaterialYouScheme } from './ThemeProvider';

// ============================================
// useAppTheme - Enhanced Theme Hook
// ============================================

export const useAppTheme = () => {
    const themeContext = useTheme();
    const paperTheme = usePaperTheme();

    return {
        ...themeContext,
        paper: paperTheme,
    };
};

// ============================================
// useColors - Direct Color Access
// ============================================

export const useColors = (): MaterialYouScheme => {
    const { colors } = useTheme();
    return colors;
};

// ============================================
// useThemedStyles - Create Themed Stylesheets
// ============================================

type StyleFunction<T extends StyleSheet.NamedStyles<T>> = (
    colors: MaterialYouScheme,
    isDark: boolean
) => T;

export const useThemedStyles = <T extends StyleSheet.NamedStyles<T>>(
    stylesFn: StyleFunction<T>
): T => {
    const { colors, isDark } = useTheme();

    return useMemo(() => {
        return StyleSheet.create(stylesFn(colors, isDark));
    }, [colors, isDark, stylesFn]);
};

// ============================================
// useElevation - Surface Elevation Colors
// ============================================

export const useElevation = () => {
    const { colors, isDark } = useTheme();

    return useMemo(() => ({
        level0: 'transparent',
        level1: colors.surfaceContainerLow,
        level2: colors.surfaceContainer,
        level3: colors.surfaceContainerHigh,
        level4: colors.surfaceContainerHigh,
        level5: colors.surfaceContainerHighest,
        // Convenience helpers
        card: colors.surfaceContainerLow,
        modal: colors.surfaceContainerHigh,
        drawer: colors.surfaceContainerLow,
        appBar: colors.surface,
        fab: colors.primaryContainer,
    }), [colors, isDark]);
};

// ============================================
// useSurfaceColor - Get Surface with Tint
// ============================================

export const useSurfaceColor = (elevation: 0 | 1 | 2 | 3 | 4 | 5 = 0) => {
    const { colors } = useTheme();

    const elevationMap = {
        0: 'transparent',
        1: colors.surfaceContainerLow,
        2: colors.surfaceContainer,
        3: colors.surfaceContainerHigh,
        4: colors.surfaceContainerHigh,
        5: colors.surfaceContainerHighest,
    };

    return elevationMap[elevation];
};

// ============================================
// useContainerColors - Quick Container Access
// ============================================

export const useContainerColors = () => {
    const { colors } = useTheme();

    return useMemo(() => ({
        primary: {
            background: colors.primaryContainer,
            text: colors.onPrimaryContainer,
        },
        secondary: {
            background: colors.secondaryContainer,
            text: colors.onSecondaryContainer,
        },
        tertiary: {
            background: colors.tertiaryContainer,
            text: colors.onTertiaryContainer,
        },
        error: {
            background: colors.errorContainer,
            text: colors.onErrorContainer,
        },
        surface: {
            background: colors.surface,
            text: colors.onSurface,
        },
        surfaceVariant: {
            background: colors.surfaceVariant,
            text: colors.onSurfaceVariant,
        },
    }), [colors]);
};
