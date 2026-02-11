/**
 * WidgetCraft - Premium FAB (Floating Action Button)
 * Material Design 3 FAB with animations and variants
 */

import React, { ReactNode } from 'react';
import {
    StyleSheet,
    Pressable,
    View,
    Text,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';
import { LAYOUT, ANIMATION } from '@constants/index';

// ============================================
// Types
// ============================================

export type FABSize = 'small' | 'medium' | 'large';
export type FABVariant = 'primary' | 'secondary' | 'tertiary' | 'surface' | 'gradient';

export interface PremiumFABProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label?: string;
    onPress: () => void;
    size?: FABSize;
    variant?: FABVariant;
    extended?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    gradientColors?: string[];
    // Animation options
    enableRipple?: boolean;
    enablePulse?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================
// Size configurations
// ============================================

const SIZE_CONFIG = {
    small: {
        size: 40,
        iconSize: 20,
        padding: 8,
        fontSize: 12,
    },
    medium: {
        size: 56,
        iconSize: 24,
        padding: 16,
        fontSize: 14,
    },
    large: {
        size: 96,
        iconSize: 36,
        padding: 30,
        fontSize: 16,
    },
};

// ============================================
// Premium FAB Component
// ============================================

export const PremiumFAB: React.FC<PremiumFABProps> = ({
    icon,
    label,
    onPress,
    size = 'medium',
    variant = 'primary',
    extended = false,
    disabled = false,
    style,
    gradientColors,
    enableRipple = true,
    enablePulse = false,
}) => {
    const colors = useColors();
    const scale = useSharedValue(1);

    const config = SIZE_CONFIG[size];

    // Press animation
    const handlePressIn = () => {
        if (!disabled) {
            scale.value = withTiming(0.9, { duration: 60 });
        }
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handlePress = () => {
        if (!disabled) {
            onPress();
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
        ],
    }));

    // Get variant colors
    const getVariantColors = () => {
        switch (variant) {
            case 'primary':
                return {
                    background: colors.primaryContainer,
                    foreground: colors.onPrimaryContainer,
                };
            case 'secondary':
                return {
                    background: colors.secondaryContainer,
                    foreground: colors.onSecondaryContainer,
                };
            case 'tertiary':
                return {
                    background: colors.tertiaryContainer,
                    foreground: colors.onTertiaryContainer,
                };
            case 'surface':
                return {
                    background: colors.surfaceContainerHigh,
                    foreground: colors.primary,
                };
            case 'gradient':
                return {
                    background: 'transparent',
                    foreground: colors.onPrimary,
                };
            default:
                return {
                    background: colors.primaryContainer,
                    foreground: colors.onPrimaryContainer,
                };
        }
    };

    const variantColors = getVariantColors();
    const defaultGradient = gradientColors || [colors.primary, colors.tertiary];

    const fabStyle: ViewStyle = {
        height: extended ? config.size : config.size,
        minWidth: config.size,
        borderRadius: extended ? config.size / 2 : size === 'large' ? 28 : 16,
        paddingHorizontal: extended ? config.padding + 8 : 0,
        backgroundColor: variant === 'gradient' ? 'transparent' : variantColors.background,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    };

    const renderContent = () => (
        <View style={styles.contentContainer}>
            <MaterialCommunityIcons
                name={icon}
                size={config.iconSize}
                color={variantColors.foreground}
            />
            {extended && label && (
                <Text
                    style={[
                        styles.label,
                        {
                            color: variantColors.foreground,
                            fontSize: config.fontSize,
                            marginLeft: 12,
                        },
                    ]}
                >
                    {label}
                </Text>
            )}
        </View>
    );

    if (variant === 'gradient') {
        return (
            <AnimatedPressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={[animatedStyle, disabled && styles.disabled, style]}
            >
                <LinearGradient
                    colors={defaultGradient as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[fabStyle, styles.gradientFab]}
                >
                    {renderContent()}
                </LinearGradient>
            </AnimatedPressable>
        );
    }

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[fabStyle, styles.fab, animatedStyle, disabled && styles.disabled, style]}
        >
            {renderContent()}
        </AnimatedPressable>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    fab: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientFab: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    disabled: {
        opacity: 0.5,
    },
});

export default PremiumFAB;
