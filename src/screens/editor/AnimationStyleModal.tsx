/**
 * WidgetCraft - Animation Style Modal
 * Modal for customizing widget animations
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Pressable,
} from 'react-native';
import { useColors } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BodySmall, LabelLarge, TitleMedium } from '@components/common/Typography';
import { PremiumSlider } from '@components/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import { AnimationConfig, AnimationType, EasingType } from '../../effects/AnimationBuilder';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    withSequence,
    withDelay,
    cancelAnimation,
    Easing
} from 'react-native-reanimated';

interface AnimationStyleModalProps {
    visible: boolean;
    onClose: () => void;
    currentConfig?: AnimationConfig;
    onApply: (config: AnimationConfig | undefined) => void;
}

const ANIMATION_TYPES: { id: AnimationType; label: string; icon: string }[] = [
    { id: 'none', label: 'None', icon: 'block-helper' },
    { id: 'fadeIn', label: 'Fade In', icon: 'transition-masked' },
    { id: 'fadeOut', label: 'Fade Out', icon: 'transition-masked' },
    { id: 'scaleIn', label: 'Scale In', icon: 'arrow-expand' },
    { id: 'scaleOut', label: 'Scale Out', icon: 'arrow-collapse' },
    { id: 'slideUp', label: 'Slide Up', icon: 'arrow-up' },
    { id: 'slideDown', label: 'Slide Down', icon: 'arrow-down' },
    { id: 'slideLeft', label: 'Slide Left', icon: 'arrow-left' },
    { id: 'slideRight', label: 'Slide Right', icon: 'arrow-right' },
    { id: 'bounce', label: 'Bounce', icon: 'volleyball' },
    { id: 'pulse', label: 'Pulse', icon: 'pulse' },
    { id: 'shake', label: 'Shake', icon: 'vibrate' },
    { id: 'spin', label: 'Spin', icon: 'reload' },
];

const EASING_TYPES: { id: EasingType; label: string }[] = [
    { id: 'linear', label: 'Linear' },
    { id: 'ease', label: 'Ease' },
    { id: 'easeIn', label: 'Ease In' },
    { id: 'easeOut', label: 'Ease Out' },
    { id: 'easeInOut', label: 'Ease In Out' },
    { id: 'bounce', label: 'Bounce' },
    { id: 'elastic', label: 'Elastic' },
];

export const AnimationStyleModal: React.FC<AnimationStyleModalProps> = ({
    visible,
    onClose,
    currentConfig,
    onApply,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    
    // State
    const [type, setType] = useState<AnimationType>(currentConfig?.type ?? 'none');
    const [duration, setDuration] = useState(currentConfig?.duration ?? 1000);
    const [delay, setDelay] = useState(currentConfig?.delay ?? 0);
    const [loop, setLoop] = useState(currentConfig?.repeat === -1);
    const [reverse, setReverse] = useState(currentConfig?.reverse ?? false);
    const [easing, setEasing] = useState<EasingType>(currentConfig?.easing ?? 'linear');

    // Preview Animation Helper
    // We want a small box that demonstrates the selected animation continuously
    const previewScale = useSharedValue(1);
    const previewOpacity = useSharedValue(1);
    const previewTransX = useSharedValue(0);
    const previewTransY = useSharedValue(0);
    const previewRotation = useSharedValue(0);

    // Trigger preview when settings change
    useEffect(() => {
        if (visible) {
            const resetPreview = () => {
                cancelAnimation(previewScale);
                cancelAnimation(previewOpacity);
                cancelAnimation(previewTransX);
                cancelAnimation(previewTransY);
                cancelAnimation(previewRotation);

                previewScale.value = 1;
                previewOpacity.value = 1;
                previewTransX.value = 0;
                previewTransY.value = 0;
                previewRotation.value = 0;
            };

            const runPreview = () => {
                resetPreview();
                if (type === 'none') return;
                
                // Very basic preview logic
                const animDuration = duration || 1000;
                // Simple easing mapping
                const getEasing = (t: EasingType) => {
                    switch(t) {
                        case 'linear': return Easing.linear;
                        case 'bounce': return Easing.bounce;
                        case 'elastic': return Easing.elastic(1);
                        default: return Easing.inOut(Easing.ease);
                    }
                };

                const animConfig = { duration: animDuration, easing: getEasing(easing) };
                const withLoop = (anim: any) => loop ? withRepeat(anim, -1, reverse) : anim;

                switch (type) {
                    case 'fadeIn':
                        previewOpacity.value = 0;
                        previewOpacity.value = withLoop(withTiming(1, animConfig));
                        break;
                    case 'scaleIn':
                        previewScale.value = 0;
                        previewScale.value = withLoop(withTiming(1, animConfig));
                        break;
                    case 'pulse':
                        previewScale.value = withLoop(withSequence(withTiming(1.2, animConfig), withTiming(1, animConfig)));
                        break;
                    case 'spin':
                        previewRotation.value = withLoop(withTiming(360, animConfig));
                        break;
                     case 'slideUp':
                        previewTransY.value = 50;
                        previewTransY.value = withLoop(withTiming(0, animConfig));
                        break;
                     // Add others as needed for preview
                     default:
                        // Generic 'pop' for others
                        previewScale.value = withSequence(withTiming(1.2, { duration: 200 }), withTiming(1, { duration: 200 }));
                }
            };

             // Run after a small delay to let UI settle
             const timer = setTimeout(runPreview, 100);
             return () => clearTimeout(timer);
        }
    }, [visible, type, duration, loop, reverse, easing, previewScale, previewOpacity, previewTransX, previewTransY, previewRotation]);

    // Reset state when modal opens

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            if (currentConfig) {
                setType(currentConfig.type);
                setDuration(currentConfig.duration ?? 1000);
                setDelay(currentConfig.delay ?? 0);
                setLoop(currentConfig.repeat === -1);
                setReverse(currentConfig.reverse ?? false);
                setEasing(currentConfig.easing ?? 'linear');
            } else {
                setType('none');
                setDuration(1000);
                setDelay(0);
                setLoop(false);
                setReverse(false);
                setEasing('linear');
            }
        }
    }, [visible, currentConfig]);

    const handleApply = () => {
        if (type === 'none') {
            onApply(undefined);
        } else {
            const config: AnimationConfig = {
                type,
                duration,
                delay,
                repeat: loop ? -1 : 1, // Basic support for now: once or infinite
                reverse,
                easing,
            };
            onApply(config);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
    };

    const previewStyle = useAnimatedStyle(() => {
        return {
            opacity: previewOpacity.value,
            transform: [
                { translateX: previewTransX.value },
                { translateY: previewTransY.value },
                { scale: previewScale.value },
                { rotate: `${previewRotation.value}deg` },
            ],
        };
    });

    return (
        <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                            <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
                        </TouchableOpacity>
                        <TitleMedium style={{ color: colors.onSurface }}>Animation</TitleMedium>
                        <TouchableOpacity onPress={handleApply} style={styles.headerButton}>
                            <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Preview Box */}
                         <View style={styles.previewSection}>
                             <View style={[styles.previewContainer, { backgroundColor: colors.surfaceVariant }]}>
                                 <Animated.View style={[
                                     styles.previewObject, 
                                     { backgroundColor: colors.primary },
                                     previewStyle
                                 ]}>
                                     <MaterialCommunityIcons name="star" size={32} color={colors.onPrimary} />
                                 </Animated.View>
                             </View>
                        </View>

                        {/* Animation Type Selection */}
                        <View style={styles.section}>
                            <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                Effect
                            </LabelLarge>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeList}>
                                {ANIMATION_TYPES.map((t) => (
                                    <TouchableOpacity
                                        key={t.id}
                                        style={[
                                            styles.typeButton,
                                            {
                                                backgroundColor: type === t.id ? colors.primaryContainer : colors.surfaceVariant,
                                                borderColor: type === t.id ? colors.primary : 'transparent',
                                            },
                                        ]}
                                        onPress={() => {
                                            setType(t.id);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={t.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                                            size={24}
                                            color={type === t.id ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                                        />
                                        <BodySmall
                                            style={{
                                                color: type === t.id ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                                                marginTop: 4,
                                                textAlign: 'center'
                                            }}
                                        >
                                            {t.label}
                                        </BodySmall>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {type !== 'none' && (
                            <>
                                {/* Controls */}
                                <View style={styles.section}>
                                    <View style={styles.controlRow}>
                                        <LabelLarge style={{ color: colors.onSurface, flex: 1 }}>Duration: {duration}ms</LabelLarge>
                                    </View>
                                    <PremiumSlider
                                        value={duration}
                                        onValueChange={setDuration}
                                        min={100}
                                        max={5000}
                                        step={100}
                                    />
                                </View>
                                
                                <View style={styles.section}>
                                    <View style={styles.controlRow}>
                                        <LabelLarge style={{ color: colors.onSurface, flex: 1 }}>Delay: {delay}ms</LabelLarge>
                                    </View>
                                    <PremiumSlider
                                        value={delay}
                                        onValueChange={setDelay}
                                        min={0}
                                        max={5000}
                                        step={100}
                                    />
                                </View>

                                {/* Toggles */}
                                <View style={styles.togglesRow}>
                                    {/* Loop Toggle */}
                                    <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceVariant }]}>
                                        <LabelLarge style={{ color: colors.onSurface, marginBottom: 8 }}>Loop</LabelLarge>
                                        <Pressable 
                                            onPress={() => setLoop(!loop)}
                                            style={[
                                                styles.toggle, 
                                                { backgroundColor: loop ? colors.primary : colors.surfaceContainerHighest }
                                            ]}
                                        >
                                            <View style={[
                                                styles.toggleThumb, 
                                                { 
                                                    backgroundColor: '#fff',
                                                    transform: [{ translateX: loop ? 24 : 2 }]
                                                } 
                                            ]} />
                                        </Pressable>
                                    </View>

                                    {/* Reverse Toggle */}
                                    <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceVariant }]}>
                                        <LabelLarge style={{ color: colors.onSurface, marginBottom: 8 }}>Reverse</LabelLarge>
                                        <Pressable 
                                            onPress={() => setReverse(!reverse)}
                                            style={[
                                                styles.toggle, 
                                                { backgroundColor: reverse ? colors.primary : colors.surfaceContainerHighest }
                                            ]}
                                        >
                                             <View style={[
                                                styles.toggleThumb, 
                                                { 
                                                    backgroundColor: '#fff',
                                                    transform: [{ translateX: reverse ? 24 : 2 }]
                                                } 
                                            ]} />
                                        </Pressable>
                                    </View>
                                </View>

                                {/* Easing */}
                                <View style={styles.section}>
                                    <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                        Easing
                                    </LabelLarge>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeList}>
                                        {EASING_TYPES.map((t) => (
                                            <TouchableOpacity
                                                key={t.id}
                                                style={[
                                                    styles.textButton,
                                                    {
                                                        backgroundColor: easing === t.id ? colors.primaryContainer : colors.surfaceVariant,
                                                    },
                                                ]}
                                                onPress={() => {
                                                    setEasing(t.id);
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
                                            >
                                                <BodySmall
                                                    style={{
                                                        color: easing === t.id ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                                                    }}
                                                >
                                                    {t.label}
                                                </BodySmall>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </>
                        )}
                        
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(150,150,150,0.2)',
    },
    headerButton: {
        padding: 8,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    controlRow: {
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 8
    },
    previewSection: {
        marginTop: 20,
        alignItems: 'center',
    },
    previewContainer: {
        width: '100%',
        height: 120,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    previewObject: {
        width: 60,
        height: 60,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    typeList: {
        gap: 12,
        paddingRight: 20
    },
    typeButton: {
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        borderWidth: 2,
    },
    textButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    togglesRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 20,
    },
    toggleContainer: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    toggle: {
        width: 52,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        position: 'absolute',
    },
});

export default AnimationStyleModal;
