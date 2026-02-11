/**
 * WidgetCraft - Custom Bottom Tab Bar
 * Material Design 3 with proper contrast and dynamic colors
 */

import React from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useTheme } from '@theme/index';
import { LabelSmall } from '@components/common';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Tab Icon Configuration
// ============================================

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface TabConfig {
    icon: IconName;
    iconFocused: IconName;
    label: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
    HomeTab: {
        icon: 'home-outline',
        iconFocused: 'home',
        label: 'Home',
    },
    TemplatesTab: {
        icon: 'view-grid-outline',
        iconFocused: 'view-grid',
        label: 'Templates',
    },
    CreateTab: {
        icon: 'plus-circle-outline',
        iconFocused: 'plus-circle',
        label: 'Create',
    },
    LibraryTab: {
        icon: 'folder-outline',
        iconFocused: 'folder',
        label: 'Library',
    },
    SettingsTab: {
        icon: 'cog-outline',
        iconFocused: 'cog',
        label: 'Settings',
    },
};

// ============================================
// Tab Item Component
// ============================================

interface TabItemProps {
    routeName: string;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
}

const TabItem: React.FC<TabItemProps> = ({
    routeName,
    isFocused,
    onPress,
    onLongPress,
}) => {
    const colors = useColors();
    const config = TAB_CONFIG[routeName];

    const scale = useSharedValue(1);
    const indicatorWidth = useSharedValue(isFocused ? 1 : 0);

    React.useEffect(() => {
        indicatorWidth.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    }, [isFocused]);

    const handlePressIn = () => {
        scale.value = withTiming(0.9, { duration: 60 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const indicatorStyle = useAnimatedStyle(() => ({
        width: interpolate(indicatorWidth.value, [0, 1], [0, 56]),
        opacity: indicatorWidth.value,
    }));

    const iconStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: interpolate(indicatorWidth.value, [0, 1], [1, 1.15]) },
        ],
    }));

    if (!config) return null;

    return (
        <Pressable
            onPress={handlePress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.tabItem}
        >
            <Animated.View style={[styles.tabContent, containerStyle]}>
                {/* Active Indicator Pill - Primary Container */}
                <Animated.View
                    style={[
                        styles.indicator,
                        { backgroundColor: colors.primaryContainer },
                        indicatorStyle,
                    ]}
                />

                {/* Icon - High contrast colors */}
                <Animated.View style={iconStyle}>
                    <MaterialCommunityIcons
                        name={isFocused ? config.iconFocused : config.icon}
                        size={24}
                        color={isFocused ? colors.onPrimaryContainer : colors.onSurface}
                    />
                </Animated.View>

                {/* Label */}
                <LabelSmall
                    style={[
                        styles.label,
                        {
                            color: isFocused ? colors.onPrimaryContainer : colors.onSurface,
                            fontWeight: isFocused ? '600' : '400',
                        }
                    ]}
                >
                    {config.label}
                </LabelSmall>
            </Animated.View>
        </Pressable>
    );
};

// ============================================
// Custom Tab Bar Component
// ============================================

export const CustomTabBar: React.FC<BottomTabBarProps> = ({
    state,
    descriptors,
    navigation,
}) => {
    const colors = useColors();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();

    return (
        <View
            style={[
                styles.container,
                {
                    paddingBottom: insets.bottom,
                    backgroundColor: colors.surface,
                    borderTopColor: colors.outlineVariant,
                },
            ]}
        >
            <View style={styles.tabsContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    return (
                        <TabItem
                            key={route.key}
                            routeName={route.name}
                            isFocused={isFocused}
                            onPress={onPress}
                            onLongPress={onLongPress}
                        />
                    );
                })}
            </View>
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    container: {
        borderTopWidth: StyleSheet.hairlineWidth,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 8,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingTop: 8,
        paddingHorizontal: 8,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
    },
    tabContent: {
        alignItems: 'center',
        paddingVertical: 6,
    },
    indicator: {
        position: 'absolute',
        top: 0,
        height: 32,
        borderRadius: 16,
    },
    label: {
        marginTop: 4,
        fontSize: 11,
    },
});

export default CustomTabBar;
