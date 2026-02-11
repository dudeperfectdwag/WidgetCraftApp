/**
 * WidgetCraft - Premium Loading Indicator
 * MD3 Expressive loading indicator with morphing shapes
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    interpolate,
    Easing,
} from 'react-native-reanimated';
import { useColors } from '@theme/index';

// ============================================
// Types
// ============================================

export interface PremiumLoadingIndicatorProps {
    /** Use contained style with background */
    contained?: boolean;
    /** Size of the indicator in dp */
    size?: number;
    /** Custom indicator color */
    indicatorColor?: string;
    /** Custom container color (for contained variant) */
    containerColor?: string;
    /** Use multiple colors */
    multiColor?: boolean;
}

// ============================================
// Component
// ============================================

export const PremiumLoadingIndicator: React.FC<PremiumLoadingIndicatorProps> = ({
    contained = false,
    size = 38,
    indicatorColor,
    containerColor,
    multiColor = false,
}) => {
    const colors = useColors();
    const activeColor = indicatorColor || colors.primary;
    const bgColor = containerColor || colors.surfaceContainerHighest;

    // Animation values for morphing
    const morphProgress = useSharedValue(0);
    const colorProgress = useSharedValue(0);
    const rotation = useSharedValue(0);

    // Color palette for multi-color mode
    const colorPalette = [
        colors.primary,
        colors.secondary,
        colors.tertiary,
        colors.primary,
    ];

    useEffect(() => {
        // Morphing animation - continuous loop
        morphProgress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(2, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(3, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                withTiming(0, { duration: 400, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
            ),
            -1, // Infinite
            false
        );

        // Rotation animation
        rotation.value = withRepeat(
            withTiming(360, { duration: 1600, easing: Easing.linear }),
            -1,
            false
        );

        // Color transition for multi-color
        if (multiColor) {
            colorProgress.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 400 }),
                    withTiming(2, { duration: 400 }),
                    withTiming(3, { duration: 400 }),
                    withTiming(0, { duration: 400 }),
                ),
                -1,
                false
            );
        }
    }, []);

    // Morphing shape styles - transitions between circle, rounded square, diamond, circle
    const shapeStyle = useAnimatedStyle(() => {
        // Border radius morphs: circle (50%) -> rounded square -> diamond -> circle
        const borderRadius = interpolate(
            morphProgress.value,
            [0, 1, 2, 3],
            [size / 2, size / 4, size / 6, size / 2]
        );

        // Scale pulses slightly
        const scale = interpolate(
            morphProgress.value,
            [0, 0.5, 1, 1.5, 2, 2.5, 3],
            [1, 1.15, 1, 1.1, 1, 1.15, 1]
        );

        return {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius,
            backgroundColor: activeColor,
            transform: [
                { scale },
                { rotate: `${rotation.value}deg` },
            ],
        };
    });

    const containerSize = contained ? size * 1.3 : size;

    return (
        <View
            style={[
                styles.container,
                {
                    width: containerSize,
                    height: containerSize,
                    borderRadius: containerSize / 2,
                    backgroundColor: contained ? bgColor : 'transparent',
                },
            ]}
            accessibilityRole="progressbar"
            accessibilityLabel="Loading"
        >
            <Animated.View style={shapeStyle} />
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PremiumLoadingIndicator;
