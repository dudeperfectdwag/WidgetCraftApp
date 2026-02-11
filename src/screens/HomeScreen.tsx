/**
 * WidgetCraft - Premium Home Screen
 * Material Design 3 with Glassmorphism and Parallax Effects
 * Dynamic colors throughout with proper contrast
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    withTiming,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import { useColors, useTheme } from '@theme/index';
import {
    PremiumButton,
    PremiumChip,
    PremiumIconButton,
    TitleLarge,
    TitleMedium,
    TitleSmall,
    HeadlineLarge,
    HeadlineMedium,
    HeadlineSmall,
    BodyLarge,
    BodyMedium,
    BodySmall,
    LabelLarge,
    LabelMedium,
    LabelSmall,
} from '@components/common';
import { getWidgetList, WidgetMetadata, saveWidget } from '@services/WidgetStorage';
import { getTrendingWidgets, downloadCommunityWidget, CommunityWidget } from '@services/CommunityService';
import WidgetPreview from '@components/common/WidgetPreview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = 320;

// ============================================
// Glass Card Component
// ============================================

interface GlassCardProps {
    children: React.ReactNode;
    style?: object;
    color?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style, color }) => {
    const { isDark } = useTheme();
    const colors = useColors();

    return (
        <View style={[
            styles.glassCard,
            {
                backgroundColor: color || (isDark
                    ? colors.surfaceContainerHigh
                    : colors.surfaceContainerLowest),
            },
            style,
        ]}>
            {children}
        </View>
    );
};

// ============================================
// Stat Pill Component
// ============================================

interface StatPillProps {
    value: string;
    label: string;
    color: string;
}

const StatPill: React.FC<StatPillProps> = ({ value, label, color }) => {
    const colors = useColors();
    const { isDark } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPressIn={() => { scale.value = withTiming(0.95, { duration: 60 }); }}
            onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
        >
            <Animated.View style={[
                styles.statPill,
                {
                    backgroundColor: isDark ? color + '20' : color + '15',
                    borderColor: color + '30',
                },
                animatedStyle,
            ]}>
                <HeadlineSmall style={{ color: color }}>{value}</HeadlineSmall>
                <LabelSmall
                    style={{
                        color: colors.onSurface,
                        opacity: 0.7,
                        textAlign: 'center',
                        width: '100%',
                        fontSize: 10,
                        lineHeight: 12,
                        letterSpacing: 0,
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                >
                    {label}
                </LabelSmall>
            </Animated.View>
        </Pressable>
    );
};

// ============================================
// Quick Action Card
// ============================================

interface QuickActionProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    bgColor: string;
    iconColor: string;
    onPress: () => void;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ icon, label, bgColor, iconColor, onPress }) => {
    const colors = useColors();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
            onPressIn={() => { scale.value = withTiming(0.92, { duration: 60 }); }}
            onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
            style={styles.quickActionWrapper}
        >
            <Animated.View style={[styles.quickActionCard, animatedStyle]}>
                <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
                    <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
                </View>
                <LabelMedium style={{ color: colors.onSurface, marginTop: 8 }}>{label}</LabelMedium>
            </Animated.View>
        </Pressable>
    );
};

// ============================================
// Widget Preview Card
// ============================================

// Get icon based on widget name
// Format relative time
const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
};

interface WidgetPreviewCardProps {
    widget: WidgetMetadata;
    color: string;
    onPress: () => void;
}

const WidgetPreviewCard: React.FC<WidgetPreviewCardProps> = ({ widget, color, onPress }) => {
    const colors = useColors();
    const { isDark } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPressIn={() => { scale.value = withTiming(0.95, { duration: 60 }); }}
            onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
        >
            <Animated.View style={animatedStyle}>
                <View style={[
                    styles.widgetCard,
                    {
                        backgroundColor: isDark
                            ? colors.surfaceContainerHigh
                            : colors.surfaceContainerLowest,
                        borderColor: isDark
                            ? colors.outlineVariant
                            : 'rgba(0,0,0,0.05)',
                    }
                ]}>
                    <View style={[styles.widgetPreview, { backgroundColor: color + '20' }]}>
                        <WidgetPreview
                            thumbnail={widget.thumbnail}
                            width={106}
                            height={56}
                            fallbackColor={color}
                            style={{ borderRadius: 10 }}
                        />
                    </View>
                    <TitleSmall style={{ color: colors.onSurface }} numberOfLines={1}>{widget.name}</TitleSmall>
                    <LabelSmall style={{ color: colors.onSurfaceVariant }}>{formatRelativeTime(widget.updatedAt)}</LabelSmall>
                </View>
            </Animated.View>
        </Pressable>
    );
};

// ============================================
// Main Home Screen Component
// ============================================

export const HomeScreen: React.FC = () => {
    const colors = useColors();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const scrollY = useSharedValue(0);
    const [widgets, setWidgets] = useState<WidgetMetadata[]>([]);

    // Community state
    const [communityPicks, setCommunityPicks] = useState<CommunityWidget[]>([]);
    const [communityLoading, setCommunityLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
    const [refreshing, setRefreshing] = useState(false);

    // Load widgets from storage
    const loadWidgets = useCallback(async () => {
        try {
            const widgetList = await getWidgetList();
            setWidgets(widgetList);
        } catch (error) {
            console.error('Error loading widgets:', error);
        }
    }, []);

    // Load on mount
    useEffect(() => {
        loadWidgets();
        loadCommunityPicks();
    }, [loadWidgets]);

    const loadCommunityPicks = async () => {
        setCommunityLoading(true);
        try {
            const results = await getTrendingWidgets(6);
            setCommunityPicks(results.filter(cw => !!cw.thumbnailUrl));
        } catch (error) {
            console.error('Error loading community picks:', error);
        } finally {
            setCommunityLoading(false);
        }
    };

    const handleCommunityDownload = async (cw: CommunityWidget) => {
        if (downloadingId) return;
        // If already downloaded, just mark and navigate
        if (downloadedIds.has(cw.id)) return;
        setDownloadingId(cw.id);
        try {
            const widgetData = await downloadCommunityWidget(cw.id);
            const saved = await saveWidget({ ...widgetData, id: undefined, name: cw.name } as any);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setDownloadedIds(prev => new Set(prev).add(cw.id));
            loadWidgets();
            // Navigate to editor with the newly saved widget
            navigation.navigate('Editor', { widgetId: saved.id });
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setDownloadingId(null);
        }
    };

    // Pull to refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await Promise.all([loadWidgets(), loadCommunityPicks()]);
        setRefreshing(false);
    }, [loadWidgets]);

    // Reload when screen is focused
    useFocusEffect(
        useCallback(() => {
            loadWidgets();
        }, [loadWidgets])
    );

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Hero parallax effect
    const heroStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [-100, 0, HERO_HEIGHT],
            [-50, 0, HERO_HEIGHT * 0.4],
            Extrapolation.CLAMP
        );
        const scale = interpolate(
            scrollY.value,
            [-100, 0],
            [1.15, 1],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            scrollY.value,
            [0, HERO_HEIGHT * 0.6],
            [1, 0],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateY }, { scale }],
            opacity,
        };
    });

    // Floating header
    const headerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [HERO_HEIGHT * 0.4, HERO_HEIGHT * 0.7],
            [0, 1],
            Extrapolation.CLAMP
        );
        const translateY = interpolate(
            scrollY.value,
            [HERO_HEIGHT * 0.4, HERO_HEIGHT * 0.7],
            [-20, 0],
            Extrapolation.CLAMP
        );

        return { opacity, transform: [{ translateY }] };
    });

    // Stats parallax
    const statsStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            scrollY.value,
            [0, 200],
            [0, -30],
            Extrapolation.CLAMP
        );

        return { transform: [{ translateY }] };
    });

    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Get recent widgets (last 4, sorted by updated time) — only those with thumbnails
    const recentWidgets = widgets
        .filter(w => !!w.thumbnail)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 4);

    // Stats calculations
    const totalWidgets = widgets.length;
    const totalElements = widgets.reduce((sum, w) => sum + w.elementCount, 0);

    // Card colors
    const cardColors = [colors.primary, colors.secondary, colors.tertiary];

    // Navigation handlers
    const handleCreateNew = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('Editor');
    };

    const handleOpenLibrary = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('MainTabs', { screen: 'LibraryTab' });
    };

    const handleOpenTemplates = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('MainTabs', { screen: 'TemplatesTab' });
    };

    const handleOpenSettings = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('MainTabs', { screen: 'SettingsTab' });
    };

    const handleWidgetPress = (widget: WidgetMetadata) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('Editor', { widgetId: widget.id });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Floating Header */}
            <Animated.View
                style={[
                    styles.floatingHeader,
                    {
                        paddingTop: insets.top,
                        backgroundColor: colors.surface,
                        borderBottomColor: colors.outlineVariant,
                    },
                    headerStyle,
                ]}
            >
                <TitleLarge style={{ color: colors.onSurface }}>WidgetCraft</TitleLarge>
                <PremiumIconButton icon="bell-outline" variant="standard" onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }} />
            </Animated.View>

            <Animated.ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                        progressBackgroundColor={colors.surfaceContainerHigh}
                        progressViewOffset={HERO_HEIGHT / 2}
                    />
                }
            >
                {/* Hero Section with Parallax */}
                <Animated.View style={[styles.heroSection, heroStyle]}>
                    <View style={[
                        styles.heroBg,
                        {
                            backgroundColor: colors.primaryContainer,
                            paddingTop: insets.top + 16,
                        }
                    ]}>
                        {/* Decorative elements */}
                        <View style={[styles.heroDecor1, { backgroundColor: colors.primary + '20' }]} />
                        <View style={[styles.heroDecor2, { backgroundColor: colors.secondary + '15' }]} />

                        {/* Header */}
                        <View style={styles.heroHeader}>
                            <View>
                                <BodyLarge style={{ color: colors.onPrimaryContainer, opacity: 0.8 }}>
                                    {getGreeting()},
                                </BodyLarge>
                                <HeadlineLarge style={{ color: colors.onPrimaryContainer }}>
                                    Designer
                                </HeadlineLarge>
                            </View>
                            <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                                <MaterialCommunityIcons name="account" size={28} color={colors.onPrimary} />
                            </View>
                        </View>

                        {/* Stats Row with parallax */}
                        <Animated.View style={[styles.statsRow, statsStyle]}>
                            <StatPill value={totalWidgets.toString()} label="Widgets" color={colors.primary} />
                            <StatPill value={totalElements.toString()} label="Elements" color={colors.tertiary} />
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* Quick Actions Grid */}
                <View style={styles.quickActionsSection}>
                    <GlassCard style={styles.quickActionsCard}>
                        <View style={styles.quickActionsGrid}>
                            <QuickActionCard
                                icon="plus-circle"
                                label="New"
                                bgColor={colors.primaryContainer}
                                iconColor={colors.primary}
                                onPress={handleCreateNew}
                            />
                            <QuickActionCard
                                icon="folder-open"
                                label="Library"
                                bgColor={colors.secondaryContainer}
                                iconColor={colors.secondary}
                                onPress={handleOpenLibrary}
                            />
                            <QuickActionCard
                                icon="view-grid"
                                label="Templates"
                                bgColor={colors.tertiaryContainer}
                                iconColor={colors.tertiary}
                                onPress={handleOpenTemplates}
                            />
                            <QuickActionCard
                                icon="cog"
                                label="Settings"
                                bgColor={colors.surfaceContainerHighest}
                                iconColor={colors.onSurfaceVariant}
                                onPress={handleOpenSettings}
                            />
                        </View>
                    </GlassCard>
                </View>

                {/* Community Picks */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <TitleLarge style={{ color: colors.onSurface }}>Community Picks</TitleLarge>
                        <PremiumButton variant="text" label="Browse" onPress={() => navigation.navigate('Search')} size="small" />
                    </View>
                    {communityLoading ? (
                        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                            <ActivityIndicator size="small" color={colors.primary} />
                            <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>Loading community widgets...</BodySmall>
                        </View>
                    ) : communityPicks.length > 0 ? (
                        <Animated.ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.featuredScroll}
                            decelerationRate="fast"
                            snapToInterval={SCREEN_WIDTH * 0.6 + 12}
                        >
                            {communityPicks.map((cw, index) => {
                                const catColor = [colors.primary, colors.secondary, colors.tertiary][index % 3];
                                const isDownloading = downloadingId === cw.id;
                                const isDownloaded = downloadedIds.has(cw.id);
                                return (
                                    <Pressable
                                        key={cw.id}
                                        onPress={() => handleCommunityDownload(cw)}
                                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                                    >
                                        <GlassCard style={styles.communityCard}>
                                            {/* Widget Preview Area */}
                                            <View style={[styles.communityPreview, { backgroundColor: catColor + '18' }]}>
                                                <WidgetPreview
                                                    thumbnail={cw.thumbnailUrl}
                                                    width={SCREEN_WIDTH * 0.6 - 32}
                                                    height={98}
                                                    fallbackColor={catColor}
                                                    style={{ borderRadius: 12 }}
                                                />
                                                <View style={[styles.previewSizeBadge, { backgroundColor: catColor + '15' }]}>
                                                    <LabelSmall style={{ color: catColor, fontSize: 9 }}>
                                                        {cw.width}×{cw.height}
                                                    </LabelSmall>
                                                </View>
                                            </View>

                                            {/* Card Info */}
                                            <View style={styles.communityCardInfo}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <View style={[styles.communityCatDot, { backgroundColor: catColor }]} />
                                                    <LabelSmall style={{ color: colors.onSurfaceVariant }}>{cw.category}</LabelSmall>
                                                </View>
                                                <TitleSmall numberOfLines={1} style={{ color: colors.onSurface, marginTop: 6 }}>
                                                    {cw.name}
                                                </TitleSmall>
                                                <LabelSmall numberOfLines={1} style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                                                    by {cw.authorName}
                                                </LabelSmall>
                                                <View style={styles.communityCardFooter}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                        <MaterialCommunityIcons name="layers-outline" size={12} color={colors.onSurfaceVariant} />
                                                        <LabelSmall style={{ color: colors.onSurfaceVariant }}>{cw.elementCount}</LabelSmall>
                                                    </View>
                                                    {isDownloading ? (
                                                        <ActivityIndicator size="small" color={colors.primary} />
                                                    ) : isDownloaded ? (
                                                        <View style={[styles.communityBadge, { backgroundColor: colors.primaryContainer }]}>
                                                            <MaterialCommunityIcons name="check" size={12} color={colors.onPrimaryContainer} />
                                                        </View>
                                                    ) : (
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                                            <MaterialCommunityIcons name="download-outline" size={13} color={colors.onSurfaceVariant} />
                                                            <LabelSmall style={{ color: colors.onSurfaceVariant }}>
                                                                {cw.downloads.toLocaleString()}
                                                            </LabelSmall>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        </GlassCard>
                                    </Pressable>
                                );
                            })}
                        </Animated.ScrollView>
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 }}>
                            <MaterialCommunityIcons name="earth" size={32} color={colors.onSurfaceVariant} />
                            <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                                No community widgets yet. Share yours from the Library!
                            </BodySmall>
                        </View>
                    )}
                </View>

                {/* Recent Widgets */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <TitleMedium style={{ color: colors.onSurface }}>Recent Widgets</TitleMedium>
                        <PremiumButton variant="text" label="See all" onPress={handleOpenLibrary} size="small" />
                    </View>
                    {recentWidgets.length > 0 ? (
                        <Animated.ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.horizontalScroll}
                        >
                            {recentWidgets.map((widget, index) => (
                                <WidgetPreviewCard 
                                    key={widget.id} 
                                    widget={widget}
                                    color={cardColors[index % cardColors.length]}
                                    onPress={() => handleWidgetPress(widget)}
                                />
                            ))}
                        </Animated.ScrollView>
                    ) : (
                        <View style={styles.emptyRecent}>
                            <MaterialCommunityIcons name="widgets-outline" size={32} color={colors.onSurfaceVariant} />
                            <BodyMedium style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
                                No widgets yet
                            </BodyMedium>
                            <Pressable 
                                style={[styles.createFirstButton, { backgroundColor: colors.primaryContainer }]}
                                onPress={handleCreateNew}
                            >
                                <LabelMedium style={{ color: colors.onPrimaryContainer }}>Create your first widget</LabelMedium>
                            </Pressable>
                        </View>
                    )}
                </View>

                {/* Coming Soon */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <TitleMedium style={{ color: colors.onSurface }}>Coming Soon</TitleMedium>
                        <PremiumButton variant="text" label="See all" onPress={handleOpenTemplates} size="small" />
                    </View>
                    <Animated.ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.featuredScroll}
                        decelerationRate="fast"
                        snapToInterval={SCREEN_WIDTH - 48}
                    >
                        {[
                            { name: 'Weather Pro', description: 'Live weather with animations', bgColor: colors.primary, icon: 'weather-partly-cloudy' as keyof typeof MaterialCommunityIcons.glyphMap },
                            { name: 'Digital Wellbeing', description: 'Screen time and focus insights', bgColor: colors.secondary, icon: 'chart-timeline-variant' as keyof typeof MaterialCommunityIcons.glyphMap },
                            { name: 'Health Stats', description: 'Track your daily activity', bgColor: colors.tertiary, icon: 'heart-pulse' as keyof typeof MaterialCommunityIcons.glyphMap },
                        ].map((item, index) => (
                            <Pressable
                                key={index}
                                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                            >
                                <View style={[styles.featuredCard]}>
                                    <View style={[styles.featuredCardBg, { backgroundColor: item.bgColor }]}>
                                        <View style={styles.featuredOverlay} />
                                        <View style={[styles.decorCircle, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                                        <View style={styles.featuredContent}>
                                            <View style={styles.featuredIcon}>
                                                <MaterialCommunityIcons name={item.icon} size={28} color="#FFFFFF" />
                                            </View>
                                            <View style={styles.featuredText}>
                                                <TitleLarge style={{ color: '#FFFFFF' }}>{item.name}</TitleLarge>
                                                <BodyMedium style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                                                    {item.description}
                                                </BodyMedium>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </Pressable>
                        ))}
                    </Animated.ScrollView>
                </View>

                {/* Bottom spacing */}
                <View style={{ height: 120 }} />
            </Animated.ScrollView>
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
    floatingHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 12,
        zIndex: 100,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    heroSection: {
        overflow: 'hidden',
    },
    heroBg: {
        paddingHorizontal: 24,
        paddingBottom: 80,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: 'hidden',
    },
    heroDecor1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: 100,
    },
    heroDecor2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statPill: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    glassCard: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    quickActionsSection: {
        paddingHorizontal: 24,
        marginTop: -40,
        marginBottom: 8,
    },
    quickActionsCard: {
        padding: 20,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickActionWrapper: {
        flex: 1,
    },
    quickActionCard: {
        alignItems: 'center',
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    section: {
        marginTop: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    featuredScroll: {
        paddingHorizontal: 24,
        gap: 12,
    },
    featuredCard: {
        width: SCREEN_WIDTH - 72,
        borderRadius: 24,
        overflow: 'hidden',
    },
    featuredCardBg: {
        padding: 20,
        minHeight: 140,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    decorCircle: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: 70,
    },
    featuredContent: {
        flexDirection: 'row',
        gap: 16,
    },
    featuredIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featuredText: {
        flex: 1,
    },
    // Community preview cards
    communityCard: {
        width: SCREEN_WIDTH * 0.6,
        borderRadius: 20,
        overflow: 'hidden',
    },
    communityPreview: {
        height: 130,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16,
        position: 'relative',
    },
    previewSizeBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
    },
    communityCardInfo: {
        padding: 12,
    },
    communityCatDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    communityCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    communityBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4ADE80',
    },
    horizontalScroll: {
        paddingHorizontal: 24,
        gap: 12,
    },
    widgetCard: {
        width: 130,
        padding: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    widgetPreview: {
        width: '100%',
        height: 70,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    widgetShape: {
        width: 36,
        height: 36,
        borderRadius: 10,
    },
    chipsScroll: {
        paddingHorizontal: 24,
        gap: 8,
    },
    emptyRecent: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    createFirstButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
});

export default HomeScreen;
