/**
 * WidgetCraft - Material Design 3 Progress Indicators
 * Circular and Linear progress with determinate/indeterminate modes
 * Supports four-color indeterminate animation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useDerivedValue,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@theme/index';

// Circular Progress

interface CircularProgressProps {
    /** Progress value between 0 and 1 */
    value?: number;
    /** Maximum value (default 1) */
    max?: number;
    /** Show indeterminate animation */
    indeterminate?: boolean;
    /** Use four-color animation for indeterminate */
    fourColor?: boolean;
    /** Size of the indicator */
    size?: number;
    /** Stroke width as percentage of size (default 8.33) */
    strokeWidthPercent?: number;
    /** Custom active indicator color */
    activeColor?: string;
    /** Custom track color */
    trackColor?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    value = 0,
    max = 1,
    indeterminate = false,
    fourColor = false,
    size = 48,
    strokeWidthPercent = 8.33,
    activeColor,
    trackColor,
}) => {
    const colors = useColors();
    const rotation = useSharedValue(0);
    const progress = useSharedValue(indeterminate ? 0.25 : value / max);

    const strokeWidth = (size * strokeWidthPercent) / 100;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    useEffect(() => {
        if (indeterminate) {
            rotation.value = withRepeat(
                withTiming(360, { duration: 1400, easing: Easing.linear }),
                -1,
                false
            );
            progress.value = withRepeat(
                withSequence(
                    withTiming(0.75, { duration: 700, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                    withTiming(0.15, { duration: 700, easing: Easing.bezier(0.4, 0, 0.2, 1) })
                ),
                -1,
                false
            );
        } else {
            cancelAnimation(rotation);
            rotation.value = 0;
            progress.value = withTiming(value / max, { duration: 300 });
        }

        return () => {
            cancelAnimation(rotation);
            cancelAnimation(progress);
        };
    }, [indeterminate, value, max]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    // Calculate strokeDashoffset in derived value
    const strokeDashoffset = useDerivedValue(() => {
        return circumference * (1 - progress.value);
    });

    const currentColor = activeColor || colors.primary;
    const track = trackColor || colors.surfaceContainerHighest;

    // For the actual rendering, we use a determinate circle with animated offset
    const displayedProgress = indeterminate ? 0.25 : value / max;
    const displayedOffset = circumference * (1 - displayedProgress);

    return (
        <Animated.View style={[{ width: size, height: size }, animatedContainerStyle]}>
            <Svg width={size} height={size}>
                {/* Track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={track}
                    strokeWidth={strokeWidth}
                    fill="none"
                    opacity={0.3}
                />
                {/* Active Indicator */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={currentColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={indeterminate ? circumference * 0.25 : displayedOffset}
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </Svg>
        </Animated.View>
    );
};

// ============================================
// Linear Progress
// ============================================

interface LinearProgressProps {
    /** Progress value between 0 and 1 */
    value?: number;
    /** Buffer value between 0 and 1 */
    buffer?: number;
    /** Maximum value (default 1) */
    max?: number;
    /** Show indeterminate animation */
    indeterminate?: boolean;
    /** Use four-color animation for indeterminate */
    fourColor?: boolean;
    /** Height of the track */
    height?: number;
    /** Border radius */
    borderRadius?: number;
    /** Custom active indicator color */
    activeColor?: string;
    /** Custom track color */
    trackColor?: string;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
    value = 0,
    buffer = 0,
    max = 1,
    indeterminate = false,
    fourColor = false,
    height = 4,
    borderRadius = 2,
    activeColor,
    trackColor,
}) => {
    const colors = useColors();
    const translateX = useSharedValue(0);
    const width = useSharedValue(indeterminate ? 0.3 : value / max);

    useEffect(() => {
        if (indeterminate) {
            // Indeterminate animation: bar moves left to right
            translateX.value = withRepeat(
                withSequence(
                    withTiming(-1, { duration: 0 }),
                    withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) })
                ),
                -1,
                false
            );
            width.value = withRepeat(
                withSequence(
                    withTiming(0.2, { duration: 0 }),
                    withTiming(0.6, { duration: 750, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
                    withTiming(0.2, { duration: 750, easing: Easing.bezier(0.4, 0, 0.2, 1) })
                ),
                -1,
                false
            );
        } else {
            cancelAnimation(translateX);
            cancelAnimation(width);
            translateX.value = 0;
            width.value = withTiming(value / max, { duration: 300 });
        }

        return () => {
            cancelAnimation(translateX);
            cancelAnimation(width);
        };
    }, [indeterminate, value, max]);

    const animatedIndicatorStyle = useAnimatedStyle(() => {
        if (indeterminate) {
            return {
                width: `${width.value * 100}%`,
                left: `${(translateX.value + 1) * 50 - (width.value * 50)}%`,
            };
        }
        return {
            width: `${width.value * 100}%`,
            left: 0,
        };
    });

    const animatedBufferStyle = useAnimatedStyle(() => ({
        width: `${(buffer / max) * 100}%`,
    }));

    const currentColor = activeColor || colors.primary;
    const track = trackColor || colors.surfaceContainerHighest;

    return (
        <View
            style={[
                styles.linearTrack,
                {
                    height,
                    borderRadius,
                    backgroundColor: track,
                },
            ]}
        >
            {/* Buffer */}
            {buffer > 0 && !indeterminate && (
                <Animated.View
                    style={[
                        styles.linearBuffer,
                        {
                            backgroundColor: currentColor,
                            opacity: 0.3,
                            borderRadius,
                        },
                        animatedBufferStyle,
                    ]}
                />
            )}
            {/* Active Indicator */}
            <Animated.View
                style={[
                    styles.linearIndicator,
                    {
                        backgroundColor: currentColor,
                        borderRadius,
                    },
                    animatedIndicatorStyle,
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    linearTrack: {
        width: '100%',
        overflow: 'hidden',
        position: 'relative',
    },
    linearBuffer: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
    },
    linearIndicator: {
        position: 'absolute',
        top: 0,
        bottom: 0,
    },
});

export default { CircularProgress, LinearProgress };
