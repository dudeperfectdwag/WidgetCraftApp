/**
 * WidgetCraft - Search & Discovery Screen
 * Material Design 3 Expressive with:
 * - Animated expandable search bar
 * - Category filter chips
 * - Voice search capability
 * - Recent searches with delete
 * - Trending/popular items
\ */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TextInput,
    Pressable,
    ScrollView,
    Keyboard,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    Easing,
    FadeInDown,
    FadeOutUp,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import { useColors, useTheme } from '@theme/index';
import {
    PremiumCard,
    PremiumChip,
    PremiumIconButton,
    TitleLarge,
    TitleMedium,
    TitleSmall,
    BodyMedium,
    BodySmall,
    LabelMedium,
    LabelSmall,
} from '@components/common';
import {
    browseCommunityWidgets,
    getTrendingWidgets,
    downloadCommunityWidget,
    CommunityWidget,
    COMMUNITY_CATEGORIES,
} from '@services/CommunityService';
import { saveWidget } from '@services/WidgetStorage';
import { useNavigation } from '@react-navigation/native';
import WidgetPreview from '@components/common/WidgetPreview';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Animated Search Bar
// ============================================

interface AnimatedSearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onSubmit?: () => void;
}

const AnimatedSearchBar: React.FC<AnimatedSearchBarProps> = ({
    value,
    onChangeText,
    onFocus,
    onBlur,
    onSubmit,
}) => {
    const colors = useColors();
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const containerWidth = useSharedValue(SCREEN_WIDTH - 48);
    const iconScale = useSharedValue(1);

    const handleFocus = () => {
        setIsFocused(true);
        iconScale.value = withTiming(0.9, { duration: 100 });
        containerWidth.value = withTiming(SCREEN_WIDTH - 48, { duration: 200 });
        onFocus?.();
    };
    const handleBlur = () => {
        setIsFocused(false);
        iconScale.value = withTiming(1, { duration: 100 });
        onBlur?.();
    };

    const animatedContainerStyle = useAnimatedStyle(() => ({
        width: containerWidth.value,
    }));

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    return (
        <Animated.View style={[styles.searchContainer, animatedContainerStyle]}>
            <View
                style={[
                    styles.searchBar,
                    {
                        backgroundColor: colors.surfaceContainerHigh,
                        borderColor: isFocused ? colors.primary : 'transparent',
                    },
                ]}
            >
                <Animated.View style={animatedIconStyle}>
                    <MaterialCommunityIcons
                        name="magnify"
                        size={24}
                        color={isFocused ? colors.primary : colors.onSurfaceVariant}
                    />
                </Animated.View>
                <TextInput
                    ref={inputRef}
                    style={[styles.searchInput, { color: colors.onSurface }]}
                    placeholder="Search widgets, templates..."
                    placeholderTextColor={colors.onSurfaceVariant}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onSubmitEditing={onSubmit}
                    returnKeyType="search"
                />
                {value.length > 0 && (
                    <Pressable
                        onPress={() => {
                            onChangeText('');
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <View style={[styles.clearButton, { backgroundColor: colors.surfaceContainerHighest }]}>
                            <MaterialCommunityIcons
                                name="close"
                                size={16}
                                color={colors.onSurfaceVariant}
                            />
                        </View>
                    </Pressable>
                )}
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        // Voice search would go here
                    }}
                >
                    <MaterialCommunityIcons
                        name="microphone"
                        size={24}
                        color={colors.onSurfaceVariant}
                    />
                </Pressable>
            </View>
        </Animated.View>
    );
};

// ============================================
// Category Helper Functions
// ============================================

const getCategoryIcon = (cat: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    const map: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
        Weather: 'weather-cloudy',
        Clock: 'clock-outline',
        Calendar: 'calendar',
        Fitness: 'heart-pulse',
        Music: 'music',
        Battery: 'battery-high',
        Quotes: 'format-quote-close',
        Photo: 'image',
        Utility: 'tools',
        Custom: 'widgets',
    };
    return map[cat] || 'widgets';
};

const getCategoryIconForResult = (cat: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    const map: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
        Weather: 'weather-partly-cloudy',
        Clock: 'clock-digital',
        Calendar: 'calendar-month',
        Fitness: 'heart-pulse',
        Music: 'music-note',
        Battery: 'battery-charging',
        Quotes: 'format-quote-close',
        Photo: 'image-outline',
        Utility: 'tools',
        Custom: 'widgets',
    };
    return map[cat] || 'widgets';
};

const getCategoryColor = (cat: string, colors: any): string => {
    const map: Record<string, string> = {
        Weather: colors.primary,
        Clock: colors.secondary,
        Calendar: colors.tertiary,
        Fitness: colors.error,
        Music: colors.primary,
        Battery: colors.tertiary,
        Quotes: colors.secondary,
        Photo: colors.primary,
        Utility: colors.secondary,
        Custom: colors.tertiary,
    };
    return map[cat] || colors.primary;
};

// ============================================
// Main Search Screen
// ============================================

export const SearchScreen: React.FC = () => {
    const colors = useColors();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Community data
    const [communityResults, setCommunityResults] = useState<CommunityWidget[]>([]);
    const [trendingWidgets, setTrendingWidgets] = useState<CommunityWidget[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [trendingLoading, setTrendingLoading] = useState(true);
    const [totalResults, setTotalResults] = useState(0);

    // Download state
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

    // Recent searches (persisted in state for now)
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const categories = [
        { id: 'all', label: 'All', icon: 'apps' as keyof typeof MaterialCommunityIcons.glyphMap },
        ...COMMUNITY_CATEGORIES.filter(c => c !== 'All').slice(0, 5).map(c => ({
            id: c.toLowerCase(),
            label: c,
            icon: getCategoryIcon(c),
        })),
    ];

    // Load trending on mount
    useEffect(() => {
        loadTrending();
    }, []);

    // Search when query or category changes (debounced)
    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setCommunityResults([]);
            setTotalResults(0);
            return;
        }
        const timer = setTimeout(() => {
            performSearch();
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategory]);

    const loadTrending = async () => {
        setTrendingLoading(true);
        try {
            const results = await getTrendingWidgets(6);
            setTrendingWidgets(results.filter(cw => !!cw.thumbnailUrl));
        } catch (error) {
            console.error('Failed to load trending:', error);
        } finally {
            setTrendingLoading(false);
        }
    };

    const performSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        try {
            const { widgets, total } = await browseCommunityWidgets({
                searchQuery: searchQuery.trim(),
                category: selectedCategory && selectedCategory !== 'all'
                    ? selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)
                    : undefined,
                sort: 'popular',
            });
            const withThumbs = widgets.filter(cw => !!cw.thumbnailUrl);
            setCommunityResults(withThumbs);
            setTotalResults(withThumbs.length);

            // Add to recent searches
            if (searchQuery.trim() && !recentSearches.includes(searchQuery.trim())) {
                setRecentSearches(prev => [searchQuery.trim(), ...prev.slice(0, 4)]);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleDownload = async (widget: CommunityWidget) => {
        if (downloadingId) return;
        if (downloadedIds.has(widget.id)) return;
        setDownloadingId(widget.id);
        try {
            const widgetData = await downloadCommunityWidget(widget.id);
            const saved = await saveWidget({
                ...widgetData,
                id: undefined,
                name: widget.name,
            } as any);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setDownloadedIds(prev => new Set(prev).add(widget.id));
            navigation.navigate('Editor' as never, { widgetId: saved.id } as never);
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header with Search Bar */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TitleLarge style={{ color: colors.onSurface, marginBottom: 16 }}>Discover</TitleLarge>
                <AnimatedSearchBar
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setIsSearching(true)}
                    onBlur={() => setIsSearching(false)}
                    onSubmit={performSearch}
                />
            </View>

            {/* Category Chips */}
            <View style={styles.categoriesContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesScroll}
                >
                    {categories.map((cat) => (
                        <PremiumChip
                            key={cat.id}
                            label={cat.label}
                            icon={cat.icon}
                            variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
                            selected={selectedCategory === cat.id}
                            onPress={() => {
                                setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        />
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Search Results */}
                {searchQuery.length > 0 ? (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <TitleMedium style={{ color: colors.onSurface }}>Community Results</TitleMedium>
                            {searchLoading ? (
                                <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                                <BodySmall style={{ color: colors.onSurfaceVariant }}>{totalResults} found</BodySmall>
                            )}
                        </View>
                        {communityResults.length === 0 && !searchLoading ? (
                            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                                <MaterialCommunityIcons name="magnify-close" size={40} color={colors.onSurfaceVariant} />
                                <BodyMedium style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
                                    No community widgets found
                                </BodyMedium>
                                <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
                                    Try a different search term
                                </BodySmall>
                            </View>
                        ) : (
                            communityResults.map((cw, index) => {
                                const catColor = getCategoryColor(cw.category, colors);
                                const catIcon = getCategoryIconForResult(cw.category);
                                const isDownloading = downloadingId === cw.id;
                                const isDownloaded = downloadedIds.has(cw.id);
                                return (
                                    <Animated.View
                                        key={cw.id}
                                        entering={FadeInDown.delay(index * 80).springify()}
                                    >
                                        <Pressable
                                            onPress={() => handleDownload(cw)}
                                            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                                        >
                                            <PremiumCard variant="filled" style={styles.resultCard}>
                                                {/* Widget Preview Thumbnail */}
                                                <View style={[styles.resultPreview, { backgroundColor: catColor + '12' }]}>
                                                    <WidgetPreview
                                                        thumbnail={cw.thumbnailUrl}
                                                        width={56}
                                                        height={56}
                                                        fallbackColor={catColor}
                                                        style={{ borderRadius: 10 }}
                                                    />
                                                    <View style={[styles.resultPreviewIconBadge, { backgroundColor: catColor + '20' }]}>
                                                        <MaterialCommunityIcons name={catIcon} size={14} color={catColor} />
                                                    </View>
                                                </View>

                                                {/* Info */}
                                                <View style={styles.resultContent}>
                                                    <TitleSmall numberOfLines={1} style={{ color: colors.onSurface }}>{cw.name}</TitleSmall>
                                                    <LabelSmall numberOfLines={1} style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                                                        by {cw.authorName}
                                                    </LabelSmall>
                                                    <View style={styles.resultMeta}>
                                                        <LabelSmall style={{ color: colors.onSurfaceVariant }}>
                                                            {cw.width}×{cw.height}
                                                        </LabelSmall>
                                                        <View style={[styles.metaDot, { backgroundColor: colors.outlineVariant }]} />
                                                        <LabelSmall style={{ color: colors.onSurfaceVariant }}>
                                                            {cw.elementCount} element{cw.elementCount !== 1 ? 's' : ''}
                                                        </LabelSmall>
                                                        <View style={[styles.metaDot, { backgroundColor: colors.outlineVariant }]} />
                                                        <LabelSmall style={{ color: colors.onSurfaceVariant }}>
                                                            {cw.downloads.toLocaleString()}
                                                        </LabelSmall>
                                                    </View>
                                                </View>

                                                {/* Status */}
                                                {isDownloading ? (
                                                    <ActivityIndicator size="small" color={colors.primary} />
                                                ) : isDownloaded ? (
                                                    <View style={[styles.resultStatusBadge, { backgroundColor: colors.primaryContainer }]}>
                                                        <MaterialCommunityIcons name="check" size={14} color={colors.onPrimaryContainer} />
                                                    </View>
                                                ) : (
                                                    <View style={[styles.resultStatusBadge, { backgroundColor: colors.primaryContainer }]}>
                                                        <MaterialCommunityIcons name="download-outline" size={14} color={colors.onPrimaryContainer} />
                                                    </View>
                                                )}
                                            </PremiumCard>
                                        </Pressable>
                                    </Animated.View>
                                );
                            })
                        )}
                    </View>
                ) : (
                    <>
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <TitleMedium style={{ color: colors.onSurface }}>Recent</TitleMedium>
                                    <Pressable onPress={() => setRecentSearches([])}>
                                        <BodySmall style={{ color: colors.primary }}>Clear all</BodySmall>
                                    </Pressable>
                                </View>
                                <View style={styles.recentList}>
                                    {recentSearches.map((search, index) => (
                                        <Pressable
                                            key={index}
                                            onPress={() => setSearchQuery(search)}
                                            style={[styles.recentItem, { backgroundColor: colors.surfaceContainerLow }]}
                                        >
                                            <MaterialCommunityIcons
                                                name="history"
                                                size={18}
                                                color={colors.onSurfaceVariant}
                                            />
                                            <BodyMedium style={{ color: colors.onSurface, flex: 1 }}>
                                                {search}
                                            </BodyMedium>
                                            <Pressable
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                    setRecentSearches(prev => prev.filter((_, i) => i !== index));
                                                }}
                                            >
                                                <MaterialCommunityIcons
                                                    name="close"
                                                    size={18}
                                                    color={colors.onSurfaceVariant}
                                                />
                                            </Pressable>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Trending from Community */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <TitleMedium style={{ color: colors.onSurface }}>Trending in Community</TitleMedium>
                                <MaterialCommunityIcons
                                    name="fire"
                                    size={20}
                                    color={colors.tertiary}
                                />
                            </View>
                            {trendingLoading ? (
                                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>Loading trending...</BodySmall>
                                </View>
                            ) : trendingWidgets.length > 0 ? (
                                <View style={styles.trendingGrid}>
                                    {trendingWidgets.slice(0, 6).map((cw, index) => {
                                        const catColor = getCategoryColor(cw.category, colors);
                                        const catIcon = getCategoryIconForResult(cw.category);
                                        const isDownloading = downloadingId === cw.id;
                                        const isDownloaded = downloadedIds.has(cw.id);
                                        return (
                                            <Animated.View
                                                key={cw.id}
                                                entering={FadeInDown.delay(index * 80).springify()}
                                                style={styles.trendingCard}
                                            >
                                                <Pressable
                                                    onPress={() => handleDownload(cw)}
                                                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                                                >
                                                    <PremiumCard variant="filled" style={styles.trendingCardInner}>
                                                        {/* Preview thumbnail */}
                                                        <View style={[styles.trendingPreview, { backgroundColor: catColor + '12' }]}>
                                                            <WidgetPreview
                                                                thumbnail={cw.thumbnailUrl}
                                                                width={(SCREEN_WIDTH - 48 - 10) / 2 - 24}
                                                                height={66}
                                                                fallbackColor={catColor}
                                                                style={{ borderRadius: 8 }}
                                                            />
                                                            <View style={[styles.trendingPreviewBadge, { backgroundColor: catColor + '20' }]}>
                                                                <MaterialCommunityIcons name={catIcon} size={12} color={catColor} />
                                                            </View>
                                                        </View>

                                                        {/* Info */}
                                                        <View style={styles.trendingInfo}>
                                                            <TitleSmall numberOfLines={1} style={{ color: colors.onSurface, fontSize: 13 }}>
                                                                {cw.name}
                                                            </TitleSmall>
                                                            <LabelSmall numberOfLines={1} style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                                                                by {cw.authorName}
                                                            </LabelSmall>
                                                            <View style={styles.trendingFooter}>
                                                                <LabelSmall style={{ color: colors.onSurfaceVariant, fontSize: 10 }}>
                                                                    {cw.width}×{cw.height} · {cw.elementCount}
                                                                </LabelSmall>
                                                                {isDownloading ? (
                                                                    <ActivityIndicator size={12} color={colors.primary} />
                                                                ) : isDownloaded ? (
                                                                    <MaterialCommunityIcons name="check-circle" size={14} color={colors.primary} />
                                                                ) : (
                                                                    <LabelSmall style={{ color: colors.onSurfaceVariant, fontSize: 10 }}>
                                                                        {cw.downloads.toLocaleString()}↓
                                                                    </LabelSmall>
                                                                )}
                                                            </View>
                                                        </View>
                                                    </PremiumCard>
                                                </Pressable>
                                            </Animated.View>
                                        );
                                    })}
                                </View>
                            ) : (
                                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                                    <MaterialCommunityIcons name="earth" size={32} color={colors.onSurfaceVariant} />
                                    <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
                                        No community widgets yet — be the first to share!
                                    </BodySmall>
                                </View>
                            )}
                        </View>
                    </>
                )}

                {/* Bottom spacing */}
                <View style={{ height: 120 }} />
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
    header: {
        paddingHorizontal: 24,
    },
    searchContainer: {
        alignSelf: 'center',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 28,
        borderWidth: 2,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    clearButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoriesContainer: {
        marginTop: 16,
    },
    categoriesScroll: {
        paddingHorizontal: 24,
        gap: 8,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingTop: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 12,
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        marginHorizontal: 24,
        marginBottom: 10,
        gap: 12,
    },
    resultPreview: {
        width: 72,
        height: 72,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        position: 'relative',
    },
    resultPreviewIconBadge: {
        position: 'absolute',
        bottom: 3,
        right: 3,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultContent: {
        flex: 1,
    },
    resultMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    metaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    resultBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    resultStatusBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recentList: {
        paddingHorizontal: 24,
        gap: 8,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 12,
    },
    trendingGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 20,
        gap: 10,
    },
    trendingCard: {
        width: (SCREEN_WIDTH - 48 - 10) / 2,
        borderRadius: 16,
        overflow: 'hidden',
    },
    trendingCardInner: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    trendingPreview: {
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        position: 'relative',
    },
    trendingPreviewBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendingInfo: {
        padding: 10,
    },
    trendingFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
    },
    trendingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendingName: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginTop: 8,
    },
    trendingStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    trendingCount: {
        color: 'rgba(255,255,255,0.8)',
    },
});

export default SearchScreen;
