/**
 * WidgetCraft - Premium Card Component
 * Beautiful cards with glassmorphism, gradients, and elevation
 */

import React, { ReactNode } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import { useColors } from '@theme/index';
import { LAYOUT, ANIMATION } from '@constants/index';

// ============================================
// Types
// ============================================

export type CardVariant = 'elevated' | 'filled' | 'outlined' | 'glass' | 'gradient';

export interface PremiumCardProps {
    children: ReactNode;
    variant?: CardVariant;
    onPress?: () => void;
    onLongPress?: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    // Customization
    borderRadius?: number;
    gradientColors?: string[];
    gradientStart?: { x: number; y: number };
    gradientEnd?: { x: number; y: number };
    blurIntensity?: number;
    elevation?: 0 | 1 | 2 | 3 | 4 | 5;
    // Animation
    enablePressAnimation?: boolean;
    enableHoverEffect?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================
// Premium Card Component
// ============================================

export const PremiumCard: React.FC<PremiumCardProps> = ({
    children,
    variant = 'elevated',
    onPress,
    onLongPress,
    disabled = false,
    style,
    borderRadius = LAYOUT.CARD_BORDER_RADIUS,
    gradientColors,
    gradientStart = { x: 0, y: 0 },
    gradientEnd = { x: 1, y: 1 },
    blurIntensity = 50,
    elevation = 1,
    enablePressAnimation = true,
    enableHoverEffect = true,
}) => {
    const colors = useColors();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    // Press animation
    const handlePressIn = () => {
        if (enablePressAnimation && !disabled) {
            scale.value = withTiming(0.97, { duration: 80 });
            opacity.value = withTiming(0.9, { duration: 80 });
        }
    };

    const handlePressOut = () => {
        if (enablePressAnimation) {
            scale.value = withTiming(1, { duration: 120 });
            opacity.value = withTiming(1, { duration: 120 });
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    // Get variant-specific styles
    const getVariantStyles = (): ViewStyle => {
        const baseStyles: ViewStyle = {
            borderRadius,
            overflow: 'hidden',
        };

        switch (variant) {
            case 'elevated':
                return {
                    ...baseStyles,
                    backgroundColor: colors.surfaceContainerLow,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: elevation * 2 },
                    shadowOpacity: 0.1 + elevation * 0.02,
                    shadowRadius: elevation * 4,
                    elevation: elevation * 2,
                };

            case 'filled':
                return {
                    ...baseStyles,
                    backgroundColor: colors.surfaceContainerHighest,
                };

            case 'outlined':
                return {
                    ...baseStyles,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                };

            case 'glass':
                return {
                    ...baseStyles,
                    backgroundColor: 'transparent',
                };

            case 'gradient':
                return {
                    ...baseStyles,
                    backgroundColor: 'transparent',
                };

            default:
                return baseStyles;
        }
    };

    // Default gradient colors based on theme
    const defaultGradientColors = gradientColors || [
        colors.primaryContainer,
        colors.secondaryContainer,
    ];

    // Render card content based on variant
    const renderContent = () => {
        if (variant === 'glass') {
            return (
                <BlurView intensity={blurIntensity} tint="default" style={styles.blurView}>
                    <View
                        style={[
                            styles.glassOverlay,
                            {
                                backgroundColor: `${colors.surface}40`,
                                borderColor: `${colors.outline}20`,
                            },
                        ]}
                    >
                        <View style={styles.content}>{children}</View>
                    </View>
                </BlurView>
            );
        }

        if (variant === 'gradient') {
            return (
                <LinearGradient
                    colors={defaultGradientColors as [string, string, ...string[]]}
                    start={gradientStart}
                    end={gradientEnd}
                    style={styles.gradient}
                >
                    <View style={styles.content}>{children}</View>
                </LinearGradient>
            );
        }

        return <View style={styles.content}>{children}</View>;
    };

    const isPressable = onPress || onLongPress;

    if (isPressable) {
        return (
            <AnimatedPressable
                onPress={onPress}
                onLongPress={onLongPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={[getVariantStyles(), animatedStyle, disabled && styles.disabled, style]}
            >
                {renderContent()}
            </AnimatedPressable>
        );
    }

    return (
        <Animated.View style={[getVariantStyles(), style]}>
            {renderContent()}
        </Animated.View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    content: {
        padding: LAYOUT.SPACING.md,
    },
    blurView: {
        flex: 1,
    },
    glassOverlay: {
        flex: 1,
        borderWidth: 1,
    },
    gradient: {
        flex: 1,
    },
    disabled: {
        opacity: 0.5,
    },
});

export default PremiumCard;
