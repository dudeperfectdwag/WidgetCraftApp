/**
 * WidgetCraft - Shape Picker Modal
 * MD3-compliant shape selection with 45+ shapes
 * Supports: basic shapes, geometric, arrows, symbols, containers, communication, decorative
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Modal, Dimensions, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Rect, Ellipse, Polygon } from 'react-native-svg';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@theme/index';
import { TitleMedium, BodySmall, LabelSmall } from '@components/common';
import {
    getShapeCategories,
    getShapesByCategory,
    generateCornerPath,
    MD3_SHAPE_PRESETS,
    type ShapePreset,
} from '@canvas/MD3Shapes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Types
// ============================================

interface ShapePickerModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectShape: (shape: ShapePreset) => void;
}

// ============================================
// Category Icons & Labels
// ============================================

const CATEGORY_INFO: Record<string, { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }> = {
    basic: { icon: 'shape-outline', label: 'Basic' },
    geometric: { icon: 'hexagon-outline', label: 'Geometric' },
    arrows: { icon: 'arrow-right-bold-outline', label: 'Arrows' },
    symbols: { icon: 'star-outline', label: 'Symbols' },
    containers: { icon: 'card-outline', label: 'Containers' },
    communication: { icon: 'message-outline', label: 'Communication' },
    decorative: { icon: 'heart-outline', label: 'Decorative' },
};

// ============================================
// Shape Preview Component
// ============================================

interface ShapePreviewProps {
    shape: ShapePreset;
    size?: number;
    color?: string;
}

const ShapePreview: React.FC<ShapePreviewProps> = ({ shape, size = 40, color = '#FFFFFF' }) => {
    const renderShape = () => {
        const padding = 4;
        const innerSize = size - padding * 2;

        switch (shape.type) {
            case 'rectangle': {
                const cornerConfig = shape.cornerConfig;
                if (cornerConfig) {
                    // Calculate scaled corner radius
                    const maxRadius = innerSize / 2;
                    const tl = Math.min(cornerConfig.topLeft, maxRadius);
                    const tr = Math.min(cornerConfig.topRight, maxRadius);
                    const br = Math.min(cornerConfig.bottomRight, maxRadius);
                    const bl = Math.min(cornerConfig.bottomLeft, maxRadius);
                    const allSame = tl === tr && tr === br && br === bl;
                    
                    if (allSame && cornerConfig.family === 'rounded') {
                        return (
                            <Rect
                                x={padding}
                                y={padding}
                                width={innerSize}
                                height={innerSize}
                                rx={tl}
                                fill={color}
                            />
                        );
                    } else {
                        const path = generateCornerPath(innerSize, innerSize, cornerConfig);
                        return (
                            <Path
                                d={path}
                                fill={color}
                                transform={`translate(${padding}, ${padding})`}
                            />
                        );
                    }
                }
                return (
                    <Rect
                        x={padding}
                        y={padding}
                        width={innerSize}
                        height={innerSize}
                        fill={color}
                    />
                );
            }

            case 'ellipse':
                return (
                    <Ellipse
                        cx={size / 2}
                        cy={size / 2}
                        rx={innerSize / 2}
                        ry={innerSize / 2}
                        fill={color}
                    />
                );

            case 'polygon': {
                const sides = shape.properties?.sides || 6;
                const rotation = shape.properties?.rotation || 0;
                const cx = size / 2;
                const cy = size / 2;
                const radius = innerSize / 2;
                
                const points = Array.from({ length: sides }, (_, i) => {
                    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2 + (rotation * Math.PI) / 180;
                    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
                }).join(' ');
                
                return <Polygon points={points} fill={color} />;
            }

            case 'star': {
                const numPoints = shape.properties?.points || 5;
                const innerRadius = shape.properties?.innerRadius || 0.4;
                const cx = size / 2;
                const cy = size / 2;
                const outerRadius = innerSize / 2;
                const inner = outerRadius * innerRadius;
                
                const points = Array.from({ length: numPoints * 2 }, (_, i) => {
                    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
                    const r = i % 2 === 0 ? outerRadius : inner;
                    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                }).join(' ');
                
                return <Polygon points={points} fill={color} />;
            }

            case 'path': {
                if (shape.path) {
                    // Scale path from 0-1 to actual size
                    const scaledPath = shape.path.replace(
                        /([0-9]*\.?[0-9]+)/g,
                        (match: string) => {
                            const num = parseFloat(match);
                            return String(num * innerSize + padding);
                        }
                    );
                    return <Path d={scaledPath} fill={color} />;
                }
                // For cut corner rectangles
                if (shape.cornerConfig) {
                    const path = generateCornerPath(innerSize, innerSize, shape.cornerConfig);
                    return (
                        <Path
                            d={path}
                            fill={color}
                            transform={`translate(${padding}, ${padding})`}
                        />
                    );
                }
                return null;
            }

            default:
                return null;
        }
    };

    return (
        <Svg width={size} height={size}>
            {renderShape()}
        </Svg>
    );
};

// ============================================
// Shape Card Component
// ============================================

interface ShapeCardProps {
    shape: ShapePreset;
    onSelect: (shape: ShapePreset) => void;
    primaryColor: string;
    surfaceColor: string;
}

const ShapeCard: React.FC<ShapeCardProps> = ({
    shape,
    onSelect,
    primaryColor,
    surfaceColor,
}) => {
    const colors = useColors();
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withTiming(0.95, { duration: 60 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(shape);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Pressable
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.shapeCard,
                    { backgroundColor: surfaceColor, borderColor: colors.outlineVariant },
                ]}
            >
                <View style={[styles.shapePreviewContainer, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <ShapePreview shape={shape} size={48} color={primaryColor} />
                </View>
                <LabelSmall style={[styles.shapeName, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                    {shape.name}
                </LabelSmall>
            </Pressable>
        </Animated.View>
    );
};

// ============================================
// Category Tab Component
// ============================================

interface CategoryTabProps {
    category: string;
    isActive: boolean;
    onPress: () => void;
}

const CategoryTab: React.FC<CategoryTabProps> = ({ category, isActive, onPress }) => {
    const colors = useColors();
    const info = CATEGORY_INFO[category];

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.categoryTab,
                {
                    backgroundColor: isActive ? colors.secondaryContainer : 'transparent',
                },
            ]}
        >
            <MaterialCommunityIcons
                name={info?.icon || 'shape-outline'}
                size={20}
                color={isActive ? colors.onSecondaryContainer : colors.onSurfaceVariant}
            />
            <BodySmall
                style={{
                    color: isActive ? colors.onSecondaryContainer : colors.onSurfaceVariant,
                    marginLeft: 6,
                }}
            >
                {info?.label || category}
            </BodySmall>
        </Pressable>
    );
};

// ============================================
// Shape Picker Modal
// ============================================

export const ShapePickerModal: React.FC<ShapePickerModalProps> = ({
    visible,
    onClose,
    onSelectShape,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const [activeCategory, setActiveCategory] = useState<string>('basic');
    const [searchQuery, setSearchQuery] = useState('');
    
    const categories = useMemo(() => getShapeCategories(), []);
    
    const shapesInCategory = useMemo(() => {
        if (searchQuery.trim()) {
            // Search all shapes
            const query = searchQuery.toLowerCase();
            return MD3_SHAPE_PRESETS.filter(shape => 
                shape.name.toLowerCase().includes(query) ||
                shape.category.toLowerCase().includes(query)
            );
        }
        return getShapesByCategory(activeCategory as ShapePreset['category']);
    }, [activeCategory, searchQuery]);

    const handleSelectShape = useCallback((shape: ShapePreset) => {
        onSelectShape(shape);
        onClose();
        setSearchQuery('');
    }, [onSelectShape, onClose]);

    const handleClose = useCallback(() => {
        onClose();
        setSearchQuery('');
    }, [onClose]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View
                    style={[
                        styles.modalContainer,
                        {
                            backgroundColor: colors.surfaceContainerLow,
                            paddingBottom: insets.bottom + 16,
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
                        <TitleMedium style={{ color: colors.onSurface }}>
                            Add Shape ({MD3_SHAPE_PRESETS.length} shapes)
                        </TitleMedium>
                        <Pressable onPress={handleClose} style={styles.closeButton}>
                            <MaterialCommunityIcons
                                name="close"
                                size={24}
                                color={colors.onSurfaceVariant}
                            />
                        </Pressable>
                    </View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: colors.surfaceContainer }]}>
                        <MaterialCommunityIcons name="magnify" size={20} color={colors.onSurfaceVariant} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.onSurface }]}
                            placeholder="Search shapes..."
                            placeholderTextColor={colors.onSurfaceVariant}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <Pressable onPress={() => setSearchQuery('')}>
                                <MaterialCommunityIcons name="close-circle" size={18} color={colors.onSurfaceVariant} />
                            </Pressable>
                        )}
                    </View>

                    {/* Category Tabs - hide when searching */}
                    {!searchQuery && (
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoryScroll}
                            contentContainerStyle={styles.categoryScrollContent}
                        >
                            {categories.map((category) => (
                                <CategoryTab
                                    key={category}
                                    category={category}
                                    isActive={activeCategory === category}
                                    onPress={() => {
                                        Haptics.selectionAsync();
                                        setActiveCategory(category);
                                    }}
                                />
                            ))}
                        </ScrollView>
                    )}

                    {/* Shape Grid */}
                    <ScrollView
                        style={styles.shapeGrid}
                        contentContainerStyle={styles.shapeGridContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.shapeGridInner}>
                            {shapesInCategory.map((shape) => (
                                <ShapeCard
                                    key={shape.id}
                                    shape={shape}
                                    onSelect={handleSelectShape}
                                    primaryColor={colors.primary}
                                    surfaceColor={colors.surfaceContainer}
                                />
                            ))}
                        </View>
                    </ScrollView>
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
        height: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    closeButton: {
        padding: 8,
        margin: -8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 0,
    },
    categoryScroll: {
        maxHeight: 56,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
    },
    categoryScrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
    },
    shapeGrid: {
        flex: 1,
    },
    shapeGridContent: {
        padding: 16,
    },
    shapeGridInner: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    shapeCard: {
        width: (SCREEN_WIDTH - 64) / 3,
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    shapePreviewContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    shapeName: {
        textAlign: 'center',
    },
});

export default ShapePickerModal;
