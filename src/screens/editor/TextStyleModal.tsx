/**
 * WidgetCraft - Text Style Modal
 * Full text styling editor with font, size, color, and weight options
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    TitleMedium,
    BodyMedium,
    LabelMedium,
    LabelSmall,
} from '@components/common';
import { TextStyle } from '@canvas/CanvasContext';
import { getContrastBackground } from '@utils/index';

// Types
// ============================================

interface TextStyleModalProps {
    visible: boolean;
    onClose: () => void;
    currentTextStyle: TextStyle | undefined;
    onApply: (textStyle: Partial<TextStyle>) => void;
}

// ============================================
// Constants
// ============================================

const FONTS = [
    { name: 'System', family: 'System' },
    { name: 'Serif', family: 'serif' },
    { name: 'Monospace', family: 'monospace' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72, 96];

const FONT_WEIGHTS = [
    { label: 'Light', value: '300' },
    { label: 'Regular', value: '400' },
    { label: 'Medium', value: '500' },
    { label: 'Bold', value: '700' },
    { label: 'Black', value: '900' },
];

const TEXT_ALIGNS: Array<{ label: string; value: 'left' | 'center' | 'right'; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = [
    { label: 'Left', value: 'left', icon: 'format-align-left' },
    { label: 'Center', value: 'center', icon: 'format-align-center' },
    { label: 'Right', value: 'right', icon: 'format-align-right' },
];

const COLORS = [
    '#FFFFFF', '#000000', '#F8FAFC', '#1E293B',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

// ============================================
// Component
// ============================================

export const TextStyleModal: React.FC<TextStyleModalProps> = ({
    visible,
    onClose,
    currentTextStyle,
    onApply,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();

    // State
    const [fontFamily, setFontFamily] = useState(currentTextStyle?.fontFamily || 'System');
    const [fontSize, setFontSize] = useState(currentTextStyle?.fontSize || 24);
    const [fontWeight, setFontWeight] = useState(currentTextStyle?.fontWeight || '400');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(currentTextStyle?.textAlign || 'center');
    const [textColor, setTextColor] = useState(currentTextStyle?.color || '#FFFFFF');
    const previewFontSize = Math.min(fontSize, 48);
    const previewLineHeight = Math.round(previewFontSize * 1.2);

    // Reset state when modal opens
    useEffect(() => {
        if (visible && currentTextStyle) {
            setFontFamily(currentTextStyle.fontFamily || 'System');
            setFontSize(currentTextStyle.fontSize || 24);
            setFontWeight(currentTextStyle.fontWeight || '400');
            setTextAlign(currentTextStyle.textAlign || 'center');
            setTextColor(currentTextStyle.color || '#FFFFFF');
        }
    }, [visible, currentTextStyle]);

    const handleApply = () => {
        console.log('TextStyleModal handleApply:', { fontFamily, fontSize, fontWeight, textAlign, textColor });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onApply({
            fontFamily,
            fontSize,
            fontWeight,
            textAlign,
            color: textColor,
        });
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
                            Text Style
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
                        {/* Preview */}
                        <View style={[styles.preview, { backgroundColor: getContrastBackground(textColor) }]}>
                            <BodyMedium
                                style={{
                                    color: textColor,
                                    fontFamily: fontFamily,
                                    fontSize: previewFontSize,
                                    lineHeight: previewLineHeight,
                                    fontWeight: fontWeight as any,
                                    textAlign: textAlign,
                                    width: '100%',
                                }}
                            >
                                Preview Text
                            </BodyMedium>
                        </View>

                        {/* Font Family */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Font Family
                        </LabelMedium>
                        <View style={styles.optionRow}>
                            {FONTS.map((font) => (
                                <Pressable
                                    key={font.name}
                                    style={[
                                        styles.optionButton,
                                        {
                                            backgroundColor: fontFamily === font.family
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    onPress={() => {
                                        setFontFamily(font.family);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <LabelSmall
                                        style={{
                                            color: fontFamily === font.family
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                            fontFamily: font.family,
                                        }}
                                    >
                                        {font.name}
                                    </LabelSmall>
                                </Pressable>
                            ))}
                        </View>

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

                        {/* Font Weight */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Weight
                        </LabelMedium>
                        <View style={styles.optionRow}>
                            {FONT_WEIGHTS.map((weight) => (
                                <Pressable
                                    key={weight.value}
                                    style={[
                                        styles.weightButton,
                                        {
                                            backgroundColor: fontWeight === weight.value
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    onPress={() => {
                                        setFontWeight(weight.value);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <LabelSmall
                                        style={{
                                            color: fontWeight === weight.value
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                            fontWeight: weight.value as any,
                                        }}
                                    >
                                        {weight.label}
                                    </LabelSmall>
                                </Pressable>
                            ))}
                        </View>

                        {/* Text Alignment */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Alignment
                        </LabelMedium>
                        <View style={styles.alignRow}>
                            {TEXT_ALIGNS.map((align) => (
                                <Pressable
                                    key={align.value}
                                    style={[
                                        styles.alignButton,
                                        {
                                            backgroundColor: textAlign === align.value
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    onPress={() => {
                                        setTextAlign(align.value);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name={align.icon}
                                        size={20}
                                        color={textAlign === align.value
                                            ? colors.onPrimaryContainer
                                            : colors.onSurfaceVariant
                                        }
                                    />
                                </Pressable>
                            ))}
                        </View>

                        {/* Text Color */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Color
                        </LabelMedium>
                        <View style={styles.colorGrid}>
                            {COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    style={[
                                        styles.colorButton,
                                        { backgroundColor: color },
                                        textColor === color && {
                                            borderWidth: 3,
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

                        {/* Theme Colors */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Theme Colors
                        </LabelMedium>
                        <View style={styles.colorGrid}>
                            {[
                                colors.primary,
                                colors.secondary,
                                colors.tertiary,
                                colors.error,
                                colors.onPrimary,
                                colors.onSecondary,
                                colors.onSurface,
                                colors.onSurfaceVariant,
                            ].map((color, index) => (
                                <Pressable
                                    key={`theme-${index}`}
                                    style={[
                                        styles.colorButton,
                                        { backgroundColor: color },
                                        textColor === color && {
                                            borderWidth: 3,
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
                            <MaterialCommunityIcons name="check" size={20} color={colors.onPrimary} />
                            <LabelMedium style={{ color: colors.onPrimary }}>Apply</LabelMedium>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
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
        minHeight: 80,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'stretch',
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    sectionLabel: {
        marginBottom: 8,
        marginTop: 12,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    optionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
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
    weightButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    alignRow: {
        flexDirection: 'row',
        gap: 12,
    },
    alignButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
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

export default TextStyleModal;
