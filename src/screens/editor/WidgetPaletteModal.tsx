/**
 * WidgetCraft - Editor Widget Palette
 * Pre-built data-bound components for the canvas editor
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Modal, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TitleSmall, BodySmall, LabelSmall } from '@components/common';
import { CanvasElement, ElementType } from '@canvas/CanvasContext';

// Widget Component Types
// ============================================

interface WidgetPaletteItem {
    id: string;
    name: string;
    category: 'time' | 'data' | 'media' | 'display';
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    preview: string;
    createElement: () => Omit<CanvasElement, 'id'>;
}

// ============================================
// Pre-built Widget Components
// ============================================

const WIDGET_COMPONENTS: WidgetPaletteItem[] = [
    // Time Components
    {
        id: 'digital-clock',
        name: 'Digital Clock',
        category: 'time',
        icon: 'clock-digital',
        preview: '12:30',
        createElement: () => ({
            type: 'digitalClock' as ElementType,
            name: 'Digital Clock',
            transform: { x: 100, y: 100, width: 220, height: 60, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 0, fontWeight: '400', color: '#FFFFFF', textAlign: 'center' },
            clockConfig: { format: '12h', showSeconds: false, showAmPm: true },
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'digital-clock-detailed',
        name: 'Digital w/ Sec',
        category: 'time',
        icon: 'clock-time-eight',
        preview: '12:30:45',
        createElement: () => ({
            type: 'digitalClock' as ElementType,
            name: 'Detailed Clock',
            transform: { x: 100, y: 100, width: 240, height: 60, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 0, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
            clockConfig: { format: '24h', showSeconds: true, showAmPm: false },
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'digital-clock-12h-sec',
        name: '12H w/ Sec',
        category: 'time',
        icon: 'clock-time-four',
        preview: '12:30:45 PM',
        createElement: () => ({
            type: 'digitalClock' as ElementType,
            name: '12H w/ Sec',
            transform: { x: 100, y: 100, width: 260, height: 60, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 0, fontWeight: '400', color: '#FFFFFF', textAlign: 'center' },
            clockConfig: { format: '12h', showSeconds: true, showAmPm: true },
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'analog-clock-modern',
        name: 'Analog Modern',
        category: 'time',
        icon: 'clock-outline',
        preview: 'Modern',
        createElement: () => ({
            type: 'analogClock' as ElementType,
            name: 'Analog Clock',
            transform: { x: 100, y: 100, width: 140, height: 140, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 16, fontWeight: '400', color: '#FFFFFF', textAlign: 'center' },  // Unused but required by type
            clockConfig: { faceStyle: 'modern', handStyle: 'modern', showSeconds: true, showNumbers: false, showTicks: true, hourHandColor: '#FFFFFF', minuteHandColor: '#FFFFFF', secondHandColor: '#FF5252' },
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'analog-clock-classic',
        name: 'Analog Classic',
        category: 'time',
        icon: 'clock',
        preview: 'Classic',
        createElement: () => ({
            type: 'analogClock' as ElementType,
            name: 'Classic Clock',
            transform: { x: 100, y: 100, width: 140, height: 140, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'rgba(255,255,255,0.1)', opacity: 1, cornerRadius: 70 },
            textStyle: { fontFamily: 'System', fontSize: 16, fontWeight: '400', color: '#FFFFFF', textAlign: 'center' },
            clockConfig: { faceStyle: 'classic', handStyle: 'classic', showSeconds: true, showNumbers: true, showTicks: true, hourHandColor: '#000000', minuteHandColor: '#000000', secondHandColor: '#FF0000', numberColor: '#000000' },
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'date-full',
        name: 'Full Date',
        category: 'time',
        icon: 'calendar',
        preview: '{date.dayName}, {date.monthName} {date.day}',
        createElement: () => ({
            type: 'text' as ElementType,
            name: 'Full Date',
            transform: { x: 100, y: 150, width: 280, height: 40, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 18, fontWeight: 'medium', color: '#FFFFFF', textAlign: 'center' },
            content: '{date.dayName}, {date.monthName} {date.day}',
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'greeting',
        name: 'Greeting',
        category: 'time',
        icon: 'hand-wave',
        preview: '{user.greeting}',
        createElement: () => ({
            type: 'text' as ElementType,
            name: 'Greeting',
            transform: { x: 100, y: 50, width: 200, height: 40, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 24, fontWeight: 'medium', color: '#FFFFFF', textAlign: 'left' },
            content: '{user.greeting}',
            visible: true,
            locked: false,
        }),
    },

    // Data Components
    {
        id: 'battery-percent',
        name: 'Battery %',
        category: 'data',
        icon: 'battery-70',
        preview: '{battery.level}%',
        createElement: () => ({
            type: 'text' as ElementType,
            name: 'Battery Level',
            transform: { x: 100, y: 100, width: 80, height: 40, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 24, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center' },
            content: '{battery.level}%',
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'weather-temp',
        name: 'Temperature',
        category: 'data',
        icon: 'thermometer',
        preview: '{weather.temp}°',
        createElement: () => ({
            type: 'text' as ElementType,
            name: 'Temperature',
            transform: { x: 100, y: 100, width: 100, height: 60, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 48, fontWeight: 'bold', color: '#FFC107', textAlign: 'center' },
            content: '{weather.temp}°',
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'weather-condition',
        name: 'Weather',
        category: 'data',
        icon: 'weather-partly-cloudy',
        preview: '{weather.condition}',
        createElement: () => ({
            type: 'text' as ElementType,
            name: 'Weather',
            transform: { x: 100, y: 160, width: 150, height: 30, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 16, fontWeight: 'normal', color: '#FFFFFF', textAlign: 'center' },
            content: '{weather.condition}',
            visible: true,
            locked: false,
        }),
    },

    // Media Components
    {
        id: 'music-title',
        name: 'Now Playing',
        category: 'media',
        icon: 'music',
        preview: '{music.title}',
        createElement: () => ({
            type: 'text' as ElementType,
            name: 'Now Playing',
            transform: { x: 100, y: 100, width: 200, height: 30, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 18, fontWeight: 'bold', color: '#E91E63', textAlign: 'left' },
            content: '{music.title}',
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'music-artist',
        name: 'Artist',
        category: 'media',
        icon: 'account-music',
        preview: '{music.artist}',
        createElement: () => ({
            type: 'text' as ElementType,
            name: 'Artist',
            transform: { x: 100, y: 130, width: 180, height: 24, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'transparent', opacity: 1 },
            textStyle: { fontFamily: 'System', fontSize: 14, fontWeight: 'normal', color: '#FFFFFF', textAlign: 'left' },
            content: '{music.artist}',
            visible: true,
            locked: false,
        }),
    },

    // Display Components (shapes with specific purposes)
    {
        id: 'glass-card',
        name: 'Glass Card',
        category: 'display',
        icon: 'card-outline',
        preview: 'Frosted backdrop',
        createElement: () => ({
            type: 'rectangle' as ElementType,
            name: 'Glass Card',
            transform: { x: 50, y: 50, width: 260, height: 140, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'rgba(255,255,255,0.15)', opacity: 0.8, cornerRadius: 24 },
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'accent-bar',
        name: 'Accent Bar',
        category: 'display',
        icon: 'minus',
        preview: 'Gradient accent',
        createElement: () => ({
            type: 'rectangle' as ElementType,
            name: 'Accent Bar',
            transform: { x: 80, y: 180, width: 200, height: 4, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: '#6750A4', opacity: 1, cornerRadius: 2 },
            visible: true,
            locked: false,
        }),
    },
    {
        id: 'icon-circle',
        name: 'Icon Circle',
        category: 'display',
        icon: 'circle-outline',
        preview: 'Icon backdrop',
        createElement: () => ({
            type: 'ellipse' as ElementType,
            name: 'Icon Circle',
            transform: { x: 160, y: 160, width: 56, height: 56, rotation: 0, scaleX: 1, scaleY: 1 },
            style: { fill: 'rgba(103,80,164,0.3)', opacity: 1 },
            visible: true,
            locked: false,
        }),
    },
];

// ============================================
// Palette Item Component
// ============================================

interface PaletteItemProps {
    item: WidgetPaletteItem;
    onPress: () => void;
}

const PaletteItem: React.FC<PaletteItemProps> = ({ item, onPress }) => {
    const colors = useColors();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withTiming(0.95, { duration: 60 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    const categoryColors = {
        time: colors.primary,
        data: colors.secondary,
        media: colors.tertiary,
        display: colors.outline,
    };

    const screenWidth = Dimensions.get('window').width;
    // Account for modal padding (16*2) and gap (12) — fit 2 items per row
    const itemWidth = (screenWidth - 32 - 16 - 12) / 2;

    return (
        <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
            <Animated.View
                style={[
                    styles.paletteItem,
                    { backgroundColor: colors.surfaceContainerHigh, width: itemWidth },
                    animatedStyle,
                ]}
            >
                <View style={[styles.iconContainer, { backgroundColor: categoryColors[item.category] + '20' }]}>
                    <MaterialCommunityIcons
                        name={item.icon}
                        size={24}
                        color={categoryColors[item.category]}
                    />
                </View>
                <TitleSmall style={{ color: colors.onSurface }} numberOfLines={1}>
                    {item.name}
                </TitleSmall>
                <BodySmall style={{ color: colors.onSurfaceVariant, fontFamily: 'monospace' }} numberOfLines={1}>
                    {item.preview}
                </BodySmall>
            </Animated.View>
        </Pressable>
    );
};

// ============================================
// Widget Palette Modal
// ============================================

interface WidgetPaletteModalProps {
    visible: boolean;
    onClose: () => void;
    onAddComponent: (element: Omit<CanvasElement, 'id'>) => void;
}

export const WidgetPaletteModal: React.FC<WidgetPaletteModalProps> = ({
    visible,
    onClose,
    onAddComponent,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const [activeCategory, setActiveCategory] = useState<'all' | 'time' | 'data' | 'media' | 'display'>('all');

    const filteredComponents = activeCategory === 'all'
        ? WIDGET_COMPONENTS
        : WIDGET_COMPONENTS.filter(c => c.category === activeCategory);

    const handleAddComponent = (item: WidgetPaletteItem) => {
        const element = item.createElement();
        onAddComponent(element);
        onClose();
    };

    const categories = [
        { id: 'all', label: 'All', icon: 'view-grid' as const },
        { id: 'time', label: 'Time', icon: 'clock' as const },
        { id: 'data', label: 'Data', icon: 'chart-bar' as const },
        { id: 'media', label: 'Media', icon: 'music' as const },
        { id: 'display', label: 'Display', icon: 'shape' as const },
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <TitleSmall style={{ color: colors.onSurface, flex: 1 }}>
                            Widget Components
                        </TitleSmall>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    {/* Category Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                        contentContainerStyle={styles.categoryContainer}
                    >
                        {categories.map(cat => (
                            <Pressable
                                key={cat.id}
                                onPress={() => {
                                    Haptics.selectionAsync();
                                    setActiveCategory(cat.id as any);
                                }}
                                style={[
                                    styles.categoryChip,
                                    {
                                        backgroundColor: activeCategory === cat.id
                                            ? colors.primaryContainer
                                            : colors.surfaceContainerHigh,
                                    },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name={cat.icon}
                                    size={16}
                                    color={activeCategory === cat.id ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                                />
                                <LabelSmall
                                    style={{
                                        color: activeCategory === cat.id ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                                    }}
                                >
                                    {cat.label}
                                </LabelSmall>
                            </Pressable>
                        ))}
                    </ScrollView>

                    {/* Components Grid */}
                    <ScrollView style={styles.componentsScroll} contentContainerStyle={styles.componentsGrid}>
                        {filteredComponents.map(item => (
                            <PaletteItem
                                key={item.id}
                                item={item}
                                onPress={() => handleAddComponent(item)}
                            />
                        ))}
                    </ScrollView>

                    {/* Hint */}
                    <View style={[styles.hintContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                        <MaterialCommunityIcons name="information" size={16} color={colors.onSurfaceVariant} />
                        <BodySmall style={{ color: colors.onSurfaceVariant, flex: 1 }}>
                            Data bindings like {'{time.formatted24}'} update in real-time when widget is active
                        </BodySmall>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        height: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryScroll: {
        maxHeight: 48,
    },
    categoryContainer: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    componentsScroll: {
        flex: 1,
    },
    componentsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    paletteItem: {
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 16,
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
});

export default WidgetPaletteModal;
