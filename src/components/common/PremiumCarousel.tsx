/**
 * WidgetCraft - Premium Carousel Component
 * Material Design 3 Expressive Carousel with:
 * - Multi-browse, uncontained, hero, and full-screen layouts
 * - Dynamic item sizing (large/medium/)
 * - Parallax scrolling effect
 * - 28dp corner radius per MD3 spec
 * - Snap scrolling with haptic feedback
 */

import React, { useCallback, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Pressable,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolation,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';
import { TitleMedium, BodyMedium, LabelMedium } from './Typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// Types
// ============================================

export type CarouselLayout = 'multi-browse' | 'uncontained' | 'hero' | 'full-screen' | 'center-aligned';
export type CarouselAlignment = 'start' | 'center';

export interface CarouselItem {
    id: string;
    title?: string;
    subtitle?: string;
    image?: string;
    gradient?: [string, string];
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress?: () => void;
}

export interface PremiumCarouselProps {
    items: CarouselItem[];
    layout?: CarouselLayout;
    alignment?: CarouselAlignment;
    height?: number;
    showLabels?: boolean;
    autoPlay?: boolean;
    autoPlayInterval?: number;
    onItemPress?: (item: CarouselItem, index: number) => void;
    onIndexChange?: (index: number) => void;
    style?: StyleProp<ViewStyle>;
}

// ============================================
// Layout Configurations (per MD3 spec)
// ============================================

const LAYOUT_CONFIG = {
    'multi-browse': {
        largeItemWidth: SCREEN_WIDTH * 0.7,
        mediumItemWidth: SCREEN_WIDTH * 0.25,
        smallItemWidth: 56, // 40-56dp per spec
        gap: 8,
        padding: 16,
    },
    'uncontained': {
        largeItemWidth: SCREEN_WIDTH * 0.85,
        gap: 8,
        padding: 16,
    },
    'hero': {
        largeItemWidth: SCREEN_WIDTH * 0.8,
        smallItemWidth: 56,
        gap: 8,
        padding: 16,
    },
    'center-aligned': {
        largeItemWidth: SCREEN_WIDTH * 0.7,
        smallItemWidth: 56,
        gap: 8,
        padding: 16,
    },
    'full-screen': {
        largeItemWidth: SCREEN_WIDTH,
        gap: 0,
        padding: 0,
    },
};

const CORNER_RADIUS = 28; // MD3 spec: 28dp

// ============================================
// Carousel Item Component
// ============================================

interface CarouselItemViewProps {
    item: CarouselItem;
    index: number;
    scrollX: Animated.SharedValue<number>;
    itemWidth: number;
    height: number;
    totalItems: number;
    layout: CarouselLayout;
    onPress?: () => void;
}

const CarouselItemView: React.FC<CarouselItemViewProps> = ({
    item,
    index,
    scrollX,
    itemWidth,
    height,
    totalItems,
    layout,
    onPress,
}) => {
    const colors = useColors();
    const scale = useSharedValue(1);

    const inputRange = [
        (index - 1) * itemWidth,
        index * itemWidth,
        (index + 1) * itemWidth,
    ];

    // Parallax effect for item content
    const animatedContentStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            scrollX.value,
            inputRange,
            [30, 0, -30],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ translateX }],
        };
    });

    // Scale effect for items moving in/out of focus
    const animatedContainerStyle = useAnimatedStyle(() => {
        const itemScale = interpolate(
            scrollX.value,
            inputRange,
            [0.9, 1, 0.9],
            Extrapolation.CLAMP
        );
        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.7, 1, 0.7],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale: itemScale * scale.value }],
            opacity,
        };
    });

    const handlePressIn = () => {
        scale.value = withTiming(0.95, { duration: 60 });
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
    };

    const defaultGradient: [string, string] = item.gradient || [colors.primary, colors.tertiary];

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
        >
            <Animated.View
                style={[
                    styles.carouselItem,
                    { width: itemWidth, height },
                    animatedContainerStyle,
                ]}
            >
                <LinearGradient
                    colors={defaultGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.itemGradient, { borderRadius: CORNER_RADIUS }]}
                >
                    {/* Decorative elements */}
                    <View style={styles.itemDecor}>
                        <View style={[styles.decorShape, styles.decorShape1]} />
                        <View style={[styles.decorShape, styles.decorShape2]} />
                    </View>

                    {/* Content with parallax effect */}
                    <Animated.View style={[styles.itemContent, animatedContentStyle]}>
                        {item.icon && (
                            <View style={styles.itemIconContainer}>
                                <MaterialCommunityIcons
                                    name={item.icon}
                                    size={40}
                                    color="#FFFFFF"
                                />
                            </View>
                        )}
                        {item.title && (
                            <TitleMedium style={styles.itemTitle}>{item.title}</TitleMedium>
                        )}
                        {item.subtitle && (
                            <BodyMedium style={styles.itemSubtitle}>{item.subtitle}</BodyMedium>
                        )}
                    </Animated.View>
                </LinearGradient>
            </Animated.View>
        </Pressable>
    );
};

// ============================================
// Pagination Dots
// ============================================

interface PaginationDotsProps {
    count: number;
    scrollX: Animated.SharedValue<number>;
    itemWidth: number;
}

const PaginationDots: React.FC<PaginationDotsProps> = ({ count, scrollX, itemWidth }) => {
    const colors = useColors();

    return (
        <View style={styles.paginationContainer}>
            {Array.from({ length: count }).map((_, index) => {
                const animatedDotStyle = useAnimatedStyle(() => {
                    const inputRange = [
                        (index - 1) * itemWidth,
                        index * itemWidth,
                        (index + 1) * itemWidth,
                    ];

                    const width = interpolate(
                        scrollX.value,
                        inputRange,
                        [8, 24, 8],
                        Extrapolation.CLAMP
                    );
                    const opacity = interpolate(
                        scrollX.value,
                        inputRange,
                        [0.4, 1, 0.4],
                        Extrapolation.CLAMP
                    );

                    return {
                        width,
                        opacity,
                    };
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.paginationDot,
                            { backgroundColor: colors.primary },
                            animatedDotStyle,
                        ]}
                    />
                );
            })}
        </View>
    );
};

// ============================================
// Main Carousel Component
// ============================================

export const PremiumCarousel: React.FC<PremiumCarouselProps> = ({
    items,
    layout = 'hero',
    alignment = 'start',
    height = 200,
    showLabels = false,
    autoPlay = false,
    autoPlayInterval = 3000,
    onItemPress,
    onIndexChange,
    style,
}) => {
    const colors = useColors();
    const scrollX = useSharedValue(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<Animated.ScrollView>(null);

    const config = LAYOUT_CONFIG[layout];
    const itemWidth = config.largeItemWidth;
    const snapInterval = itemWidth + config.gap;

    const triggerHaptic = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const updateIndex = useCallback((index: number) => {
        setCurrentIndex(index);
        onIndexChange?.(index);
    }, [onIndexChange]);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
        onMomentumEnd: (event) => {
            const newIndex = Math.round(event.contentOffset.x / snapInterval);
            runOnJS(updateIndex)(newIndex);
            runOnJS(triggerHaptic)();
        },
    });

    // Auto-play functionality
    React.useEffect(() => {
        if (!autoPlay) return;

        const timer = setInterval(() => {
            const nextIndex = (currentIndex + 1) % items.length;
            scrollViewRef.current?.scrollTo({
                x: nextIndex * snapInterval,
                animated: true,
            });
            setCurrentIndex(nextIndex);
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [autoPlay, autoPlayInterval, currentIndex, items.length, snapInterval]);

    return (
        <View style={[styles.container, style]}>
            <Animated.ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={snapInterval}
                snapToAlignment={alignment}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingHorizontal: config.padding, gap: config.gap },
                ]}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
            >
                {items.map((item, index) => (
                    <CarouselItemView
                        key={item.id}
                        item={item}
                        index={index}
                        scrollX={scrollX}
                        itemWidth={itemWidth}
                        height={height}
                        totalItems={items.length}
                        layout={layout}
                        onPress={() => onItemPress?.(item, index)}
                    />
                ))}
            </Animated.ScrollView>

            {/* Pagination */}
            <PaginationDots
                count={items.length}
                scrollX={scrollX}
                itemWidth={snapInterval}
            />
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    scrollContent: {
        paddingVertical: 8,
    },
    carouselItem: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
    itemGradient: {
        flex: 1,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        padding: 20,
    },
    itemDecor: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    decorShape: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    decorShape1: {
        width: 120,
        height: 120,
        top: -30,
        right: -30,
    },
    decorShape2: {
        width: 80,
        height: 80,
        bottom: 40,
        left: -20,
    },
    itemContent: {
        gap: 8,
    },
    itemIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemTitle: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    itemSubtitle: {
        color: 'rgba(255,255,255,0.8)',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    paginationDot: {
        height: 8,
        borderRadius: 4,
    },
});

export default PremiumCarousel;
