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
import { WidgetExporter, EXPORT_PRESETS, ExportPreset, WidgetElement } from '../../widgets/export/WidgetExporter';
import { useCanvas, CanvasElement, CanvasState } from '../../canvas/CanvasContext';

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
    const { state } = useCanvas();
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<string>('');
    const [selectedPreset, setSelectedPreset] = useState<ExportPreset>(EXPORT_PRESETS[0]);

    // Resolve color tokens to hex for native rendering
    const COLOR_TOKEN_MAP: Record<string, string> = {
        'primary': '#6750A4', 'onPrimary': '#FFFFFF',
        'primaryContainer': '#EADDFF', 'onPrimaryContainer': '#21005D',
        'secondary': '#625B71', 'onSecondary': '#FFFFFF',
        'secondaryContainer': '#E8DEF8', 'onSecondaryContainer': '#1D192B',
        'tertiary': '#7D5260', 'onTertiary': '#FFFFFF',
        'tertiaryContainer': '#FFD8E4', 'onTertiaryContainer': '#31111D',
        'surface': '#FFFBFE', 'onSurface': '#1C1B1F',
        'surfaceVariant': '#E7E0EC', 'onSurfaceVariant': '#49454F',
        'error': '#B3261E', 'background': '#FFFBFE',
        'inverseSurface': '#313033', 'inverseOnSurface': '#F4EFF4',
        'inversePrimary': '#D0BCFF', 'transparent': 'transparent',
    };
    const resolveExportColor = (c: string): string => {
        if (!c || c.startsWith('#') || c.startsWith('rgb')) return c;
        return COLOR_TOKEN_MAP[c] || c;
    };

    // Serialize canvas elements for native rendering
    const serializeCanvasElements = (): WidgetElement[] => {
        const elements: WidgetElement[] = [];
        const { width: cw, height: ch } = state.canvasSize;
        if (cw === 0 || ch === 0) return elements;

        // Supported types that can be drawn natively
        const nativeTypes = new Set(['rectangle', 'ellipse', 'text', 'image', 'analogClock', 'digitalClock', 'curvedText', 'path', 'line', 'gradient']);

        for (const id of state.elementOrder) {
            const el = state.elements[id];
            if (!el || !el.visible || !nativeTypes.has(el.type)) continue;
            // Skip grouped children (they're in the group's screenshot)
            if (el.parentId) continue;

            const t = el.transform;
            const we: WidgetElement = {
                type: el.type as WidgetElement['type'],
                xPercent: t.x / cw,
                yPercent: t.y / ch,
                widthPercent: t.width / cw,
                heightPercent: t.height / ch,
                rotation: t.rotation || 0,
                opacity: el.style.opacity ?? 1,
            };

            // Shape style — resolve color tokens to hex
            if (el.style.fill) we.fill = resolveExportColor(el.style.fill);
            if (el.style.stroke) we.stroke = resolveExportColor(el.style.stroke);
            if (el.style.strokeWidth) we.strokeWidth = el.style.strokeWidth;
            if (el.style.cornerRadius != null) {
                we.cornerRadius = typeof el.style.cornerRadius === 'number'
                    ? el.style.cornerRadius
                    : el.style.cornerRadius[0] ?? 0;
            }

            // Text content and style
            if (el.content) we.content = el.content;
            if (el.textStyle) {
                we.fontSize = el.textStyle.fontSize;
                we.fontWeight = el.textStyle.fontWeight;
                we.fontFamily = el.textStyle.fontFamily;
                we.color = resolveExportColor(el.textStyle.color || '#FFFFFF');
                we.textAlign = el.textStyle.textAlign;
            }

            // Clock config
            if (el.clockConfig) {
                we.clockConfig = {
                    faceStyle: el.clockConfig.faceStyle,
                    handStyle: el.clockConfig.handStyle,
                    format: el.clockConfig.format,
                    showAmPm: el.clockConfig.showAmPm,
                    showSeconds: el.clockConfig.showSeconds,
                    showNumbers: el.clockConfig.showNumbers,
                    showTicks: el.clockConfig.showTicks,
                    faceColor: el.clockConfig.faceColor,
                    hourHandColor: el.clockConfig.hourHandColor,
                    minuteHandColor: el.clockConfig.minuteHandColor,
                    secondHandColor: el.clockConfig.secondHandColor,
                    tickColor: el.clockConfig.tickColor,
                    numberColor: el.clockConfig.numberColor,
                };
            }

            // Image file name (we still use the screenshot as background)
            if (el.type === 'image' && el.imageUri) {
                we.imageFileName = el.imageUri;
            }

            // Curved text config
            if (el.type === 'curvedText' && el.curvedTextConfig) {
                we.curvedTextConfig = {
                    curveType: el.curvedTextConfig.curveType,
                    curveAmount: el.curvedTextConfig.curveAmount,
                    startOffset: el.curvedTextConfig.startOffset,
                };
            }

            // SVG path data
            if ((el.type === 'path' || el.type === 'line') && el.path) {
                we.path = el.path;
            }

            // Gradient config — resolve any color tokens to hex
            if (el.gradientConfig) {
                we.gradientConfig = {
                    type: el.gradientConfig.type,
                    colors: el.gradientConfig.colors?.map(resolveExportColor) || [],
                    angle: el.gradientConfig.angle,
                };
            }

            elements.push(we);
        }

        return elements;
    };

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

            // Serialize canvas elements for native live rendering
            setExportStatus('Configuring live data...');
            const elements = serializeCanvasElements();

            await WidgetExporter.requestPinWidget(captureResult.uri, {
                shortLabel: widgetName,
                longLabel: `WidgetCraft: ${widgetName}`,
            }, elements, {
                designWidth: state.canvasSize.width,
                designHeight: state.canvasSize.height,
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
