/**
 * WidgetCraft - Typography Studio
 * Text editing and styling component with:
 * - Font family selection (Google Fonts)
 * - Font size, weight, style controls
 * - Text alignment and spacing
 * - Text  and effects
 * - Letter and line spacing
 */

import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import {
    PremiumCard,
    PremiumChip,
    PremiumSlider,
    TitleMedium,
    TitleSmall,
    BodySmall,
    BodyMedium,
    LabelSmall,
} from '@components/common';

// ============================================
// Types
// ============================================

export interface TextStyleConfig {
    fontFamily: string;
    fontSize: number;
    fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontStyle: 'normal' | 'italic';
    color: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    letterSpacing: number;
    lineHeight: number;
    textDecoration: 'none' | 'underline' | 'line-through';
    textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    shadow?: TextShadow;
}

export interface TextShadow {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
}

// ============================================
// Font Families
// ============================================

export const FONT_FAMILIES = [
    { name: 'System', family: 'System' },
    { name: 'Inter', family: 'Inter' },
    { name: 'Roboto', family: 'Roboto' },
    { name: 'Outfit', family: 'Outfit' },
    { name: 'Poppins', family: 'Poppins' },
    { name: 'Montserrat', family: 'Montserrat' },
    { name: 'Open Sans', family: 'Open Sans' },
    { name: 'Lato', family: 'Lato' },
    { name: 'Nunito', family: 'Nunito' },
    { name: 'Playfair Display', family: 'Playfair Display' },
    { name: 'Source Sans Pro', family: 'Source Sans Pro' },
    { name: 'Raleway', family: 'Raleway' },
];

export const FONT_WEIGHTS: { label: string; value: TextStyleConfig['fontWeight'] }[] = [
    { label: 'Thin', value: '100' },
    { label: 'Extra Light', value: '200' },
    { label: 'Light', value: '300' },
    { label: 'Regular', value: '400' },
    { label: 'Medium', value: '500' },
    { label: 'Semi Bold', value: '600' },
    { label: 'Bold', value: '700' },
    { label: 'Extra Bold', value: '800' },
    { label: 'Black', value: '900' },
];

// ============================================
// Font Family Picker
// ============================================

interface FontFamilyPickerProps {
    selected: string;
    onSelect: (family: string) => void;
}

const FontFamilyPicker: React.FC<FontFamilyPickerProps> = ({ selected, onSelect }) => {
    const colors = useColors();

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fontFamilyList}
        >
            {FONT_FAMILIES.map((font) => (
                <Pressable
                    key={font.family}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onSelect(font.family);
                    }}
                >
                    <View
                        style={[
                            styles.fontFamilyItem,
                            {
                                backgroundColor: selected === font.family
                                    ? colors.primaryContainer
                                    : colors.surfaceContainerHigh,
                                borderColor: selected === font.family
                                    ? colors.primary
                                    : 'transparent',
                            },
                        ]}
                    >
                        <BodyMedium
                            style={{
                                fontFamily: font.family,
                                color: selected === font.family
                                    ? colors.onPrimaryContainer
                                    : colors.onSurface,
                            }}
                        >
                            {font.name}
                        </BodyMedium>
                    </View>
                </Pressable>
            ))}
        </ScrollView>
    );
};

// ============================================
// Alignment & Style Controls
// ============================================

interface AlignmentControlsProps {
    textAlign: TextStyleConfig['textAlign'];
    onAlignChange: (align: TextStyleConfig['textAlign']) => void;
    fontStyle: TextStyleConfig['fontStyle'];
    onStyleChange: (style: TextStyleConfig['fontStyle']) => void;
    textDecoration: TextStyleConfig['textDecoration'];
    onDecorationChange: (decoration: TextStyleConfig['textDecoration']) => void;
}

const AlignmentControls: React.FC<AlignmentControlsProps> = ({
    textAlign,
    onAlignChange,
    fontStyle,
    onStyleChange,
    textDecoration,
    onDecorationChange,
}) => {
    const colors = useColors();

    const alignments: { value: TextStyleConfig['textAlign']; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
        { value: 'left', icon: 'format-align-left' },
        { value: 'center', icon: 'format-align-center' },
        { value: 'right', icon: 'format-align-right' },
        { value: 'justify', icon: 'format-align-justify' },
    ];

    const styles_array: { value: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; type: 'fontStyle' | 'textDecoration' }[] = [
        { value: 'italic', icon: 'format-italic', type: 'fontStyle' },
        { value: 'underline', icon: 'format-underline', type: 'textDecoration' },
        { value: 'line-through', icon: 'format-strikethrough', type: 'textDecoration' },
    ];

    return (
        <View style={styles.alignmentRow}>
            {/* Alignment */}
            <View style={styles.buttonGroup}>
                {alignments.map((item) => (
                    <Pressable
                        key={item.value}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onAlignChange(item.value);
                        }}
                        style={[
                            styles.iconButton,
                            {
                                backgroundColor: textAlign === item.value
                                    ? colors.primaryContainer
                                    : 'transparent',
                            },
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={item.icon}
                            size={20}
                            color={textAlign === item.value ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                        />
                    </Pressable>
                ))}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

            {/* Style */}
            <View style={styles.buttonGroup}>
                {styles_array.map((item) => {
                    const isActive = item.type === 'fontStyle'
                        ? fontStyle === 'italic'
                        : textDecoration === item.value;

                    return (
                        <Pressable
                            key={item.value}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                if (item.type === 'fontStyle') {
                                    onStyleChange(fontStyle === 'italic' ? 'normal' : 'italic');
                                } else {
                                    onDecorationChange(
                                        textDecoration === item.value ? 'none' : item.value as TextStyleConfig['textDecoration']
                                    );
                                }
                            }}
                            style={[
                                styles.iconButton,
                                {
                                    backgroundColor: isActive
                                        ? colors.primaryContainer
                                        : 'transparent',
                                },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={item.icon}
                                size={20}
                                color={isActive ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                            />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

// ============================================
// Text Transform Controls
// ============================================

interface TextTransformControlsProps {
    textTransform: TextStyleConfig['textTransform'];
    onTransformChange: (transform: TextStyleConfig['textTransform']) => void;
}

const TextTransformControls: React.FC<TextTransformControlsProps> = ({
    textTransform,
    onTransformChange,
}) => {
    const colors = useColors();

    const transforms: { value: TextStyleConfig['textTransform']; label: string }[] = [
        { value: 'none', label: 'Aa' },
        { value: 'uppercase', label: 'AA' },
        { value: 'lowercase', label: 'aa' },
        { value: 'capitalize', label: 'Ab' },
    ];

    return (
        <View style={styles.transformRow}>
            {transforms.map((item) => (
                <Pressable
                    key={item.value}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onTransformChange(item.value);
                    }}
                    style={[
                        styles.transformButton,
                        {
                            backgroundColor: textTransform === item.value
                                ? colors.primaryContainer
                                : colors.surfaceContainerHigh,
                        },
                    ]}
                >
                    <BodySmall
                        style={{
                            color: textTransform === item.value
                                ? colors.onPrimaryContainer
                                : colors.onSurface,
                            fontWeight: '600',
                        }}
                    >
                        {item.label}
                    </BodySmall>
                </Pressable>
            ))}
        </View>
    );
};

// ============================================
// Text Preview
// ============================================

interface TextPreviewProps {
    text: string;
    style: TextStyleConfig;
}

const TextPreview: React.FC<TextPreviewProps> = ({ text, style }) => {
    const colors = useColors();

    return (
        <View style={[styles.textPreview, { backgroundColor: colors.surfaceContainerLow }]}>
            <BodyMedium
                style={{
                    fontFamily: style.fontFamily,
                    fontSize: style.fontSize,
                    fontWeight: style.fontWeight,
                    fontStyle: style.fontStyle,
                    color: style.color,
                    textAlign: style.textAlign,
                    letterSpacing: style.letterSpacing,
                    lineHeight: style.lineHeight * style.fontSize,
                    textDecorationLine: style.textDecoration,
                    textTransform: style.textTransform,
                    ...(style.shadow && {
                        textShadowColor: style.shadow.color,
                        textShadowOffset: { width: style.shadow.offsetX, height: style.shadow.offsetY },
                        textShadowRadius: style.shadow.blur,
                    }),
                }}
            >
                {text}
            </BodyMedium>
        </View>
    );
};

// ============================================
// Main Typography Studio Component
// ============================================

export interface TypographyStudioProps {
    style: TextStyleConfig;
    onStyleChange: (style: TextStyleConfig) => void;
    previewText?: string;
}

export const TypographyStudio: React.FC<TypographyStudioProps> = ({
    style,
    onStyleChange,
    previewText = 'The quick brown fox jumps over the lazy dog',
}) => {
    const colors = useColors();
    const [showShadow, setShowShadow] = useState(!!style.shadow);

    const updateStyle = useCallback((updates: Partial<TextStyleConfig>) => {
        onStyleChange({ ...style, ...updates });
    }, [style, onStyleChange]);

    const updateShadow = useCallback((shadowUpdates: Partial<TextShadow>) => {
        const currentShadow = style.shadow || { color: '#00000050', offsetX: 2, offsetY: 2, blur: 4 };
        onStyleChange({
            ...style,
            shadow: { ...currentShadow, ...shadowUpdates },
        });
    }, [style, onStyleChange]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Preview */}
            <TextPreview text={previewText} style={style} />

            {/* Font Family */}
            <View style={styles.section}>
                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>Font Family</LabelSmall>
                <FontFamilyPicker
                    selected={style.fontFamily}
                    onSelect={(family) => updateStyle({ fontFamily: family })}
                />
            </View>

            {/* Font Size & Weight */}
            <View style={styles.section}>
                <View style={styles.rowBetween}>
                    <LabelSmall style={{ color: colors.onSurfaceVariant }}>Size</LabelSmall>
                    <LabelSmall style={{ color: colors.onSurface }}>{style.fontSize}px</LabelSmall>
                </View>
                <PremiumSlider
                    value={style.fontSize}
                    min={8}
                    max={120}
                    step={1}
                    onValueChange={(size) => updateStyle({ fontSize: size })}
                />
            </View>

            <View style={styles.section}>
                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>Weight</LabelSmall>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.weightList}
                >
                    {FONT_WEIGHTS.map((weight) => (
                        <PremiumChip
                            key={weight.value}
                            label={weight.label}
                            variant={style.fontWeight === weight.value ? 'filled' : 'outlined'}
                            selected={style.fontWeight === weight.value}
                            size="small"
                            onPress={() => updateStyle({ fontWeight: weight.value })}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Alignment & Style */}
            <View style={styles.section}>
                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>Alignment & Style</LabelSmall>
                <AlignmentControls
                    textAlign={style.textAlign}
                    onAlignChange={(align) => updateStyle({ textAlign: align })}
                    fontStyle={style.fontStyle}
                    onStyleChange={(fontStyle) => updateStyle({ fontStyle })}
                    textDecoration={style.textDecoration}
                    onDecorationChange={(textDecoration) => updateStyle({ textDecoration })}
                />
            </View>

            {/* Text Transform */}
            <View style={styles.section}>
                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>Transform</LabelSmall>
                <TextTransformControls
                    textTransform={style.textTransform}
                    onTransformChange={(transform) => updateStyle({ textTransform: transform })}
                />
            </View>

            {/* Letter Spacing */}
            <View style={styles.section}>
                <View style={styles.rowBetween}>
                    <LabelSmall style={{ color: colors.onSurfaceVariant }}>Letter Spacing</LabelSmall>
                    <LabelSmall style={{ color: colors.onSurface }}>{style.letterSpacing.toFixed(1)}</LabelSmall>
                </View>
                <PremiumSlider
                    value={style.letterSpacing}
                    min={-5}
                    max={20}
                    step={0.1}
                    onValueChange={(spacing) => updateStyle({ letterSpacing: spacing })}
                />
            </View>

            {/* Line Height */}
            <View style={styles.section}>
                <View style={styles.rowBetween}>
                    <LabelSmall style={{ color: colors.onSurfaceVariant }}>Line Height</LabelSmall>
                    <LabelSmall style={{ color: colors.onSurface }}>{style.lineHeight.toFixed(1)}x</LabelSmall>
                </View>
                <PremiumSlider
                    value={style.lineHeight}
                    min={0.8}
                    max={3}
                    step={0.1}
                    onValueChange={(height) => updateStyle({ lineHeight: height })}
                />
            </View>

            {/* Text Shadow */}
            <View style={styles.section}>
                <View style={styles.rowBetween}>
                    <LabelSmall style={{ color: colors.onSurfaceVariant }}>Text Shadow</LabelSmall>
                    <Pressable
                        onPress={() => {
                            setShowShadow(!showShadow);
                            if (!showShadow) {
                                updateStyle({
                                    shadow: { color: '#00000050', offsetX: 2, offsetY: 2, blur: 4 },
                                });
                            } else {
                                updateStyle({ shadow: undefined });
                            }
                        }}
                    >
                        <MaterialCommunityIcons
                            name={showShadow ? 'toggle-switch' : 'toggle-switch-off'}
                            size={36}
                            color={showShadow ? colors.primary : colors.onSurfaceVariant}
                        />
                    </Pressable>
                </View>

                {showShadow && style.shadow && (
                    <View style={styles.shadowControls}>
                        <View style={styles.shadowRow}>
                            <View style={styles.shadowField}>
                                <LabelSmall style={{ color: colors.onSurfaceVariant }}>Offset X</LabelSmall>
                                <PremiumSlider
                                    value={style.shadow.offsetX}
                                    min={-20}
                                    max={20}
                                    step={1}
                                    onValueChange={(x) => updateShadow({ offsetX: x })}
                                />
                            </View>
                            <View style={styles.shadowField}>
                                <LabelSmall style={{ color: colors.onSurfaceVariant }}>Offset Y</LabelSmall>
                                <PremiumSlider
                                    value={style.shadow.offsetY}
                                    min={-20}
                                    max={20}
                                    step={1}
                                    onValueChange={(y) => updateShadow({ offsetY: y })}
                                />
                            </View>
                        </View>
                        <View style={styles.shadowField}>
                            <LabelSmall style={{ color: colors.onSurfaceVariant }}>Blur</LabelSmall>
                            <PremiumSlider
                                value={style.shadow.blur}
                                min={0}
                                max={30}
                                step={1}
                                onValueChange={(blur) => updateShadow({ blur })}
                            />
                        </View>
                    </View>
                )}
            </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    textPreview: {
        padding: 24,
        borderRadius: 16,
        marginBottom: 24,
        minHeight: 100,
        justifyContent: 'center',
    },
    fontFamilyList: {
        gap: 8,
    },
    fontFamilyItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 2,
    },
    weightList: {
        gap: 8,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    alignmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 4,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        width: 1,
        height: 24,
        marginHorizontal: 8,
    },
    transformRow: {
        flexDirection: 'row',
        gap: 8,
    },
    transformButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    shadowControls: {
        marginTop: 12,
        gap: 12,
    },
    shadowRow: {
        flexDirection: 'row',
        gap: 12,
    },
    shadowField: {
        flex: 1,
    },
});

export default TypographyStudio;
