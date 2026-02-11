/**
 * WidgetCraft - Widget Library Screen
 * Manages saved widgets with filtering, sorting, and organiza
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    TextInput,
    RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    withTiming,
    useSharedValue,
    FadeInDown,
    FadeIn,
    Layout,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import {
    TitleLarge,
    TitleMedium,
    BodyMedium,
    BodySmall,
    LabelMedium,
    LabelSmall,
} from '@components/common';
import { PremiumIconButton } from '@components/common/PremiumIconButton';
import {
    getWidgetList,
    getWidget,
    deleteWidget,
    duplicateWidget,
    SavedWidget,
    WidgetMetadata,
} from '@services/WidgetStorage';

// ============================================
// Types
// ============================================

type SortOption = 'newest' | 'oldest' | 'name' | 'modified';
type FilterOption = 'all' | 'favorites' | 'recent';

interface WidgetCardProps {
    widget: WidgetMetadata;
    index: number;
    onPress: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onToggleFavorite: () => void;
}

// ============================================
// Widget Card Component
// ============================================

const WidgetCard: React.FC<WidgetCardProps> = ({
    widget,
    index,
    onPress,
    onEdit,
    onDuplicate,
    onDelete,
    onToggleFavorite,
}) => {
    const colors = useColors();
    const scale = useSharedValue(1);
    const [showActions, setShowActions] = useState(false);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.98, { duration: 60 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handleLongPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowActions(!showActions);
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            layout={Layout.springify()}
        >
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onLongPress={handleLongPress}
            >
                <Animated.View
                    style={[
                        styles.widgetCard,
                        { backgroundColor: colors.surfaceContainerHigh },
                        animatedStyle,
                    ]}
                >
                    {/* Widget Preview */}
                    <View
                        style={[
                            styles.widgetPreview,
                            { backgroundColor: colors.surfaceContainerHighest },
                        ]}
                    >
                        <MaterialCommunityIcons
                            name="widgets"
                            size={32}
                            color={colors.primary}
                        />
                    </View>

                    {/* Widget Info */}
                    <View style={styles.widgetInfo}>
                        <View style={styles.widgetHeader}>
                            <BodyMedium
                                style={{ color: colors.onSurface, flex: 1 }}
                                numberOfLines={1}
                            >
                                {widget.name}
                            </BodyMedium>
                            <Pressable onPress={onToggleFavorite}>
                                <MaterialCommunityIcons
                                    name="star-outline"
                                    size={20}
                                    color={colors.onSurfaceVariant}
                                />
                            </Pressable>
                        </View>
                        <LabelSmall style={{ color: colors.onSurfaceVariant }}>
                            {formatDate(widget.updatedAt)} • {widget.elementCount} elements
                        </LabelSmall>
                    </View>

                    {/* Actions (shown on long press) */}
                    {showActions && (
                        <Animated.View
                            entering={FadeIn.duration(200)}
                            style={[styles.actionsOverlay, { backgroundColor: colors.surface + 'F0' }]}
                        >
                            <Pressable
                                style={[styles.actionButton, { backgroundColor: colors.primaryContainer }]}
                                onPress={() => { setShowActions(false); onEdit(); }}
                            >
                                <MaterialCommunityIcons name="pencil" size={20} color={colors.onPrimaryContainer} />
                                <LabelSmall style={{ color: colors.onPrimaryContainer }}>Edit</LabelSmall>
                            </Pressable>
                            <Pressable
                                style={[styles.actionButton, { backgroundColor: colors.secondaryContainer }]}
                                onPress={() => { setShowActions(false); onDuplicate(); }}
                            >
                                <MaterialCommunityIcons name="content-copy" size={20} color={colors.onSecondaryContainer} />
                                <LabelSmall style={{ color: colors.onSecondaryContainer }}>Copy</LabelSmall>
                            </Pressable>
                            <Pressable
                                style={[styles.actionButton, { backgroundColor: colors.errorContainer }]}
                                onPress={() => { setShowActions(false); onDelete(); }}
                            >
                                <MaterialCommunityIcons name="delete" size={20} color={colors.onErrorContainer} />
                                <LabelSmall style={{ color: colors.onErrorContainer }}>Delete</LabelSmall>
                            </Pressable>
                        </Animated.View>
                    )}
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
};

// ============================================
// Filter/Sort Chip
// ============================================

interface ChipProps {
    label: string;
    selected: boolean;
    onPress: () => void;
}

const Chip: React.FC<ChipProps> = ({ label, selected, onPress }) => {
    const colors = useColors();

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.chip,
                {
                    backgroundColor: selected ? colors.primaryContainer : colors.surfaceContainerHigh,
                    borderColor: selected ? colors.primary : 'transparent',
                },
            ]}
        >
            <LabelMedium
                style={{ color: selected ? colors.onPrimaryContainer : colors.onSurfaceVariant }}
            >
                {label}
            </LabelMedium>
        </Pressable>
    );
};

// ============================================
// Widget Library Screen
// ============================================

export const WidgetLibraryScreen: React.FC = () => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const [widgets, setWidgets] = useState<WidgetMetadata[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterBy, setFilterBy] = useState<FilterOption>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Load widgets
    const loadWidgets = useCallback(async () => {
        try {
            const savedWidgets = await getWidgetList();
            setWidgets(savedWidgets);
        } catch (error) {
            console.error('Failed to load widgets:', error);
        }
    }, []);

    useEffect(() => {
        loadWidgets();
    }, [loadWidgets]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadWidgets();
        setIsRefreshing(false);
    };

    // Filter and sort widgets
    const filteredWidgets = useMemo(() => {
        let result = [...widgets];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(w => w.name.toLowerCase().includes(query));
        }

        // Category filter (favorites not available in WidgetMetadata)
        if (filterBy === 'recent') {
            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            result = result.filter(w => w.updatedAt > oneWeekAgo);
        }

        // Sort
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => b.createdAt - a.createdAt);
                break;
            case 'oldest':
                result.sort((a, b) => a.createdAt - b.createdAt);
                break;
            case 'name':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'modified':
                result.sort((a, b) => b.updatedAt - a.updatedAt);
                break;
        }

        return result;
    }, [widgets, searchQuery, sortBy, filterBy]);

    // Actions
    const handleWidgetPress = (widget: WidgetMetadata) => {
        // Navigate to widget preview or editor
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleEdit = (widget: WidgetMetadata) => {
        // Navigate to editor with widget data
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleDuplicate = async (widget: WidgetMetadata) => {
        try {
            await duplicateWidget(widget.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            loadWidgets();
        } catch (error) {
            Alert.alert('Error', 'Failed to duplicate widget');
        }
    };

    const handleDelete = (widget: WidgetMetadata) => {
        Alert.alert(
            'Delete Widget',
            `Are you sure you want to delete "${widget.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteWidget(widget.id);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            loadWidgets();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete widget');
                        }
                    },
                },
            ]
        );
    };

    const handleToggleFavorite = async (widget: WidgetMetadata) => {
        // Toggle favorite status (would need to update storage)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // This would require implementing updateWidget in WidgetStorage
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.headerTop}>
                    <PremiumIconButton
                        icon="arrow-left"
                        variant="standard"
                        onPress={() => navigation.goBack()}
                    />
                    <TitleLarge style={{ color: colors.onSurface, flex: 1 }}>
                        My Widgets
                    </TitleLarge>
                    <PremiumIconButton
                        icon="filter-variant"
                        variant={showFilters ? 'tonal' : 'standard'}
                        onPress={() => setShowFilters(!showFilters)}
                    />
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceVariant} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.onSurface }]}
                        placeholder="Search widgets..."
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <Pressable onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name="close" size={20} color={colors.onSurfaceVariant} />
                        </Pressable>
                    ) : null}
                </View>

                {/* Filter/Sort Options */}
                {showFilters && (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.filterSection}>
                        <View style={styles.filterRow}>
                            <LabelSmall style={{ color: colors.onSurfaceVariant, marginRight: 8 }}>
                                Filter:
                            </LabelSmall>
                            <Chip
                                label="All"
                                selected={filterBy === 'all'}
                                onPress={() => setFilterBy('all')}
                            />
                            <Chip
                                label="Favorites"
                                selected={filterBy === 'favorites'}
                                onPress={() => setFilterBy('favorites')}
                            />
                            <Chip
                                label="Recent"
                                selected={filterBy === 'recent'}
                                onPress={() => setFilterBy('recent')}
                            />
                        </View>
                        <View style={styles.filterRow}>
                            <LabelSmall style={{ color: colors.onSurfaceVariant, marginRight: 8 }}>
                                Sort by:
                            </LabelSmall>
                            <Chip
                                label="Newest"
                                selected={sortBy === 'newest'}
                                onPress={() => setSortBy('newest')}
                            />
                            <Chip
                                label="Name"
                                selected={sortBy === 'name'}
                                onPress={() => setSortBy('name')}
                            />
                            <Chip
                                label="Modified"
                                selected={sortBy === 'modified'}
                                onPress={() => setSortBy('modified')}
                            />
                        </View>
                    </Animated.View>
                )}
            </View>

            {/* Widget Grid */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.gridContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {filteredWidgets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons
                            name="widgets-outline"
                            size={64}
                            color={colors.onSurfaceVariant}
                        />
                        <TitleMedium style={{ color: colors.onSurface, marginTop: 16 }}>
                            No widgets yet
                        </TitleMedium>
                        <BodyMedium style={{ color: colors.onSurfaceVariant, textAlign: 'center' }}>
                            Create your first widget to see it here
                        </BodyMedium>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {filteredWidgets.map((widget, index) => (
                            <WidgetCard
                                key={widget.id}
                                widget={widget}
                                index={index}
                                onPress={() => handleWidgetPress(widget)}
                                onEdit={() => handleEdit(widget)}
                                onDuplicate={() => handleDuplicate(widget)}
                                onDelete={() => handleDelete(widget)}
                                onToggleFavorite={() => handleToggleFavorite(widget)}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <Pressable
                style={[styles.fab, { backgroundColor: colors.primaryContainer }]}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Navigate to editor
                }}
            >
                <MaterialCommunityIcons name="plus" size={28} color={colors.onPrimaryContainer} />
            </Pressable>
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
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 28,
        marginTop: 12,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        padding: 0,
    },
    filterSection: {
        marginTop: 12,
        gap: 8,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    scrollView: {
        flex: 1,
    },
    gridContent: {
        padding: 16,
        paddingBottom: 100,
    },
    grid: {
        gap: 12,
    },
    widgetCard: {
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
    },
    widgetPreview: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    widgetInfo: {
        flex: 1,
        gap: 4,
    },
    widgetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionsOverlay: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        borderRadius: 16,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        gap: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    fab: {
        position: 'absolute',
        right: 16,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});

export default WidgetLibraryScreen;
