/**
 * WidgetCraft - Gradient Style Modal
 * Modal for customizing gradient backgrounds
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
import { GradientBackground, GradientConfig, GRADIENT_PRESETS, GradientType } from '../../widgets/components/GradientBackground';

interface GradientStyleModalProps {
    visible: boolean;
    onClose: () => void;
    currentConfig?: GradientConfig;
    onApply: (config: GradientConfig) => void;
}

export const GradientStyleModal: React.FC<GradientStyleModalProps> = ({
    visible,
    onClose,
    currentConfig,
    onApply,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const [gradientType, setGradientType] = useState<GradientType>(currentConfig?.type ?? 'linear');
    const [gradientColors, setGradientColors] = useState<string[]>(currentConfig?.colors ?? ['#FF512F', '#F09819']);
    const [angle, setAngle] = useState(currentConfig?.angle ?? 135);
    const [centerX, setCenterX] = useState(currentConfig?.centerX ?? 0.5);
    const [centerY, setCenterY] = useState(currentConfig?.centerY ?? 0.5);
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);
    
    // Color palette for quick selection
    const colorPalette = [
        '#FF512F', '#F09819', '#00C9FF', '#92FE9D', '#834d9b', '#d04ed6',
        '#2193b0', '#6dd5ed', '#134E5E', '#71B280', '#f12711', '#f5af19',
        '#232526', '#414345', '#D8B5FF', '#1EAE98', '#FFAFBD', '#ffc3a0',
        '#0f0c29', '#302b63', '#24243e', '#ff0000', '#00ff00', '#0000ff',
        '#ffffff', '#000000', '#ff7f00', '#ffff00', '#4b0082', '#9400d3',
    ];

    // Reset state when modal opens
    useEffect(() => {
        if (visible && currentConfig) {
            setGradientType(currentConfig.type);
            setGradientColors(currentConfig.colors);
            setAngle(currentConfig.angle ?? 135);
            setCenterX(currentConfig.centerX ?? 0.5);
            setCenterY(currentConfig.centerY ?? 0.5);
        }
    }, [visible, currentConfig]);

    const handleApply = () => {
        const config: GradientConfig = {
            type: gradientType,
            colors: gradientColors,
            ...(gradientType === 'linear' ? { angle } : { centerX, centerY }),
        };
        onApply(config);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
    };

    const handlePresetSelect = (presetKey: string) => {
        const preset = GRADIENT_PRESETS[presetKey];
        if (preset) {
            setGradientType(preset.type);
            setGradientColors([...preset.colors]);
            setAngle(preset.angle ?? 135);
            setCenterX(preset.centerX ?? 0.5);
            setCenterY(preset.centerY ?? 0.5);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleAddColor = () => {
        if (gradientColors.length < 8) {
            setGradientColors([...gradientColors, '#888888']);
            setSelectedColorIndex(gradientColors.length);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleRemoveColor = (index: number) => {
        if (gradientColors.length > 2) {
            const newColors = gradientColors.filter((_, i) => i !== index);
            setGradientColors(newColors);
            setSelectedColorIndex(Math.min(selectedColorIndex, newColors.length - 1));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleColorChange = (color: string) => {
        const newColors = [...gradientColors];
        newColors[selectedColorIndex] = color;
        setGradientColors(newColors);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const buildPreviewConfig = (): GradientConfig => ({
        type: gradientType,
        colors: gradientColors,
        angle,
        centerX,
        centerY,
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
                        <TitleMedium style={{ color: colors.onSurface }}>Gradient Style</TitleMedium>
                        <TouchableOpacity onPress={handleApply} style={styles.headerButton}>
                            <MaterialCommunityIcons name="check" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {/* Preview */}
                        <View style={styles.section}>
                            <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                Preview
                            </LabelLarge>
                            <View style={[styles.previewContainer, { backgroundColor: colors.surfaceVariant }]}>
                                <GradientBackground
                                    width={280}
                                    height={140}
                                    config={buildPreviewConfig()}
                                    cornerRadius={12}
                                />
                            </View>
                        </View>

                        {/* Gradient Type */}
                        <View style={styles.section}>
                            <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                Type
                            </LabelLarge>
                            <View style={styles.typeRow}>
                                {(['linear', 'radial'] as GradientType[]).map((type) => (
                                    <TouchableOpacity
                                        key={type}
                                        style={[
                                            styles.typeButton,
                                            {
                                                backgroundColor: gradientType === type ? colors.primaryContainer : colors.surfaceVariant,
                                                borderColor: gradientType === type ? colors.primary : 'transparent',
                                            },
                                        ]}
                                        onPress={() => {
                                            setGradientType(type);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <MaterialCommunityIcons
                                            name={type === 'linear' ? 'gradient-horizontal' : 'circle-opacity'}
                                            size={24}
                                            color={gradientType === type ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                                        />
                                        <BodySmall
                                            style={{
                                                color: gradientType === type ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                                                marginTop: 4,
                                            }}
                                        >
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </BodySmall>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Gradient Colors */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <LabelLarge style={{ color: colors.onSurface }}>Colors</LabelLarge>
                                {gradientColors.length < 8 && (
                                    <TouchableOpacity onPress={handleAddColor}>
                                        <MaterialCommunityIcons name="plus-circle" size={24} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            
                            {/* Color stops */}
                            <View style={styles.colorStopsRow}>
                                {gradientColors.map((color, index) => (
                                    <Pressable
                                        key={index}
                                        style={[
                                            styles.colorStop,
                                            {
                                                backgroundColor: color,
                                                borderColor: selectedColorIndex === index ? colors.primary : colors.outline,
                                                borderWidth: selectedColorIndex === index ? 3 : 1,
                                            },
                                        ]}
                                        onPress={() => setSelectedColorIndex(index)}
                                        onLongPress={() => handleRemoveColor(index)}
                                    >
                                        {gradientColors.length > 2 && selectedColorIndex === index && (
                                            <TouchableOpacity
                                                style={[styles.removeButton, { backgroundColor: colors.error }]}
                                                onPress={() => handleRemoveColor(index)}
                                            >
                                                <MaterialCommunityIcons name="close" size={12} color="#fff" />
                                            </TouchableOpacity>
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                            
                            {/* Color palette */}
                            <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 8, marginBottom: 8 }}>
                                Tap to change color #{selectedColorIndex + 1}
                            </BodySmall>
                            <View style={styles.colorPalette}>
                                {colorPalette.map((color, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.paletteColor,
                                            {
                                                backgroundColor: color,
                                                borderColor: gradientColors[selectedColorIndex] === color ? colors.primary : colors.outline,
                                                borderWidth: gradientColors[selectedColorIndex] === color ? 2 : 1,
                                            },
                                        ]}
                                        onPress={() => handleColorChange(color)}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Angle (for linear) or Center (for radial) */}
                        {gradientType === 'linear' ? (
                            <View style={styles.section}>
                                <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                    Angle: {Math.round(angle)}°
                                </LabelLarge>
                                <PremiumSlider
                                    value={angle}
                                    onValueChange={setAngle}
                                    min={0}
                                    max={360}
                                    step={5}
                                />
                                <View style={styles.anglePresets}>
                                    {[0, 45, 90, 135, 180, 225, 270, 315].map((presetAngle) => (
                                        <TouchableOpacity
                                            key={presetAngle}
                                            style={[
                                                styles.anglePreset,
                                                {
                                                    backgroundColor: angle === presetAngle ? colors.primaryContainer : colors.surfaceVariant,
                                                },
                                            ]}
                                            onPress={() => {
                                                setAngle(presetAngle);
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            }}
                                        >
                                            <BodySmall
                                                style={{
                                                    color: angle === presetAngle ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                                                }}
                                            >
                                                {presetAngle}°
                                            </BodySmall>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : (
                            <View style={styles.section}>
                                <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                    Center Position
                                </LabelLarge>
                                <BodySmall style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>
                                    X: {Math.round(centerX * 100)}%
                                </BodySmall>
                                <PremiumSlider
                                    value={centerX}
                                    onValueChange={setCenterX}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                />
                                <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>
                                    Y: {Math.round(centerY * 100)}%
                                </BodySmall>
                                <PremiumSlider
                                    value={centerY}
                                    onValueChange={setCenterY}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                />
                            </View>
                        )}

                        {/* Presets */}
                        <View style={styles.section}>
                            <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                Presets
                            </LabelLarge>
                            <View style={styles.presetsGrid}>
                                {Object.entries(GRADIENT_PRESETS).map(([key, preset]) => (
                                    <TouchableOpacity
                                        key={key}
                                        style={styles.presetItem}
                                        onPress={() => handlePresetSelect(key)}
                                    >
                                        <View style={styles.presetPreview}>
                                            <GradientBackground
                                                width={60}
                                                height={60}
                                                config={preset}
                                                cornerRadius={8}
                                            />
                                        </View>
                                        <BodySmall
                                            style={{ color: colors.onSurfaceVariant, marginTop: 4, textTransform: 'capitalize' }}
                                        >
                                            {key}
                                        </BodySmall>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Bottom padding */}
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
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    previewContainer: {
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
    },
    typeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
    },
    colorStopsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorStop: {
        width: 48,
        height: 48,
        borderRadius: 24,
        position: 'relative',
    },
    removeButton: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
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
    anglePresets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    anglePreset: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    presetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    presetItem: {
        alignItems: 'center',
        width: 70,
    },
    presetPreview: {
        borderRadius: 8,
        overflow: 'hidden',
    },
});

export default GradientStyleModal;
