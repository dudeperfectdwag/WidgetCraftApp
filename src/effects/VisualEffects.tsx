/**
 * WidgetCraft - Visual Effects Engine
 * Provides shadows, blur, gradients, glow, and other visual effects for widgets
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    useSharedValue,
    Easing,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect, Filter, FeGaussianBlur, Circle } from 'react-native-svg';

// ============================================
// Effect Types
// ============================================

export type ShadowIntensity = 'none' | 'subtle' | 'soft' | 'medium' | 'strong' | 'dramatic';
export type BlurIntensity = 'light' | 'medium' | 'strong';
export type GlowColor = 'primary' | 'secondary' | 'tertiary' | 'custom';
export type GradientDirection = 'horizontal' | 'vertical' | 'diagonal' | 'radial';

export interface ShadowEffect {
    type: 'shadow';
    intensity: ShadowIntensity;
    color?: string;
    offsetX?: number;
    offsetY?: number;
}

export interface BlurEffect {
    type: 'blur';
    intensity: BlurIntensity;
    tint?: 'light' | 'dark' | 'default';
}

export interface GlowEffect {
    type: 'glow';
    color: string;
    radius: number;
    intensity: number; // 0-1
}

export interface GradientEffect {
    type: 'gradient';
    colors: string[];
    direction: GradientDirection;
    locations?: number[];
}

export interface GlassEffect {
    type: 'glass';
    opacity: number; // 0-1
    blur: BlurIntensity;
    tint?: 'light' | 'dark';
}

export type VisualEffect = ShadowEffect | BlurEffect | GlowEffect | GradientEffect | GlassEffect;

// ============================================
// Shadow Presets
// ============================================

export const SHADOW_PRESETS: Record<ShadowIntensity, ViewStyle> = {
    none: {},
    subtle: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    soft: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    strong: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    dramatic: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.3,
        shadowRadius: 24,
        elevation: 16,
    },
};

// ============================================
// Gradient Direction Helpers
// ============================================

export const getGradientCoords = (direction: GradientDirection) => {
    switch (direction) {
        case 'horizontal':
            return { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };
        case 'vertical':
            return { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } };
        case 'diagonal':
            return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
        case 'radial':
            return { start: { x: 0.5, y: 0.5 }, end: { x: 1, y: 1 } };
        default:
            return { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
    }
};

// ============================================
// Effect Components
// ============================================

interface ShadowWrapperProps {
    effect: ShadowEffect;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const ShadowWrapper: React.FC<ShadowWrapperProps> = ({ effect, children, style }) => {
    const shadowStyle = {
        ...SHADOW_PRESETS[effect.intensity],
        ...(effect.color && { shadowColor: effect.color }),
        ...(effect.offsetX !== undefined && {
            shadowOffset: {
                width: effect.offsetX,
                height: effect.offsetY ?? SHADOW_PRESETS[effect.intensity].shadowOffset?.height ?? 0
            }
        }),
    };

    return (
        <View style={[shadowStyle, style]}>
            {children}
        </View>
    );
};

interface GlassContainerProps {
    effect: GlassEffect;
    children: React.ReactNode;
    style?: ViewStyle;
    borderRadius?: number;
}

export const GlassContainer: React.FC<GlassContainerProps> = ({
    effect,
    children,
    style,
    borderRadius = 16,
}) => {
    const blurIntensityMap = {
        light: 20,
        medium: 50,
        strong: 80,
    };

    return (
        <View style={[styles.glassContainer, { borderRadius }, style]}>
            <BlurView
                intensity={blurIntensityMap[effect.blur]}
                tint={effect.tint || 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius }]}
            />
            <View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: effect.tint === 'dark'
                            ? `rgba(0,0,0,${effect.opacity})`
                            : `rgba(255,255,255,${effect.opacity})`,
                        borderRadius,
                    }
                ]}
            />
            {children}
        </View>
    );
};

interface GradientBackgroundProps {
    effect: GradientEffect;
    children?: React.ReactNode;
    style?: ViewStyle;
    borderRadius?: number;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
    effect,
    children,
    style,
    borderRadius = 0,
}) => {
    const coords = getGradientCoords(effect.direction);
    // Ensure locations is properly typed for LinearGradient
    const safeLocations = effect.locations && effect.locations.length >= 2
        ? effect.locations as [number, number, ...number[]]
        : undefined;

    return (
        <LinearGradient
            colors={effect.colors as [string, string, ...string[]]}
            start={coords.start}
            end={coords.end}
            locations={safeLocations}
            style={[{ borderRadius }, style]}
        >
            {children}
        </LinearGradient>
    );
};

interface GlowWrapperProps {
    effect: GlowEffect;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const GlowWrapper: React.FC<GlowWrapperProps> = ({ effect, children, style }) => {
    // Create a glow effect using multiple shadow layers
    const glowShadows = Array.from({ length: 3 }, (_, i) => ({
        shadowColor: effect.color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: effect.intensity * (1 - i * 0.25),
        shadowRadius: effect.radius * (i + 1) * 0.5,
        elevation: effect.radius,
    }));

    return (
        <View style={[glowShadows[2], style]}>
            <View style={glowShadows[1]}>
                <View style={glowShadows[0]}>
                    {children}
                </View>
            </View>
        </View>
    );
};

// ============================================
// Animated Effect Components
// ============================================

interface PulsingGlowProps {
    color: string;
    minOpacity?: number;
    maxOpacity?: number;
    duration?: number;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const PulsingGlow: React.FC<PulsingGlowProps> = ({
    color,
    minOpacity = 0.3,
    maxOpacity = 0.8,
    duration = 2000,
    children,
    style,
}) => {
    const opacity = useSharedValue(minOpacity);

    React.useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(maxOpacity, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
                withTiming(minOpacity, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // Infinite
            false
        );
    }, [duration, maxOpacity, minOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: opacity.value,
        shadowRadius: 20,
        elevation: 10,
    }));

    return (
        <Animated.View style={[animatedStyle, style]}>
            {children}
        </Animated.View>
    );
};

interface ShimmerEffectProps {
    width: number;
    height: number;
    baseColor?: string;
    shimmerColor?: string;
    duration?: number;
    style?: ViewStyle;
}

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
    width,
    height,
    baseColor = 'rgba(255,255,255,0.1)',
    shimmerColor = 'rgba(255,255,255,0.3)',
    duration = 1500,
    style,
}) => {
    const translateX = useSharedValue(-width);

    React.useEffect(() => {
        translateX.value = withRepeat(
            withTiming(width * 2, { duration, easing: Easing.linear }),
            -1,
            false
        );
    }, [width, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <View style={[{ width, height, overflow: 'hidden', backgroundColor: baseColor }, style]}>
            <Animated.View style={[styles.shimmerGradient, animatedStyle]}>
                <LinearGradient
                    colors={['transparent', shimmerColor, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: width * 0.5, height: '100%' }}
                />
            </Animated.View>
        </View>
    );
};

// ============================================
// Effect Presets
// ============================================

export const EFFECT_PRESETS = {
    // Card styles
    cardSubtle: {
        shadow: SHADOW_PRESETS.subtle,
    },
    cardElevated: {
        shadow: SHADOW_PRESETS.medium,
    },
    cardFloating: {
        shadow: SHADOW_PRESETS.strong,
    },

    // Glass morphism
    glassLight: {
        glass: { type: 'glass', opacity: 0.2, blur: 'medium', tint: 'light' } as GlassEffect,
    },
    glassDark: {
        glass: { type: 'glass', opacity: 0.3, blur: 'medium', tint: 'dark' } as GlassEffect,
    },
    glassFrosted: {
        glass: { type: 'glass', opacity: 0.15, blur: 'strong', tint: 'light' } as GlassEffect,
    },

    // Gradients
    gradientSunset: {
        colors: ['#FF512F', '#DD2476'],
        direction: 'diagonal' as GradientDirection,
    },
    gradientOcean: {
        colors: ['#2193b0', '#6dd5ed'],
        direction: 'vertical' as GradientDirection,
    },
    gradientPurple: {
        colors: ['#667eea', '#764ba2'],
        direction: 'diagonal' as GradientDirection,
    },
    gradientMint: {
        colors: ['#11998e', '#38ef7d'],
        direction: 'horizontal' as GradientDirection,
    },
    gradientDusk: {
        colors: ['#2C3E50', '#4CA1AF'],
        direction: 'vertical' as GradientDirection,
    },

    // Glow effects
    glowPrimary: {
        color: '#6750A4',
        radius: 20,
        intensity: 0.6,
    },
    glowNeon: {
        color: '#00FF88',
        radius: 25,
        intensity: 0.8,
    },
    glowWarm: {
        color: '#FF6B35',
        radius: 20,
        intensity: 0.5,
    },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Apply shadow effect to a style object
 */
export const applyShadow = (intensity: ShadowIntensity, color?: string): ViewStyle => {
    const shadow = { ...SHADOW_PRESETS[intensity] };
    if (color) {
        shadow.shadowColor = color;
    }
    return shadow;
};

/**
 * Create gradient colors array from two colors
 */
export const createGradient = (startColor: string, endColor: string, steps = 2): string[] => {
    return [startColor, endColor];
};

/**
 * Get contrasting text color for a background
 */
export const getContrastColor = (backgroundColor: string): string => {
    // Simple luminance check
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    glassContainer: {
        overflow: 'hidden',
    },
    shimmerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
    },
});

// ============================================
// Export
// ============================================

export const VisualEffects = {
    ShadowWrapper,
    GlassContainer,
    GradientBackground,
    GlowWrapper,
    PulsingGlow,
    ShimmerEffect,
    SHADOW_PRESETS,
    EFFECT_PRESETS,
    applyShadow,
    createGradient,
    getContrastColor,
    getGradientCoords,
};

export default VisualEffects;
