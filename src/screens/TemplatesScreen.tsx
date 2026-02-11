/**
 * WidgetCraft - Templates Screen
 * Widget Gallery with live widget previews
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeIn,
    FadeInUp,
    FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors, useTheme } from '@theme/index';
import {
    HeadlineMedium,
    TitleMedium,
    TitleSmall,
    BodyMedium,
    BodySmall,
    LabelMedium,
    LabelSmall,
} from '@components/common';
import {
    allTemplates,
    getTemplatesByCategory,
    searchTemplates,
    CATEGORY_INFO,
    WidgetTemplate,
    WidgetCategory,
    WidgetSize,
    WIDGET_SIZES,
    WidgetDataProvider,
} from '../widgets';
import { WidgetRenderer } from '../widgets/components/WidgetRenderer';
import { prepareTemplateForNavigation } from '../widgets/templates/TemplateConverter';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Search Bar Component
interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, placeholder }) => {
    const colors = useColors();
    const { isDark } = useTheme();

    return (
        <Animated.View 
            entering={FadeInDown.delay(100).springify()}
            style={[
                styles.searchContainer,
                {
                    backgroundColor: isDark
                        ? colors.surfaceContainerHigh
                        : colors.surfaceContainerLow,
                },
            ]}
        >
            <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={colors.onSurfaceVariant}
                style={{ marginRight: 10 }}
            />
            <TextInput
                style={[styles.searchInput, { color: colors.onSurface }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder || 'Search widgets...'}
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
            />
            {value.length > 0 && (
                <Pressable
                    onPress={() => {
                        onChangeText('');
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={styles.clearButton}
                >
                    <MaterialCommunityIcons
                        name="close-circle"
                        size={18}
                        color={colors.onSurfaceVariant}
                    />
                </Pressable>
            )}
        </Animated.View>
    );
};

// Glass Card Component
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

// Category Filter Chip
interface CategoryChipProps {
    category: WidgetCategory | 'all';
    label: string;
    icon: string;
    isSelected: boolean;
    onPress: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
    category,
    label,
    icon,
    isSelected,
    onPress,
}) => {
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
            onPressIn={() => { scale.value = withTiming(0.95, { duration: 60 }); }}
            onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
        >
            <Animated.View style={[
                styles.categoryChip,
                {
                    backgroundColor: isSelected ? colors.primaryContainer : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : 'transparent',
                },
                animatedStyle,
            ]}>
                <MaterialCommunityIcons
                    name={icon as any}
                    size={16}
                    color={isSelected ? colors.primary : colors.onSurfaceVariant}
                />
                <LabelMedium style={{
                    color: isSelected ? colors.primary : colors.onSurfaceVariant,
                    marginLeft: 6,
                    fontWeight: isSelected ? '600' : '400',
                }}>
                    {label}
                </LabelMedium>
            </Animated.View>
        </Pressable>
    );
};

// Widget Preview Card
interface WidgetPreviewCardProps {
    template: WidgetTemplate;
    onPress: () => void;
    index: number;
}

const WidgetPreviewCard: React.FC<WidgetPreviewCardProps> = ({
    template,
    onPress,
    index,
}) => {
    const colors = useColors();
    const { isDark } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const sizeConfig = WIDGET_SIZES[template.size];
    const aspectRatio = sizeConfig.width / sizeConfig.height;

    // Calculate preview size to fit in card
    const previewWidth = template.size === 'large' || template.size === 'extraLarge'
        ? SCREEN_WIDTH - 64
        : (SCREEN_WIDTH - 72) / 2;
    const previewHeight = previewWidth / aspectRatio;
    const previewScale = Math.min(
        previewWidth / sizeConfig.width,
        previewHeight / sizeConfig.height
    );

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
            onPressIn={() => { scale.value = withTiming(0.97, { duration: 60 }); }}
            onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
        >
            <Animated.View
                entering={FadeInUp.delay(index * 50).springify()}
            >
                <Animated.View style={animatedStyle}>
                <GlassCard style={[
                    styles.widgetCard,
                    {
                        width: template.size === 'large' || template.size === 'extraLarge'
                            ? SCREEN_WIDTH - 32
                            : (SCREEN_WIDTH - 48) / 2,
                        maxWidth: template.size === 'large' || template.size === 'extraLarge'
                            ? undefined
                            : (SCREEN_WIDTH - 48) / 2,
                    },
                ]}>
                    {/* Widget Preview */}
                    <View style={[
                        styles.widgetPreview,
                        {
                            height: template.size === 'extraLarge'
                                ? Math.min(previewWidth, 320)
                                : Math.min(previewHeight + 16, 220),
                            backgroundColor: isDark
                                ? 'rgba(0,0,0,0.2)'
                                : 'rgba(0,0,0,0.03)',
                        },
                    ]}>
                        <View style={{
                            transform: [{ scale: previewScale * 0.85 }],
                            transformOrigin: 'center',
                        }}>
                            <WidgetRenderer template={template} />
                        </View>
                    </View>

                    {/* Widget Info */}
                    <View style={styles.widgetInfo}>
                        <TitleSmall
                            style={{ color: colors.onSurface, lineHeight: 18 }}
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.85}
                        >
                            {template.name}
                        </TitleSmall>
                        <View style={styles.widgetMeta}>
                            <LabelSmall
                                style={{ color: colors.onSurfaceVariant, flexShrink: 1, marginRight: 8 }}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.85}
                            >
                                {CATEGORY_INFO[template.category]?.label || template.category}
                            </LabelSmall>
                            <View style={[styles.sizeBadge, { backgroundColor: colors.primaryContainer }]}>
                                <LabelSmall style={{ color: colors.primary, fontSize: 10 }}>
                                    {sizeConfig.cols}x{sizeConfig.rows}
                                </LabelSmall>
                            </View>
                        </View>
                    </View>
                </GlassCard>
                </Animated.View>
            </Animated.View>
        </Pressable>
    );
};

// Featured Widget Card
interface FeaturedWidgetProps {
    template: WidgetTemplate;
    onPress: () => void;
}

const FeaturedWidget: React.FC<FeaturedWidgetProps> = ({ template, onPress }) => {
    const colors = useColors();
    const { isDark } = useTheme();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const sizeConfig = WIDGET_SIZES[template.size];
    const previewScale = (SCREEN_WIDTH - 64) / sizeConfig.width * 0.9;

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
            onPressIn={() => { scale.value = withTiming(0.98, { duration: 60 }); }}
            onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
        >
            <Animated.View style={[styles.featuredCard, animatedStyle]}>
                <View style={[
                    styles.featuredContent,
                    { backgroundColor: colors.primaryContainer },
                ]}>
                    {/* Label */}
                    <View style={styles.featuredLabel}>
                        <MaterialCommunityIcons name="star" size={14} color={colors.primary} />
                        <LabelSmall style={{ color: colors.primary, marginLeft: 4, fontWeight: '600' }}>
                            FEATURED
                        </LabelSmall>
                    </View>

                    {/* Widget Preview */}
                    <View style={styles.featuredPreview}>
                        <View style={{ transform: [{ scale: previewScale }] }}>
                            <WidgetRenderer template={template} />
                        </View>
                    </View>

                    {/* Info */}
                    <View style={styles.featuredInfo}>
                        <TitleMedium style={{ color: colors.onPrimaryContainer }}>
                            {template.name}
                        </TitleMedium>
                        <BodySmall style={{ color: colors.onPrimaryContainer, opacity: 0.8 }}>
                            {template.description}
                        </BodySmall>
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
};

// Main Templates Screen
export const TemplatesScreen: React.FC = () => {
    const colors = useColors();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [selectedCategory, setSelectedCategory] = useState<WidgetCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const categories: { key: WidgetCategory | 'all'; label: string; icon: string }[] = [
        { key: 'all', label: 'All', icon: 'view-grid' },
        ...Object.entries(CATEGORY_INFO).map(([key, info]) => ({
            key: key as WidgetCategory,
            label: info.label,
            icon: info.icon,
        })),
    ];

    const filteredTemplates = useMemo(() => {
        let templates = allTemplates;
        
        // Filter by search query first
        if (searchQuery.trim()) {
            templates = searchTemplates(searchQuery);
        }
        
        // Then filter by category
        if (selectedCategory !== 'all') {
            templates = templates.filter(t => t.category === selectedCategory);
        }
        
        return templates;
    }, [selectedCategory, searchQuery]);

    // Separate large and small widgets for grid layout
    const largeWidgets = filteredTemplates.filter(t => t.size === 'large' || t.size === 'extraLarge');
    const smallWidgets = filteredTemplates.filter(t => t.size === 'small' || t.size === 'medium');

    // Featured widget (first large one, or first one overall)
    const featuredWidget = filteredTemplates[0];

    const navigation = useNavigation<any>();

    const handleWidgetPress = useCallback((template: WidgetTemplate) => {
        // Convert template to canvas format and navigate to editor
        const templateParams = prepareTemplateForNavigation(template);
        navigation.navigate('Editor', {
            templateId: templateParams.templateId,
            templateElements: templateParams.elements,
            templateElementOrder: templateParams.elementOrder,
            templateCanvasSize: templateParams.canvasSize,
            templateName: templateParams.templateName,
        });
    }, [navigation]);

    return (
        <WidgetDataProvider>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <HeadlineMedium style={{ color: colors.onSurface }}>
                            Widget Gallery
                        </HeadlineMedium>
                        <BodyMedium style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
                            {filteredTemplates.length} beautiful widgets
                        </BodyMedium>
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchWrapper}>
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search widgets by name..."
                        />
                    </View>

                    {/* Category Filters */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                        contentContainerStyle={styles.categoryContent}
                    >
                        {categories.map((cat) => (
                            <CategoryChip
                                key={cat.key}
                                category={cat.key}
                                label={cat.label}
                                icon={cat.icon}
                                isSelected={selectedCategory === cat.key}
                                onPress={() => setSelectedCategory(cat.key)}
                            />
                        ))}
                    </ScrollView>

                    {/* Featured Widget */}
                    {featuredWidget && selectedCategory === 'all' && (
                        <FeaturedWidget
                            template={featuredWidget}
                            onPress={() => handleWidgetPress(featuredWidget)}
                        />
                    )}

                    {/* Widget Grid */}
                    {filteredTemplates.length > 0 ? (
                        <View style={styles.widgetGrid}>
                            {/* Large widgets (full width) */}
                            {largeWidgets.map((template, index) => (
                                <WidgetPreviewCard
                                    key={template.id}
                                    template={template}
                                    onPress={() => handleWidgetPress(template)}
                                    index={index}
                                />
                            ))}

                            {/* Small widgets (2 column grid) */}
                            <View style={styles.smallWidgetRow}>
                                {smallWidgets.map((template, index) => (
                                    <WidgetPreviewCard
                                        key={template.id}
                                        template={template}
                                        onPress={() => handleWidgetPress(template)}
                                        index={largeWidgets.length + index}
                                    />
                                ))}
                            </View>
                        </View>
                    ) : (
                        <Animated.View 
                            entering={FadeIn.delay(200)}
                            style={styles.emptyState}
                        >
                            <MaterialCommunityIcons
                                name="magnify-remove-outline"
                                size={64}
                                color={colors.onSurfaceVariant}
                                style={{ opacity: 0.5 }}
                            />
                            <TitleMedium style={{ color: colors.onSurface, marginTop: 16 }}>
                                No widgets found
                            </TitleMedium>
                            <BodyMedium style={{ color: colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>
                                Try adjusting your search or{'\n'}selecting a different category
                            </BodyMedium>
                            {searchQuery && (
                                <Pressable
                                    onPress={() => {
                                        setSearchQuery('');
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    style={[styles.clearSearchButton, { backgroundColor: colors.primaryContainer }]}
                                >
                                    <LabelMedium style={{ color: colors.onPrimaryContainer }}>
                                        Clear search
                                    </LabelMedium>
                                </Pressable>
                            )}
                        </Animated.View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>
        </WidgetDataProvider>
    );
};

// Styles
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
        marginBottom: 16,
    },
    categoryScroll: {
        marginBottom: 20,
    },
    categoryContent: {
        paddingHorizontal: 20,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    glassCard: {
        borderRadius: 16,
    },
    widgetCard: {
        marginBottom: 12,
        maxWidth: '100%',
    },
    widgetPreview: {
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
        padding: 8,
    },
    widgetInfo: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 12,
        minHeight: 64,
    },
    widgetMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    sizeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    featuredCard: {
        marginHorizontal: 16,
        marginBottom: 24,
    },
    featuredContent: {
        borderRadius: 28,
        padding: 20,
        overflow: 'hidden',
    },
    featuredLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featuredPreview: {
        alignItems: 'center',
        marginBottom: 16,
    },
    featuredInfo: {
        gap: 4,
    },
    widgetGrid: {
        paddingHorizontal: 16,
    },
    smallWidgetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    searchWrapper: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 0,
    },
    clearButton: {
        padding: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    clearSearchButton: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
});

export default TemplatesScreen;