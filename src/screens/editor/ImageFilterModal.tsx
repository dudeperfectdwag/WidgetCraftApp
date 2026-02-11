/**
 * WidgetCraft - Image Filter Modal
 * Modal for applying and adjusting image filters
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Modal,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useColors } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BodySmall, LabelLarge, TitleMedium } from '@components/common/Typography';
import { PremiumSlider } from '@components/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import type { ImageFilterConfig, ImageFilterType } from '@canvas/CanvasContext';

interface ImageFilterModalProps {
    visible: boolean;
    onClose: () => void;
    currentConfig?: ImageFilterConfig;
    imageUri?: string;
    onApply: (config: ImageFilterConfig) => void;
}

interface FilterPreset {
    id: ImageFilterType;
    name: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

const FILTER_PRESETS: FilterPreset[] = [
    { id: 'none', name: 'Original', icon: 'image' },
    { id: 'grayscale', name: 'Grayscale', icon: 'palette-swatch' },
    { id: 'sepia', name: 'Sepia', icon: 'camera-timer' },
    { id: 'vintage', name: 'Vintage', icon: 'camera-image' },
    { id: 'warm', name: 'Warm', icon: 'white-balance-sunny' },
    { id: 'cool', name: 'Cool', icon: 'snowflake' },
    { id: 'blur', name: 'Blur', icon: 'blur' },
    { id: 'sharpen', name: 'Sharpen', icon: 'triangle-outline' },
    { id: 'vignette', name: 'Vignette', icon: 'circle-opacity' },
    { id: 'noir', name: 'Noir', icon: 'contrast-box' },
];

export const ImageFilterModal: React.FC<ImageFilterModalProps> = ({
    visible,
    onClose,
    currentConfig,
    imageUri,
    onApply,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    
    const [filter, setFilter] = useState<ImageFilterType>(currentConfig?.filter ?? 'none');
    const [intensity, setIntensity] = useState(currentConfig?.intensity ?? 100);
    const [brightness, setBrightness] = useState(currentConfig?.brightness ?? 0);
    const [contrast, setContrast] = useState(currentConfig?.contrast ?? 0);
    const [saturation, setSaturation] = useState(currentConfig?.saturation ?? 0);

    // Reset state when modal opens
    useEffect(() => {
        if (visible && currentConfig) {
            setFilter(currentConfig.filter);
            setIntensity(currentConfig.intensity);
            setBrightness(currentConfig.brightness);
            setContrast(currentConfig.contrast);
            setSaturation(currentConfig.saturation);
        } else if (visible) {
            setFilter('none');
            setIntensity(100);
            setBrightness(0);
            setContrast(0);
            setSaturation(0);
        }
    }, [visible, currentConfig]);

    const handleApply = () => {
        const config: ImageFilterConfig = {
            filter,
            intensity,
            brightness,
            contrast,
            saturation,
            hue: 0,
        };
        onApply(config);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
    };

    const handleReset = () => {
        setFilter('none');
        setIntensity(100);
        setBrightness(0);
        setContrast(0);
        setSaturation(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleFilterSelect = (filterId: ImageFilterType) => {
        setFilter(filterId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Preview style with CSS-like filter approximation
    const previewStyle = useMemo(() => {
        const filters: string[] = [];
        
        if (brightness !== 0) {
            filters.push(`brightness(${1 + brightness / 100})`);
        }
        if (contrast !== 0) {
            filters.push(`contrast(${1 + contrast / 100})`);
        }
        if (saturation !== 0) {
            filters.push(`saturate(${1 + saturation / 100})`);
        }
        
        // Filter-specific effects
        switch (filter) {
            case 'grayscale':
                filters.push(`grayscale(${intensity / 100})`);
                break;
            case 'sepia':
                filters.push(`sepia(${intensity / 100})`);
                break;
            case 'blur':
                filters.push(`blur(${(intensity / 100) * 5}px)`);
                break;
        }
        
        return filters.length > 0 ? { filter: filters.join(' ') } : {};
    }, [filter, intensity, brightness, contrast, saturation]);

    return (
        <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: colors.surface, paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                            <MaterialCommunityIcons name="close" size={24} color={colors.onSurface} />
                        </TouchableOpacity>
                        <TitleMedium style={{ color: colors.onSurface }}>Image Filters</TitleMedium>
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
                                {imageUri ? (
                                    <Image
                                        source={{ uri: imageUri }}
                                        style={[styles.previewImage, previewStyle as object]}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.previewPlaceholder, { backgroundColor: colors.outline }]}>
                                        <MaterialCommunityIcons name="image" size={48} color={colors.onSurfaceVariant} />
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Filter Presets */}
                        <View style={styles.section}>
                            <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                Filters
                            </LabelLarge>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                                {FILTER_PRESETS.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.id}
                                        style={[
                                            styles.filterPreset,
                                            {
                                                backgroundColor: filter === preset.id ? colors.primaryContainer : colors.surfaceVariant,
                                                borderColor: filter === preset.id ? colors.primary : 'transparent',
                                            },
                                        ]}
                                        onPress={() => handleFilterSelect(preset.id)}
                                    >
                                        <MaterialCommunityIcons
                                            name={preset.icon}
                                            size={24}
                                            color={filter === preset.id ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                                        />
                                        <BodySmall
                                            style={{
                                                color: filter === preset.id ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                                                marginTop: 4,
                                            }}
                                        >
                                            {preset.name}
                                        </BodySmall>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Filter Intensity */}
                        {filter !== 'none' && (
                            <View style={styles.section}>
                                <LabelLarge style={[styles.sectionTitle, { color: colors.onSurface }]}>
                                    Intensity: {Math.round(intensity)}%
                                </LabelLarge>
                                <PremiumSlider
                                    value={intensity}
                                    onValueChange={setIntensity}
                                    min={0}
                                    max={100}
                                    step={1}
                                />
                            </View>
                        )}

                        {/* Adjustments */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <LabelLarge style={{ color: colors.onSurface }}>Adjustments</LabelLarge>
                                <TouchableOpacity onPress={handleReset}>
                                    <BodySmall style={{ color: colors.primary }}>Reset</BodySmall>
                                </TouchableOpacity>
                            </View>

                            {/* Brightness */}
                            <View style={styles.adjustmentRow}>
                                <View style={styles.adjustmentLabel}>
                                    <MaterialCommunityIcons name="brightness-6" size={20} color={colors.onSurfaceVariant} />
                                    <BodySmall style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>
                                        Brightness: {brightness > 0 ? '+' : ''}{Math.round(brightness)}
                                    </BodySmall>
                                </View>
                                <View style={styles.sliderContainer}>
                                    <PremiumSlider
                                        value={brightness}
                                        onValueChange={setBrightness}
                                        min={-100}
                                        max={100}
                                        step={1}
                                    />
                                </View>
                            </View>

                            {/* Contrast */}
                            <View style={styles.adjustmentRow}>
                                <View style={styles.adjustmentLabel}>
                                    <MaterialCommunityIcons name="contrast-circle" size={20} color={colors.onSurfaceVariant} />
                                    <BodySmall style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>
                                        Contrast: {contrast > 0 ? '+' : ''}{Math.round(contrast)}
                                    </BodySmall>
                                </View>
                                <View style={styles.sliderContainer}>
                                    <PremiumSlider
                                        value={contrast}
                                        onValueChange={setContrast}
                                        min={-100}
                                        max={100}
                                        step={1}
                                    />
                                </View>
                            </View>

                            {/* Saturation */}
                            <View style={styles.adjustmentRow}>
                                <View style={styles.adjustmentLabel}>
                                    <MaterialCommunityIcons name="palette" size={20} color={colors.onSurfaceVariant} />
                                    <BodySmall style={{ color: colors.onSurfaceVariant, marginLeft: 8 }}>
                                        Saturation: {saturation > 0 ? '+' : ''}{Math.round(saturation)}
                                    </BodySmall>
                                </View>
                                <View style={styles.sliderContainer}>
                                    <PremiumSlider
                                        value={saturation}
                                        onValueChange={setSaturation}
                                        min={-100}
                                        max={100}
                                        step={1}
                                    />
                                </View>
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
        marginBottom: 16,
    },
    previewContainer: {
        borderRadius: 16,
        padding: 8,
        alignItems: 'center',
    },
    previewImage: {
        width: 280,
        height: 180,
        borderRadius: 12,
    },
    previewPlaceholder: {
        width: 280,
        height: 180,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterRow: {
        flexGrow: 0,
    },
    filterPreset: {
        width: 72,
        height: 72,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 2,
    },
    adjustmentRow: {
        marginBottom: 20,
    },
    adjustmentLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sliderContainer: {
        flex: 1,
    },
});

export default ImageFilterModal;
