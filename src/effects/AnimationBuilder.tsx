/**
 * WidgetCraft - Animation Builder
 * Provides animation presets, composable animations, and animated components
 */

import React from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    SharedValue,
    AnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

// ============================================
// Animation Types
// ============================================

export type AnimationType =
    | 'fadeIn' | 'fadeOut'
    | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
    | 'scaleIn' | 'scaleOut'
    | 'bounce' | 'pulse' | 'shake' | 'wobble'
    | 'spin' | 'flip'
    | 'none';

export type EasingType =
    | 'linear' | 'ease' | 'easeIn' | 'easeOut' | 'easeInOut'
    | 'bounce' | 'elastic' | 'back';

export interface AnimationConfig {
    type: AnimationType;
    duration?: number;
    delay?: number;
    repeat?: number; // -1 for infinite
    reverse?: boolean;
    easing?: EasingType;
}

export interface AnimationSequence {
    animations: AnimationConfig[];
    loop?: boolean;
}

// ============================================
// Easing Functions
// ============================================

const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
    linear: Easing.linear,
    ease: Easing.ease,
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),
    bounce: Easing.bounce,
    elastic: Easing.elastic(1),
    back: Easing.back(1.5),
};

// ============================================
// Animation Presets
// ============================================

export const ANIMATION_PRESETS: Record<string, AnimationConfig> = {
    // Fade animations
    fadeIn: { type: 'fadeIn', duration: 300, easing: 'easeOut' },
    fadeOut: { type: 'fadeOut', duration: 300, easing: 'easeIn' },
    fadeInSlow: { type: 'fadeIn', duration: 600, easing: 'easeOut' },

    // Slide animations
    slideUp: { type: 'slideUp', duration: 400, easing: 'easeOut' },
    slideDown: { type: 'slideDown', duration: 400, easing: 'easeOut' },
    slideLeft: { type: 'slideLeft', duration: 400, easing: 'easeOut' },
    slideRight: { type: 'slideRight', duration: 400, easing: 'easeOut' },

    // Scale animations
    scaleIn: { type: 'scaleIn', duration: 300, easing: 'bounce' },
    scaleOut: { type: 'scaleOut', duration: 200, easing: 'easeIn' },
    popIn: { type: 'scaleIn', duration: 400, easing: 'elastic' },

    // Attention animations
    bounce: { type: 'bounce', duration: 600, easing: 'bounce' },
    pulse: { type: 'pulse', duration: 1000, repeat: -1, easing: 'easeInOut' },
    shake: { type: 'shake', duration: 500, easing: 'easeInOut' },
    wobble: { type: 'wobble', duration: 800, easing: 'easeInOut' },

    // Rotation animations
    spin: { type: 'spin', duration: 1000, repeat: -1, easing: 'linear' },
    spinOnce: { type: 'spin', duration: 500, easing: 'easeInOut' },
    flip: { type: 'flip', duration: 600, easing: 'easeInOut' },
};

// ============================================
// useAnimatedMount Hook
// ============================================

interface UseAnimatedMountOptions {
    type?: AnimationType;
    duration?: number;
    delay?: number;
    easing?: EasingType;
}

export const useAnimatedMount = (options: UseAnimatedMountOptions = {}) => {
    const {
        type = 'fadeIn',
        duration = 300,
        delay = 0,
        easing = 'easeOut',
    } = options;

    const progress = useSharedValue(0);
    const easingFn = EASING_FUNCTIONS[easing];

    React.useEffect(() => {
        progress.value = withDelay(
            delay,
            withTiming(1, { duration, easing: easingFn })
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        switch (type) {
            case 'fadeIn':
                return { opacity: progress.value };
            case 'slideUp':
                return {
                    opacity: progress.value,
                    transform: [{ translateY: interpolate(progress.value, [0, 1], [50, 0]) }],
                };
            case 'slideDown':
                return {
                    opacity: progress.value,
                    transform: [{ translateY: interpolate(progress.value, [0, 1], [-50, 0]) }],
                };
            case 'slideLeft':
                return {
                    opacity: progress.value,
                    transform: [{ translateX: interpolate(progress.value, [0, 1], [50, 0]) }],
                };
            case 'slideRight':
                return {
                    opacity: progress.value,
                    transform: [{ translateX: interpolate(progress.value, [0, 1], [-50, 0]) }],
                };
            case 'scaleIn':
                return {
                    opacity: progress.value,
                    transform: [{ scale: interpolate(progress.value, [0, 1], [0.5, 1]) }],
                };
            default:
                return { opacity: progress.value };
        }
    });

    return animatedStyle;
};

// ============================================
// useLoopingAnimation Hook
// ============================================

interface UseLoopingAnimationOptions {
    type: 'pulse' | 'bounce' | 'spin' | 'shake' | 'wobble';
    duration?: number;
    intensity?: number;
}

export const useLoopingAnimation = (options: UseLoopingAnimationOptions) => {
    const { type, duration = 1000, intensity = 1 } = options;
    const progress = useSharedValue(0);

    React.useEffect(() => {
        switch (type) {
            case 'pulse':
                progress.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
                        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    false
                );
                break;
            case 'bounce':
                progress.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: duration * 0.4, easing: Easing.out(Easing.ease) }),
                        withTiming(0, { duration: duration * 0.6, easing: Easing.bounce })
                    ),
                    -1,
                    false
                );
                break;
            case 'spin':
                progress.value = withRepeat(
                    withTiming(1, { duration, easing: Easing.linear }),
                    -1,
                    false
                );
                break;
            case 'shake':
                progress.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: duration / 8, easing: Easing.linear }),
                        withTiming(-1, { duration: duration / 4, easing: Easing.linear }),
                        withTiming(1, { duration: duration / 4, easing: Easing.linear }),
                        withTiming(-1, { duration: duration / 4, easing: Easing.linear }),
                        withTiming(0, { duration: duration / 8, easing: Easing.linear })
                    ),
                    -1,
                    false
                );
                break;
            case 'wobble':
                progress.value = withRepeat(
                    withSequence(
                        withTiming(1, { duration: duration / 4, easing: Easing.inOut(Easing.ease) }),
                        withTiming(-1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
                        withTiming(0, { duration: duration / 4, easing: Easing.inOut(Easing.ease) })
                    ),
                    -1,
                    false
                );
                break;
        }

        return () => {
            progress.value = 0;
        };
    }, [type, duration]);

    const animatedStyle = useAnimatedStyle(() => {
        switch (type) {
            case 'pulse':
                return {
                    transform: [{ scale: 1 + progress.value * 0.1 * intensity }],
                };
            case 'bounce':
                return {
                    transform: [{ translateY: -progress.value * 20 * intensity }],
                };
            case 'spin':
                return {
                    transform: [{ rotate: `${progress.value * 360}deg` }],
                };
            case 'shake':
                return {
                    transform: [{ translateX: progress.value * 10 * intensity }],
                };
            case 'wobble':
                return {
                    transform: [
                        { rotate: `${progress.value * 5 * intensity}deg` },
                        { translateX: progress.value * 5 * intensity },
                    ],
                };
            default:
                return {};
        }
    });

    return animatedStyle;
};

// ============================================
// useStaggeredAnimation Hook
// ============================================

export const useStaggeredAnimation = (
    index: number,
    staggerDelay: number = 100,
    type: AnimationType = 'fadeIn',
    duration: number = 300
) => {
    return useAnimatedMount({
        type,
        duration,
        delay: index * staggerDelay,
    });
};

// ============================================
// Animated Component Wrappers
// ============================================

interface AnimatedContainerProps {
    animation?: AnimationConfig;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
    animation = ANIMATION_PRESETS.fadeIn,
    children,
    style,
}) => {
    const animatedStyle = useAnimatedMount({
        type: animation.type,
        duration: animation.duration,
        delay: animation.delay,
        easing: animation.easing,
    });

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

interface LoopingContainerProps {
    type: 'pulse' | 'bounce' | 'spin' | 'shake' | 'wobble';
    duration?: number;
    intensity?: number;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const LoopingContainer: React.FC<LoopingContainerProps> = ({
    type,
    duration,
    intensity,
    children,
    style,
}) => {
    const animatedStyle = useLoopingAnimation({ type, duration, intensity });

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

// ============================================
// Transition Helpers
// ============================================

export const createSpringConfig = (tension = 100, friction = 10) => ({
    damping: friction,
    stiffness: tension,
    mass: 1,
});

export const createTimingConfig = (duration: number, easing: EasingType = 'easeOut') => ({
    duration,
    easing: EASING_FUNCTIONS[easing],
});

// ============================================
// Export
// ============================================

export const AnimationBuilder = {
    ANIMATION_PRESETS,
    EASING_FUNCTIONS,
    useAnimatedMount,
    useLoopingAnimation,
    useStaggeredAnimation,
    AnimatedContainer,
    LoopingContainer,
    createSpringConfig,
    createTimingConfig,
};

export default AnimationBuilder;
