/**
 * WidgetCraft - Library Screen
 * Widget library showing saved widgets with MD3 Glassmorphism Design
 * Uses Material You dynamic colors throughout
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Pressable, RefreshControl, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    FadeIn,
    FadeOut,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors, useTheme } from '@theme/index';
import {
    PremiumChip,
    PremiumIconButton,
    HeadlineMedium,
    TitleMedium,
    TitleSmall,
    BodyMedium,
    BodySmall,
    LabelSmall,
    LabelMedium,
} from '@components/common';
import { getWidgetList, deleteWidget, duplicateWidget, WidgetMetadata } from '@services/WidgetStorage';
import { shareWidgetToCommunity, COMMUNITY_CATEGORIES, CommunityCategory } from '@services/CommunityService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Get icon based on widget content or name
const getWidgetIcon = (widget: WidgetMetadata): keyof typeof MaterialCommunityIcons.glyphMap => {
    const name = widget.name.toLowerCase();
    if (name.includes('weather')) return 'weather-partly-cloudy';
    if (name.includes('clock') || name.includes('time')) return 'clock-outline';
    if (name.includes('calendar') || name.includes('date')) return 'calendar';
    if (name.includes('music')) return 'music';
    if (name.includes('step') || name.includes('walk') || name.includes('fitness')) return 'walk';
    if (name.includes('photo') || name.includes('image')) return 'image';
    if (name.includes('quote')) return 'format-quote-close';
    if (name.includes('battery')) return 'battery';
    return 'widgets';
};

// Format relative time
const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return new Date(timestamp).toLocaleDateString();
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

// Widget Item Card

interface WidgetItemProps {
    widget: WidgetMetadata;
    color: string;
    onPress: () => void;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onShare: () => void;
}

const MENU_WIDTH = 200;
const MENU_ITEM_HEIGHT = 48;
const MENU_VERTICAL_PADDING = 8;
const MENU_ITEMS_COUNT = 4;
const MENU_HEIGHT = MENU_ITEMS_COUNT * MENU_ITEM_HEIGHT + MENU_VERTICAL_PADDING * 2;
const SCREEN_PADDING = 8;

const WidgetItem: React.FC<WidgetItemProps> = ({ widget, color, onPress, onEdit, onDuplicate, onDelete, onShare }) => {
    const colors = useColors();
    const { isDark } = useTheme();
    const scale = useSharedValue(1);
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const menuButtonRef = useRef<View>(null);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleMenuPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (menuButtonRef.current) {
            menuButtonRef.current.measureInWindow((x, y, width, height) => {
                const { width: screenW, height: screenH } = Dimensions.get('window');

                // Anchor to the right edge of the button, dropdown expands left
                let menuX = x + width - MENU_WIDTH;
                let menuY = y + height + 4;

                // Clamp horizontal: keep within screen with padding
                if (menuX + MENU_WIDTH > screenW - SCREEN_PADDING) {
                    menuX = screenW - MENU_WIDTH - SCREEN_PADDING;
                }
                if (menuX < SCREEN_PADDING) {
                    menuX = SCREEN_PADDING;
                }

                // Clamp vertical: if menu overflows bottom, show above the button
                if (menuY + MENU_HEIGHT > screenH - SCREEN_PADDING) {
                    menuY = y - MENU_HEIGHT - 4;
                }
                // If still off-screen top, just clamp
                if (menuY < SCREEN_PADDING) {
                    menuY = SCREEN_PADDING;
                }

                setMenuPosition({ x: menuX, y: menuY });
                setShowMenu(true);
            });
        } else {
            setShowMenu(!showMenu);
        }
    };

    const MenuItemRow = ({ icon, label, color: itemColor, onPress: itemPress }: { icon: string; label: string; color: string; onPress: () => void }) => (
        <Pressable
            style={({ pressed }) => [
                styles.menuItem,
                pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowMenu(false);
                itemPress();
            }}
            android_ripple={{ color: colors.onSurface + '1A', borderless: false }}
        >
            <MaterialCommunityIcons name={icon as any} size={20} color={itemColor} />
            <BodyMedium style={{ color: itemColor, marginLeft: 12, flex: 1 }}>{label}</BodyMedium>
        </Pressable>
    );

    return (
        <Pressable
            onPressIn={() => {
                scale.value = withTiming(0.98, { duration: 60 });
            }}
            onPressOut={() => {
                scale.value = withTiming(1, { duration: 100 });
            }}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
        >
            <Animated.View style={animatedStyle}>
                <GlassCard style={styles.widgetItem}>
                    {/* Thumbnail with dynamic color */}
                    <View style={[styles.widgetThumbnail, { backgroundColor: color }]}>
                        <View style={styles.thumbnailOverlay} />
                        <MaterialCommunityIcons name={getWidgetIcon(widget)} size={24} color="#FFFFFF" />
                    </View>

                    {/* Info */}
                    <View style={styles.widgetInfo}>
                        <TitleSmall style={{ color: colors.onSurface }}>{widget.name}</TitleSmall>
                        <LabelSmall style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                            {formatRelativeTime(widget.updatedAt)}
                        </LabelSmall>
                        <View style={styles.widgetMeta}>
                            <LabelSmall style={{ color: colors.onSurfaceVariant }}>
                                {widget.width}×{widget.height} • {widget.elementCount} element{widget.elementCount !== 1 ? 's' : ''}
                            </LabelSmall>
                        </View>
                    </View>

                    {/* Actions */}
                    <View ref={menuButtonRef} style={styles.actionsContainer}>
                        <PremiumIconButton
                            icon="dots-vertical"
                            variant="standard"
                            size="small"
                            onPress={handleMenuPress}
                        />
                    </View>
                </GlassCard>
            </Animated.View>

            {/* MD3 Menu — Modal overlay with scrim */}
            <Modal visible={showMenu} transparent animationType="none" onRequestClose={() => setShowMenu(false)}>
                <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
                    <Animated.View
                        entering={FadeIn.duration(120)}
                        style={[
                            styles.menuDropdown,
                            {
                                backgroundColor: colors.surfaceContainerHigh,
                                borderColor: isDark ? colors.outlineVariant + '28' : 'transparent',
                                borderWidth: isDark ? 1 : 0,
                                top: menuPosition.y,
                                left: menuPosition.x,
                            },
                        ]}
                    >
                        <MenuItemRow icon="pencil-outline" label="Edit" color={colors.onSurface} onPress={onEdit} />
                        <MenuItemRow icon="content-copy" label="Duplicate" color={colors.onSurface} onPress={onDuplicate} />
                        <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant + '40' }]} />
                        <MenuItemRow icon="share-variant-outline" label="Share to Community" color={colors.primary} onPress={onShare} />
                        <MenuItemRow icon="delete-outline" label="Delete" color={colors.error} onPress={onDelete} />
                    </Animated.View>
                </Pressable>
            </Modal>
        </Pressable>
    );
};

// ============================================
// Stats Row
// ============================================

interface StatItemProps {
    value: string;
    label: string;
    color: string;
}

const StatItem: React.FC<StatItemProps> = ({ value, label, color }) => {
    const colors = useColors();
    const { isDark } = useTheme();

    return (
        <View style={[
            styles.statItem,
            {
                backgroundColor: isDark ? color + '15' : color + '10',
            }
        ]}>
            <TitleMedium style={{ color: color }}>{value}</TitleMedium>
            <LabelSmall
                style={{ color: colors.onSurfaceVariant, textAlign: 'center', width: '100%' }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
            >
                {label}
            </LabelSmall>
        </View>
    );
};

// Empty State Component
const EmptyState: React.FC<{ onCreatePress: () => void }> = ({ onCreatePress }) => {
    const colors = useColors();
    const { isDark } = useTheme();

    return (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.primaryContainer : colors.primaryContainer }]}>
                <MaterialCommunityIcons name="widgets-outline" size={48} color={colors.primary} />
            </View>
            <TitleMedium style={{ color: colors.onSurface, marginTop: 16, textAlign: 'center' }}>
                No widgets yet
            </TitleMedium>
            <BodyMedium style={{ color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                Create your first widget to see it here
            </BodyMedium>
            <Pressable
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={onCreatePress}
            >
                <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
                <BodyMedium style={{ color: colors.onPrimary, marginLeft: 8 }}>Create Widget</BodyMedium>
            </Pressable>
        </View>
    );
};

// ============================================
// Main Library Screen
// ============================================

export const LibraryScreen: React.FC = () => {
    const colors = useColors();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const [view, setView] = useState<'grid' | 'list'>('list');
    const [widgets, setWidgets] = useState<WidgetMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'recent'>('all');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [widgetToDelete, setWidgetToDelete] = useState<WidgetMetadata | null>(null);

    // Share modal state
    const [showShareModal, setShowShareModal] = useState(false);
    const [widgetToShare, setWidgetToShare] = useState<WidgetMetadata | null>(null);
    const [shareName, setShareName] = useState('');
    const [shareDesc, setShareDesc] = useState('');
    const [shareAuthor, setShareAuthor] = useState('');
    const [shareCategory, setShareCategory] = useState<string>('Custom');
    const [shareLoading, setShareLoading] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);

    // Color palette for widget cards
    const cardColors = [colors.primary, colors.secondary, colors.tertiary];

    // Load widgets from storage
    const loadWidgets = useCallback(async () => {
        try {
            const widgetList = await getWidgetList();
            setWidgets(widgetList);
        } catch (error) {
            console.error('Error loading widgets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Load widgets on mount
    useEffect(() => {
        loadWidgets();
    }, [loadWidgets]);

    // Reload widgets when screen is focused (after creating/editing)
    useFocusEffect(
        useCallback(() => {
            loadWidgets();
        }, [loadWidgets])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadWidgets();
    }, [loadWidgets]);

    const handleWidgetPress = (widget: WidgetMetadata) => {
        // Navigate to editor with the widget to edit
        navigation.navigate('Editor', { widgetId: widget.id });
    };

    const handleEditWidget = (widget: WidgetMetadata) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('Editor', { widgetId: widget.id });
    };

    const handleDuplicateWidget = async (widget: WidgetMetadata) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await duplicateWidget(widget.id);
            loadWidgets();
        } catch (error) {
            console.error('Failed to duplicate widget:', error);
        }
    };

    const handleDeleteWidget = (widget: WidgetMetadata) => {
        setWidgetToDelete(widget);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!widgetToDelete) return;
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteWidget(widgetToDelete.id);
            loadWidgets();
        } catch (error) {
            console.error('Failed to delete widget:', error);
        } finally {
            setShowDeleteConfirm(false);
            setWidgetToDelete(null);
        }
    };

    const handleCreatePress = () => {
        navigation.navigate('Editor');
    };

    const handleShareWidget = (widget: WidgetMetadata) => {
        setWidgetToShare(widget);
        setShareName(widget.name);
        setShareDesc('');
        setShareAuthor('');
        setShareCategory('Custom');
        setShareSuccess(false);
        setShowShareModal(true);
    };

    const confirmShare = async () => {
        if (!widgetToShare || !shareName.trim() || !shareAuthor.trim()) return;
        setShareLoading(true);
        try {
            await shareWidgetToCommunity(
                widgetToShare.id,
                shareName.trim(),
                shareDesc.trim(),
                shareAuthor.trim(),
                shareCategory,
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShareSuccess(true);
        } catch (error) {
            console.error('Failed to share widget:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setShareLoading(false);
        }
    };

    // Get filtered widgets
    const filteredWidgets = widgets.filter(widget => {
        if (filter === 'all') return true;
        if (filter === 'recent') {
            const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return widget.updatedAt > oneWeekAgo;
        }
        return true;
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <HeadlineMedium style={{ color: colors.onSurface }}>Library</HeadlineMedium>
                        <BodyMedium style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
                            Your widget collection
                        </BodyMedium>
                    </View>
                    <View style={styles.headerActions}>
                        <PremiumIconButton
                            icon={view === 'list' ? 'view-grid' : 'view-list'}
                            variant="tonal"
                            onPress={() => setView(view === 'list' ? 'grid' : 'list')}
                        />
                        <PremiumIconButton 
                            icon="magnify" 
                            variant="standard" 
                            onPress={() => navigation.navigate('Search')} 
                        />
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatItem value={widgets.length.toString()} label="Widgets" color={colors.primary} />
                    <StatItem 
                        value={widgets.filter(w => Date.now() - w.updatedAt < 7 * 24 * 60 * 60 * 1000).length.toString()} 
                        label="Week" 
                        color={colors.secondary} 
                    />
                    <StatItem 
                        value={widgets.reduce((sum, w) => sum + w.elementCount, 0).toString()} 
                        label="Elements" 
                        color={colors.tertiary} 
                    />
                </View>

                {/* Filter Chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsContainer}
                >
                    <PremiumChip 
                        label="All Widgets" 
                        variant={filter === 'all' ? 'filled' : 'outlined'} 
                        selected={filter === 'all'}
                        onPress={() => setFilter('all')}
                    />
                    <PremiumChip 
                        label="Recent" 
                        icon="clock-outline" 
                        variant={filter === 'recent' ? 'filled' : 'outlined'}
                        selected={filter === 'recent'}
                        onPress={() => setFilter('recent')}
                    />
                </ScrollView>

                {/* Widget List or Empty State */}
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <BodyMedium style={{ color: colors.onSurfaceVariant }}>Loading widgets...</BodyMedium>
                    </View>
                ) : filteredWidgets.length === 0 ? (
                    <EmptyState onCreatePress={handleCreatePress} />
                ) : (
                    <View style={styles.widgetList}>
                        <TitleSmall style={[styles.listLabel, { color: colors.onSurfaceVariant }]}>
                            YOUR WIDGETS ({filteredWidgets.length})
                        </TitleSmall>
                        {filteredWidgets.map((widget, index) => (
                            <WidgetItem 
                                key={widget.id} 
                                widget={widget}
                                color={cardColors[index % cardColors.length]}
                                onPress={() => handleWidgetPress(widget)}
                                onEdit={() => handleEditWidget(widget)}
                                onDuplicate={() => handleDuplicateWidget(widget)}
                                onDelete={() => handleDeleteWidget(widget)}
                                onShare={() => handleShareWidget(widget)}
                            />
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Delete Confirmation Modal */}
            <Modal visible={showDeleteConfirm} transparent animationType="fade">
                <View style={styles.deleteModalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface, alignSelf: 'center' }]}>
                        <TitleMedium style={{ color: colors.onSurface, marginBottom: 8 }}>
                            Delete Widget
                        </TitleMedium>
                        <BodyMedium style={{ color: colors.onSurfaceVariant, marginBottom: 24 }}>
                            Are you sure you want to delete "{widgetToDelete?.name}"? This action cannot be undone.
                        </BodyMedium>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <Pressable
                                onPress={() => { setShowDeleteConfirm(false); setWidgetToDelete(null); }}
                                style={[styles.modalButton, { backgroundColor: colors.surfaceContainerHigh }]}
                            >
                                <BodyMedium style={{ color: colors.onSurface }}>Cancel</BodyMedium>
                            </Pressable>
                            <Pressable
                                onPress={confirmDelete}
                                style={[styles.modalButton, { backgroundColor: colors.error }]}
                            >
                                <BodyMedium style={{ color: colors.onError }}>Delete</BodyMedium>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Share to Community Modal */}
            <Modal visible={showShareModal} transparent animationType="fade">
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior="padding"
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <Pressable style={styles.modalDismissArea} onPress={() => { setShowShareModal(false); setWidgetToShare(null); }} />
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={{ flexGrow: 0 }}>
                        {shareSuccess ? (
                            <>
                                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                                    <View style={[styles.shareSuccessIcon, { backgroundColor: colors.primaryContainer }]}>
                                        <MaterialCommunityIcons name="check-circle" size={48} color={colors.primary} />
                                    </View>
                                    <TitleMedium style={{ color: colors.onSurface, marginTop: 16, textAlign: 'center' }}>
                                        Shared Successfully!
                                    </TitleMedium>
                                    <BodyMedium style={{ color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                                        Your widget is now available in the community for everyone to discover.
                                    </BodyMedium>
                                </View>
                                <Pressable
                                    onPress={() => { setShowShareModal(false); setWidgetToShare(null); }}
                                    style={[styles.modalButton, { backgroundColor: colors.primary, alignSelf: 'center', marginTop: 16 }]}
                                >
                                    <BodyMedium style={{ color: colors.onPrimary }}>Done</BodyMedium>
                                </Pressable>
                            </>
                        ) : (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                    <MaterialCommunityIcons name="share-variant" size={24} color={colors.primary} />
                                    <TitleMedium style={{ color: colors.onSurface, marginLeft: 12 }}>
                                        Share to Community
                                    </TitleMedium>
                                </View>

                                <BodySmall style={{ color: colors.onSurfaceVariant, marginBottom: 16 }}>
                                    Share your widget so others can discover and use it.
                                </BodySmall>

                                {/* Name */}
                                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 4 }}>Widget Name</LabelSmall>
                                <TextInput
                                    style={[styles.shareInput, { color: colors.onSurface, backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant }]}
                                    value={shareName}
                                    onChangeText={setShareName}
                                    placeholder="Widget name"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                />

                                {/* Author */}
                                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 4, marginTop: 12 }}>Your Name</LabelSmall>
                                <TextInput
                                    style={[styles.shareInput, { color: colors.onSurface, backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant }]}
                                    value={shareAuthor}
                                    onChangeText={setShareAuthor}
                                    placeholder="Display name"
                                    placeholderTextColor={colors.onSurfaceVariant}
                                />

                                {/* Description */}
                                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 4, marginTop: 12 }}>Description</LabelSmall>
                                <TextInput
                                    style={[styles.shareInput, styles.shareInputMulti, { color: colors.onSurface, backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant }]}
                                    value={shareDesc}
                                    onChangeText={setShareDesc}
                                    placeholder="Describe your widget..."
                                    placeholderTextColor={colors.onSurfaceVariant}
                                    multiline
                                    numberOfLines={3}
                                />

                                {/* Category */}
                                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 8, marginTop: 12 }}>Category</LabelSmall>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        {COMMUNITY_CATEGORIES.filter(c => c !== 'All').map((cat) => (
                                            <Pressable
                                                key={cat}
                                                onPress={() => { setShareCategory(cat); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                                style={[
                                                    styles.categoryChip,
                                                    {
                                                        backgroundColor: shareCategory === cat ? colors.primary : colors.surfaceContainerHigh,
                                                    },
                                                ]}
                                            >
                                                <LabelSmall style={{ color: shareCategory === cat ? colors.onPrimary : colors.onSurfaceVariant }}>
                                                    {cat}
                                                </LabelSmall>
                                            </Pressable>
                                        ))}
                                    </View>
                                </ScrollView>

                                {/* Actions */}
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                    <Pressable
                                        onPress={() => { setShowShareModal(false); setWidgetToShare(null); }}
                                        style={[styles.modalButton, { backgroundColor: colors.surfaceContainerHigh }]}
                                        disabled={shareLoading}
                                    >
                                        <BodyMedium style={{ color: colors.onSurface }}>Cancel</BodyMedium>
                                    </Pressable>
                                    <Pressable
                                        onPress={confirmShare}
                                        style={[styles.modalButton, { backgroundColor: colors.primary, opacity: (!shareName.trim() || !shareAuthor.trim() || shareLoading) ? 0.5 : 1 }]}
                                        disabled={!shareName.trim() || !shareAuthor.trim() || shareLoading}
                                    >
                                        {shareLoading ? (
                                            <ActivityIndicator size="small" color={colors.onPrimary} />
                                        ) : (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <MaterialCommunityIcons name="upload" size={16} color={colors.onPrimary} />
                                                <BodyMedium style={{ color: colors.onPrimary }}>Share</BodyMedium>
                                            </View>
                                        )}
                                    </Pressable>
                                </View>
                            </>
                        )}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    headerActions: {
        flexDirection: 'row',
        gap: 4,
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 20,
    },
    statItem: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipsContainer: {
        paddingHorizontal: 24,
        gap: 8,
        marginBottom: 24,
    },
    widgetList: {
        paddingHorizontal: 24,
    },
    listLabel: {
        marginBottom: 12,
        letterSpacing: 1,
    },
    glassCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 12,
    },
    widgetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    widgetThumbnail: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    thumbnailOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    widgetInfo: {
        flex: 1,
    },
    widgetMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    actionsContainer: {
        marginLeft: 8,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    menuDropdown: {
        position: 'absolute',
        width: MENU_WIDTH,
        borderRadius: 16,
        paddingVertical: MENU_VERTICAL_PADDING,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 3,
    },
    menuDivider: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 16,
        marginVertical: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: MENU_ITEM_HEIGHT,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 48,
        paddingTop: 60,
    },
    emptyIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        padding: 16,
    },
    deleteModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalDismissArea: {
        flex: 1,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        borderRadius: 24,
        padding: 24,
        marginBottom: 8,
        flexShrink: 1,
    },
    modalButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    shareInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
    },
    shareInputMulti: {
        minHeight: 72,
        textAlignVertical: 'top',
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
    },
    shareSuccessIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default LibraryScreen;