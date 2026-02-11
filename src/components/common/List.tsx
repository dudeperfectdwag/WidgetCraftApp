/**
 * WidgetCraft - Material Design 3 List Components
 * List, ListItem with support for icons, images, and leading/trailing content
 */

import React from 'react';
import { View, StyleSheet, Pressable, Image, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors, useTheme } from '@theme/index';
import { BodyMedium, BodySmall, LabelSmall } from './Typography';

// ============================================
// List Container
// ============================================

interface ListProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const List: React.FC<ListProps> = ({ children, style }) => {
    const colors = useColors();

    return (
        <View style={[styles.list, { backgroundColor: colors.surface }, style]}>
            {children}
        </View>
    );
};

// ============================================
// List Divider
// ============================================

interface ListDividerProps {
    inset?: boolean;
}

export const ListDivider: React.FC<ListDividerProps> = ({ inset = false }) => {
    const colors = useColors();

    return (
        <View
            style={[
                styles.divider,
                {
                    backgroundColor: colors.outlineVariant,
                    marginLeft: inset ? 56 : 0,
                },
            ]}
        />
    );
};

// ============================================
// List Item
// ============================================

interface ListItemProps {
    /** Main text */
    headline: string;
    /** Secondary text */
    supportingText?: string;
    /** Trailing secondary text (e.g., count, status) */
    trailingSupportingText?: string;
    /** Item type: text (default), button, or link */
    type?: 'text' | 'button' | 'link';
    /** Disabled state */
    disabled?: boolean;
    /** Icon name for start slot */
    leadingIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    /** Custom color for leading icon */
    leadingIconColor?: string;
    /** Image URI for start slot */
    leadingImage?: string;
    /** Avatar text (will show first letter in circle) */
    leadingAvatar?: string;
    /** Avatar background color */
    leadingAvatarColor?: string;
    /** Icon name for end slot */
    trailingIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
    /** Custom color for trailing icon */
    trailingIconColor?: string;
    /** Custom start content */
    startContent?: React.ReactNode;
    /** Custom end content */
    endContent?: React.ReactNode;
    /** Press handler */
    onPress?: () => void;
    /** Multi-line supporting text */
    multiLine?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
    headline,
    supportingText,
    trailingSupportingText,
    type = 'text',
    disabled = false,
    leadingIcon,
    leadingIconColor,
    leadingImage,
    leadingAvatar,
    leadingAvatarColor,
    trailingIcon,
    trailingIconColor,
    startContent,
    endContent,
    onPress,
    multiLine = false,
}) => {
    const colors = useColors();
    const { isDark } = useTheme();
    const opacity = useSharedValue(1);

    const isInteractive = type === 'button' || type === 'link' || !!onPress;

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const handlePressIn = () => {
        if (isInteractive && !disabled) {
            opacity.value = withTiming(0.7, { duration: 100 });
        }
    };

    const handlePressOut = () => {
        opacity.value = withTiming(1, { duration: 200 });
    };

    const handlePress = () => {
        if (isInteractive && !disabled && onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }
    };

    const renderLeading = () => {
        if (startContent) return startContent;

        if (leadingAvatar) {
            const avatarBg = leadingAvatarColor || colors.primaryContainer;
            return (
                <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                    <BodyMedium style={{ color: colors.onPrimaryContainer, fontWeight: '600' }}>
                        {leadingAvatar.charAt(0).toUpperCase()}
                    </BodyMedium>
                </View>
            );
        }

        if (leadingImage) {
            return (
                <Image
                    source={{ uri: leadingImage }}
                    style={styles.leadingImage}
                    resizeMode="cover"
                />
            );
        }

        if (leadingIcon) {
            return (
                <MaterialCommunityIcons
                    name={leadingIcon}
                    size={24}
                    color={leadingIconColor || colors.onSurfaceVariant}
                />
            );
        }

        return null;
    };

    const renderTrailing = () => {
        if (endContent) return endContent;

        const elements: React.ReactNode[] = [];

        if (trailingSupportingText) {
            elements.push(
                <LabelSmall
                    key="trailing-text"
                    style={{ color: colors.onSurfaceVariant }}
                >
                    {trailingSupportingText}
                </LabelSmall>
            );
        }

        if (trailingIcon) {
            elements.push(
                <MaterialCommunityIcons
                    key="trailing-icon"
                    name={trailingIcon}
                    size={24}
                    color={trailingIconColor || colors.onSurfaceVariant}
                />
            );
        }

        if (elements.length === 0) return null;

        return <View style={styles.trailingContainer}>{elements}</View>;
    };

    const leading = renderLeading();
    const trailing = renderTrailing();

    const content = (
        <Animated.View
            style={[
                styles.listItem,
                {
                    opacity: disabled ? 0.38 : 1,
                    minHeight: supportingText && multiLine ? 72 : supportingText ? 56 : 48,
                },
                animatedStyle,
            ]}
        >
            {/* Leading Content */}
            {leading && <View style={styles.leadingContainer}>{leading}</View>}

            {/* Text Content */}
            <View style={styles.textContainer}>
                <BodyMedium
                    style={{ color: colors.onSurface }}
                    numberOfLines={1}
                >
                    {headline}
                </BodyMedium>
                {supportingText && (
                    <BodySmall
                        style={{ color: colors.onSurfaceVariant, marginTop: 2 }}
                        numberOfLines={multiLine ? 2 : 1}
                    >
                        {supportingText}
                    </BodySmall>
                )}
            </View>

            {/* Trailing Content */}
            {trailing}
        </Animated.View>
    );

    if (isInteractive && !disabled) {
        return (
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={({ pressed }) => [
                    styles.pressable,
                    pressed && { backgroundColor: colors.surfaceContainerHigh },
                ]}
            >
                {content}
            </Pressable>
        );
    }

    return content;
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    list: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    divider: {
        height: 1,
    },
    pressable: {
        // Empty, just for structure
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    leadingContainer: {
        marginRight: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    leadingImage: {
        width: 56,
        height: 56,
        borderRadius: 0,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    trailingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 16,
    },
});

export default { List, ListItem, ListDivider };
