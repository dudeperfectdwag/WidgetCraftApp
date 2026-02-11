/**
 * WidgetCraft - Clock Style Modal
 * Full clock customization with face styles, hand styles, colors, and options
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
    LabelMedium,
    LabelSmall,
} from '@components/common';
import { ClockConfig, TextStyle } from '@canvas/CanvasContext';
import { AnalogClock } from '../../widgets/components/AnalogClock';
import { DigitalClock } from '../../widgets/components/DigitalClock';
import { getContrastBackground } from '@utils/index';

// Types
// ============================================

interface ClockStyleModalProps {
    visible: boolean;
    onClose: () => void;
    currentConfig: ClockConfig | undefined;
    currentTextStyle?: TextStyle;
    onApply: (config: ClockConfig, textStyle?: Partial<TextStyle>) => void;
    clockType?: 'analogClock' | 'digitalClock';
}

// ============================================
// Constants
// ============================================

const FONTS = [
    { label: 'System', value: 'System' },
    { label: 'Serif', value: 'serif' },
    { label: 'Mono', value: 'monospace' },
    { label: 'Courier', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Times', value: 'Times New Roman' },
    { label: 'Trebuchet', value: 'Trebuchet MS' },
    { label: 'Verdana', value: 'Verdana' },
];

const FONT_WEIGHTS = [
    { label: 'Thin', value: '100' },
    { label: 'Light', value: '300' },
    { label: 'Regular', value: '400' },
    { label: 'Medium', value: '500' },
    { label: 'Bold', value: '700' },
    { label: 'Black', value: '900' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72, 96];

const TEXT_ALIGNS: Array<{ label: string; value: 'left' | 'center' | 'right'; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = [
    { label: 'Left', value: 'left', icon: 'format-align-left' },
    { label: 'Center', value: 'center', icon: 'format-align-center' },
    { label: 'Right', value: 'right', icon: 'format-align-right' },
];

const FACE_STYLES: Array<{ label: string; value: ClockConfig['faceStyle'] }> = [
    { label: 'Minimal', value: 'minimal' },
    { label: 'Classic', value: 'classic' },
    { label: 'Modern', value: 'modern' },
    { label: 'Roman', value: 'roman' },
    { label: 'Dots', value: 'dots' },
    { label: 'Lines', value: 'lines' },
];

const HAND_STYLES: Array<{ label: string; value: ClockConfig['handStyle'] }> = [
    { label: 'Classic', value: 'classic' },
    { label: 'Modern', value: 'modern' },
    { label: 'Thin', value: 'thin' },
    { label: 'Bold', value: 'bold' },
    { label: 'Arrow', value: 'arrow' },
];

const TIME_FORMATS: Array<{ label: string; value: '12h' | '24h' }> = [
    { label: '12 Hour', value: '12h' },
    { label: '24 Hour', value: '24h' },
];

const PRESET_COLORS = [
    '#FFFFFF', '#000000', '#1E293B', '#F8FAFC',
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
];

// ============================================
// Component
// ============================================

export const ClockStyleModal: React.FC<ClockStyleModalProps> = ({
    visible,
    onClose,
    currentConfig,
    currentTextStyle,
    onApply,
    clockType = 'analogClock',
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const isDigital = clockType === 'digitalClock';

    // State
    const [faceStyle, setFaceStyle] = useState<ClockConfig['faceStyle']>(currentConfig?.faceStyle || 'minimal');
    const [handStyle, setHandStyle] = useState<ClockConfig['handStyle']>(currentConfig?.handStyle || 'classic');
    const [showSeconds, setShowSeconds] = useState(currentConfig?.showSeconds ?? true);
    const [showNumbers, setShowNumbers] = useState(currentConfig?.showNumbers ?? true);
    const [showTicks, setShowTicks] = useState(currentConfig?.showTicks ?? true);
    const [smoothSeconds, setSmoothSeconds] = useState(currentConfig?.smoothSeconds ?? false);
    
    // Digital clock specific
    const [format, setFormat] = useState<'12h' | '24h'>(currentConfig?.format || '12h');
    const [showAmPm, setShowAmPm] = useState(currentConfig?.showAmPm ?? true);
    
    // Colors
    const [faceColor, setFaceColor] = useState(currentConfig?.faceColor || '#1E293B');
    const [hourHandColor, setHourHandColor] = useState(currentConfig?.hourHandColor || '#FFFFFF');
    const [minuteHandColor, setMinuteHandColor] = useState(currentConfig?.minuteHandColor || '#FFFFFF');
    const [secondHandColor, setSecondHandColor] = useState(currentConfig?.secondHandColor || '#EF4444');
    const [tickColor, setTickColor] = useState(currentConfig?.tickColor || '#FFFFFF');
    const [numberColor, setNumberColor] = useState(currentConfig?.numberColor || '#FFFFFF');
    
    // Text Style (Digital)
    const [fontFamily, setFontFamily] = useState(currentTextStyle?.fontFamily || 'System');
    const [fontWeight, setFontWeight] = useState(currentTextStyle?.fontWeight || '400');
    const [fontSize, setFontSize] = useState(currentTextStyle?.fontSize || 24);
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(currentTextStyle?.textAlign || 'center');

    // Active color picker
    const [activeColorTarget, setActiveColorTarget] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setFaceStyle(currentConfig?.faceStyle || 'minimal');
            setHandStyle(currentConfig?.handStyle || 'classic');
            setShowSeconds(currentConfig?.showSeconds ?? true);
            setShowNumbers(currentConfig?.showNumbers ?? true);
            setShowTicks(currentConfig?.showTicks ?? true);
            setSmoothSeconds(currentConfig?.smoothSeconds ?? false);
            setFormat(currentConfig?.format || '12h');
            setShowAmPm(currentConfig?.showAmPm ?? true);
            setFaceColor(currentConfig?.faceColor || '#1E293B');
            setHourHandColor(currentConfig?.hourHandColor || '#FFFFFF');
            setMinuteHandColor(currentConfig?.minuteHandColor || '#FFFFFF');
            setSecondHandColor(currentConfig?.secondHandColor || '#EF4444');
            setTickColor(currentConfig?.tickColor || '#FFFFFF');
            setNumberColor(currentConfig?.numberColor || '#FFFFFF');
            
            setFontFamily(currentTextStyle?.fontFamily || 'System');
            setFontWeight(currentTextStyle?.fontWeight || '400');
            setFontSize(currentTextStyle?.fontSize || 24);
            setTextAlign(currentTextStyle?.textAlign || 'center');
            
            setActiveColorTarget(null);
        }
    }, [visible, currentConfig, currentTextStyle]);

    const handleApply = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        const newTextStyle: Partial<TextStyle> = isDigital ? {
            fontFamily,
            fontWeight,
            fontSize,
            textAlign,
            color: hourHandColor,
        } : {};

        onApply({
            faceStyle,
            handStyle,
            showSeconds,
            showNumbers,
            showTicks,
            smoothSeconds,
            format,
            showAmPm,
            faceColor,
            hourHandColor,
            minuteHandColor,
            secondHandColor,
            tickColor,
            numberColor,
        }, newTextStyle);
        onClose();
    };

    const handleColorSelect = (color: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        switch (activeColorTarget) {
            case 'face': setFaceColor(color); break;
            case 'hourHand': setHourHandColor(color); break;
            case 'minuteHand': setMinuteHandColor(color); break;
            case 'secondHand': setSecondHandColor(color); break;
            case 'tick': setTickColor(color); break;
            case 'number': setNumberColor(color); break;
        }
    };

    const getActiveColor = () => {
        switch (activeColorTarget) {
            case 'face': return faceColor;
            case 'hourHand': return hourHandColor;
            case 'minuteHand': return minuteHandColor;
            case 'secondHand': return secondHandColor;
            case 'tick': return tickColor;
            case 'number': return numberColor;
            default: return null;
        }
    };

    const renderToggle = (
        label: string,
        value: boolean,
        onToggle: (v: boolean) => void
    ) => (
        <Pressable
            style={[
                styles.toggleRow,
                { backgroundColor: colors.surfaceContainerHigh },
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onToggle(!value);
            }}
        >
            <LabelMedium style={{ color: colors.onSurface }}>{label}</LabelMedium>
            <View
                style={[
                    styles.toggleTrack,
                    { backgroundColor: value ? colors.primary : colors.surfaceContainerHighest },
                ]}
            >
                <View
                    style={[
                        styles.toggleThumb,
                        {
                            backgroundColor: value ? colors.onPrimary : colors.onSurfaceVariant,
                            transform: [{ translateX: value ? 20 : 0 }],
                        },
                    ]}
                />
            </View>
        </Pressable>
    );

    const renderColorButton = (
        label: string,
        targetKey: string,
        color: string
    ) => (
        <Pressable
            style={[
                styles.colorTargetButton,
                {
                    backgroundColor: activeColorTarget === targetKey
                        ? colors.primaryContainer
                        : colors.surfaceContainerHigh,
                    borderColor: activeColorTarget === targetKey
                        ? colors.primary
                        : 'transparent',
                    borderWidth: 2,
                },
            ]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveColorTarget(activeColorTarget === targetKey ? null : targetKey);
            }}
        >
            <View style={[styles.colorPreview, { backgroundColor: color }]} />
            <LabelSmall
                style={{
                    color: activeColorTarget === targetKey
                        ? colors.onPrimaryContainer
                        : colors.onSurface,
                }}
            >
                {label}
            </LabelSmall>
        </Pressable>
    );

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
                            Clock Style
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
                        <View style={[styles.preview, { backgroundColor: isDigital ? getContrastBackground(hourHandColor) : getContrastBackground(faceColor) }]}>
                            {isDigital ? (
                                <DigitalClock
                                    width={180}
                                    height={60}
                                    format={format}
                                    showSeconds={showSeconds}
                                    showAmPm={showAmPm}
                                    textColor={hourHandColor}
                                    secondaryColor={secondHandColor}
                                    fontFamily={fontFamily}
                                    fontSize={fontSize}
                                    fontWeight={fontWeight as any}
                                    textAlign={textAlign}
                                />
                            ) : (
                                <AnalogClock
                                    size={120}
                                    faceStyle={faceStyle}
                                    handStyle={handStyle}
                                    showSeconds={showSeconds}
                                    showNumbers={showNumbers}
                                    showTicks={showTicks}
                                    smoothSeconds={smoothSeconds}
                                    faceColor={faceColor}
                                    hourHandColor={hourHandColor}
                                    minuteHandColor={minuteHandColor}
                                    secondHandColor={secondHandColor}
                                    tickColor={tickColor}
                                    numberColor={numberColor}
                                />
                            )}
                        </View>

                        {/* Time Format - Digital only */}
                        {isDigital && (
                            <>
                                <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                                    Time Format
                                </LabelMedium>
                                <View style={styles.optionRow}>
                                    {TIME_FORMATS.map((fmt) => (
                                        <Pressable
                                            key={fmt.value}
                                            style={[
                                                styles.styleButton,
                                                {
                                                    flex: 1,
                                                    backgroundColor: format === fmt.value
                                                        ? colors.primaryContainer
                                                        : colors.surfaceContainerHigh,
                                                },
                                            ]}
                                            onPress={() => {
                                                setFormat(fmt.value);
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            }}
                                        >
                                            <LabelSmall
                                                style={{
                                                    color: format === fmt.value
                                                        ? colors.onPrimaryContainer
                                                        : colors.onSurface,
                                                }}
                                            >
                                                {fmt.label}
                                            </LabelSmall>
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        )}
                        
                        {/* Font Style - Digital only */}
                        {isDigital && (
                            <>
                                <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                                    Font Family
                                </LabelMedium>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.optionRow}>
                                        {FONTS.map((font) => (
                                            <Pressable
                                                key={font.value}
                                                style={[
                                                    styles.styleButton,
                                                    {
                                                        backgroundColor: fontFamily === font.value
                                                            ? colors.primaryContainer
                                                            : colors.surfaceContainerHigh,
                                                    },
                                                ]}
                                                onPress={() => {
                                                    setFontFamily(font.value);
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
                                            >
                                                <LabelSmall
                                                    style={{
                                                        color: fontFamily === font.value
                                                            ? colors.onPrimaryContainer
                                                            : colors.onSurface,
                                                        fontFamily: font.value,
                                                    }}
                                                >
                                                    {font.label}
                                                </LabelSmall>
                                            </Pressable>
                                        ))}
                                    </View>
                                </ScrollView>

                                <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                                    Font Weight
                                </LabelMedium>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.optionRow}>
                                        {FONT_WEIGHTS.map((weight) => (
                                            <Pressable
                                                key={weight.value}
                                                style={[
                                                    styles.styleButton,
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
                                </ScrollView>

                                <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                                    Font Size: {fontSize}px
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
                                                    : colors.onSurface}
                                            />
                                        </Pressable>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Face Style - Analog only */}
                        {!isDigital && (
                            <>
                                <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                                    Face Style
                                </LabelMedium>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.optionRow}>
                                        {FACE_STYLES.map((style) => (
                                            <Pressable
                                                key={style.value}
                                                style={[
                                                    styles.styleButton,
                                                    {
                                                        backgroundColor: faceStyle === style.value
                                                            ? colors.primaryContainer
                                                            : colors.surfaceContainerHigh,
                                                    },
                                                ]}
                                                onPress={() => {
                                                    setFaceStyle(style.value);
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
                                            >
                                                <LabelSmall
                                                    style={{
                                                        color: faceStyle === style.value
                                                            ? colors.onPrimaryContainer
                                                            : colors.onSurface,
                                                    }}
                                                >
                                                    {style.label}
                                                </LabelSmall>
                                            </Pressable>
                                        ))}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {/* Hand Style - Analog only */}
                        {!isDigital && (
                            <>
                                <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                                    Hand Style
                                </LabelMedium>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.optionRow}>
                                        {HAND_STYLES.map((style) => (
                                            <Pressable
                                                key={style.value}
                                                style={[
                                                    styles.styleButton,
                                                    {
                                                        backgroundColor: handStyle === style.value
                                                            ? colors.primaryContainer
                                                            : colors.surfaceContainerHigh,
                                                    },
                                                ]}
                                                onPress={() => {
                                                    setHandStyle(style.value);
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }}
                                            >
                                                <LabelSmall
                                                    style={{
                                                        color: handStyle === style.value
                                                            ? colors.onPrimaryContainer
                                                            : colors.onSurface,
                                                    }}
                                                >
                                                    {style.label}
                                                </LabelSmall>
                                            </Pressable>
                                        ))}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {/* Toggles */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Options
                        </LabelMedium>
                        <View style={styles.togglesContainer}>
                            {renderToggle(isDigital ? 'Show Seconds' : 'Show Seconds Hand', showSeconds, setShowSeconds)}
                            {isDigital && format === '12h' && renderToggle('Show AM/PM', showAmPm, setShowAmPm)}
                            {!isDigital && renderToggle('Show Numbers', showNumbers, setShowNumbers)}
                            {!isDigital && renderToggle('Show Tick Marks', showTicks, setShowTicks)}
                            {!isDigital && renderToggle('Smooth Seconds', smoothSeconds, setSmoothSeconds)}
                        </View>

                        {/* Color Targets */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Colors - Tap to Edit
                        </LabelMedium>
                        <View style={styles.colorTargetsGrid}>
                            {!isDigital && renderColorButton('Face', 'face', faceColor)}
                            {renderColorButton(isDigital ? 'Text' : 'Hour', 'hourHand', hourHandColor)}
                            {!isDigital && renderColorButton('Minute', 'minuteHand', minuteHandColor)}
                            {renderColorButton('Secondary', 'secondHand', secondHandColor)}
                            {!isDigital && renderColorButton('Ticks', 'tick', tickColor)}
                            {!isDigital && renderColorButton('Numbers', 'number', numberColor)}
                        </View>

                        {/* Color Picker Grid */}
                        {activeColorTarget && (
                            <>
                                <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                                    Select Color
                                </LabelMedium>
                                <View style={styles.colorGrid}>
                                    {PRESET_COLORS.map((color) => (
                                        <Pressable
                                            key={color}
                                            style={[
                                                styles.colorButton,
                                                {
                                                    backgroundColor: color,
                                                    borderWidth: getActiveColor() === color ? 3 : 0,
                                                    borderColor: colors.primary,
                                                },
                                            ]}
                                            onPress={() => handleColorSelect(color)}
                                        />
                                    ))}
                                </View>
                            </>
                        )}

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
        height: 150,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionLabel: {
        marginBottom: 8,
        marginTop: 12,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 4,
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
    styleButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    togglesContainer: {
        gap: 8,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    toggleTrack: {
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    colorTargetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    colorTargetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 8,
    },
    colorPreview: {
        width: 20,
        height: 20,
        borderRadius: 10,
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

export default ClockStyleModal;
