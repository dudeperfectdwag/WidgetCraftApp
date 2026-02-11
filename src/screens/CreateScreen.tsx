/**
 * WidgetCraft - Create Screen
 * Quick create interface with MD3 Glassmorphism Design
 * Uses  You dynamic colors throughout
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Dimensions, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors, useTheme } from '@theme/index';
import {
    PremiumChip,
    HeadlineMedium,
    TitleLarge,
    TitleMedium,
    TitleSmall,
    BodyLarge,
    BodyMedium,
    BodySmall,
    LabelMedium,
    LabelSmall,
} from '@components/common';
import { RootStackParamList } from '@navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

// Create Option Card
interface CreateOptionProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    description: string;
    bgColor: string;
    iconColor: string;
    onPress: () => void;
}

const CreateOption: React.FC<CreateOptionProps> = ({ icon, title, description, bgColor, iconColor, onPress }) => {
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
            onPressIn={() => { scale.value = withTiming(0.97, { duration: 60 }); }}
            onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
        >
            <Animated.View style={animatedStyle}>
                <GlassCard style={styles.optionCard}>
                    {/* Icon */}
                    <View style={[styles.optionIcon, { backgroundColor: bgColor }]}>
                        <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
                    </View>

                    {/* Text */}
                    <View style={styles.optionContent}>
                        <TitleMedium style={{ color: colors.onSurface }}>{title}</TitleMedium>
                        <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                            {description}
                        </BodySmall>
                    </View>

                    {/* Chevron */}
                    <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color={colors.onSurfaceVariant}
                    />
                </GlassCard>
            </Animated.View>
        </Pressable>
    );
};

// Hero Create Card
interface HeroCardProps {
    title: string;
    description: string;
    bgColor: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    onPress: () => void;
}

const HeroCard: React.FC<HeroCardProps> = ({ title, description, bgColor, icon, onPress }) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPress();
            }}
            onPressIn={() => {
                scale.value = withTiming(0.97, { duration: 60 });
            }}
            onPressOut={() => {
                scale.value = withTiming(1, { duration: 100 });
            }}
        >
            <Animated.View style={[styles.heroCard, animatedStyle]}>
                <View style={[styles.heroBg, { backgroundColor: bgColor }]}>
                    {/* Glass overlay */}
                    <View style={styles.heroOverlay} />
                    {/* Decorative elements */}
                    <View style={[styles.heroDecor1, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
                    <View style={[styles.heroDecor2, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />

                    <View style={styles.heroContent}>
                        <View style={styles.heroIcon}>
                            <MaterialCommunityIcons name={icon} size={32} color="#FFFFFF" />
                        </View>
                        <TitleLarge style={{ color: '#FFFFFF', marginTop: 16 }}>{title}</TitleLarge>
                        <BodyMedium style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8 }}>
                            {description}
                        </BodyMedium>
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
};

// Main Create Screen
export const CreateScreen: React.FC = () => {
    const colors = useColors();
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();

    const handleBlankWidget = () => {
        navigation.navigate('Editor', {});
    };

    const handleFromTemplate = () => {
        // Navigate to Templates tab
        navigation.navigate('MainTabs', { screen: 'TemplatesTab' });
    };

    const handleImportDesign = () => {
        Alert.alert(
            'Import Design',
            'Import from file or URL coming soon!',
            [{ text: 'OK' }]
        );
    };

    const handleScriptWidget = () => {
        navigation.navigate('ScriptEditor', { widgetId: '' });
    };

    const options = [
        {
            icon: 'view-grid' as const,
            title: 'From Template',
            description: 'Start with a pre-built design',
            bgColor: colors.secondaryContainer,
            iconColor: colors.onSecondaryContainer,
            onPress: handleFromTemplate,
        },
        {
            icon: 'puzzle' as const,
            title: 'Import Design',
            description: 'Import from file or URL',
            bgColor: colors.tertiaryContainer,
            iconColor: colors.onTertiaryContainer,
            onPress: handleImportDesign,
        },
        {
            icon: 'code-braces' as const,
            title: 'Script Widget',
            description: 'Create with custom JavaScript',
            bgColor: colors.surfaceContainerHighest,
            iconColor: colors.onSurfaceVariant,
            onPress: handleScriptWidget,
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <HeadlineMedium style={{ color: colors.onSurface }}>Create</HeadlineMedium>
                    <BodyMedium style={{ color: colors.onSurfaceVariant, marginTop: 4 }}>
                        Start a new widget project
                    </BodyMedium>
                </View>

                {/* Hero Card - Blank Widget */}
                <View style={styles.heroSection}>
                    <HeroCard
                        title="Blank Widget"
                        description="Start from scratch with a blank canvas and build your dream widget"
                        bgColor={colors.primary}
                        icon="shape-plus"
                        onPress={handleBlankWidget}
                    />
                </View>

                {/* Other Options */}
                <View style={styles.optionsSection}>
                    <TitleSmall style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                        OTHER OPTIONS
                    </TitleSmall>
                    <View style={styles.optionsContainer}>
                        {options.map((option, index) => (
                            <CreateOption key={index} {...option} />
                        ))}
                    </View>
                </View>

                {/* Recent Templates */}
                <View style={styles.recentSection}>
                    <TitleSmall style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                        RECENT TEMPLATES
                    </TitleSmall>
                    <GlassCard style={styles.emptyState}>
                        <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
                            <MaterialCommunityIcons name="history" size={32} color={colors.onSurfaceVariant} />
                        </View>
                        <BodyMedium style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 12 }}>
                            Your recently used templates will appear here
                        </BodyMedium>
                    </GlassCard>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
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
        marginBottom: 24,
    },
    glassCard: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    heroSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    heroCard: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    heroBg: {
        padding: 24,
        minHeight: 180,
        overflow: 'hidden',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    heroDecor1: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 160,
        height: 160,
        borderRadius: 80,
    },
    heroDecor2: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    heroContent: {
        zIndex: 1,
    },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsSection: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionLabel: {
        marginBottom: 12,
        letterSpacing: 1,
    },
    optionsContainer: {
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    optionIcon: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
    },
    recentSection: {
        paddingHorizontal: 24,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CreateScreen;