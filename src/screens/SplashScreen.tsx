/**
 * WidgetCraft - Premium Splash Screen
 * Animated splash with logo reveal, MD3 loading indicator
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';
import { HeadlineLarge, BodyMedium, PremiumLoadingIndicator } from '@components/common';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const colors = useColors();

    // Animation values
    const logoScale = useSharedValue(0.3);
    const logoOpacity = useSharedValue(0);
    const logoRotate = useSharedValue(-45);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(20);
    const loaderOpacity = useSharedValue(0);

    useEffect(() => {
        // Logo animation
        logoScale.value = withTiming(1, { duration: 500 });
        logoOpacity.value = withTiming(1, { duration: 600 });
        logoRotate.value = withTiming(0, { duration: 500 });

        // Text animation
        textOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
        textTranslateY.value = withDelay(400, withTiming(0, { duration: 300 }));

        // Loading indicator appears after text
        loaderOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));

        // Finish splash
        const timer = setTimeout(onFinish, 2500);
        return () => clearTimeout(timer);
    }, []);

    const logoStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: logoScale.value },
            { rotate: `${logoRotate.value}deg` },
        ],
        opacity: logoOpacity.value,
    }));

    const textStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    const loaderStyle = useAnimatedStyle(() => ({
        opacity: loaderOpacity.value,
    }));

    return (
        <LinearGradient
            colors={[
                colors.surface,
                colors.surfaceContainerHighest,
                colors.primaryContainer,
            ] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.container}
        >
            <View style={styles.content}>
                {/* Logo Container */}
                <Animated.View style={[styles.logoContainer, logoStyle]}>
                    <View style={[styles.logoBackground, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <MaterialCommunityIcons
                            name="widgets-outline"
                            size={56}
                            color={colors.primary}
                        />
                    </View>
                </Animated.View>

                {/* App Name */}
                <Animated.View style={[styles.textContainer, textStyle]}>
                    <HeadlineLarge style={[styles.appName, { color: colors.onSurface }]}>WidgetCraft</HeadlineLarge>
                    <BodyMedium style={[styles.tagline, { color: colors.onSurfaceVariant }]}>Design Your World</BodyMedium>
                </Animated.View>

                {/* MD3 Loading Indicator */}
                <Animated.View style={[styles.loaderContainer, loaderStyle]}>
                    <PremiumLoadingIndicator
                        size={72}
                        indicatorColor={colors.primary}
                    />
                </Animated.View>
            </View>

            {/* Bottom branding */}
            <View style={styles.bottomBranding}>
                <BodyMedium style={[styles.brandingText, { color: colors.onSurfaceVariant }]}>Material Design 3</BodyMedium>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoContainer: {
        marginBottom: 24,
    },
    logoBackground: {
        width: 100,
        height: 100,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    textContainer: {
        alignItems: 'center',
    },
    appName: {
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    tagline: {
        marginTop: 6,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        fontSize: 12,
    },
    loaderContainer: {
        marginTop: 40,
    },
    bottomBranding: {
        position: 'absolute',
        bottom: 48,
    },
    brandingText: {
        fontSize: 12,
        letterSpacing: 1,
    },
});

export default SplashScreen;
