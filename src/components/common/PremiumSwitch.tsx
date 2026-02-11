/**
 * WidgetCraft - 
 * Beautiful toggle switch with fluid animations and haptic feedback
 */

import React, { useEffect } from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ViewStyle,
    StyleProp,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolateColor,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';

// ============================================
// Types
// ============================================

export type SwitchSize = 'small' | 'medium' | 'large';

export interface PremiumSwitchProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    size?: SwitchSize;
    disabled?: boolean;
    showIcon?: boolean;
    style?: StyleProp<ViewStyle>;
    trackColorOn?: string;
    trackColorOff?: string;
    thumbColorOn?: string;
    thumbColorOff?: string;
}

const SIZE_CONFIG = {
    small: { width: 40, height: 24, thumbSize: 16, padding: 4, iconSize: 10 },
    medium: { width: 52, height: 32, thumbSize: 24, padding: 4, iconSize: 14 },
    large: { width: 64, height: 40, thumbSize: 32, padding: 4, iconSize: 18 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ============================================
// Component for WidgetCraft
// ============================================

export const PremiumSwitch: React.FC<PremiumSwitchProps> = ({
    value,
    onValueChange,
    size = 'medium',
    disabled = false,
    showIcon = true,
    style,
    trackColorOn,
    trackColorOff,
    thumbColorOn,
    thumbColorOff,
}) => {
    const colors = useColors();
    const config = SIZE_CONFIG[size];

    const progress = useSharedValue(value ? 1 : 0);
    const scale = useSharedValue(1);

    // Colors
    const onColor = trackColorOn || colors.primary;
    const offColor = trackColorOff || colors.surfaceContainerHighest;
    const thumbOnColor = thumbColorOn || colors.onPrimary;
    const thumbOffColor = thumbColorOff || colors.outline;

    // Update animation when value changes
    useEffect(() => {
        progress.value = withTiming(value ? 1 : 0, { duration: 150 });
    }, [value]);

    // Handle press
    const handlePress = () => {
        if (disabled) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(!value);
    };

    // Animated track style
    const trackStyle = useAnimatedStyle(() => {
        const backgroundColor = interpolateColor(
            progress.value,
            [0, 1],
            [offColor, onColor]
        );

        return {
            backgroundColor,
            transform: [{ scale: scale.value }],
        };
    });

    // Animated thumb style
    const thumbStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            progress.value,
            [0, 1],
            [0, config.width - config.thumbSize - config.padding * 2]
        );

        const thumbScale = interpolate(
            progress.value,
            [0, 0.5, 1],
            [1, 0.9, 1]
        );

        const backgroundColor = interpolateColor(
            progress.value,
            [0, 1],
            [thumbOffColor, thumbOnColor]
        );

        return {
            transform: [
                { translateX },
                { scale: thumbScale },
            ],
            backgroundColor,
        };
    });

    // Icon opacity styles
    const checkIconStyle = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [{ scale: progress.value }],
    }));

    const closeIconStyle = useAnimatedStyle(() => ({
        opacity: 1 - progress.value,
        transform: [{ scale: 1 - progress.value }],
    }));

    return (
        <AnimatedPressable
            onPress={handlePress}
            disabled={disabled}
            style={[
                styles.track,
                {
                    width: config.width,
                    height: config.height,
                    borderRadius: config.height / 2,
                    padding: config.padding,
                },
                trackStyle,
                disabled && styles.disabled,
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.thumb,
                    {
                        width: config.thumbSize,
                        height: config.thumbSize,
                        borderRadius: config.thumbSize / 2,
                    },
                    thumbStyle,
                ]}
            >
                {showIcon && (
                    <View style={styles.iconContainer}>
                        <Animated.View style={[styles.icon, checkIconStyle]}>
                            <MaterialCommunityIcons
                                name="check"
                                size={config.iconSize}
                                color={onColor}
                            />
                        </Animated.View>
                        <Animated.View style={[styles.icon, closeIconStyle]}>
                            <MaterialCommunityIcons
                                name="close"
                                size={config.iconSize}
                                color={offColor}
                            />
                        </Animated.View>
                    </View>
                )}
            </Animated.View>
        </AnimatedPressable>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    track: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    thumb: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    iconContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        position: 'absolute',
    },
    disabled: {
        opacity: 0.5,
    },
});

export default PremiumSwitch;
