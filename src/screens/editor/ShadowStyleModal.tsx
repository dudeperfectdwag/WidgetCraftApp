/**
 * WidgetCraft - Shadow Style Modal
 * Modal for customizing layer effects (shadow/glow)
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

interface ShadowConfig {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
    opacity?: number;
}

interface ShadowStyleModalProps {
    visible: boolean;
    onClose: () => void;
    currentConfig?: ShadowConfig;
    onApply: (config: ShadowConfig | undefined) => void;
}

export const ShadowStyleModal: React.FC<ShadowStyleModalProps> = ({
    visible,
    onClose,
    currentConfig,
    onApply,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    
    // State
    const [color, setColor] = useState(currentConfig?.color ?? '#000000');
    const [offsetX, setOffsetX] = useState(currentConfig?.offsetX ?? 0);
    const [offsetY, setOffsetY] = useState(currentConfig?.offsetY ?? 0);
    const [blur, setBlur] = useState(currentConfig?.blur ?? 4);
    const [opacity, setOpacity] = useState(currentConfig?.opacity ?? 0.5);

    const [hasShadow, setHasShadow] = useState(!!currentConfig);

    // Color palette for quick selection
    const colorPalette = [
        '#000000', '#444444', '#888888', '#CCCCCC', '#FFFFFF',
        '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
        '#7C3AED', '#DB2777', '#059669', '#D97706', '#DC2626'
    ];

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            if (currentConfig) {
                setColor(currentConfig.color);
                setOffsetX(currentConfig.offsetX);
                setOffsetY(currentConfig.offsetY);
                setBlur(currentConfig.blur);
                setOpacity(currentConfig.opacity ?? 0.5);
                setHasShadow(true);
            } else {
                // Defaults
                setColor('#000000');
                setOffsetX(0);
                setOffsetY(4);
                setBlur(8);
                setOpacity(0.3);
                setHasShadow(false); // Only enable when user interacts or clicks apply
            }
        }
    }, [visible, currentConfig]);

    const handleApply = () => {
        if (!hasShadow) {
            onApply(undefined); // Clear shadow
        } else {
            const config: ShadowConfig = {
                color,
                offsetX,
                offsetY,
                blur,
                opacity,
            };
            onApply(config);
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
    };

    const handleToggleShadow = () => {
        setHasShadow(!hasShadow);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                            <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
                        </TouchableOpacity>
                        <TitleMedium style={{ color: colors.onSurface }}>Shadow & Glow</TitleMedium>
                        <TouchableOpacity onPress={handleApply} style={styles.headerButton}>
                            <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Enable/Disable Toggle */}
                         <View style={styles.sectionRow}>
                            <LabelLarge style={{ color: colors.onSurface }}>Enable Effect</LabelLarge>
                            <Pressable 
                                onPress={handleToggleShadow}
                                style={[
                                    styles.toggle, 
                                    { backgroundColor: hasShadow ? colors.primary : colors.surfaceVariant }
                                ]}
                            >
                                <View style={[
                                    styles.toggleThumb, 
                                    { 
                                        backgroundColor: '#fff',
                                        transform: [{ translateX: hasShadow ? 24 : 2 }]
                                    } 
                                ]} />
                            </Pressable>
                        </View>

                        {hasShadow && (
                            <>
                                {/* Preview */}
                                <View style={styles.section}>
                                    <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                        Preview
                                    </LabelLarge>
                                    <View style={[styles.previewContainer, { backgroundColor: colors.surfaceVariant }]}>
                                         <View style={{
                                             width: 100,
                                             height: 100,
                                             borderRadius: 16,
                                             backgroundColor: colors.primaryContainer,
                                             shadowColor: color,
                                             shadowOffset: { width: offsetX, height: offsetY },
                                             shadowOpacity: opacity,
                                             shadowRadius: blur,
                                             elevation: 5, // Android approximation (limited control)
                                             alignItems: 'center',
                                             justifyContent: 'center',
                                         }}>
                                             <MaterialCommunityIcons name="cube-outline" size={40} color={colors.onPrimaryContainer} />
                                         </View>
                                    </View>
                                </View>

                                {/* Controls */}
                                <View style={styles.section}>
                                    <View style={styles.controlRow}>
                                        <LabelLarge style={{ color: colors.onSurface, flex: 1 }}>Offset X: {Math.round(offsetX)}</LabelLarge>
                                    </View>
                                    <PremiumSlider
                                        value={offsetX}
                                        onValueChange={setOffsetX}
                                        min={-50}
                                        max={50}
                                        step={1}
                                    />
                                </View>
                                
                                <View style={styles.section}>
                                    <View style={styles.controlRow}>
                                        <LabelLarge style={{ color: colors.onSurface, flex: 1 }}>Offset Y: {Math.round(offsetY)}</LabelLarge>
                                    </View>
                                    <PremiumSlider
                                        value={offsetY}
                                        onValueChange={setOffsetY}
                                        min={-50}
                                        max={50}
                                        step={1}
                                    />
                                </View>
                                
                                <View style={styles.section}>
                                    <View style={styles.controlRow}>
                                        <LabelLarge style={{ color: colors.onSurface, flex: 1 }}>Blur Radius: {Math.round(blur)}</LabelLarge>
                                    </View>
                                    <PremiumSlider
                                        value={blur}
                                        onValueChange={setBlur}
                                        min={0}
                                        max={50}
                                        step={1}
                                    />
                                </View>

                                <View style={styles.section}>
                                    <View style={styles.controlRow}>
                                        <LabelLarge style={{ color: colors.onSurface, flex: 1 }}>Opacity: {Math.round(opacity * 100)}%</LabelLarge>
                                    </View>
                                    <PremiumSlider
                                        value={opacity}
                                        onValueChange={setOpacity}
                                        min={0}
                                        max={1}
                                        step={0.05}
                                    />
                                </View>

                                {/* Shadow Color */}
                                <View style={styles.section}>
                                    <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                        Color
                                    </LabelLarge>
                                    <View style={styles.colorPalette}>
                                        {colorPalette.map((c, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={[
                                                    styles.paletteColor,
                                                    {
                                                        backgroundColor: c,
                                                        borderColor: color === c ? colors.primary : colors.outline,
                                                        borderWidth: color === c ? 3 : 1,
                                                    },
                                                ]}
                                                onPress={() => {
                                                    setColor(c);
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
                                            />
                                        ))}
                                    </View>
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
    sectionRow: {
        marginTop: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        marginBottom: 12,
    },
    controlRow: {
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: 8
    },
    previewContainer: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorPalette: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    paletteColor: {
        width: 32,
        height: 32,
        borderRadius: 16,
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

export default ShadowStyleModal;
