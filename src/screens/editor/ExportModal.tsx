/**
 * WidgetCraft - Export Modal
 * UI for exporting widgets as images, sharing, or adding to home screen
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, Modal, Pressable, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TitleMedium, BodyMedium, BodySmall, LabelMedium } from '@components/common';
import { WidgetExporter, EXPORT_PRESETS, ExportPreset } from '../../widgets/export/WidgetExporter';

// ============================================
// Types
// ============================================

interface ExportOption {
    id: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    description: string;
    action: () => Promise<void>;
    androidOnly?: boolean;
}

interface ExportModalProps {
    visible: boolean;
    onClose: () => void;
    widgetRef: React.RefObject<any>;
    widgetName: string;
}

// ============================================
// Export Option Button
// ============================================

interface ExportOptionButtonProps {
    option: ExportOption;
    onPress: () => void;
    disabled?: boolean;
}

const ExportOptionButton: React.FC<ExportOptionButtonProps> = ({ option, onPress, disabled }) => {
    const colors = useColors();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        if (!disabled) {
            scale.value = withTiming(0.95, { duration: 60 });
        }
    };

    const handlePressOut = () => {
        scale.value = withTiming(1, { duration: 100 });
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
        >
            <Animated.View
                style={[
                    styles.optionButton,
                    {
                        backgroundColor: colors.surfaceContainerHigh,
                        opacity: disabled ? 0.5 : 1,
                    },
                    animatedStyle,
                ]}
            >
                <View style={[styles.optionIcon, { backgroundColor: colors.primaryContainer }]}>
                    <MaterialCommunityIcons
                        name={option.icon}
                        size={24}
                        color={colors.onPrimaryContainer}
                    />
                </View>
                <View style={styles.optionText}>
                    <BodyMedium style={{ color: colors.onSurface }}>{option.title}</BodyMedium>
                    <BodySmall style={{ color: colors.onSurfaceVariant }}>{option.description}</BodySmall>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
            </Animated.View>
        </Pressable>
    );
};

// ============================================
// Export Modal
// ============================================

export const ExportModal: React.FC<ExportModalProps> = ({
    visible,
    onClose,
    widgetRef,
    widgetName,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<string>('');
    const [selectedPreset, setSelectedPreset] = useState<ExportPreset>(EXPORT_PRESETS[0]);

    const handleSaveToGallery = async () => {
        setIsExporting(true);
        setExportStatus('Capturing widget...');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const captureResult = await WidgetExporter.captureWidgetImage(widgetRef, {
                format: 'png',
                quality: 1,
                width: selectedPreset.width,
                height: selectedPreset.height,
            });

            if (!captureResult.success || !captureResult.uri) {
                Alert.alert('Error', captureResult.error || 'Failed to capture widget');
                return;
            }

            setExportStatus('Saving to gallery...');
            const saveResult = await WidgetExporter.saveToGallery(captureResult.uri);

            if (saveResult.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Saved!', 'Widget saved to gallery in WidgetCraft album');
                onClose();
            } else {
                Alert.alert('Error', saveResult.error || 'Failed to save to gallery');
            }
        } catch (error) {
            Alert.alert('Error', String(error));
        } finally {
            setIsExporting(false);
            setExportStatus('');
        }
    };

    const handleShare = async () => {
        setIsExporting(true);
        setExportStatus('Preparing to share...');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const captureResult = await WidgetExporter.captureWidgetImage(widgetRef, {
                format: 'png',
                quality: 1,
                width: selectedPreset.width,
                height: selectedPreset.height,
            });

            if (!captureResult.success || !captureResult.uri) {
                Alert.alert('Error', captureResult.error || 'Failed to capture widget');
                return;
            }

            setExportStatus('Opening share dialog...');
            await WidgetExporter.shareWidget(captureResult.uri, `Check out my "${widgetName}" widget!`);
            onClose();
        } catch (error) {
            Alert.alert('Error', String(error));
        } finally {
            setIsExporting(false);
            setExportStatus('');
        }
    };

    const handleAddToHomeScreen = async () => {
        if (Platform.OS !== 'android') {
            Alert.alert('Not Available', 'This feature is only available on Android');
            return;
        }

        setIsExporting(true);
        setExportStatus('Preparing widget...');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const captureResult = await WidgetExporter.captureWidgetImage(widgetRef, {
                format: 'png',
                quality: 1,
                width: selectedPreset.width,
                height: selectedPreset.height,
            });

            if (!captureResult.success || !captureResult.uri) {
                Alert.alert('Error', captureResult.error || 'Failed to capture widget');
                return;
            }

            await WidgetExporter.requestPinWidget(captureResult.uri, {
                shortLabel: widgetName,
                longLabel: `WidgetCraft: ${widgetName}`,
            });

            onClose();
        } catch (error) {
            Alert.alert('Error', String(error));
        } finally {
            setIsExporting(false);
            setExportStatus('');
        }
    };



    const exportOptions: ExportOption[] = [
        {
            id: 'gallery',
            icon: 'image-plus',
            title: 'Save to Gallery',
            description: 'Save as image in your photo gallery',
            action: handleSaveToGallery,
        },
        {
            id: 'share',
            icon: 'share-variant',
            title: 'Share',
            description: 'Share via apps, messages, or social media',
            action: handleShare,
        },
        {
            id: 'homescreen',
            icon: 'cellphone-screenshot',
            title: 'Add to Home Screen',
            description: 'Pin widget to your home screen',
            action: handleAddToHomeScreen,
            androidOnly: true,
        },
    ];

    const filteredOptions = Platform.OS === 'android'
        ? exportOptions
        : exportOptions.filter(o => !o.androidOnly);

    return (
        <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 32 }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TitleMedium style={{ color: colors.onSurface, flex: 1 }}>
                            Export Widget
                        </TitleMedium>
                        <Pressable onPress={onClose} style={styles.closeButton} disabled={isExporting}>
                            <MaterialCommunityIcons name="close" size={24} color={colors.onSurfaceVariant} />
                        </Pressable>
                    </View>

                    {/* Widget Name */}
                    <View style={[styles.widgetNameBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <MaterialCommunityIcons name="widgets" size={16} color={colors.primary} />
                        <LabelMedium style={{ color: colors.onSurface }}>{widgetName}</LabelMedium>
                    </View>

                    {/* Preset Selection */}
                    <View style={styles.section}>
                        <LabelMedium style={{ color: colors.onSurface, marginBottom: 12, paddingHorizontal: 24 }}>
                            Export Size
                        </LabelMedium>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.presetsList}
                        >
                            {EXPORT_PRESETS.map((preset) => (
                                <Pressable
                                    key={preset.id}
                                    style={[
                                        styles.presetButton,
                                        {
                                            backgroundColor: selectedPreset.id === preset.id ? colors.primaryContainer : colors.surfaceContainerHigh,
                                            borderColor: selectedPreset.id === preset.id ? colors.primary : 'transparent',
                                            borderWidth: 2,
                                        }
                                    ]}
                                    onPress={() => {
                                        setSelectedPreset(preset);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <MaterialCommunityIcons 
                                        name={preset.icon as any} 
                                        size={24} 
                                        color={selectedPreset.id === preset.id ? colors.onPrimaryContainer : colors.onSurfaceVariant} 
                                    />
                                    <BodySmall style={{ 
                                        color: selectedPreset.id === preset.id ? colors.onPrimaryContainer : colors.onSurface,
                                        marginTop: 8,
                                        textAlign: 'center',
                                        fontSize: 12
                                    }}>
                                        {preset.label}
                                    </BodySmall>
                                    <LabelMedium style={{ 
                                        color: selectedPreset.id === preset.id ? colors.onPrimaryContainer : colors.onSurfaceVariant,
                                        fontSize: 10,
                                        opacity: 0.7
                                    }}>
                                        {preset.width ? `${preset.width}x${preset.height}` : 'Auto'}
                                    </LabelMedium>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Export Options */}
                    <View style={styles.optionsList}>
                        {filteredOptions.map((option) => (
                            <ExportOptionButton
                                key={option.id}
                                option={option}
                                onPress={() => option.action()}
                                disabled={isExporting}
                            />
                        ))}
                    </View>

                    {/* Loading State */}
                    {isExporting && (
                        <View style={[styles.loadingOverlay, { backgroundColor: colors.surface + 'E6' }]}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <BodyMedium style={{ color: colors.onSurface, marginTop: 12 }}>
                                {exportStatus}
                            </BodyMedium>
                        </View>
                    )}
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 8,
    },
    closeButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    widgetNameBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginLeft: 16,
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    section: {
        marginBottom: 16,
    },
    presetsList: {
        paddingHorizontal: 24,
        gap: 12,
    },
    presetButton: {
        width: 100,
        height: 100,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
    },
    optionsList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionText: {
        flex: 1,
        gap: 2,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
});

export default ExportModal;
