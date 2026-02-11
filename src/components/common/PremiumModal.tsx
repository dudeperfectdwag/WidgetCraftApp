/**
 * WidgetCraft - Premium Modal Component
 * Beautiful modals with blur backdrop and animations
 */

import React, { ReactNode, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal as RNModal,
    Pressable,
    ViewStyle,
    StyleProp,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import { LAYOUT } from '@constants/index';
import { TitleLarge, BodyMedium } from './Typography';
import { PremiumIconButton } from './PremiumIconButton';

// ============================================
// Types
// ============================================

export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

export interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    subtitle?: string;
    size?: ModalSize;
    showCloseButton?: boolean;
    closeOnBackdropPress?: boolean;
    enableBlur?: boolean;
    blurIntensity?: number;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    // Actions
    footer?: ReactNode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SIZE_CONFIG = {
    small: { width: SCREEN_WIDTH * 0.75, maxHeight: SCREEN_HEIGHT * 0.4 },
    medium: { width: SCREEN_WIDTH * 0.85, maxHeight: SCREEN_HEIGHT * 0.6 },
    large: { width: SCREEN_WIDTH * 0.92, maxHeight: SCREEN_HEIGHT * 0.8 },
    fullscreen: { width: SCREEN_WIDTH, maxHeight: SCREEN_HEIGHT },
};

// ============================================
// Component
// ============================================

export const PremiumModal: React.FC<PremiumModalProps> = ({
    visible,
    onClose,
    children,
    title,
    subtitle,
    size = 'medium',
    showCloseButton = true,
    closeOnBackdropPress = true,
    enableBlur = true,
    blurIntensity = 40,
    style,
    contentStyle,
    footer,
}) => {
    const colors = useColors();
    const scale = useSharedValue(0.9);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            scale.value = withTiming(1, { duration: 200 });
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            scale.value = withTiming(0.9, { duration: 150 });
            opacity.value = withTiming(0, { duration: 150 });
        }
    }, [visible]);

    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const animatedBackdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const handleBackdropPress = () => {
        if (closeOnBackdropPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClose();
        }
    };

    const sizeConfig = SIZE_CONFIG[size];
    const isFullscreen = size === 'fullscreen';

    return (
        <RNModal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.container}>
                    {/* Backdrop */}
                    <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
                        <Pressable style={styles.backdropPressable} onPress={handleBackdropPress}>
                            {enableBlur ? (
                                <BlurView intensity={blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
                            ) : (
                                <View
                                    style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                                />
                            )}
                        </Pressable>
                    </Animated.View>

                    {/* Modal Content */}
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                width: sizeConfig.width,
                                maxHeight: sizeConfig.maxHeight,
                                backgroundColor: colors.surfaceContainerHigh,
                                borderRadius: isFullscreen ? 0 : 28,
                            },
                            animatedContainerStyle,
                            style,
                        ]}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <View style={styles.header}>
                                <View style={styles.headerText}>
                                    {title && <TitleLarge>{title}</TitleLarge>}
                                    {subtitle && (
                                        <BodyMedium color="muted" style={styles.subtitle}>
                                            {subtitle}
                                        </BodyMedium>
                                    )}
                                </View>
                                {showCloseButton && (
                                    <PremiumIconButton
                                        icon="close"
                                        variant="standard"
                                        size="medium"
                                        onPress={onClose}
                                    />
                                )}
                            </View>
                        )}

                        {/* Content */}
                        <View style={[styles.content, contentStyle]}>{children}</View>

                        {/* Footer */}
                        {footer && <View style={styles.footer}>{footer}</View>}
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </RNModal>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    backdropPressable: {
        flex: 1,
    },
    modalContainer: {
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: LAYOUT.SPACING.lg,
        paddingTop: LAYOUT.SPACING.lg,
        paddingBottom: LAYOUT.SPACING.sm,
    },
    headerText: {
        flex: 1,
        marginRight: LAYOUT.SPACING.sm,
    },
    subtitle: {
        marginTop: 4,
    },
    content: {
        paddingHorizontal: LAYOUT.SPACING.lg,
        paddingBottom: LAYOUT.SPACING.lg,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: LAYOUT.SPACING.sm,
        paddingHorizontal: LAYOUT.SPACING.lg,
        paddingBottom: LAYOUT.SPACING.lg,
        paddingTop: LAYOUT.SPACING.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
});

export default PremiumModal;
