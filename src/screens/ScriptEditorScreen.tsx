/**
 * WidgetCraft - Script Editor Screen (Advanced)
 * Dedicated interface for creating and editing script widgets
 * with live preview, code editor, style customization, and scripting reference.
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Text,
    Dimensions,
    Modal,
    KeyboardAvoidingView,
    Platform,
    PanResponder,
    ToastAndroid,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import { useColors, useTheme } from '@theme/index';
import {
    TitleMedium,
    TitleSmall,
    BodyMedium,
    BodySmall,
    LabelMedium,
    LabelSmall,
} from '@components/common';
import { PremiumIconButton } from '@components/common/PremiumIconButton';
import { RootStackParamList } from '@navigation/types';
import {
    createScriptRuntime,
    defaultRuntimeOptions,
    ScriptOutput,
    ScriptRuntimeResult,
} from '../services/ScriptRuntime';
import { dataProvider, startDataUpdates } from '../widgets/data/DataSources';
import { saveWidget } from '../services/WidgetStorage';
import { CanvasElement } from '../canvas/CanvasContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// Types
// ============================================

type ActiveTab = 'code' | 'preview' | 'style' | 'learn';

interface WidgetStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    fontColor: string;
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    letterSpacing: number;
    bgColor: string;
    bgOpacity: number;
    borderColor: string;
    borderWidth: number;
    borderStyle: 'solid' | 'dashed' | 'dotted';
    cornerRadius: number;
    shadowEnabled: boolean;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    widgetWidth: number;
    widgetHeight: number;
    padding: number;
    shape: 'rectangle' | 'rounded' | 'pill' | 'circle';
}

const DEFAULT_WIDGET_STYLE: WidgetStyle = {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400',
    fontColor: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 1.4,
    letterSpacing: 0,
    bgColor: '#1C1C1E',
    bgOpacity: 1,
    borderColor: '#3A3A3C',
    borderWidth: 0,
    borderStyle: 'solid',
    cornerRadius: 16,
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: 8,
    shadowOffsetX: 0,
    shadowOffsetY: 4,
    widgetWidth: 300,
    widgetHeight: 200,
    padding: 16,
    shape: 'rounded',
};

// ============================================
// Constants
// ============================================

const FONT_FAMILIES = [
    { label: 'System', value: 'System' },
    { label: 'Mono', value: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    { label: 'Serif', value: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
    { label: 'Sans', value: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif' },
    { label: 'Rounded', value: Platform.OS === 'ios' ? 'SF Pro Rounded' : 'Roboto' },
];

const FONT_WEIGHTS = [
    { label: 'Thin', value: '100' },
    { label: 'Light', value: '300' },
    { label: 'Regular', value: '400' },
    { label: 'Medium', value: '500' },
    { label: 'Semi', value: '600' },
    { label: 'Bold', value: '700' },
    { label: 'Black', value: '900' },
];

const PRESET_COLORS = [
    '#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00',
    '#34C759', '#30D158', '#00C7BE', '#32ADE6', '#007AFF',
    '#5856D6', '#AF52DE', '#FF2D55', '#A2845E', '#8E8E93',
    '#636366', '#48484A', '#3A3A3C', '#2C2C2E', '#1C1C1E',
];

const SHAPE_OPTIONS: { label: string; value: WidgetStyle['shape']; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { label: 'Rect', value: 'rectangle', icon: 'rectangle-outline' },
    { label: 'Rounded', value: 'rounded', icon: 'rounded-corner' },
    { label: 'Pill', value: 'pill', icon: 'stadium-outline' },
    { label: 'Circle', value: 'circle', icon: 'circle-outline' },
];

const BORDER_STYLES: { label: string; value: 'solid' | 'dashed' | 'dotted' }[] = [
    { label: 'Solid', value: 'solid' },
    { label: 'Dash', value: 'dashed' },
    { label: 'Dot', value: 'dotted' },
];

// ============================================
// Script Examples
// ============================================

interface ScriptExample {
    title: string;
    description: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    code: string;
}

const SCRIPT_EXAMPLES: ScriptExample[] = [
    {
        title: 'Hello World',
        description: 'Display simple text',
        icon: 'hand-wave',
        code: `// Simple text output\nreturn { type: 'text', value: 'Hello, World!' };`,
    },
    {
        title: 'Current Time',
        description: 'Show live time using context',
        icon: 'clock-outline',
        code: `// Access the current time\nvar d = new Date(context.now);\nvar h = d.getHours();\nvar m = d.getMinutes();\nvar ampm = h >= 12 ? 'PM' : 'AM';\nh = h % 12 || 12;\nvar mm = m < 10 ? '0' + m : m;\nreturn { type: 'text', value: h + ':' + mm + ' ' + ampm };`,
    },
    {
        title: 'Greeting',
        description: 'Time-based greeting message',
        icon: 'weather-sunny',
        code: `// Greeting based on time of day\nvar h = new Date(context.now).getHours();\nvar greeting = 'Good ';\nif (h < 12) greeting += 'Morning';\nelse if (h < 17) greeting += 'Afternoon';\nelse greeting += 'Evening';\nreturn { type: 'text', value: greeting + ' \\u2728' };`,
    },
    {
        title: 'Todo List',
        description: 'Display a list of items',
        icon: 'format-list-bulleted',
        code: `// List output with multiple items\nreturn {\n  type: 'list',\n  items: [\n    { value: 'Buy groceries' },\n    { value: 'Walk the dog' },\n    { value: 'Read a book' },\n  ]\n};`,
    },
    {
        title: 'Shape',
        description: 'Render a simple shape',
        icon: 'shape',
        code: `// Shape output\nreturn { type: 'shape', shape: 'circle' };`,
    },
    {
        title: 'Countdown',
        description: 'Days until a target date',
        icon: 'calendar-clock',
        code: `// Countdown to a date\nvar target = new Date('2026-12-31');\nvar now = new Date(context.now);\nvar diff = target.getTime() - now.getTime();\nvar days = Math.ceil(diff / 86400000);\nreturn { type: 'text', value: days + ' days left' };`,
    },
    {
        title: 'Data Binding',
        description: 'Use context.get() for live data',
        icon: 'database-outline',
        code: `// Read live data via context\nvar temp = context.get('weather.temp');\nvar cond = context.get('weather.condition');\nreturn {\n  type: 'text',\n  value: temp + ' - ' + cond\n};`,
    },
    {
        title: 'Random Quote',
        description: 'Pick a random quote each refresh',
        icon: 'format-quote-open',
        code: `// Random quote picker\nvar quotes = [\n  'Stay hungry, stay foolish.',\n  'Think different.',\n  'Less is more.',\n  'Make it simple.',\n];\nvar i = Math.floor(Math.random() * quotes.length);\nreturn { type: 'text', value: quotes[i] };`,
    },
];

// ============================================
// Subcomponents
// ============================================

const TabButton: React.FC<{
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    active: boolean;
    onPress: () => void;
}> = ({ label, icon, active, onPress }) => {
    const colors = useColors();
    return (
        <Pressable
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
            style={[
                styles.tabButton,
                {
                    backgroundColor: active ? colors.primaryContainer : 'transparent',
                    borderColor: active ? colors.primary : colors.outlineVariant,
                },
            ]}
        >
            <MaterialCommunityIcons
                name={icon}
                size={16}
                color={active ? colors.onPrimaryContainer : colors.onSurfaceVariant}
            />
            <Text
                style={[
                    styles.tabLabel,
                    { color: active ? colors.onPrimaryContainer : colors.onSurfaceVariant },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
};

// Chip Selector
const ChipRow: React.FC<{
    options: { label: string; value: string }[];
    selected: string;
    onSelect: (value: string) => void;
}> = ({ options, selected, onSelect }) => {
    const colors = useColors();
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipScrollContent}>
            {options.map((opt) => (
                <Pressable
                    key={opt.value}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(opt.value); }}
                    style={[
                        styles.chip,
                        {
                            backgroundColor: selected === opt.value ? colors.primaryContainer : colors.surfaceContainerHigh,
                            borderColor: selected === opt.value ? colors.primary : 'transparent',
                        },
                    ]}
                >
                    <Text style={{ color: selected === opt.value ? colors.onPrimaryContainer : colors.onSurface, fontSize: 12, fontWeight: '500' }}>
                        {opt.label}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
    );
};

// Color Grid
const ColorGrid: React.FC<{
    selected: string;
    onSelect: (color: string) => void;
}> = ({ selected, onSelect }) => {
    const colors = useColors();
    return (
        <View style={styles.colorGrid}>
            {PRESET_COLORS.map((c) => (
                <Pressable
                    key={c}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(c); }}
                    style={[
                        styles.colorSwatch,
                        { backgroundColor: c, borderWidth: selected.toUpperCase() === c ? 2.5 : 1, borderColor: selected.toUpperCase() === c ? colors.primary : colors.outlineVariant },
                    ]}
                >
                    {selected.toUpperCase() === c && <MaterialCommunityIcons name="check" size={14} color={c === '#FFFFFF' || c === '#FFCC00' ? '#000' : '#FFF'} />}
                </Pressable>
            ))}
        </View>
    );
};

// Slider Row
const SliderRow: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    onValueChange: (val: number) => void;
}> = ({ label, value, min, max, step = 1, suffix = '', onValueChange }) => {
    const colors = useColors();
    const displayVal = step < 1 ? value.toFixed(1) : String(value);
    return (
        <View style={styles.sliderRow}>
            <View style={styles.sliderHeader}>
                <LabelSmall style={{ color: colors.onSurfaceVariant }}>{label}</LabelSmall>
                <View style={[styles.sliderValueBadge, { backgroundColor: colors.surfaceContainerHighest }]}>
                    <Text style={{ color: colors.onSurface, fontSize: 11, fontWeight: '600' }}>{displayVal}{suffix}</Text>
                </View>
            </View>
            <View style={styles.sliderTrackContainer}>
                <Pressable onPress={() => onValueChange(Math.max(min, Math.round((value - step) / step) * step))} style={styles.sliderBtn}>
                    <MaterialCommunityIcons name="minus" size={16} color={colors.onSurfaceVariant} />
                </Pressable>
                <View style={[styles.sliderTrack, { backgroundColor: colors.surfaceContainerHighest }]}>
                    <View style={[styles.sliderFill, { backgroundColor: colors.primary, width: `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%` }]} />
                </View>
                <Pressable onPress={() => onValueChange(Math.min(max, Math.round((value + step) / step) * step))} style={styles.sliderBtn}>
                    <MaterialCommunityIcons name="plus" size={16} color={colors.onSurfaceVariant} />
                </Pressable>
            </View>
        </View>
    );
};

// Section Header
const SectionHeader: React.FC<{ title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = ({ title, icon }) => {
    const colors = useColors();
    return (
        <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name={icon} size={16} color={colors.primary} />
            <LabelMedium style={{ color: colors.onSurface, marginLeft: 6, letterSpacing: 0.5 }}>{title}</LabelMedium>
        </View>
    );
};

// ============================================
// Preview Panel (compact, in Code tab)
// ============================================

const PreviewPanel: React.FC<{
    output: ScriptOutput | undefined;
    error: string | undefined;
    isRunning: boolean;
    widgetStyle: WidgetStyle;
}> = ({ output, error, isRunning, widgetStyle }) => {
    const colors = useColors();

    const textSty = {
        fontFamily: widgetStyle.fontFamily === 'System' ? undefined : widgetStyle.fontFamily,
        fontSize: widgetStyle.fontSize,
        fontWeight: widgetStyle.fontWeight as any,
        color: widgetStyle.fontColor,
        textAlign: widgetStyle.textAlign as any,
        lineHeight: widgetStyle.fontSize * widgetStyle.lineHeight,
        letterSpacing: widgetStyle.letterSpacing,
    };

    return (
        <View style={[styles.previewContainer, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={[styles.previewHeader, { borderBottomColor: colors.outlineVariant }]}>
                <View style={styles.previewHeaderLeft}>
                    <View style={[styles.statusDot, { backgroundColor: error ? colors.error : isRunning ? colors.tertiary : '#4CAF50' }]} />
                    <LabelSmall style={{ color: colors.onSurfaceVariant }}>
                        {error ? 'Error' : isRunning ? 'Running...' : 'Output'}
                    </LabelSmall>
                </View>
            </View>
            <ScrollView style={[styles.previewContent, { backgroundColor: colors.surface }]} contentContainerStyle={styles.previewContentInner}>
                {error ? (
                    <View style={styles.previewErrorContainer}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={28} color={colors.error} />
                        <Text style={[styles.previewError, { color: colors.error }]}>{error}</Text>
                    </View>
                ) : output?.type === 'text' ? (
                    <Text style={textSty}>{output.value}</Text>
                ) : output?.type === 'list' ? (
                    <View style={{ width: '100%', paddingHorizontal: 8 }}>
                        {output.items.map((item, idx) => (
                            <View key={idx} style={[styles.previewListItem, { borderBottomColor: colors.outlineVariant }]}>
                                <View style={[styles.listBullet, { backgroundColor: widgetStyle.fontColor }]} />
                                <Text style={{ fontSize: widgetStyle.fontSize, color: widgetStyle.fontColor }}>{item.value}</Text>
                            </View>
                        ))}
                    </View>
                ) : output?.type === 'shape' ? (
                    <View style={{ width: 50, height: 50, backgroundColor: widgetStyle.fontColor, borderRadius: output.shape === 'circle' ? 999 : 8 }} />
                ) : (
                    <View style={styles.previewEmptyContainer}>
                        <MaterialCommunityIcons name="play-circle-outline" size={40} color={colors.outlineVariant} />
                        <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}>
                            Tap Run to see output
                        </BodySmall>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

// ============================================
// Style Tab
// ============================================

const StylePanel: React.FC<{
    widgetStyle: WidgetStyle;
    onStyleChange: (updates: Partial<WidgetStyle>) => void;
}> = ({ widgetStyle, onStyleChange }) => {
    const colors = useColors();

    return (
        <ScrollView style={styles.styleContainer} contentContainerStyle={styles.styleContent} showsVerticalScrollIndicator={false}>
            {/* Typography */}
            <SectionHeader title="TYPOGRAPHY" icon="format-font" />
            <View style={[styles.styleCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 6 }}>Font Family</LabelSmall>
                <ChipRow options={FONT_FAMILIES} selected={widgetStyle.fontFamily} onSelect={(v) => onStyleChange({ fontFamily: v })} />

                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 12 }}>Font Weight</LabelSmall>
                <ChipRow options={FONT_WEIGHTS} selected={widgetStyle.fontWeight} onSelect={(v) => onStyleChange({ fontWeight: v })} />

                <SliderRow label="Font Size" value={widgetStyle.fontSize} min={8} max={72} step={1} suffix="px" onValueChange={(v) => onStyleChange({ fontSize: v })} />
                <SliderRow label="Line Height" value={widgetStyle.lineHeight} min={0.8} max={3} step={0.1} suffix="x" onValueChange={(v) => onStyleChange({ lineHeight: Math.round(v * 10) / 10 })} />
                <SliderRow label="Letter Spacing" value={widgetStyle.letterSpacing} min={-2} max={10} step={0.5} suffix="px" onValueChange={(v) => onStyleChange({ letterSpacing: v })} />

                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 12 }}>Text Align</LabelSmall>
                <View style={styles.alignRow}>
                    {(['left', 'center', 'right'] as const).map((align) => (
                        <Pressable
                            key={align}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onStyleChange({ textAlign: align }); }}
                            style={[
                                styles.alignBtn,
                                {
                                    backgroundColor: widgetStyle.textAlign === align ? colors.primaryContainer : colors.surfaceContainerHighest,
                                    borderColor: widgetStyle.textAlign === align ? colors.primary : 'transparent',
                                },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={align === 'left' ? 'format-align-left' : align === 'center' ? 'format-align-center' : 'format-align-right'}
                                size={18}
                                color={widgetStyle.textAlign === align ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                            />
                        </Pressable>
                    ))}
                </View>

                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 12 }}>Text Color</LabelSmall>
                <ColorGrid selected={widgetStyle.fontColor} onSelect={(c) => onStyleChange({ fontColor: c })} />
            </View>

            {/* Background & Shape */}
            <SectionHeader title="BACKGROUND & SHAPE" icon="card-outline" />
            <View style={[styles.styleCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 6 }}>Shape</LabelSmall>
                <View style={styles.shapeRow}>
                    {SHAPE_OPTIONS.map((opt) => (
                        <Pressable
                            key={opt.value}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                const radius = opt.value === 'rectangle' ? 0 : opt.value === 'rounded' ? 16 : 999;
                                onStyleChange({ shape: opt.value, cornerRadius: radius });
                            }}
                            style={[
                                styles.shapeBtn,
                                {
                                    backgroundColor: widgetStyle.shape === opt.value ? colors.primaryContainer : colors.surfaceContainerHighest,
                                    borderColor: widgetStyle.shape === opt.value ? colors.primary : 'transparent',
                                },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={opt.icon}
                                size={22}
                                color={widgetStyle.shape === opt.value ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                            />
                            <Text style={{ fontSize: 10, color: widgetStyle.shape === opt.value ? colors.onPrimaryContainer : colors.onSurfaceVariant, marginTop: 2 }}>
                                {opt.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 12 }}>Background Color</LabelSmall>
                <ColorGrid selected={widgetStyle.bgColor} onSelect={(c) => onStyleChange({ bgColor: c })} />
                <SliderRow label="Background Opacity" value={Math.round(widgetStyle.bgOpacity * 100)} min={0} max={100} step={5} suffix="%" onValueChange={(v) => onStyleChange({ bgOpacity: v / 100 })} />
                {widgetStyle.shape !== 'pill' && widgetStyle.shape !== 'circle' && (
                    <SliderRow label="Corner Radius" value={widgetStyle.cornerRadius} min={0} max={40} step={2} suffix="px" onValueChange={(v) => onStyleChange({ cornerRadius: v })} />
                )}
            </View>

            {/* Border */}
            <SectionHeader title="BORDER" icon="border-all-variant" />
            <View style={[styles.styleCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                <SliderRow label="Border Width" value={widgetStyle.borderWidth} min={0} max={8} step={0.5} suffix="px" onValueChange={(v) => onStyleChange({ borderWidth: v })} />
                {widgetStyle.borderWidth > 0 && (
                    <>
                        <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 4 }}>Style</LabelSmall>
                        <ChipRow options={BORDER_STYLES} selected={widgetStyle.borderStyle} onSelect={(v) => onStyleChange({ borderStyle: v as any })} />
                        <LabelSmall style={{ color: colors.onSurfaceVariant, marginBottom: 6, marginTop: 12 }}>Border Color</LabelSmall>
                        <ColorGrid selected={widgetStyle.borderColor} onSelect={(c) => onStyleChange({ borderColor: c })} />
                    </>
                )}
            </View>

            {/* Shadow */}
            <SectionHeader title="SHADOW" icon="blur" />
            <View style={[styles.styleCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onStyleChange({ shadowEnabled: !widgetStyle.shadowEnabled }); }}
                    style={styles.toggleRow}
                >
                    <LabelMedium style={{ color: colors.onSurface, flex: 1 }}>Enable Shadow</LabelMedium>
                    <View style={[styles.toggleTrack, { backgroundColor: widgetStyle.shadowEnabled ? colors.primary : colors.surfaceContainerHighest }]}>
                        <View style={[styles.toggleThumb, { transform: [{ translateX: widgetStyle.shadowEnabled ? 18 : 2 }], backgroundColor: widgetStyle.shadowEnabled ? colors.onPrimary : colors.outline }]} />
                    </View>
                </Pressable>
                {widgetStyle.shadowEnabled && (
                    <>
                        <SliderRow label="Blur" value={widgetStyle.shadowBlur} min={0} max={30} step={1} suffix="px" onValueChange={(v) => onStyleChange({ shadowBlur: v })} />
                        <SliderRow label="Offset X" value={widgetStyle.shadowOffsetX} min={-20} max={20} step={1} suffix="px" onValueChange={(v) => onStyleChange({ shadowOffsetX: v })} />
                        <SliderRow label="Offset Y" value={widgetStyle.shadowOffsetY} min={-20} max={20} step={1} suffix="px" onValueChange={(v) => onStyleChange({ shadowOffsetY: v })} />
                    </>
                )}
            </View>

            {/* Size & Spacing */}
            <SectionHeader title="SIZE & SPACING" icon="resize" />
            <View style={[styles.styleCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                <SliderRow label="Width" value={widgetStyle.widgetWidth} min={100} max={400} step={10} suffix="px" onValueChange={(v) => onStyleChange({ widgetWidth: v })} />
                <SliderRow label="Height" value={widgetStyle.widgetHeight} min={60} max={400} step={10} suffix="px" onValueChange={(v) => onStyleChange({ widgetHeight: v })} />
                <SliderRow label="Padding" value={widgetStyle.padding} min={0} max={40} step={2} suffix="px" onValueChange={(v) => onStyleChange({ padding: v })} />
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

// ============================================
// Learn Panel
// ============================================

const LearnPanel: React.FC<{ onInsertExample: (code: string) => void }> = ({ onInsertExample }) => {
    const colors = useColors();
    const { isDark } = useTheme();

    return (
        <ScrollView style={styles.learnContainer} contentContainerStyle={styles.learnContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.referenceCard, { backgroundColor: colors.primaryContainer }]}>
                <MaterialCommunityIcons name="book-open-variant" size={24} color={colors.onPrimaryContainer} />
                <View style={styles.referenceCardText}>
                    <TitleSmall style={{ color: colors.onPrimaryContainer }}>Script Reference</TitleSmall>
                    <BodySmall style={{ color: colors.onPrimaryContainer, opacity: 0.85, marginTop: 4 }}>
                        Scripts run in a sandboxed environment. Return an object with a type field to render output.
                    </BodySmall>
                </View>
            </View>

            <View style={styles.learnSection}>
                <LabelMedium style={[styles.learnSectionTitle, { color: colors.onSurfaceVariant }]}>OUTPUT TYPES</LabelMedium>
                <View style={[styles.outputTypeCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <OutputTypeRow label="Text" code={'{ type: "text", value: "..." }'} colors={colors} isDark={isDark} />
                    <View style={[styles.outputDivider, { backgroundColor: colors.outlineVariant }]} />
                    <OutputTypeRow label="List" code={'{ type: "list", items: [{ value: "..." }] }'} colors={colors} isDark={isDark} />
                    <View style={[styles.outputDivider, { backgroundColor: colors.outlineVariant }]} />
                    <OutputTypeRow label="Shape" code={'{ type: "shape", shape: "circle" }'} colors={colors} isDark={isDark} />
                </View>
            </View>

            <View style={styles.learnSection}>
                <LabelMedium style={[styles.learnSectionTitle, { color: colors.onSurfaceVariant }]}>CONTEXT API</LabelMedium>
                <View style={[styles.outputTypeCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <ContextRow label="context.now" desc="Current timestamp (ms)" colors={colors} isDark={isDark} />
                    <View style={[styles.outputDivider, { backgroundColor: colors.outlineVariant }]} />
                    <ContextRow label={'context.get(key)'} desc="Read live data (weather, time, etc.)" colors={colors} isDark={isDark} />
                </View>
            </View>

            {Platform.OS === 'android' && (
                <View style={styles.learnSection}>
                    <LabelMedium style={[styles.learnSectionTitle, { color: colors.onSurfaceVariant }]}>HOW TO ADD TO HOME SCREEN</LabelMedium>
                    <View style={[styles.instructionCard, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <View style={styles.instructionStep}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primaryContainer }]}>
                                <LabelMedium style={{ color: colors.onPrimaryContainer }}>1</LabelMedium>
                            </View>
                            <BodySmall style={{ color: colors.onSurface, flex: 1 }}>Tap the save button and choose &quot;Save to Library&quot;</BodySmall>
                        </View>
                        <View style={styles.instructionStep}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primaryContainer }]}>
                                <LabelMedium style={{ color: colors.onPrimaryContainer }}>2</LabelMedium>
                            </View>
                            <BodySmall style={{ color: colors.onSurface, flex: 1 }}>Go to Library tab and tap your widget</BodySmall>
                        </View>
                        <View style={styles.instructionStep}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primaryContainer }]}>
                                <LabelMedium style={{ color: colors.onPrimaryContainer }}>3</LabelMedium>
                            </View>
                            <BodySmall style={{ color: colors.onSurface, flex: 1 }}>Tap Export and choose your preferred size</BodySmall>
                        </View>
                        <View style={styles.instructionStep}>
                            <View style={[styles.stepNumber, { backgroundColor: colors.primaryContainer }]}>
                                <LabelMedium style={{ color: colors.onPrimaryContainer }}>4</LabelMedium>
                            </View>
                            <BodySmall style={{ color: colors.onSurface, flex: 1 }}>Save to Gallery, then set as wallpaper or use with a widget app</BodySmall>
                        </View>
                    </View>
                </View>
            )}

            <View style={styles.learnSection}>
                <LabelMedium style={[styles.learnSectionTitle, { color: colors.onSurfaceVariant }]}>EXAMPLES</LabelMedium>
                <View style={styles.examplesGrid}>
                    {SCRIPT_EXAMPLES.map((example, idx) => (
                        <Pressable
                            key={idx}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onInsertExample(example.code); }}
                            style={[styles.exampleCard, { backgroundColor: colors.surfaceContainerHigh }]}
                        >
                            <View style={[styles.exampleIcon, { backgroundColor: colors.surfaceContainerHighest }]}>
                                <MaterialCommunityIcons name={example.icon} size={20} color={colors.primary} />
                            </View>
                            <TitleSmall style={{ color: colors.onSurface, fontSize: 13 }} numberOfLines={1}>{example.title}</TitleSmall>
                            <BodySmall style={{ color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 }} numberOfLines={2}>{example.description}</BodySmall>
                            <View style={[styles.exampleInsertBadge, { backgroundColor: colors.primaryContainer }]}>
                                <LabelSmall style={{ color: colors.onPrimaryContainer, fontSize: 10 }}>Use</LabelSmall>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const OutputTypeRow: React.FC<{ label: string; code: string; colors: any; isDark: boolean }> = ({ label, code, colors, isDark }) => (
    <View style={styles.outputTypeRow}>
        <LabelMedium style={{ color: colors.onSurface, width: 48 }}>{label}</LabelMedium>
        <View style={[styles.codeSnippet, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
            <Text style={[styles.codeSnippetText, { color: colors.primary }]}>{code}</Text>
        </View>
    </View>
);

const ContextRow: React.FC<{ label: string; desc: string; colors: any; isDark: boolean }> = ({ label, desc, colors, isDark }) => (
    <View style={styles.contextRow}>
        <View style={[styles.codeSnippet, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', marginBottom: 4 }]}>
            <Text style={[styles.codeSnippetText, { color: colors.primary }]}>{label}</Text>
        </View>
        <BodySmall style={{ color: colors.onSurfaceVariant }}>{desc}</BodySmall>
    </View>
);

// ============================================
// Main Screen
// ============================================

export const ScriptEditorScreen: React.FC = () => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [activeTab, setActiveTab] = useState<ActiveTab>('code');
    const [script, setScript] = useState("return { type: 'text', value: 'Hello' };");
    const [output, setOutput] = useState<ScriptOutput | undefined>();
    const [error, setError] = useState<string | undefined>();
    const [isRunning, setIsRunning] = useState(false);
    const [refreshSec, setRefreshSec] = useState(5);
    const [widgetName, setWidgetName] = useState('My Script');
    const [showSettings, setShowSettings] = useState(false);
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const [widgetStyle, setWidgetStyle] = useState<WidgetStyle>({ ...DEFAULT_WIDGET_STYLE });
    const codeInputRef = useRef<TextInput>(null);

    const handleStyleChange = useCallback((updates: Partial<WidgetStyle>) => {
        setWidgetStyle((prev) => ({ ...prev, ...updates }));
    }, []);

    // Resizable split
    const [editorHeight, setEditorHeight] = useState(SCREEN_HEIGHT * 0.38);
    const editorHeightRef = useRef(SCREEN_HEIGHT * 0.38);
    const dragStartHeight = useRef(SCREEN_HEIGHT * 0.38);
    const MIN_EDITOR = 120;

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 3,
        onPanResponderGrant: () => {
            dragStartHeight.current = editorHeightRef.current;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
        onPanResponderMove: (_, gs) => {
            const newH = Math.max(MIN_EDITOR, dragStartHeight.current + gs.dy);
            editorHeightRef.current = newH;
            setEditorHeight(newH);
        },
        onPanResponderRelease: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
    })).current;

    const runtime = useMemo(() => createScriptRuntime(), []);

    useEffect(() => { startDataUpdates(); }, []);

    const runScript = useCallback(() => {
        setIsRunning(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => {
            try {
                const result: ScriptRuntimeResult = runtime.run(
                    script,
                    { now: Date.now(), get: (key: any) => dataProvider.getValue(key) },
                    defaultRuntimeOptions()
                );
                if (result.ok && result.output) {
                    setOutput(result.output);
                    setError(undefined);
                } else {
                    setError(result.error?.message || 'Unknown error');
                    setOutput(undefined);
                }
            } catch (err) {
                setError(String(err));
                setOutput(undefined);
            }
            setIsRunning(false);
        }, 50);
    }, [script, runtime]);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { runScript(); }, 600);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [script, runScript]);

    const handleInsertExample = useCallback((code: string) => {
        setScript(code);
        setActiveTab('code');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const getShapeRadius = useCallback(() => {
        if (widgetStyle.shape === 'circle' || widgetStyle.shape === 'pill') return 999;
        if (widgetStyle.shape === 'rectangle') return 0;
        return widgetStyle.cornerRadius;
    }, [widgetStyle.shape, widgetStyle.cornerRadius]);

    const createWidgetElement = useCallback((): CanvasElement => {
        const elementId = `script-${Date.now()}`;
        return {
            id: elementId,
            type: 'scriptWidget',
            name: widgetName,
            transform: { x: 30, y: 30, width: widgetStyle.widgetWidth, height: widgetStyle.widgetHeight, rotation: 0, scaleX: 1, scaleY: 1 },
            style: {
                opacity: widgetStyle.bgOpacity,
                fill: widgetStyle.bgColor,
                stroke: widgetStyle.borderWidth > 0 ? widgetStyle.borderColor : undefined,
                strokeWidth: widgetStyle.borderWidth > 0 ? widgetStyle.borderWidth : undefined,
                cornerRadius: getShapeRadius(),
                shadow: widgetStyle.shadowEnabled ? {
                    offsetX: widgetStyle.shadowOffsetX,
                    offsetY: widgetStyle.shadowOffsetY,
                    blur: widgetStyle.shadowBlur,
                    color: widgetStyle.shadowColor,
                } : undefined,
            },
            textStyle: {
                fontFamily: widgetStyle.fontFamily,
                fontSize: widgetStyle.fontSize,
                fontWeight: widgetStyle.fontWeight,
                color: widgetStyle.fontColor,
                textAlign: widgetStyle.textAlign,
                lineHeight: widgetStyle.fontSize * widgetStyle.lineHeight,
                letterSpacing: widgetStyle.letterSpacing,
            },
            script,
            scriptRefreshSec: refreshSec,
            visible: true,
            locked: false,
        };
    }, [script, refreshSec, widgetName, widgetStyle, getShapeRadius]);

    const handleAddToEditor = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const element = createWidgetElement();
        navigation.navigate('Editor', {
            templateElements: { [element.id]: element },
            templateElementOrder: [element.id],
            templateCanvasSize: { width: 360, height: 360 },
            templateName: widgetName,
        });
    }, [createWidgetElement, widgetName, navigation]);

    const handleQuickSave = useCallback(async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const element = createWidgetElement();
            
            await saveWidget({
                name: widgetName,
                elements: { [element.id]: element },
                elementOrder: [element.id],
                canvasSize: { width: widgetStyle.widgetWidth, height: widgetStyle.widgetHeight },
                width: widgetStyle.widgetWidth,
                height: widgetStyle.widgetHeight,
                elementCount: 1,
            });

            if (Platform.OS === 'android') {
                ToastAndroid.show(`✓ "${widgetName}" saved to Library`, ToastAndroid.SHORT);
            }
            
            navigation.goBack();
        } catch (error) {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Failed to save widget', ToastAndroid.SHORT);
            }
        }
    }, [createWidgetElement, widgetName, widgetStyle, navigation]);

    const handleSaveMenu = useCallback(() => {
        setShowSaveMenu(true);
    }, []);

    const handleBack = useCallback(() => { navigation.goBack(); }, [navigation]);

    const previewBorderRadius = getShapeRadius();
    const bgHex = Math.round(widgetStyle.bgOpacity * 255).toString(16).padStart(2, '0');
    const previewBg = widgetStyle.bgColor + bgHex;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 4, backgroundColor: colors.surface }]}>
                <View style={styles.headerRow}>
                    <PremiumIconButton icon="arrow-left" variant="standard" onPress={handleBack} />
                    <View style={styles.headerTitle}>
                        <TitleMedium style={{ color: colors.onSurface }} numberOfLines={1}>Script Editor</TitleMedium>
                    </View>
                    <PremiumIconButton icon="cog-outline" variant="standard" onPress={() => setShowSettings(true)} />
                    <PremiumIconButton icon="content-save-outline" variant="filled" onPress={handleSaveMenu} />
                </View>
                <View style={styles.tabBar}>
                    <TabButton label="Code" icon="code-tags" active={activeTab === 'code'} onPress={() => setActiveTab('code')} />
                    <TabButton label="Preview" icon="eye-outline" active={activeTab === 'preview'} onPress={() => setActiveTab('preview')} />
                    <TabButton label="Style" icon="palette-outline" active={activeTab === 'style'} onPress={() => setActiveTab('style')} />
                    <TabButton label="Learn" icon="school-outline" active={activeTab === 'learn'} onPress={() => setActiveTab('learn')} />
                </View>
            </View>

            {/* Content */}
            <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                {activeTab === 'code' && (
                    <View style={styles.codeTab}>
                        <View style={[styles.editorContainer, { backgroundColor: colors.surfaceContainerLow, height: editorHeight }]}>
                            <View style={[styles.editorHeader, { borderBottomColor: colors.outlineVariant }]}>
                                <View style={styles.editorHeaderLeft}>
                                    <MaterialCommunityIcons name="code-braces" size={16} color={colors.primary} />
                                    <LabelMedium style={{ color: colors.onSurface, marginLeft: 6 }}>script.js</LabelMedium>
                                </View>
                                <Pressable onPress={runScript} style={[styles.runButton, { backgroundColor: colors.primaryContainer }]}>
                                    <MaterialCommunityIcons name="play" size={16} color={colors.onPrimaryContainer} />
                                    <Text style={[styles.runButtonText, { color: colors.onPrimaryContainer }]}>Run</Text>
                                </Pressable>
                            </View>
                            <ScrollView style={styles.editorBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
                                <View style={styles.editorBodyInner}>
                                    <View style={[styles.lineNumbers, { borderRightColor: colors.outlineVariant }]}>
                                        {script.split('\n').map((_, idx) => (
                                            <Text key={idx} style={[styles.lineNumber, { color: colors.outlineVariant }]}>{idx + 1}</Text>
                                        ))}
                                    </View>
                                    <TextInput
                                        ref={codeInputRef}
                                        style={[styles.codeInput, { color: colors.onSurface }]}
                                        value={script}
                                        onChangeText={setScript}
                                        multiline
                                        textAlignVertical="top"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        spellCheck={false}
                                        scrollEnabled={false}
                                        placeholder="// Write your script here..."
                                        placeholderTextColor={colors.outlineVariant}
                                    />
                                </View>
                            </ScrollView>
                        </View>
                        <View {...panResponder.panHandlers} style={styles.resizeHandleContainer} hitSlop={{ top: 10, bottom: 10 }}>
                            <View style={[styles.resizeHandleLine, { backgroundColor: colors.outlineVariant }]} />
                            <View style={[styles.resizeHandlePill, { backgroundColor: colors.outlineVariant }]}>
                                <MaterialCommunityIcons name="arrow-split-horizontal" size={14} color={colors.onSurfaceVariant} />
                            </View>
                            <View style={[styles.resizeHandleLine, { backgroundColor: colors.outlineVariant }]} />
                        </View>
                        <PreviewPanel output={output} error={error} isRunning={isRunning} widgetStyle={widgetStyle} />
                    </View>
                )}

                {activeTab === 'preview' && (
                    <View style={styles.previewTab}>
                        <View style={[styles.previewCanvasBg, { backgroundColor: colors.surfaceContainer }]}>
                            <View style={[
                                styles.styledWidgetPreview,
                                {
                                    width: Math.min(widgetStyle.widgetWidth, SCREEN_WIDTH - 64),
                                    height: widgetStyle.widgetHeight,
                                    backgroundColor: previewBg,
                                    borderRadius: previewBorderRadius,
                                    borderWidth: widgetStyle.borderWidth,
                                    borderColor: widgetStyle.borderColor,
                                    borderStyle: widgetStyle.borderStyle as any,
                                    padding: widgetStyle.padding,
                                    ...(widgetStyle.shadowEnabled ? {
                                        shadowColor: widgetStyle.shadowColor,
                                        shadowOffset: { width: widgetStyle.shadowOffsetX, height: widgetStyle.shadowOffsetY },
                                        shadowOpacity: 0.5,
                                        shadowRadius: widgetStyle.shadowBlur,
                                        elevation: widgetStyle.shadowBlur,
                                    } : {}),
                                },
                            ]}>
                                {error ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="alert-circle-outline" size={32} color={colors.error} />
                                        <Text style={{ color: colors.error, fontSize: 13, marginTop: 8, textAlign: 'center' }}>{error}</Text>
                                    </View>
                                ) : output?.type === 'text' ? (
                                    <Text style={{
                                        fontFamily: widgetStyle.fontFamily === 'System' ? undefined : widgetStyle.fontFamily,
                                        fontSize: widgetStyle.fontSize,
                                        fontWeight: widgetStyle.fontWeight as any,
                                        color: widgetStyle.fontColor,
                                        textAlign: widgetStyle.textAlign,
                                        lineHeight: widgetStyle.fontSize * widgetStyle.lineHeight,
                                        letterSpacing: widgetStyle.letterSpacing,
                                    }}>
                                        {output.value}
                                    </Text>
                                ) : output?.type === 'list' ? (
                                    <View style={{ width: '100%' }}>
                                        {output.items.map((item, idx) => (
                                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 }}>
                                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: widgetStyle.fontColor }} />
                                                <Text style={{ fontSize: widgetStyle.fontSize, color: widgetStyle.fontColor, fontWeight: widgetStyle.fontWeight as any }}>
                                                    {item.value}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                ) : output?.type === 'shape' ? (
                                    <View style={{
                                        width: Math.min(80, widgetStyle.widgetWidth - widgetStyle.padding * 2),
                                        height: Math.min(80, widgetStyle.widgetHeight - widgetStyle.padding * 2),
                                        backgroundColor: widgetStyle.fontColor,
                                        borderRadius: output.shape === 'circle' ? 999 : 8,
                                    }} />
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="code-braces-box" size={48} color={widgetStyle.fontColor + '40'} />
                                        <Text style={{ color: widgetStyle.fontColor + '80', marginTop: 8, fontSize: 13, textAlign: 'center' }}>
                                            No output yet
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={[styles.widgetInfoBar, { backgroundColor: colors.surfaceContainer }]}>
                            <View style={styles.widgetInfoItem}>
                                <LabelSmall style={{ color: colors.onSurfaceVariant }}>Name</LabelSmall>
                                <BodySmall style={{ color: colors.onSurface }}>{widgetName}</BodySmall>
                            </View>
                            <View style={[styles.widgetInfoDivider, { backgroundColor: colors.outlineVariant }]} />
                            <View style={styles.widgetInfoItem}>
                                <LabelSmall style={{ color: colors.onSurfaceVariant }}>Size</LabelSmall>
                                <BodySmall style={{ color: colors.onSurface }}>{widgetStyle.widgetWidth}x{widgetStyle.widgetHeight}</BodySmall>
                            </View>
                            <View style={[styles.widgetInfoDivider, { backgroundColor: colors.outlineVariant }]} />
                            <View style={styles.widgetInfoItem}>
                                <LabelSmall style={{ color: colors.onSurfaceVariant }}>Refresh</LabelSmall>
                                <BodySmall style={{ color: colors.onSurface }}>{refreshSec}s</BodySmall>
                            </View>
                            <View style={[styles.widgetInfoDivider, { backgroundColor: colors.outlineVariant }]} />
                            <View style={styles.widgetInfoItem}>
                                <LabelSmall style={{ color: colors.onSurfaceVariant }}>Status</LabelSmall>
                                <BodySmall style={{ color: error ? colors.error : '#4CAF50' }}>{error ? 'Error' : 'OK'}</BodySmall>
                            </View>
                        </View>
                        <Pressable onPress={runScript} style={[styles.bigRunButton, { backgroundColor: colors.primary }]}>
                            <MaterialCommunityIcons name="play" size={22} color={colors.onPrimary} />
                            <Text style={[styles.bigRunButtonText, { color: colors.onPrimary }]}>Run Script</Text>
                        </Pressable>
                    </View>
                )}

                {activeTab === 'style' && (
                    <StylePanel widgetStyle={widgetStyle} onStyleChange={handleStyleChange} />
                )}

                {activeTab === 'learn' && (
                    <LearnPanel onInsertExample={handleInsertExample} />
                )}
            </KeyboardAvoidingView>

            {/* Save Menu Modal */}
            <Modal visible={showSaveMenu} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setShowSaveMenu(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]} onStartShouldSetResponder={() => true}>
                        <TitleMedium style={{ color: colors.onSurface, marginBottom: 12 }}>Save Widget</TitleMedium>
                        <BodySmall style={{ color: colors.onSurfaceVariant, marginBottom: 20 }}>
                            Choose how you want to save your script widget:
                        </BodySmall>
                        <View style={{ gap: 12 }}>
                            <Pressable
                                onPress={() => {
                                    setShowSaveMenu(false);
                                    setTimeout(() => handleQuickSave(), 100);
                                }}
                                style={[styles.saveOption, { backgroundColor: colors.primaryContainer }]}
                            >
                                <MaterialCommunityIcons name="content-save" size={24} color={colors.onPrimaryContainer} />
                                <View style={{ flex: 1 }}>
                                    <LabelMedium style={{ color: colors.onPrimaryContainer }}>Save to Library</LabelMedium>
                                    <BodySmall style={{ color: colors.onPrimaryContainer, opacity: 0.8, marginTop: 2 }}>
                                        Quick save - ready to export
                                    </BodySmall>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onPrimaryContainer} />
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    setShowSaveMenu(false);
                                    setTimeout(() => handleAddToEditor(), 100);
                                }}
                                style={[styles.saveOption, { backgroundColor: colors.surfaceContainerHigh }]}
                            >
                                <MaterialCommunityIcons name="palette-outline" size={24} color={colors.onSurface} />
                                <View style={{ flex: 1 }}>
                                    <LabelMedium style={{ color: colors.onSurface }}>Add to Editor</LabelMedium>
                                    <BodySmall style={{ color: colors.onSurfaceVariant, marginTop: 2 }}>
                                        Continue editing in canvas
                                    </BodySmall>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
                            </Pressable>
                        </View>
                        <View style={styles.modalButtons}>
                            <Pressable onPress={() => setShowSaveMenu(false)} style={[styles.modalButton, { backgroundColor: colors.surfaceContainerHigh }]}>
                                <BodyMedium style={{ color: colors.onSurface }}>Cancel</BodyMedium>
                            </Pressable>
                        </View>
                    </View>
                </Pressable>
            </Modal>

            {/* Settings Modal (name & refresh) */}
            <Modal visible={showSettings} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <TitleMedium style={{ color: colors.onSurface, marginBottom: 20 }}>Widget Settings</TitleMedium>
                        <LabelMedium style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>Widget Name</LabelMedium>
                        <TextInput
                            style={[styles.settingsInput, { backgroundColor: colors.surfaceContainerHigh, color: colors.onSurface }]}
                            value={widgetName}
                            onChangeText={setWidgetName}
                            placeholder="My Script Widget"
                            placeholderTextColor={colors.outlineVariant}
                        />
                        <LabelMedium style={{ color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>Refresh Interval (seconds)</LabelMedium>
                        <View style={styles.refreshOptions}>
                            {[1, 5, 10, 30, 60].map((sec) => (
                                <Pressable
                                    key={sec}
                                    onPress={() => { setRefreshSec(sec); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                                    style={[styles.refreshChip, { backgroundColor: refreshSec === sec ? colors.primaryContainer : colors.surfaceContainerHigh, borderColor: refreshSec === sec ? colors.primary : 'transparent' }]}
                                >
                                    <Text style={{ color: refreshSec === sec ? colors.onPrimaryContainer : colors.onSurface, fontSize: 13 }}>{sec}s</Text>
                                </Pressable>
                            ))}
                        </View>
                        <View style={styles.modalButtons}>
                            <Pressable onPress={() => setShowSettings(false)} style={[styles.modalButton, { backgroundColor: colors.primary }]}>
                                <BodyMedium style={{ color: colors.onPrimary }}>Done</BodyMedium>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingBottom: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        zIndex: 10,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    headerTitle: { flex: 1, marginLeft: 4 },
    tabBar: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingBottom: 10,
        gap: 6,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 7,
        paddingHorizontal: 6,
        borderRadius: 10,
        borderWidth: 1,
        gap: 4,
    },
    tabLabel: { fontSize: 11, fontWeight: '600' },
    content: { flex: 1 },

    // Code Tab
    codeTab: { flex: 1 },
    editorContainer: {
        margin: 12,
        marginBottom: 0,
        borderRadius: 16,
        overflow: 'hidden',
    },
    editorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    editorHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
    runButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    runButtonText: { fontSize: 13, fontWeight: '600' },
    editorBody: { flex: 1 },
    editorBodyInner: { flexDirection: 'row', minHeight: '100%' as any },
    lineNumbers: {
        paddingTop: 12,
        paddingHorizontal: 10,
        borderRightWidth: 1,
        alignItems: 'flex-end',
    },
    lineNumber: {
        fontSize: 13,
        lineHeight: 20,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    codeInput: {
        flex: 1,
        padding: 12,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },

    // Resize Handle
    resizeHandleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        marginHorizontal: 12,
        height: 24,
    },
    resizeHandleLine: { flex: 1, height: StyleSheet.hairlineWidth },
    resizeHandlePill: {
        width: 36,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },

    // Preview (compact)
    previewContainer: {
        margin: 12,
        marginTop: 0,
        borderRadius: 16,
        overflow: 'hidden',
        flex: 1,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    previewHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    previewContent: { flex: 1 },
    previewContentInner: {
        flexGrow: 1,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewEmptyContainer: { alignItems: 'center', padding: 12 },
    previewErrorContainer: { alignItems: 'center', padding: 8 },
    previewError: { fontSize: 13, marginTop: 8, textAlign: 'center' },
    previewListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 8,
    },
    listBullet: { width: 6, height: 6, borderRadius: 3 },

    // Preview Tab (full-size)
    previewTab: { flex: 1, padding: 16 },
    previewCanvasBg: {
        flex: 1,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    styledWidgetPreview: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    widgetInfoBar: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
    },
    widgetInfoItem: { flex: 1, alignItems: 'center', gap: 2 },
    widgetInfoDivider: { width: 1 },
    bigRunButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    bigRunButtonText: { fontSize: 16, fontWeight: '600' },

    // Style Tab
    styleContainer: { flex: 1 },
    styleContent: { padding: 16 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 4,
    },
    styleCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
    },
    chipScroll: { marginBottom: 4 },
    chipScrollContent: { gap: 6 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 8,
        borderWidth: 1.5,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    colorSwatch: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alignRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    alignBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    shapeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    shapeBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1.5,
    },
    sliderRow: { marginTop: 10 },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    sliderValueBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    sliderTrackContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sliderTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    sliderFill: {
        height: '100%',
        borderRadius: 3,
    },
    sliderBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    toggleTrack: {
        width: 42,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
    },
    toggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },

    // Learn Tab
    learnContainer: { flex: 1 },
    learnContent: { padding: 16 },
    referenceCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        marginBottom: 20,
    },
    referenceCardText: { flex: 1 },
    learnSection: { marginBottom: 20 },
    learnSectionTitle: { marginBottom: 8, letterSpacing: 0.8 },
    outputTypeCard: { borderRadius: 12, overflow: 'hidden' },
    outputTypeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 10,
    },
    outputDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 12 },
    contextRow: { padding: 12 },
    codeSnippet: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        flexShrink: 1,
    },
    codeSnippetText: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    examplesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    exampleCard: {
        width: (SCREEN_WIDTH - 42 - 10) / 2,
        borderRadius: 14,
        padding: 14,
    },
    exampleIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    exampleInsertBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 8,
    },
    instructionCard: {
        borderRadius: 12,
        padding: 14,
        gap: 12,
    },
    instructionStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Settings Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: { borderRadius: 24, padding: 24 },
    settingsInput: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },
    refreshOptions: { flexDirection: 'row', gap: 8 },
    refreshChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 24,
    },
    modalButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 12,
    },
    saveOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 12,
    },
});

export default ScriptEditorScreen;
