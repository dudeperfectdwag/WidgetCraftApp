/**
 * WidgetCraft - Theme Module Index
 * Exports all theme-related functionality
 */

// Theme Provider & Context
export {
    ThemeProvider,
    useTheme,
    PRESET_SEED_COLORS,
    type ThemeContextType,
    type ThemeMode,
    type MaterialYouScheme,
} from './ThemeProvider';

// Color Scheme Generation
export {
    generateColorSchemes,
    generateTonalPalettes,
    generateLightScheme,
    generateDarkScheme,
    generateTonalPalette,
    hexToRgb,
    rgbToHex,
    rgbToHsl,
    hslToRgb,
    getRandomExpressiveColor,
    type TonalPalette,
} from './colorScheme';

// Theme Hooks
export {
    useAppTheme,
    useColors,
    useThemedStyles,
    useElevation,
    useSurfaceColor,
    useContainerColors,
} from './hooks';
