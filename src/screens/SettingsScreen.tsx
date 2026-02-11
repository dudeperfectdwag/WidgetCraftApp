/**
 * WidgetCraft - Settings Screen
 * App settings with MD3 Glassmorphism Design
 * Uses Material You dynamic colors throughout
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { setHapticsEnabled, isHapticsEnabled } from '@utils/HapticService';
import { useColors, useTheme } from '@theme/index';
import {
    PremiumSwitch,
    PremiumDivider,
    HeadlineMedium,
    TitleMedium,
    TitleSmall,
    BodyMedium,
    BodySmall,
    LabelLarge,
    LabelSmall,
} from '@components/common';

// ============================================
// Glass Card Component
// ============================================

interface GlassCardProps {
    children: React.ReactNode;
    style?: object;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
    const { isDark } = useTheme();
    const colors = useColors();

    return (
        <View style={[
            styles.glassCard,
            {
                backgroundColor: isDark
                    ? colors.surfaceContainerHigh
                    : colors.surfaceContainerLowest,
            },
            style,
        ]}>
            {children}
        </View>
    );
};

// ============================================
// Settings Row Component
// ============================================

interface SettingsRowProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    iconBg: string;
    iconColor: string;
    title: string;
    description?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    showChevron?: boolean;
    onPress?: () => void;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
    icon,
    iconBg,
    iconColor,
    title,
    description,
    value,
    onValueChange,
    showChevron,
    onPress,
}) => {
    const colors = useColors();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const content = (
        <Animated.View style={[styles.settingsRow, animatedStyle]}>
            <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
                <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
            </View>
            <View style={styles.settingsContent}>
                <TitleSmall style={{ color: colors.onSurface }}>{title}</TitleSmall>
                {description && (
                    <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                        {description}
                    </BodySmall>
                )}
            </View>
            {value !== undefined && onValueChange && (
                <PremiumSwitch value={value} onValueChange={onValueChange} />
            )}
            {showChevron && (
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
            )}
        </Animated.View>
    );

    if (onPress || showChevron) {
        return (
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress?.();
                }}
                onPressIn={() => { scale.value = withTiming(0.98, { duration: 60 }); }}
                onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
            >
                {content}
            </Pressable>
        );
    }

    return content;
};

// ============================================
// Color Selection Component
// ============================================

interface ColorPickerProps {
    colors: string[];
    selectedColor: string;
    onSelectColor: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ colors: colorOptions, selectedColor, onSelectColor }) => {
    const themeColors = useColors();

    return (
        <View style={styles.colorPicker}>
            {colorOptions.map((color) => (
                <Pressable
                    key={color}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onSelectColor(color);
                    }}
                >
                    <View
                        style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            selectedColor === color && [
                                styles.colorOptionSelected,
                                { borderColor: themeColors.onSurface }
                            ],
                        ]}
                    >
                        {selectedColor === color && (
                            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                        )}
                    </View>
                </Pressable>
            ))}
        </View>
    );
};

// ============================================
// Main Settings Screen
// ============================================

export const SettingsScreen: React.FC = () => {
    const colors = useColors();
    const { isDark, toggleTheme, setSeedColor, useDynamicColors, setUseDynamicColors, seedColor } = useTheme();
    const insets = useSafeAreaInsets();

    const [notifications, setNotifications] = useState(true);
    const [haptics, setHaptics] = useState(isHapticsEnabled());

    const handleHapticsToggle = (value: boolean) => {
        setHaptics(value);
        setHapticsEnabled(value);
    };

    const colorOptions = [
        '#6750A4', // Purple (default)
        '#0061A4', // Blue
        '#386A20', // Green
        '#904D00', // Orange
        '#BA1A1A', // Red
        '#006A60', // Teal
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <HeadlineMedium style={{ color: colors.onSurface }}>Settings</HeadlineMedium>
                    <BodyMedium style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
                        Customize your experience
                    </BodyMedium>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <LabelSmall style={[styles.sectionLabel, { color: colors.primary }]}>
                        APPEARANCE
                    </LabelSmall>
                    <GlassCard style={styles.sectionCard}>
                        <SettingsRow
                            icon="theme-light-dark"
                            iconBg={colors.primaryContainer}
                            iconColor={colors.onPrimaryContainer}
                            title="Dark Mode"
                            description="Use dark color scheme"
                            value={isDark}
                            onValueChange={toggleTheme}
                        />
                        <PremiumDivider spacing={8} inset="left" />
                        <SettingsRow
                            icon="palette-swatch-variant"
                            iconBg={colors.secondaryContainer}
                            iconColor={colors.onSecondaryContainer}
                            title="Dynamic Colors"
                            description="Use colors from your wallpaper"
                            value={useDynamicColors}
                            onValueChange={setUseDynamicColors}
                        />
                        <PremiumDivider spacing={8} inset="left" />
                        <View style={styles.settingsRow}>
                            <View style={[styles.settingsIcon, { backgroundColor: colors.tertiaryContainer }]}>
                                <MaterialCommunityIcons name="palette" size={20} color={colors.onTertiaryContainer} />
                            </View>
                            <View style={styles.settingsContent}>
                                <TitleSmall style={{ color: colors.onSurface }}>Theme Color</TitleSmall>
                                <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                                    {useDynamicColors ? 'Tap to override' : 'Choose your accent color'}
                                </BodySmall>
                                <ColorPicker
                                    colors={colorOptions}
                                    selectedColor={seedColor}
                                    onSelectColor={(color) => {
                                        setSeedColor(color);
                                        setUseDynamicColors(false);
                                    }}
                                />
                            </View>
                        </View>
                    </GlassCard>
                </View>

                {/* General Section */}
                <View style={styles.section}>
                    <LabelSmall style={[styles.sectionLabel, { color: colors.primary }]}>
                        GENERAL
                    </LabelSmall>
                    <GlassCard style={styles.sectionCard}>
                        <SettingsRow
                            icon="bell-outline"
                            iconBg={colors.primaryContainer}
                            iconColor={colors.onPrimaryContainer}
                            title="Notifications"
                            description="Receive update alerts"
                            value={notifications}
                            onValueChange={setNotifications}
                        />
                        <PremiumDivider spacing={8} inset="left" />
                        <SettingsRow
                            icon="vibrate"
                            iconBg={colors.secondaryContainer}
                            iconColor={colors.onSecondaryContainer}
                            title="Haptic Feedback"
                            description="Vibration on interactions"
                            value={haptics}
                            onValueChange={handleHapticsToggle}
                        />
                    </GlassCard>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <LabelSmall style={[styles.sectionLabel, { color: colors.primary }]}>
                        ABOUT
                    </LabelSmall>
                    <GlassCard style={styles.sectionCard}>
                        <SettingsRow
                            icon="information-outline"
                            iconBg={colors.surfaceContainerHighest}
                            iconColor={colors.onSurfaceVariant}
                            title="Version"
                            description="1.0.0"
                        />
                        <PremiumDivider spacing={8} inset="left" />
                        <SettingsRow
                            icon="help-circle-outline"
                            iconBg={colors.surfaceContainerHighest}
                            iconColor={colors.onSurfaceVariant}
                            title="Help & Feedback"
                            showChevron
                            onPress={() => { }}
                        />
                    </GlassCard>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionLabel: {
        paddingHorizontal: 24,
        marginBottom: 12,
        letterSpacing: 1,
        fontWeight: '600',
    },
    glassCard: {
        marginHorizontal: 16,
        borderRadius: 24,
        overflow: 'hidden',
    },
    sectionCard: {
        padding: 8,
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    settingsIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingsContent: {
        flex: 1,
    },
    colorPicker: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    colorOption: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorOptionSelected: {
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
});

export default SettingsScreen;