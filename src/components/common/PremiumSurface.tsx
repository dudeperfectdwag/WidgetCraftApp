/**
 * WidgetCraft - Premium Surface Component
 * Base surface container with elevation and tonal colors
 */

import React, { ReactNode } from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useColors } from '@theme/index';
import { LAYOUT } from '@constants/index';

// ============================================
// ============================================

export type SurfaceElevation = 0 | 1 | 2 | 3 | 4 | 5;
export type SurfaceVariant = 'default' | 'container' | 'containerLow' | 'containerHigh' | 'variant';

export interface PremiumSurfaceProps {
    children: ReactNode;
    elevation?: SurfaceElevation;
    variant?: SurfaceVariant;
    style?: StyleProp<ViewStyle>;
    borderRadius?: number;
    padding?: number | 'none' | 'small' | 'medium' | 'large';
    blur?: boolean;
    blurIntensity?: number;
}

// ============================================
// Component
// ============================================

export const PremiumSurface: React.FC<PremiumSurfaceProps> = ({
    children,
    elevation = 0,
    variant = 'default',
    style,
    borderRadius = LAYOUT.CARD_BORDER_RADIUS,
    padding = 'medium',
    blur = false,
    blurIntensity = 50,
}) => {
    const colors = useColors();

    // Get padding value
    const getPaddingValue = (): number => {
        if (typeof padding === 'number') return padding;
        switch (padding) {
            case 'none': return 0;
            case 'small': return LAYOUT.SPACING.sm;
            case 'medium': return LAYOUT.SPACING.md;
            case 'large': return LAYOUT.SPACING.lg;
            default: return LAYOUT.SPACING.md;
        }
    };

    // Get background color based on variant
    const getBackgroundColor = (): string => {
        switch (variant) {
            case 'container': return colors.surfaceContainer;
            case 'containerLow': return colors.surfaceContainerLow;
            case 'containerHigh': return colors.surfaceContainerHigh;
            case 'variant': return colors.surfaceVariant;
            default: return colors.surface;
        }
    };

    // Get shadow based on elevation
    const getShadowStyle = (): ViewStyle => {
        if (elevation === 0) return {};

        return {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: elevation * 1.5 },
            shadowOpacity: 0.05 + elevation * 0.03,
            shadowRadius: elevation * 3,
            elevation: elevation * 2,
        };
    };

    const surfaceStyle: ViewStyle = {
        backgroundColor: blur ? 'transparent' : getBackgroundColor(),
        borderRadius,
        padding: getPaddingValue(),
        ...getShadowStyle(),
        overflow: 'hidden',
    };

    if (blur) {
        return (
            <View style={[surfaceStyle, style]}>
                <BlurView
                    intensity={blurIntensity}
                    tint="default"
                    style={StyleSheet.absoluteFill}
                />
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: `${getBackgroundColor()}80` },
                    ]}
                />
                {children}
            </View>
        );
    }

    return (
        <View style={[surfaceStyle, style]}>
            {children}
        </View>
    );
};

export default PremiumSurface;
