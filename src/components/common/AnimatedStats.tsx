/**
 * WidgetCraft - Animated Stats Card Component
 * Material Design 3 stats display with animated counters
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    runOnJS,
    useDerivedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';
import { HeadlineLarge, HeadlineSmall, BodySmall, LabelMedium } from './Typography';

// ============================================
// Animated Counter Hook
// ============================================

const useAnimatedCounter = (targetValue: number, duration: number = 1500) => {
    const animatedValue = useSharedValue(0);
    const displayValue = useSharedValue(0);

    useEffect(() => {
        animatedValue.value = withTiming(targetValue, {
            duration,
            easing: Easing.out(Easing.cubic),
        });
    }, [targetValue]);

    useDerivedValue(() => {
        displayValue.value = Math.round(animatedValue.value);
    });

    return displayValue;
};

// ============================================
// Stat Card Component
// ============================================

export interface StatCardProps {
    value: number;
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    color: string;
    delay?: number;
    style?: StyleProp<ViewStyle>;
}

export const StatCard: React.FC<StatCardProps> = ({
    value,
    label,
    icon,
    color,
    delay = 0,
    style,
}) => {
    const colors = useColors();
    const scale = useSharedValue(0);
    const counterValue = useSharedValue(0);
    const [displayValue, setDisplayValue] = React.useState(0);

    useEffect(() => {
        // Entrance animation
        const timeout = setTimeout(() => {
            scale.value = withTiming(1, { duration: 300 });

            // Animate counter
            counterValue.value = withTiming(value, {
                duration: 1500,
                easing: Easing.out(Easing.cubic),
            });
        }, delay);

        return () => clearTimeout(timeout);
    }, [value, delay]);

    // Update display value on UI thread
    const updateDisplay = (val: number) => {
        setDisplayValue(Math.round(val));
    };

    useDerivedValue(() => {
        runOnJS(updateDisplay)(counterValue.value);
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: scale.value,
    }));

    return (
        <Animated.View style={[styles.statCard, style, animatedStyle]}>
            <LinearGradient
                colors={[color + '20', color + '10']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCardGradient, { borderColor: color + '30' }]}
            >
                <View style={[styles.statIconContainer, { backgroundColor: color }]}>
                    <MaterialCommunityIcons name={icon} size={20} color="#FFFFFF" />
                </View>
                <HeadlineSmall style={[styles.statValue, { color: colors.onSurface }]}>
                    {displayValue}
                </HeadlineSmall>
                <LabelMedium style={{ color: colors.onSurfaceVariant }}>{label}</LabelMedium>
            </LinearGradient>
        </Animated.View>
    );
};

// ============================================
// Pulse Button Component
// ============================================

export interface PulseButtonProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    color: string;
    onPress: () => void;
    pulse?: boolean;
    delay?: number;
}

export const PulseButton: React.FC<PulseButtonProps> = ({
    icon,
    label,
    color,
    onPress,
    pulse = false,
    delay = 0,
}) => {
    const colors = useColors();
    const scale = useSharedValue(0);
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0);

    useEffect(() => {
        const timeout = setTimeout(() => {
            scale.value = withTiming(1, { duration: 300 });
        }, delay);
        return () => clearTimeout(timeout);
    }, [delay]);

    useEffect(() => {
        if (pulse) {
            const runPulse = () => {
                pulseScale.value = 1;
                pulseOpacity.value = 0.5;
                pulseScale.value = withTiming(1.5, { duration: 800 });
                pulseOpacity.value = withTiming(0, { duration: 800 });
            };

            runPulse();
            const interval = setInterval(runPulse, 2000);
            return () => clearInterval(interval);
        }
    }, [pulse]);

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: scale.value,
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    return (
        <Animated.View style={[styles.pulseButtonContainer, containerStyle]}>
            {pulse && (
                <Animated.View
                    style={[
                        styles.pulseRing,
                        { borderColor: color },
                        pulseStyle,
                    ]}
                />
            )}
            <View
                style={[styles.pulseButton, { backgroundColor: color }]}
                onTouchEnd={onPress}
            >
                <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
            </View>
            <LabelMedium style={{ color: colors.onSurface, marginTop: 8 }}>{label}</LabelMedium>
        </Animated.View>
    );
};

// ============================================
// Suggestion Card Component
// ============================================

export interface SuggestionCardProps {
    title: string;
    description: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    gradient: [string, string];
    onPress?: () => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
    title,
    description,
    icon,
    gradient,
    onPress,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View
            style={[styles.suggestionCard, animatedStyle]}
            onTouchStart={() => { scale.value = withTiming(0.95, { duration: 60 }); }}
            onTouchEnd={() => { scale.value = withTiming(1, { duration: 100 }); onPress?.(); }}
        >
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.suggestionGradient}
            >
                <View style={styles.suggestionIcon}>
                    <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
                </View>
                <View style={styles.suggestionContent}>
                    <BodySmall style={styles.suggestionTitle}>{title}</BodySmall>
                    <BodySmall style={styles.suggestionDesc}>{description}</BodySmall>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.7)" />
            </LinearGradient>
        </Animated.View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    // Stat Card
    statCard: {
        flex: 1,
    },
    statCardGradient: {
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        gap: 8,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statValue: {
        fontWeight: '700',
    },

    // Pulse Button
    pulseButtonContainer: {
        alignItems: 'center',
    },
    pulseButton: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    pulseRing: {
        position: 'absolute',
        top: 0,
        width: 56,
        height: 56,
        borderRadius: 16,
        borderWidth: 2,
    },

    // Suggestion Card
    suggestionCard: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    suggestionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
    },
    suggestionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionTitle: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    suggestionDesc: {
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
});

export default { StatCard, PulseButton, SuggestionCard };
