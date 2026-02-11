/**
 * WidgetCraft - Premium Icon Button Component
 * Circular icon buttons with ripple effects and variants
 */

import React from 'react';
import {
    StyleSheet,
    Pressable,
    ViewStyle,
    StyleProp,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';

// ============================================
// Types
// ============================================

export type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';
export type IconButtonSize = 'small' | 'medium' | 'large';

export interface PremiumIconButtonProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
    onLongPress?: () => void;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    selected?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    color?: string;
    toggleable?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================
// Size configurations
// ============================================

const SIZE_CONFIG = {
    small: { size: 32, iconSize: 18, padding: 7 },
    medium: { size: 44, iconSize: 24, padding: 10 },
    large: { size: 56, iconSize: 32, padding: 12 },
};

// ============================================
// Component
// ============================================

export const PremiumIconButton: React.FC<PremiumIconButtonProps> = ({
    icon,
    onPress,
    onLongPress,
    variant = 'standard',
    size = 'medium',
    selected = false,
    disabled = false,
    style,
    color,
    toggleable = false,
}) => {
    const colors = useColors();
    const config = SIZE_CONFIG[size];

    const scale = useSharedValue(1);

    const handlePressIn = () => {
        if (!disabled) {
            scale.value = withTiming(0.88, { duration: 60 });
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

    const getVariantStyles = (): { container: ViewStyle; iconColor: string } => {
        const baseContainer: ViewStyle = {
            width: config.size,
            height: config.size,
            borderRadius: config.size / 2,
        };

        switch (variant) {
            case 'filled':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: selected ? colors.primary : colors.surfaceContainerHighest,
                    },
                    iconColor: color || (selected ? colors.onPrimary : colors.primary),
                };

            case 'tonal':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: selected ? colors.secondaryContainer : colors.surfaceContainerHighest,
                    },
                    iconColor: color || (selected ? colors.onSecondaryContainer : colors.onSurfaceVariant),
                };

            case 'outlined':
                return {
                    container: {
                        ...baseContainer,
                        backgroundColor: selected ? colors.inverseSurface : 'transparent',
                        borderWidth: 1,
                        borderColor: colors.outline,
                    },
                    iconColor: color || (selected ? colors.inverseOnSurface : colors.onSurfaceVariant),
                };

            case 'standard':
            default:
                return {
                    container: baseContainer,
                    iconColor: color || (selected ? colors.primary : colors.onSurfaceVariant),
                };
        }
    };

    const variantStyles = getVariantStyles();

    return (
        <AnimatedPressable
            onPress={handlePress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={[
                styles.button,
                variantStyles.container,
                animatedStyle,
                disabled && styles.disabled,
                style,
            ]}
        >
            <MaterialCommunityIcons
                name={icon}
                size={config.iconSize}
                color={variantStyles.iconColor}
            />
        </AnimatedPressable>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabled: {
        opacity: 0.38,
    },
});

export default PremiumIconButton;
