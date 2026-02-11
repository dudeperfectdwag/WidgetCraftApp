/**
 * WidgetCraft - Premium Button Component
 * Material Design 3 buttons with multiple variants and animations
 */

import React, { ReactNode } from 'react';
import {
    StyleSheet,
    Pressable,
    View,
    Text,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';
import { LAYOUT } from '@constants/index';

// ============================================
// Types
// ============================================

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'gradient';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface PremiumButtonProps {
    onPress: () => void;
    children?: ReactNode;
    label?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    style?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    gradientColors?: string[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================
// Size configurations
// ============================================

const SIZE_CONFIG = {
    small: {
        height: 36,
        paddingHorizontal: 16,
        fontSize: 13,
        iconSize: 16,
        borderRadius: 18,
    },
    medium: {
        height: 44,
        paddingHorizontal: 24,
        fontSize: 14,
        iconSize: 18,
        borderRadius: 22,
    },
    large: {
        height: 56,
        paddingHorizontal: 32,
        fontSize: 16,
        iconSize: 22,
        borderRadius: 28,
    },
};

// ============================================
// Premium Button Component
// ============================================

export const PremiumButton: React.FC<PremiumButtonProps> = ({
    onPress,
    children,
    label,
    variant = 'filled',
    size = 'medium',
    icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    labelStyle,
    gradientColors,
}) => {
    const colors = useColors();
    const config = SIZE_CONFIG[size];

    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const handlePressIn = () => {
        if (!disabled && !loading) {
            scale.value = withTiming(0.96, { duration: 80 });
            opacity.value = withTiming(0.9, { duration: 80 });
        }
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 120 });
        opacity.value = withTiming(1, { duration: 120 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    // Get variant styles
    const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
        const baseContainer: ViewStyle = {
            height: config.height,
            borderRadius: config.borderRadius,
            paddingHorizontal: config.paddingHorizontal,
        };

        switch (variant) {
            case 'filled':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: colors.primary,
                    },
                    text: { color: colors.onPrimary },
                };

            case 'tonal':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: colors.secondaryContainer,
                    },
                    text: { color: colors.onSecondaryContainer },
                };

            case 'outlined':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: colors.outline,
                    },
                    text: { color: colors.primary },
                };

            case 'text':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: 'transparent',
                        paddingHorizontal: config.paddingHorizontal / 2,
                    },
                    text: { color: colors.primary },
                };

            case 'elevated':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: colors.surfaceContainerLow,
                        shadowColor: colors.shadow,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 6,
                        elevation: 3,
                    },
                    text: { color: colors.primary },
                };

            case 'gradient':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: 'transparent',
                    },
                    text: { color: colors.onPrimary },
                };

            default:
                return {
                    container: baseContainer,
                    text: { color: colors.onPrimary },
                };
        }
    };

    const variantStyles = getVariantStyles();
    const defaultGradient = gradientColors || [colors.primary, colors.tertiary];

    const renderIcon = (position: 'left' | 'right') => {
        if (!icon || iconPosition !== position) return null;

        return (
            <MaterialCommunityIcons
                name={icon}
                size={config.iconSize}
                color={variantStyles.text.color}
                style={position === 'left' ? styles.iconLeft : styles.iconRight}
            />
        );
    };

    const renderContent = () => (
        <View style={styles.contentContainer}>
            {loading ? (
                <ActivityIndicator size="small" color={variantStyles.text.color} />
            ) : (
                <>
                    {renderIcon('left')}
                    {(label || children) && (
                        <Text
                            style={[
                                styles.label,
                                {
                                    fontSize: config.fontSize,
                                    color: variantStyles.text.color,
                                },
                                labelStyle,
                            ]}
                        >
                            {label || children}
                        </Text>
                    )}
                    {renderIcon('right')}
                </>
            )}
        </View>
    );

    const containerStyle = [
        styles.button,
        variantStyles.container,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
    ];

    if (variant === 'gradient') {
        return (
            <AnimatedPressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[animatedStyle, fullWidth && styles.fullWidth]}
            >
                <LinearGradient
                    colors={defaultGradient as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                        styles.button,
                        variantStyles.container,
                        (disabled || loading) && styles.disabled,
                        style,
                    ]}
                >
                    {renderContent()}
                </LinearGradient>
            </AnimatedPressable>
        );
    }

    return (
        <AnimatedPressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[containerStyle, animatedStyle]}
        >
            {renderContent()}
        </AnimatedPressable>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    fullWidth: {
        width: '100%',
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
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    },
    disabled: {
        opacity: 0.5,
    },
});

export default PremiumButton;
