/**
 * WidgetCraft - Onboarding Screen
 * First-time user experience and feature introduction
 */

import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Pressable,
    FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    interpolate,
    interpolateColor,
    useAnimatedScrollHandler,
    Extrapolation,
    FadeIn,
    FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@theme/index';
import { HeadlineLarge, TitleLarge, BodyLarge, BodyMedium } from '@components/common';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// Types & Data
// ============================================

interface OnboardingSlide {
    id: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    description: string;
    gradient: [string, string];
    accentColor: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
    {
        id: 'welcome',
        icon: 'widgets',
        title: 'Welcome to WidgetCraft',
        description: 'Create stunning, personalized widgets for your home screen with our powerful editor.',
        gradient: ['#667eea', '#764ba2'],
        accentColor: '#D0BCFF',
    },
    {
        id: 'design',
        icon: 'palette',
        title: 'Design Your Way',
        description: 'Choose from beautiful templates or start from scratch with our intuitive canvas editor.',
        gradient: ['#FF512F', '#DD2476'],
        accentColor: '#FFB3C1',
    },
    {
        id: 'data',
        icon: 'chart-timeline-variant',
        title: 'Live Data Integration',
        description: 'Add real-time information like time, battery, weather, and music to your widgets.',
        gradient: ['#11998e', '#38ef7d'],
        accentColor: '#A7F3D0',
    },
    {
        id: 'export',
        icon: 'export-variant',
        title: 'Share & Export',
        description: 'Save your creations to the gallery, share with friends, or add directly to your home screen.',
        gradient: ['#2193b0', '#6dd5ed'],
        accentColor: '#A5F3FC',
    },
];

// ============================================
// Props
// ============================================

interface OnboardingScreenProps {
    onComplete: () => void;
}

// ============================================
// Slide Component
// ============================================

interface SlideProps {
    slide: OnboardingSlide;
    index: number;
    scrollX: Animated.SharedValue<number>;
}

const Slide: React.FC<SlideProps> = ({ slide, index, scrollX }) => {
    const colors = useColors();

    const animatedStyle = useAnimatedStyle(() => {
        const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
        ];

        const scale = interpolate(
            scrollX.value,
            inputRange,
            [0.8, 1, 0.8],
            Extrapolation.CLAMP
        );

        const opacity = interpolate(
            scrollX.value,
            inputRange,
            [0.5, 1, 0.5],
            Extrapolation.CLAMP
        );

        const translateY = interpolate(
            scrollX.value,
            inputRange,
            [30, 0, 30],
            Extrapolation.CLAMP
        );

        return {
            transform: [{ scale }, { translateY }],
            opacity,
        };
    });

    return (
        <View style={styles.slide}>
            <LinearGradient
                colors={slide.gradient}
                style={styles.slideGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <Animated.View style={[styles.slideContent, animatedStyle]}>
                <View style={[styles.iconContainer, { backgroundColor: slide.accentColor + '30' }]}>
                    <MaterialCommunityIcons
                        name={slide.icon}
                        size={64}
                        color={slide.accentColor}
                    />
                </View>
                <HeadlineLarge style={styles.slideTitle}>{slide.title}</HeadlineLarge>
                <BodyLarge style={styles.slideDescription}>{slide.description}</BodyLarge>
            </Animated.View>
        </View>
    );
};

// ============================================
// Pagination Dots
// ============================================

interface PaginationProps {
    scrollX: Animated.SharedValue<number>;
    totalSlides: number;
}

const Pagination: React.FC<PaginationProps> = ({ scrollX, totalSlides }) => {
    const colors = useColors();

    return (
        <View style={styles.pagination}>
            {Array.from({ length: totalSlides }).map((_, index) => {
                const animatedStyle = useAnimatedStyle(() => {
                    const inputRange = [
                        (index - 1) * SCREEN_WIDTH,
                        index * SCREEN_WIDTH,
                        (index + 1) * SCREEN_WIDTH,
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

                    return { width, opacity };
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            { backgroundColor: '#FFFFFF' },
                            animatedStyle,
                        ]}
                    />
                );
            })}
        </View>
    );
};

// ============================================
// Onboarding Screen
// ============================================

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);
    const [currentIndex, setCurrentIndex] = useState(0);

    const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isLastSlide) {
            onComplete();
        } else {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onComplete();
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    return (
        <View style={styles.container}>
            {/* Skip Button */}
            {!isLastSlide && (
                <Animated.View
                    entering={FadeIn.delay(500)}
                    style={[styles.skipButton, { top: insets.top + 16 }]}
                >
                    <Pressable onPress={handleSkip}>
                        <BodyMedium style={styles.skipText}>Skip</BodyMedium>
                    </Pressable>
                </Animated.View>
            )}

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={ONBOARDING_SLIDES}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <Slide slide={item} index={index} scrollX={scrollX} />
                )}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
            />

            {/* Bottom Section */}
            <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
                <Pagination scrollX={scrollX} totalSlides={ONBOARDING_SLIDES.length} />

                <Pressable
                    style={styles.nextButton}
                    onPress={handleNext}
                >
                    <BodyLarge style={styles.nextButtonText}>
                        {isLastSlide ? 'Get Started' : 'Next'}
                    </BodyLarge>
                    <MaterialCommunityIcons
                        name={isLastSlide ? 'check' : 'arrow-right'}
                        size={24}
                        color="#FFFFFF"
                    />
                </Pressable>
            </View>
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    skipButton: {
        position: 'absolute',
        right: 24,
        zIndex: 10,
    },
    skipText: {
        color: '#FFFFFF',
        opacity: 0.8,
    },
    slide: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    slideGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    slideContent: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    slideTitle: {
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    slideDescription: {
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 24,
    },
    bottomSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        gap: 24,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 16,
        borderRadius: 28,
        gap: 8,
    },
    nextButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
});

export default OnboardingScreen;
