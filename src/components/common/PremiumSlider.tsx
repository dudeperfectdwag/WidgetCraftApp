/**
 * WidgetCraft - Premium Slider Component
 * Beautiful slider with glow effect and haptic feedback
 */

import React, { useCallback, useState } from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
    LayoutChangeEvent,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
    interpolate,
    clamp,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import { LabelSmall } from './Typography';

// ============================================
// Types
// ============================================

export interface PremiumSliderProps {
    value: number;
    onValueChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    showValue?: boolean;
    showLabels?: boolean;
    disabled?: boolean;
    trackHeight?: number;
    thumbSize?: number;
    enableGlow?: boolean;
    style?: StyleProp<ViewStyle>;
}

// ============================================
// Component
// ============================================

export const PremiumSlider: React.FC<PremiumSliderProps> = ({
    value,
    onValueChange,
    min = 0,
    max = 100,
    step = 1,
    showValue = false,
    showLabels = false,
    disabled = false,
    trackHeight = 6,
    thumbSize = 24,
    enableGlow = true,
    style,
}) => {
    const colors = useColors();
    const [trackWidth, setTrackWidth] = useState(0);

    const translateX = useSharedValue(0);
    const scale = useSharedValue(1);
    const isPressed = useSharedValue(false);

    // Calculate position from value
    const getPositionFromValue = useCallback(
        (val: number) => {
            const range = max - min;
            const normalizedValue = (val - min) / range;
            return normalizedValue * trackWidth;
        },
        [min, max, trackWidth]
    );

    // Calculate value from position
    const getValueFromPosition = useCallback(
        (pos: number) => {
            const range = max - min;
            const normalizedPos = pos / trackWidth;
            let newValue = min + normalizedPos * range;

            // Apply step
            if (step > 0) {
                newValue = Math.round(newValue / step) * step;
            }

            return Math.max(min, Math.min(max, newValue));
        },
        [min, max, step, trackWidth]
    );

    // Update position when value changes externally
    React.useEffect(() => {
        if (trackWidth > 0) {
            translateX.value = withTiming(getPositionFromValue(value), { duration: 150 });
        }
    }, [value, trackWidth]);

    // Handle layout
    const handleLayout = (event: LayoutChangeEvent) => {
        setTrackWidth(event.nativeEvent.layout.width);
    };

    // Haptic feedback
    const triggerHaptic = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Pan gesture
    const panGesture = Gesture.Pan()
        .enabled(!disabled)
        .onStart(() => {
            isPressed.value = true;
            scale.value = withTiming(1.2, { duration: 80 });
            runOnJS(triggerHaptic)();
        })
        .onUpdate((event) => {
            const newX = clamp(event.absoluteX - thumbSize / 2, 0, trackWidth);
            translateX.value = newX;

            const newValue = getValueFromPosition(newX);
            runOnJS(onValueChange)(newValue);
        })
        .onEnd(() => {
            isPressed.value = false;
            scale.value = withTiming(1, { duration: 80 });
            runOnJS(triggerHaptic)();
        });

    // Animated styles
    const thumbStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value - thumbSize / 2 },
            { scale: scale.value },
        ],
    }));

    const filledTrackStyle = useAnimatedStyle(() => ({
        width: translateX.value,
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: isPressed.value ? withTiming(0.6) : withTiming(0),
        transform: [
            { translateX: translateX.value - thumbSize },
            { scale: scale.value * 1.5 },
        ],
    }));

    return (
        <View style={[styles.container, style]}>
            {/* Labels */}
            {showLabels && (
                <View style={styles.labelsRow}>
                    <LabelSmall color="muted">{min}</LabelSmall>
                    {showValue && <LabelSmall color="primary">{Math.round(value)}</LabelSmall>}
                    <LabelSmall color="muted">{max}</LabelSmall>
                </View>
            )}

            {/* Track */}
            <GestureDetector gesture={panGesture}>
                <View
                    style={[styles.trackContainer, { height: thumbSize + 16 }]}
                    onLayout={handleLayout}
                >
                    {/* Background Track */}
                    <View
                        style={[
                            styles.track,
                            {
                                height: trackHeight,
                                backgroundColor: colors.surfaceContainerHighest,
                                borderRadius: trackHeight / 2,
                            },
                        ]}
                    />

                    {/* Filled Track */}
                    <Animated.View
                        style={[
                            styles.filledTrack,
                            {
                                height: trackHeight,
                                backgroundColor: colors.primary,
                                borderRadius: trackHeight / 2,
                            },
                            filledTrackStyle,
                        ]}
                    />

                    {/* Glow Effect */}
                    {enableGlow && (
                        <Animated.View
                            style={[
                                styles.glow,
                                {
                                    width: thumbSize * 2,
                                    height: thumbSize * 2,
                                    borderRadius: thumbSize,
                                    backgroundColor: colors.primary,
                                },
                                glowStyle,
                            ]}
                        />
                    )}

                    {/* Thumb */}
                    <Animated.View
                        style={[
                            styles.thumb,
                            {
                                width: thumbSize,
                                height: thumbSize,
                                borderRadius: thumbSize / 2,
                                backgroundColor: colors.primary,
                                borderColor: colors.onPrimary,
                            },
                            thumbStyle,
                            disabled && styles.disabled,
                        ]}
                    />
                </View>
            </GestureDetector>
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    labelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    trackContainer: {
        justifyContent: 'center',
    },
    track: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
    filledTrack: {
        position: 'absolute',
        left: 0,
    },
    thumb: {
        position: 'absolute',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    glow: {
        position: 'absolute',
    },
    disabled: {
        opacity: 0.5,
    },
});

export default PremiumSlider;
