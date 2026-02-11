/**
 * WidgetCraft - Curved Text Style Modal
 * Customize curved text appearance: curve type, amount, and text styling
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    TitleMedium,
    LabelMedium,
    LabelSmall,
    BodyMedium,
} from '@components/common';
import { CurvedTextConfig, TextStyle } from '@canvas/CanvasContext';
import { CurvedText } from '../../widgets/components/CurvedText';
import { getContrastBackground } from '@utils/index';

// Types
interface CurvedTextStyleModalProps {
    visible: boolean;
    onClose: () => void;
    currentConfig: CurvedTextConfig | undefined;
    currentTextStyle: TextStyle | undefined;
    currentContent: string | undefined;
    onApply: (config: CurvedTextConfig, textStyle: Partial<TextStyle>, content: string) => void;
}

// Constants
const CURVE_TYPES: Array<{ label: string; value: CurvedTextConfig['curveType'] }> = [
    { label: 'Arc', value: 'arc' },
    { label: 'Wave', value: 'wave' },
    { label: 'Circle', value: 'circle' },
];

const PRESET_COLORS = [
    '#FFFFFF', '#000000', '#1E293B', '#F8FAFC',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

const FONT_SIZES = [14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64];

export const CurvedTextStyleModal: React.FC<CurvedTextStyleModalProps> = ({
    visible,
    onClose,
    currentConfig,
    currentTextStyle,
    currentContent,
    onApply,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();

    // State
    const [curveType, setCurveType] = useState<CurvedTextConfig['curveType']>(currentConfig?.curveType || 'arc');
    const [curveAmount, setCurveAmount] = useState(currentConfig?.curveAmount ?? 50);
    const [content, setContent] = useState(currentContent || 'Curved Text');
    const [fontSize, setFontSize] = useState(currentTextStyle?.fontSize || 24);
    const [textColor, setTextColor] = useState(currentTextStyle?.color || '#FFFFFF');

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setCurveType(currentConfig?.curveType || 'arc');
            setCurveAmount(currentConfig?.curveAmount ?? 50);
            setContent(currentContent || 'Curved Text');
            setFontSize(currentTextStyle?.fontSize || 24);
            setTextColor(currentTextStyle?.color || '#FFFFFF');
        }
    }, [visible, currentConfig, currentTextStyle, currentContent]);

    const handleApply = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onApply(
            {
                curveType,
                curveAmount,
            },
            {
                fontSize,
                color: textColor,
            },
            content
        );
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.surfaceContainer, paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TitleMedium style={{ color: colors.onSurface }}>
                            Curved Text
                        </TitleMedium>
                        <Pressable onPress={onClose}>
                            <MaterialCommunityIcons
                                name="close"
                                size={24}
                                color={colors.onSurfaceVariant}
                            />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Live Preview */}
                        <View style={[styles.preview, { backgroundColor: getContrastBackground(textColor) }]}>
                            <CurvedText
                                text={content}
                                width={250}
                                height={100}
                                curveType={curveType}
                                curveAmount={curveAmount}
                                fontSize={Math.min(fontSize, 32)}
                                fill={textColor}
                            />
                        </View>

                        {/* Text Content */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Text
                        </LabelMedium>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: colors.surfaceContainerHigh,
                                    color: colors.onSurface,
                                    borderColor: colors.outline,
                                },
                            ]}
                            value={content}
                            onChangeText={setContent}
                            placeholder="Enter text..."
                            placeholderTextColor={colors.onSurfaceVariant}
                        />

                        {/* Curve Type */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Curve Type
                        </LabelMedium>
                        <View style={styles.optionRow}>
                            {CURVE_TYPES.map((type) => (
                                <Pressable
                                    key={type.value}
                                    style={[
                                        styles.optionButton,
                                        {
                                            flex: 1,
                                            backgroundColor: curveType === type.value
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    onPress={() => {
                                        setCurveType(type.value);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <LabelSmall
                                        style={{
                                            color: curveType === type.value
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                        }}
                                    >
                                        {type.label}
                                    </LabelSmall>
                                </Pressable>
                            ))}
                        </View>

                        {/* Curve Amount */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Curve Amount: {curveAmount}
                        </LabelMedium>
                        <View style={styles.sliderContainer}>
                            <Pressable
                                style={[styles.sliderButton, { backgroundColor: colors.surfaceContainerHigh }]}
                                onPress={() => {
                                    setCurveAmount(Math.max(-100, curveAmount - 10));
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <MaterialCommunityIcons name="minus" size={20} color={colors.onSurface} />
                            </Pressable>
                            <View style={[styles.sliderTrack, { backgroundColor: colors.surfaceContainerHighest }]}>
                                <View
                                    style={[
                                        styles.sliderFill,
                                        {
                                            backgroundColor: colors.primary,
                                            width: `${((curveAmount + 100) / 200) * 100}%`,
                                        },
                                    ]}
                                />
                            </View>
                            <Pressable
                                style={[styles.sliderButton, { backgroundColor: colors.surfaceContainerHigh }]}
                                onPress={() => {
                                    setCurveAmount(Math.min(100, curveAmount + 10));
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color={colors.onSurface} />
                            </Pressable>
                        </View>
                        <BodyMedium style={{ color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
                            Negative = curve down, Positive = curve up
                        </BodyMedium>

                        {/* Font Size */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Size: {fontSize}px
                        </LabelMedium>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.sizeRow}>
                                {FONT_SIZES.map((size) => (
                                    <Pressable
                                        key={size}
                                        style={[
                                            styles.sizeButton,
                                            {
                                                backgroundColor: fontSize === size
                                                    ? colors.primaryContainer
                                                    : colors.surfaceContainerHigh,
                                            },
                                        ]}
                                        onPress={() => {
                                            setFontSize(size);
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                    >
                                        <LabelSmall
                                            style={{
                                                color: fontSize === size
                                                    ? colors.onPrimaryContainer
                                                    : colors.onSurface,
                                            }}
                                        >
                                            {size}
                                        </LabelSmall>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Color */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Color
                        </LabelMedium>
                        <View style={styles.colorGrid}>
                            {PRESET_COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    style={[
                                        styles.colorButton,
                                        {
                                            backgroundColor: color,
                                            borderWidth: textColor === color ? 3 : 0,
                                            borderColor: colors.primary,
                                        },
                                    ]}
                                    onPress={() => {
                                        setTextColor(color);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                />
                            ))}
                        </View>

                        {/* Bottom spacing */}
                        <View style={{ height: 20 }} />
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Pressable
                            style={[styles.cancelButton, { backgroundColor: colors.surfaceContainerHigh }]}
                            onPress={onClose}
                        >
                            <LabelMedium style={{ color: colors.onSurface }}>Cancel</LabelMedium>
                        </Pressable>
                        <Pressable
                            style={[styles.applyButton, { backgroundColor: colors.primary }]}
                            onPress={handleApply}
                        >
                            <MaterialCommunityIcons
                                name="check"
                                size={20}
                                color={colors.onPrimary}
                            />
                            <LabelMedium style={{ color: colors.onPrimary }}>Apply</LabelMedium>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 12,
    },
    content: {
        paddingHorizontal: 20,
    },
    preview: {
        height: 120,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionLabel: {
        marginBottom: 8,
        marginTop: 12,
    },
    textInput: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        fontSize: 16,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    optionButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    sliderButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sliderTrack: {
        flex: 1,
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    sliderFill: {
        height: '100%',
        borderRadius: 4,
    },
    sizeRow: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 4,
    },
    sizeButton: {
        width: 48,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    colorButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    actions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    applyButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
});

export default CurvedTextStyleModal;
