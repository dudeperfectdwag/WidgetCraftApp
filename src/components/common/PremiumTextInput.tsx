/**
 * WidgetCraft - Premium Text Input Component
 * Beautiful text input with floating label and animations
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TextInput as RNTextInput,
    StyleSheet,
    Pressable,
    ViewStyle,
    TextInputProps as RNTextInputProps,
    StyleProp,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    interpolateColor,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';
import { LAYOUT } from '@constants/index';
import { BodySmall } from './Typography';

// ============================================
// Types
// ============================================

export type TextInputVariant = 'outlined' | 'filled';

export interface PremiumTextInputProps extends Omit<RNTextInputProps, 'style'> {
    label: string;
    variant?: TextInputVariant;
    error?: string;
    helperText?: string;
    leftIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    onRightIconPress?: () => void;
    disabled?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
}

const AnimatedTextInput = Animated.createAnimatedComponent(RNTextInput);

// ============================================
// Component
// ============================================

export const PremiumTextInput: React.FC<PremiumTextInputProps> = ({
    label,
    variant = 'outlined',
    error,
    helperText,
    leftIcon,
    rightIcon,
    onRightIconPress,
    disabled = false,
    containerStyle,
    value,
    onFocus,
    onBlur,
    ...rest
}) => {
    const colors = useColors();
    const inputRef = useRef<RNTextInput>(null);
    const [isFocused, setIsFocused] = useState(false);

    const labelPosition = useSharedValue(value ? 1 : 0);

    const hasValue = value && value.length > 0;
    const isActive = isFocused || hasValue;
    const hasError = !!error;

    // Update label position
    useEffect(() => {
        labelPosition.value = withTiming(isActive ? 1 : 0, { duration: 150 });
    }, [isActive, isFocused]);

    // Get colors based on state
    const getBorderColor = () => {
        if (hasError) return colors.error;
        if (isFocused) return colors.primary;
        return colors.outline;
    };

    const getLabelColor = () => {
        if (hasError) return colors.error;
        if (isFocused) return colors.primary;
        return colors.onSurfaceVariant;
    };

    // Animated label style
    const labelStyle = useAnimatedStyle(() => {
        const top = interpolate(labelPosition.value, [0, 1], [16, -8]);
        const fontSize = interpolate(labelPosition.value, [0, 1], [16, 12]);
        const left = interpolate(labelPosition.value, [0, 1], [leftIcon ? 48 : 16, 12]);

        return {
            position: 'absolute',
            top,
            left,
            fontSize,
            backgroundColor: labelPosition.value > 0.5
                ? (variant === 'filled' ? colors.surfaceContainerHighest : colors.background)
                : 'transparent',
            paddingHorizontal: labelPosition.value > 0.5 ? 4 : 0,
        };
    });

    // Container style
    const containerStyles: ViewStyle = {
        borderWidth: isFocused ? 2 : 1,
        borderColor: getBorderColor(),
        borderRadius: variant === 'filled' ? 4 : 8,
        borderTopLeftRadius: variant === 'filled' ? 4 : 8,
        borderTopRightRadius: variant === 'filled' ? 4 : 8,
        backgroundColor: variant === 'filled' ? colors.surfaceContainerHighest : 'transparent',
    };

    const handleFocus = (e: any) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    return (
        <View style={[styles.wrapper, containerStyle]}>
            <Pressable
                onPress={() => inputRef.current?.focus()}
                style={[styles.container, containerStyles, disabled && styles.disabled]}
            >
                {/* Left Icon */}
                {leftIcon && (
                    <View style={styles.leftIcon}>
                        <MaterialCommunityIcons
                            name={leftIcon}
                            size={24}
                            color={isFocused ? colors.primary : colors.onSurfaceVariant}
                        />
                    </View>
                )}

                {/* Input */}
                <AnimatedTextInput
                    ref={inputRef}
                    value={value}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    editable={!disabled}
                    placeholderTextColor={colors.onSurfaceVariant}
                    style={[
                        styles.input,
                        {
                            color: colors.onSurface,
                            paddingLeft: leftIcon ? 48 : 16,
                            paddingRight: rightIcon ? 48 : 16,
                        },
                    ]}
                    {...rest}
                />

                {/* Floating Label */}
                <Animated.Text
                    style={[
                        styles.label,
                        labelStyle,
                        { color: getLabelColor() },
                    ]}
                >
                    {label}
                </Animated.Text>

                {/* Right Icon */}
                {rightIcon && (
                    <Pressable
                        onPress={onRightIconPress}
                        style={styles.rightIcon}
                        hitSlop={8}
                    >
                        <MaterialCommunityIcons
                            name={rightIcon}
                            size={24}
                            color={colors.onSurfaceVariant}
                        />
                    </Pressable>
                )}
            </Pressable>

            {/* Helper/Error Text */}
            {(helperText || error) && (
                <BodySmall
                    color={hasError ? 'error' : 'muted'}
                    style={styles.helperText}
                >
                    {error || helperText}
                </BodySmall>
            )}
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        position: 'relative',
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 16,
    },
    label: {
        zIndex: 1,
    },
    leftIcon: {
        position: 'absolute',
        left: 12,
        zIndex: 1,
    },
    rightIcon: {
        position: 'absolute',
        right: 12,
        zIndex: 1,
    },
    helperText: {
        marginTop: 4,
        marginLeft: 16,
    },
    disabled: {
        opacity: 0.5,
    },
});

export default PremiumTextInput;
