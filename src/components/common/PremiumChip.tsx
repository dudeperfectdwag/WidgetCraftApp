/**
 * WidgetCraft - Premium Chip Component
 * Material Design 3 chips with animations and premium styling
 */

import React from 'react';
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
    interpolateColor,
    useDerivedValue,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';
import { LAYOUT } from '@constants/index';

// ============================================
// Types
// ============================================

export type ChipVariant = 'filled' | 'outlined' | 'elevated' | 'gradient';
export type ChipSize = 'small' | 'medium' | 'large';

export interface PremiumChipProps {
    label: string;
    onPress?: () => void;
    onClose?: () => void;
    selected?: boolean;
    disabled?: boolean;
    variant?: ChipVariant;
    size?: ChipSize;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    avatar?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    gradientColors?: string[];
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================
// Size configurations
// ============================================

const SIZE_CONFIG = {
    small: {
        height: 28,
        paddingHorizontal: 10,
        fontSize: 12,
        iconSize: 14,
    },
    medium: {
        height: 36,
        paddingHorizontal: 14,
        fontSize: 14,
        iconSize: 18,
    },
    large: {
        height: 44,
        paddingHorizontal: 18,
        fontSize: 16,
        iconSize: 20,
    },
};

// ============================================
// Premium Chip Component
// ============================================

export const PremiumChip: React.FC<PremiumChipProps> = ({
    label,
    onPress,
    onClose,
    selected = false,
    disabled = false,
    variant = 'filled',
    size = 'medium',
    icon,
    avatar,
    style,
    gradientColors,
}) => {
    const colors = useColors();
    const config = SIZE_CONFIG[size];

    const scale = useSharedValue(1);
    const selectedProgress = useSharedValue(selected ? 1 : 0);

    // Update selection animation
    React.useEffect(() => {
        selectedProgress.value = withTiming(selected ? 1 : 0, { duration: 150 });
    }, [selected]);

    // Press animation
    const handlePressIn = () => {
        if (!disabled) {
            scale.value = withTiming(0.95, { duration: 60 });
        }
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // Get variant styles
    const getVariantStyles = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            height: config.height,
            borderRadius: config.height / 2,
            paddingHorizontal: config.paddingHorizontal,
        };

        if (variant === 'outlined') {
            return {
                ...baseStyle,
                backgroundColor: selected ? colors.secondaryContainer : 'transparent',
                borderWidth: 1,
                borderColor: selected ? colors.secondary : colors.outline,
            };
        }

        if (variant === 'elevated') {
            return {
                ...baseStyle,
                backgroundColor: selected ? colors.secondaryContainer : colors.surfaceContainerLow,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
            };
        }

        if (variant === 'gradient') {
            return {
                ...baseStyle,
                backgroundColor: 'transparent',
            };
        }

        // Filled variant (default)
        return {
            ...baseStyle,
            backgroundColor: selected ? colors.secondaryContainer : colors.surfaceContainerHigh,
        };
    };

    const getTextColor = () => {
        if (disabled) return colors.onSurface + '61'; // 38% opacity
        if (selected) return colors.onSecondaryContainer;
        if (variant === 'gradient') return colors.onPrimary;
        return colors.onSurfaceVariant;
    };

    const defaultGradient = gradientColors || [colors.primary, colors.secondary];

    const renderContent = () => (
        <View style={styles.contentContainer}>
            {avatar && <View style={styles.avatar}>{avatar}</View>}

            {icon && !avatar && (
                <MaterialCommunityIcons
                    name={icon}
                    size={config.iconSize}
                    color={getTextColor()}
                    style={styles.leadingIcon}
                />
            )}

            <Text
                style={[
                    styles.label,
                    {
                        fontSize: config.fontSize,
                        color: getTextColor(),
                    },
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>

            {onClose && (
                <Pressable
                    onPress={onClose}
                    style={styles.closeButton}
                    hitSlop={8}
                >
                    <MaterialCommunityIcons
                        name="close-circle"
                        size={config.iconSize}
                        color={getTextColor()}
                    />
                </Pressable>
            )}
        </View>
    );

    if (variant === 'gradient') {
        return (
            <AnimatedPressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={[animatedStyle, disabled && styles.disabled, style]}
            >
                <LinearGradient
                    colors={defaultGradient as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[getVariantStyles(), styles.chip]}
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
            disabled={disabled}
            style={[
                getVariantStyles(),
                styles.chip,
                animatedStyle,
                disabled && styles.disabled,
                style,
            ]}
        >
            {renderContent()}
        </AnimatedPressable>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        marginRight: 8,
        marginLeft: -4,
    },
    leadingIcon: {
        marginRight: 6,
    },
    label: {
        fontWeight: '500',
        letterSpacing: 0.25,
    },
    closeButton: {
        marginLeft: 4,
        marginRight: -4,
    },
    disabled: {
        opacity: 0.5,
    },
});

export default PremiumChip;
