/**
 * WidgetCraft - Editor Screen
 * Full-featured widget canvas editor with:
 * - Tool sidebar with shape/text/image tools
 * - Canvas with selectable/draggable/resizable elements
 * - Text with multiple fonts
 * - Image upload support
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Pressable,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    Text,
    Image,
    PanResponder,
    Platform,
} from 'react-native';
import Svg, { Path as SvgPath } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
    PanGestureHandler,
    TapGestureHandler,
    State,
} from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import * as htmlToImage from 'html-to-image';
import { useColors, useTheme } from '@theme/index';
import {
    PremiumIconButton,
    TitleMedium,
    TitleSmall,
    BodySmall,
    BodyMedium,
    LabelSmall,
    LabelMedium,
} from '@components/common';
import {
    CanvasProvider,
    useCanvas,
    CanvasElement,
    ElementType,
    ShadowConfig,
    AnimationConfig,
} from '@canvas/CanvasContext';
import { saveWidget, SavedWidget, getWidget } from '@services/WidgetStorage';
import { WidgetPaletteModal } from './editor/WidgetPaletteModal';
import { ExportModal } from './editor/ExportModal';
import { PreviewModal } from './editor/PreviewModal';
import { DataElementModal, DataElementConfig } from './editor/DataElementModal';
import { TextStyleModal } from './editor/TextStyleModal';
import { ClockStyleModal } from './editor/ClockStyleModal';
import { CurvedTextStyleModal } from './editor/CurvedTextStyleModal';
import { ShapePickerModal } from './editor/ShapePickerModal';
import { startDataUpdates, parseDataBindings, dataProvider } from '../widgets/data/DataSources';
import { createScriptRuntime, defaultRuntimeOptions, ScriptOutput } from '../services/ScriptRuntime';
import { type ShapePreset } from '@canvas/MD3Shapes';
import { AnalogClock } from '../widgets/components/AnalogClock';
import { DigitalClock } from '../widgets/components/DigitalClock';
import { CurvedText } from '../widgets/components/CurvedText';
import { GradientBackground } from '../widgets/components/GradientBackground';
import { FilteredImage } from '../widgets/components/FilteredImage';
import { ElementRenderer } from '../widgets/components/ElementRenderer';
import { useElementAnimation } from '../effects/useElementAnimation';
import { GradientStyleModal } from './editor/GradientStyleModal';
import { ImageFilterModal } from './editor/ImageFilterModal';
import { ShadowStyleModal } from './editor/ShadowStyleModal';
import { AnimationStyleModal } from './editor/AnimationStyleModal';
import { GridBackground } from './editor/GridBackground';
import { CanvasSettingsModal } from './editor/CanvasSettingsModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Route params type
type EditorRouteParams = {
    Editor: {
        widgetId?: string;
        templateId?: string;
        templateElements?: Record<string, CanvasElement>;
        templateElementOrder?: string[];
        templateCanvasSize?: { width: number; height: number };
        templateName?: string;
    };
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ToolType = 'select' | 'shape' | 'rectangle' | 'ellipse' | 'text' | 'image' | 'widget' | 'data' | 'clock' | 'digitalClock' | 'curvedText' | 'gradient' | 'script';

interface Tool {
    id: ToolType;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
}

// Font options
const FONTS = [
    { name: 'System', family: 'System' },
    { name: 'Serif', family: 'serif' },
    { name: 'Mono', family: 'monospace' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64];

const DEFAULT_SCRIPT = "return { type: 'text', value: 'Hello' };";

// Color palette for the color picker
const COLOR_PALETTE = [
    // Row 1 - Primary colors
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
    // Row 2 - Lighter variants
    '#FCA5A5', '#FDBA74', '#FDE047', '#86EFAC', '#5EEAD4', '#93C5FD', '#C4B5FD', '#F9A8D4',
    // Row 3 - Darker variants
    '#B91C1C', '#C2410C', '#A16207', '#15803D', '#0F766E', '#1D4ED8', '#6D28D9', '#BE185D',
    // Row 4 - Neutrals
    '#FFFFFF', '#F3F4F6', '#D1D5DB', '#9CA3AF', '#6B7280', '#4B5563', '#374151', '#000000',
];

// Tool Button Component
interface ToolButtonProps {
    tool: Tool;
    isActive: boolean;
    onPress: () => void;
    disabled?: boolean;
}

const ToolButton: React.FC<ToolButtonProps> = ({ tool, isActive, onPress, disabled }) => {
    const colors = useColors();
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: disabled ? 0.5 : 1,
    }));

    return (
        <Pressable
            disabled={disabled}
            onPressIn={() => { if (!disabled) scale.value = withTiming(0.9, { duration: 60 }); }}
            onPressOut={() => { if (!disabled) scale.value = withTiming(1, { duration: 100 }); }}
            onPress={() => {
                if (!disabled) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress();
                }
            }}
            accessibilityLabel={tool.label}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive, disabled }}
            accessibilityHint={disabled ? undefined : `Selects the ${tool.label} tool`}
        >
            <Animated.View
                style={[
                    styles.toolButton,
                    {
                        backgroundColor: isActive ? colors.primaryContainer : 'transparent',
                    },
                    animatedStyle,
                ]}
            >
                <MaterialCommunityIcons
                    name={tool.icon}
                    size={24}
                    color={isActive ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                />
            </Animated.View>
        </Pressable>
    );
};

interface ToolSidebarProps {
    selectedTool: ToolType;
    onToolSelect: (tool: ToolType) => void;
    onUndo: () => void;
    onRedo: () => void;
}

const ToolSidebar: React.FC<ToolSidebarProps> = ({ selectedTool, onToolSelect, onUndo, onRedo }) => {
    const { state } = useCanvas();
    const colors = useColors();
    const insets = useSafeAreaInsets();

    const tools: Tool[] = [
        { id: 'select', icon: 'cursor-default', label: 'Select' },
        { id: 'shape', icon: 'shape-outline', label: 'Shapes' },
        { id: 'rectangle', icon: 'rectangle-outline', label: 'Rectangle' },
        { id: 'ellipse', icon: 'circle-outline', label: 'Circle' },
        { id: 'text', icon: 'format-text', label: 'Text' },
        { id: 'image', icon: 'image-outline', label: 'Image' },
        // { id: 'digitalClock', icon: 'clock-digital', label: 'Digital' },
        { id: 'curvedText', icon: 'format-text-rotation-angle-down', label: 'Curve' },
        { id: 'gradient', icon: 'gradient-vertical', label: 'Gradient' },
        { id: 'data', icon: 'database-outline', label: 'Data' },
        { id: 'widget', icon: 'widgets-outline', label: 'Widgets' },
    ];

    return (
        <View style={[styles.toolSidebar, { backgroundColor: colors.surfaceContainer, paddingTop: insets.top + 8 }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.toolSidebarContent}
                bounces={false}
            >
                {tools.map((tool) => (
                    <ToolButton
                        key={tool.id}
                        tool={tool}
                        isActive={selectedTool === tool.id}
                        onPress={() => onToolSelect(tool.id)}
                    />
                ))}
                <View style={styles.toolDivider} />
                <View style={{ opacity: state.historyIndex > 0 ? 1 : 0.4 }}>
                    <ToolButton
                        tool={{ id: 'select', icon: 'undo', label: 'Undo' }}
                        isActive={false}
                        onPress={() => {
                            if (state.historyIndex > 0) onUndo();
                        }}
                        disabled={state.historyIndex <= 0}
                    />
                </View>
                <View style={{ opacity: state.historyIndex < state.history.length - 1 ? 1 : 0.4 }}>
                    <ToolButton
                        tool={{ id: 'select', icon: 'redo', label: 'Redo' }}
                        isActive={false}
                        onPress={() => {
                            if (state.historyIndex < state.history.length - 1) onRedo();
                        }}
                        disabled={state.historyIndex >= state.history.length - 1}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

// Text Input Modal
interface TextModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (text: string, fontFamily: string, fontSize: number, fontWeight: string) => void;
}

const TextModal: React.FC<TextModalProps> = ({ visible, onClose, onSubmit }) => {
    const colors = useColors();
    const { isDark } = useTheme();
    const [text, setText] = useState('');
    const [selectedFont, setSelectedFont] = useState(0);
    const [selectedSize, setSelectedSize] = useState(24);
    const [isBold, setIsBold] = useState(false);

    const handleSubmit = () => {
        if (text.trim()) {
            onSubmit(text, FONTS[selectedFont].family, selectedSize, isBold ? 'bold' : 'normal');
            setText('');
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <TitleMedium style={{ color: colors.onSurface, marginBottom: 16 }}>
                        Add Text
                    </TitleMedium>

                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                backgroundColor: colors.surfaceContainerHigh,
                                color: colors.onSurface,
                                fontFamily: FONTS[selectedFont].family,
                                fontSize: Math.min(selectedSize, 24),
                                fontWeight: isBold ? 'bold' : 'normal',
                            },
                        ]}
                        placeholder="Enter your text..."
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={text}
                        onChangeText={setText}
                        multiline
                        autoFocus
                    />

                    <LabelMedium style={{ color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>
                        Font Style
                    </LabelMedium>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.fontRow}>
                            {FONTS.map((font, index) => (
                                <Pressable
                                    key={font.name}
                                    onPress={() => setSelectedFont(index)}
                                    style={[
                                        styles.fontChip,
                                        {
                                            backgroundColor: selectedFont === index
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            fontFamily: font.family,
                                            color: selectedFont === index
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                        }}
                                    >
                                        {font.name}
                                    </Text>
                                </Pressable>
                            ))}
                            <Pressable
                                onPress={() => setIsBold(!isBold)}
                                style={[
                                    styles.fontChip,
                                    {
                                        backgroundColor: isBold
                                            ? colors.primaryContainer
                                            : colors.surfaceContainerHigh,
                                    },
                                ]}
                            >
                                <Text
                                    style={{
                                        fontWeight: 'bold',
                                        color: isBold
                                            ? colors.onPrimaryContainer
                                            : colors.onSurface,
                                    }}
                                >
                                    Bold
                                </Text>
                            </Pressable>
                        </View>
                    </ScrollView>

                    <LabelMedium style={{ color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>
                        Size: {selectedSize}px
                    </LabelMedium>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.fontRow}>
                            {FONT_SIZES.map((size) => (
                                <Pressable
                                    key={size}
                                    onPress={() => setSelectedSize(size)}
                                    style={[
                                        styles.sizeChip,
                                        {
                                            backgroundColor: selectedSize === size
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color: selectedSize === size
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                            fontSize: 12,
                                        }}
                                    >
                                        {size}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </ScrollView>

                    <View style={styles.modalButtons}>
                        <Pressable
                            style={[styles.modalButton, { backgroundColor: colors.surfaceContainerHigh }]}
                            onPress={onClose}
                        >
                            <BodyMedium style={{ color: colors.onSurface }}>Cancel</BodyMedium>
                        </Pressable>
                        <Pressable
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={handleSubmit}
                        >
                            <BodyMedium style={{ color: colors.onPrimary }}>Add Text</BodyMedium>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Script Input Modal
interface ScriptModalProps {
    visible: boolean;
    initialScript: string;
    onClose: () => void;
    onSubmit: (script: string) => void;
}

const ScriptModal: React.FC<ScriptModalProps> = ({ visible, initialScript, onClose, onSubmit }) => {
    const colors = useColors();
    const [script, setScript] = useState(initialScript);

    useEffect(() => {
        setScript(initialScript);
    }, [initialScript, visible]);

    const handleSubmit = () => {
        if (script.trim()) {
            onSubmit(script);
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <TitleMedium style={{ color: colors.onSurface, marginBottom: 16 }}>
                        Script Widget
                    </TitleMedium>
                    <TextInput
                        style={[
                            styles.textInput,
                            {
                                backgroundColor: colors.surfaceContainerHigh,
                                color: colors.onSurface,
                                fontFamily: 'monospace',
                                fontSize: 14,
                                minHeight: 140,
                            },
                        ]}
                        placeholder="return { type: 'text', value: 'Hello' };"
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={script}
                        onChangeText={setScript}
                        multiline
                    />
                    <View style={styles.modalButtons}>
                        <Pressable
                            style={[styles.modalButton, { backgroundColor: colors.surfaceContainerHigh }]}
                            onPress={onClose}
                        >
                            <BodyMedium style={{ color: colors.onSurface }}>Cancel</BodyMedium>
                        </Pressable>
                        <Pressable
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={handleSubmit}
                        >
                            <BodyMedium style={{ color: colors.onPrimary }}>Save</BodyMedium>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Color Picker Modal
interface ColorPickerModalProps {
    visible: boolean;
    onClose: () => void;
    currentColor: string;
    currentOpacity: number;
    currentCornerRadius: number;
    onApply: (color: string, opacity: number, cornerRadius: number) => void;
}

const ColorPickerModal: React.FC<ColorPickerModalProps> = ({
    visible,
    onClose,
    currentColor,
    currentOpacity,
    currentCornerRadius,
    onApply,
}) => {
    const colors = useColors();
    const [selectedColor, setSelectedColor] = useState(currentColor);
    const [opacity, setOpacity] = useState(currentOpacity);
    const [cornerRadius, setCornerRadius] = useState(currentCornerRadius);

    React.useEffect(() => {
        if (visible) {
            setSelectedColor(currentColor);
            setOpacity(currentOpacity);
            setCornerRadius(currentCornerRadius);
        }
    }, [visible, currentColor, currentOpacity, currentCornerRadius]);

    const handleApply = () => {
        console.log('ColorPickerModal handleApply - color:', selectedColor, 'opacity:', opacity, 'radius:', cornerRadius);
        onApply(selectedColor, opacity, cornerRadius);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <TitleMedium style={{ color: colors.onSurface, marginBottom: 16 }}>
                        Style Properties
                    </TitleMedium>

                    {/* Dynamic Theme Colors from Android */}
                    <LabelMedium style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>
                        Theme Colors (Dynamic)
                    </LabelMedium>
                    <View style={styles.colorPalette}>
                        {[
                            { color: colors.primary, label: 'Primary' },
                            { color: colors.primaryContainer, label: 'Primary Container' },
                            { color: colors.secondary, label: 'Secondary' },
                            { color: colors.secondaryContainer, label: 'Secondary Container' },
                            { color: colors.tertiary, label: 'Tertiary' },
                            { color: colors.tertiaryContainer, label: 'Tertiary Container' },
                            { color: colors.error, label: 'Error' },
                            { color: colors.errorContainer, label: 'Error Container' },
                            { color: colors.surface, label: 'Surface' },
                            { color: colors.surfaceContainer, label: 'Surface Container' },
                            { color: colors.surfaceContainerHigh, label: 'Surface High' },
                            { color: colors.inverseSurface, label: 'Inverse Surface' },
                            { color: colors.onPrimary, label: 'On Primary' },
                            { color: colors.onSecondary, label: 'On Secondary' },
                            { color: colors.onSurface, label: 'On Surface' },
                            { color: colors.outline, label: 'Outline' },
                        ].map((item, index) => (
                            <Pressable
                                key={`theme-${index}`}
                                onPress={() => {
                                    setSelectedColor(item.color);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                                style={[
                                    styles.colorSwatch,
                                    {
                                        backgroundColor: item.color,
                                        borderWidth: selectedColor === item.color ? 3 : 1,
                                        borderColor: selectedColor === item.color ? colors.primary : colors.outlineVariant,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* Static Color Palette */}
                    <LabelMedium style={{ color: colors.onSurfaceVariant, marginTop: 12, marginBottom: 8 }}>
                        Standard Colors
                    </LabelMedium>
                    <View style={styles.colorPalette}>
                        {COLOR_PALETTE.map((color, index) => (
                            <Pressable
                                key={`static-${color}-${index}`}
                                onPress={() => {
                                    setSelectedColor(color);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                                style={[
                                    styles.colorSwatch,
                                    {
                                        backgroundColor: color,
                                        borderWidth: selectedColor === color ? 3 : 1,
                                        borderColor: selectedColor === color ? colors.primary : colors.outlineVariant,
                                    },
                                ]}
                            />
                        ))}
                    </View>

                    {/* Preview */}
                    <View style={styles.colorPreview}>
                        <View
                            style={[
                                styles.previewBox,
                                {
                                    backgroundColor: selectedColor,
                                    opacity,
                                    borderRadius: cornerRadius,
                                },
                            ]}
                        />
                        <BodySmall style={{ color: colors.onSurfaceVariant }}>
                            {selectedColor.toUpperCase()}
                        </BodySmall>
                    </View>

                    {/* Opacity Slider */}
                    <LabelMedium style={{ color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>
                        Opacity: {Math.round(opacity * 100)}%
                    </LabelMedium>
                    <View style={styles.sliderRow}>
                        {[0.25, 0.5, 0.75, 1].map((val) => (
                            <Pressable
                                key={val}
                                onPress={() => setOpacity(val)}
                                style={[
                                    styles.opacityChip,
                                    {
                                        backgroundColor: opacity === val ? colors.primaryContainer : colors.surfaceContainerHigh,
                                    },
                                ]}
                            >
                                <BodySmall style={{ color: opacity === val ? colors.onPrimaryContainer : colors.onSurface }}>
                                    {Math.round(val * 100)}%
                                </BodySmall>
                            </Pressable>
                        ))}
                    </View>

                    {/* Corner Radius */}
                    <LabelMedium style={{ color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>
                        Corner Radius: {cornerRadius}px
                    </LabelMedium>
                    <View style={styles.sliderRow}>
                        {[0, 8, 16, 24, 50].map((val) => (
                            <Pressable
                                key={val}
                                onPress={() => setCornerRadius(val)}
                                style={[
                                    styles.opacityChip,
                                    {
                                        backgroundColor: cornerRadius === val ? colors.primaryContainer : colors.surfaceContainerHigh,
                                    },
                                ]}
                            >
                                <BodySmall style={{ color: cornerRadius === val ? colors.onPrimaryContainer : colors.onSurface }}>
                                    {val}
                                </BodySmall>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.modalButtons}>
                        <Pressable
                            style={[styles.modalButton, { backgroundColor: colors.surfaceContainerHigh }]}
                            onPress={onClose}
                        >
                            <BodyMedium style={{ color: colors.onSurface }}>Cancel</BodyMedium>
                        </Pressable>
                        <Pressable
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={handleApply}
                        >
                            <BodyMedium style={{ color: colors.onPrimary }}>Apply</BodyMedium>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

interface FloatingToolbarProps {
    onDuplicate: () => void;
    onDelete: () => void;
    onBringForward: () => void;
    onSendBackward: () => void;
    onColorPress: () => void;
    onTextStylePress?: () => void;
    onClockStylePress?: () => void;
    onCurvedTextStylePress?: () => void;
    onGradientStylePress?: () => void;
    onImageFilterPress?: () => void;
    onShadowStylePress?: () => void;
    onAnimationStylePress?: () => void;
    onGroup?: () => void;
    onUngroup?: () => void;
    canGroup?: boolean;
    canUngroup?: boolean;
    currentColor?: string;
    isTextElement?: boolean;
    isClockElement?: boolean;
    isCurvedTextElement?: boolean;
    isGradientElement?: boolean;
    isImageElement?: boolean;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
    onDuplicate,
    onDelete,
    onBringForward,
    onSendBackward,
    onColorPress,
    onTextStylePress,
    onClockStylePress,
    onCurvedTextStylePress,
    onGradientStylePress,
    onImageFilterPress,
    onShadowStylePress,
    onAnimationStylePress,
    onGroup,
    onUngroup,
    canGroup,
    canUngroup,
    currentColor,
    isTextElement,
    isClockElement,
    isCurvedTextElement,
    isGradientElement,
    isImageElement,
}) => {
    const colors = useColors();
    const scale = useSharedValue(0);

    React.useEffect(() => {
        scale.value = withTiming(1, { duration: 120 });
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: scale.value,
    }));

    // Build actions based on element type
    const actions = [
        // Show text format button for text elements
        ...(isTextElement && onTextStylePress ? [
            { id: 'textStyle', icon: 'format-text' as const, onPress: onTextStylePress },
        ] : []),
        // Show clock style button for clock elements
        ...(isClockElement && onClockStylePress ? [
            { id: 'clockStyle', icon: 'clock-outline' as const, onPress: onClockStylePress },
        ] : []),
        // Show curved text style button for curved text elements
        ...(isCurvedTextElement && onCurvedTextStylePress ? [
            { id: 'curvedTextStyle', icon: 'format-text-rotation-angle-down' as const, onPress: onCurvedTextStylePress },
        ] : []),
        // Show gradient style button for gradient elements
        ...(isGradientElement && onGradientStylePress ? [
            { id: 'gradientStyle', icon: 'gradient-vertical' as const, onPress: onGradientStylePress },
        ] : []),
        // Show image filter button for image elements
        ...(isImageElement && onImageFilterPress ? [
            { id: 'imageFilter', icon: 'image-filter-vintage' as const, onPress: onImageFilterPress },
        ] : []),
        // Shadow/Glow Effect
        ...(onShadowStylePress ? [
            { id: 'shadowStyle', icon: 'creation' as const, onPress: onShadowStylePress },
        ] : []),
        // Animation
        ...(onAnimationStylePress ? [
            { id: 'animationStyle', icon: 'movie-open-outline' as const, onPress: onAnimationStylePress },
        ] : []),
        // Grouping
        ...(canGroup && onGroup ? [
            { id: 'group', icon: 'vector-combine' as const, onPress: onGroup },
        ] : []),
        ...(canUngroup && onUngroup ? [
            { id: 'ungroup', icon: 'vector-intersection' as const, onPress: onUngroup },
        ] : []),
        
        { id: 'color', icon: 'palette' as const, onPress: onColorPress, showColor: true },
        { id: 'duplicate', icon: 'content-copy' as const, onPress: onDuplicate },
        { id: 'delete', icon: 'trash-can-outline' as const, onPress: onDelete },
        { id: 'forward', icon: 'arrange-bring-forward' as const, onPress: onBringForward },
        { id: 'backward', icon: 'arrange-send-backward' as const, onPress: onSendBackward },
    ];

    return (
        <Animated.View style={[styles.floatingToolbar, { backgroundColor: colors.surface }, animatedStyle]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.floatingToolbarContent}
                bounces={false}
            >
                {actions.map((action, index) => (
                    <React.Fragment key={action.id}>
                        {index > 0 && <View style={[styles.toolbarDivider, { backgroundColor: colors.outlineVariant }]} />}
                        <Pressable
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                action.onPress();
                            }}
                            style={styles.toolbarButton}
                        >
                            {action.showColor && currentColor ? (
                                <View style={[styles.colorIndicator, { backgroundColor: currentColor }]} />
                            ) : (
                                <MaterialCommunityIcons
                                    name={action.icon}
                                    size={20}
                                    color={colors.onSurfaceVariant}
                                />
                            )}
                        </Pressable>
                    </React.Fragment>
                ))}
            </ScrollView>
        </Animated.View>
    );
};

// Nudge Controls Component (draggable via center handle)
interface NudgeControlsProps {
    onNudge: (direction: 'up' | 'down' | 'left' | 'right') => void;
    position: { x: number; y: number };
    onPositionChange: (pos: { x: number; y: number }) => void;
}

const NudgeControls: React.FC<NudgeControlsProps> = ({ onNudge, position, onPositionChange }) => {
    const colors = useColors();
    const dragOffset = useRef({ x: 0, y: 0 });
    const positionRef = useRef(position);

    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
            dragOffset.current = { x: positionRef.current.x, y: positionRef.current.y };
        },
        onPanResponderMove: (_, gesture) => {
            onPositionChange({
                x: dragOffset.current.x + gesture.dx,
                y: dragOffset.current.y + gesture.dy,
            });
        },
    }), [onPositionChange]);

    const handleNudge = (direction: 'up' | 'down' | 'left' | 'right') => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onNudge(direction);
    };

    return (
        <View
            style={[styles.nudgeControls, { backgroundColor: colors.surface }]}
        >
            {/* Up arrow */}
            <View style={styles.nudgeRow}>
                <Pressable
                    onPressIn={() => handleNudge('up')}
                    style={[styles.nudgeButton, { backgroundColor: colors.surfaceContainerHigh }]}
                    hitSlop={8}
                >
                    <MaterialCommunityIcons name="chevron-up" size={20} color={colors.onSurface} />
                </Pressable>
            </View>
            {/* Left, Drag handle, Right row */}
            <View style={styles.nudgeRow}>
                <Pressable
                    onPressIn={() => handleNudge('left')}
                    style={[styles.nudgeButton, { backgroundColor: colors.surfaceContainerHigh }]}
                    hitSlop={8}
                >
                    <MaterialCommunityIcons name="chevron-left" size={20} color={colors.onSurface} />
                </Pressable>
                <View
                    {...panResponder.panHandlers}
                    style={[styles.nudgeCenter, { backgroundColor: colors.primaryContainer }]}
                >
                    <MaterialCommunityIcons name="drag" size={14} color={colors.onPrimaryContainer} />
                </View>
                <Pressable
                    onPressIn={() => handleNudge('right')}
                    style={[styles.nudgeButton, { backgroundColor: colors.surfaceContainerHigh }]}
                    hitSlop={8}
                >
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.onSurface} />
                </Pressable>
            </View>
            {/* Down arrow */}
            <View style={styles.nudgeRow}>
                <Pressable
                    onPressIn={() => handleNudge('down')}
                    style={[styles.nudgeButton, { backgroundColor: colors.surfaceContainerHigh }]}
                    hitSlop={8}
                >
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.onSurface} />
                </Pressable>
            </View>
        </View>
    );
};

// Zoom Controls
interface ZoomControlsProps {
    zoom: number;
    onZoomChange: (zoom: number) => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, onZoomChange }) => {
    const colors = useColors();

    return (
        <View style={[styles.zoomControls, { backgroundColor: colors.surfaceContainer }]}>
            <Pressable
                onPress={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
                style={styles.zoomButton}
            >
                <MaterialCommunityIcons name="minus" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
            <View style={styles.zoomValue}>
                <LabelSmall style={{ color: colors.onSurface }}>{Math.round(zoom * 100)}%</LabelSmall>
            </View>
            <Pressable
                onPress={() => onZoomChange(Math.min(4, zoom + 0.25))}
                style={styles.zoomButton}
            >
                <MaterialCommunityIcons name="plus" size={18} color={colors.onSurfaceVariant} />
            </Pressable>
        </View>
    );
};

// Script Widget View
interface ScriptWidgetViewProps {
    element: CanvasElement;
}

const ScriptWidgetView: React.FC<ScriptWidgetViewProps> = ({ element }) => {
    const colors = useColors();
    const [output, setOutput] = useState<ScriptOutput | undefined>();
    const [error, setError] = useState<string | undefined>();
    const runtime = useMemo(() => createScriptRuntime(), []);

    useEffect(() => {
        const run = () => {
            const result = runtime.run(
                element.script || '',
                { now: Date.now(), get: (key: any) => dataProvider.getValue(key) },
                defaultRuntimeOptions()
            );
            if (result.ok && result.output) {
                setOutput(result.output);
                setError(undefined);
            } else {
                setError(result.error?.message || 'Script error');
            }
        };
        run();
        const interval = setInterval(run, (element.scriptRefreshSec ?? 5) * 1000);
        return () => clearInterval(interval);
    }, [element.script, element.scriptRefreshSec, runtime]);

    return (
        <View style={{
            width: element.transform.width,
            height: element.transform.height,
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            {error ? (
                <Text style={{ color: colors.error, fontSize: 12 }}>{error}</Text>
            ) : output?.type === 'text' ? (
                <Text style={{ color: colors.onSurface }}>{output.value}</Text>
            ) : output?.type === 'list' ? (
                <View>
                    {output.items.map((item, index) => (
                        <Text key={index} style={{ color: colors.onSurface }}>{item.value}</Text>
                    ))}
                </View>
            ) : output?.type === 'shape' ? (
                <View style={{
                    width: element.transform.width * 0.5,
                    height: element.transform.height * 0.5,
                    backgroundColor: colors.primary,
                    borderRadius: output.shape === 'circle' ? 999 : 8,
                }} />
            ) : null}
        </View>
    );
};

// Resize Handle Component
interface ResizeHandleProps {
    position: 'tl' | 'tr' | 'bl' | 'br';
    onResize: (deltaWidth: number, deltaHeight: number, deltaX: number, deltaY: number) => void;
    color: string;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ position, onResize, color }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY;
        })
        .onEnd((e) => {
            let dw = 0, dh = 0, dx = 0, dy = 0;

            switch (position) {
                case 'tl':
                    dx = e.translationX;
                    dy = e.translationY;
                    dw = -e.translationX;
                    dh = -e.translationY;
                    break;
                case 'tr':
                    dy = e.translationY;
                    dw = e.translationX;
                    dh = -e.translationY;
                    break;
                case 'bl':
                    dx = e.translationX;
                    dw = -e.translationX;
                    dh = e.translationY;
                    break;
                case 'br':
                    dw = e.translationX;
                    dh = e.translationY;
                    break;
            }

            runOnJS(onResize)(dw, dh, dx, dy);
            translateX.value = 0;
            translateY.value = 0;
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    const positionStyle = {
        tl: { top: -8, left: -8 },
        tr: { top: -8, right: -8 },
        bl: { bottom: -8, left: -8 },
        br: { bottom: -8, right: -8 },
    };

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View
                style={[
                    styles.resizeHandle,
                    positionStyle[position],
                    { backgroundColor: color },
                    animatedStyle,
                ]}
            />
        </GestureDetector>
    );
};

// Helper to get shadow style
const getShadowStyle = (shadowConfig?: ShadowConfig) => {
    if (!shadowConfig) return {};
    return {
        shadowColor: shadowConfig.color,
        shadowOffset: { width: shadowConfig.offsetX ?? 0, height: shadowConfig.offsetY ?? 4 },
        shadowOpacity: shadowConfig.opacity ?? 0.3,
        shadowRadius: shadowConfig.blur ?? 4,
        elevation: 5,
    };
};

// Canvas Element Component (interactive)
interface CanvasElementViewProps {
    element: CanvasElement;
    isSelected: boolean;
    onSelect: () => void;
    onMove: (deltaX: number, deltaY: number) => void;
    onResize: (deltaWidth: number, deltaHeight: number, deltaX: number, deltaY: number) => void;
}

const CanvasElementView: React.FC<CanvasElementViewProps> = ({
    element,
    isSelected,
    onSelect,
    onMove,
    onResize,
}) => {
    const colors = useColors();
    const { state } = useCanvas(); // Access context for children lookup
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            runOnJS(onSelect)();
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        })
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY;
        })
        .onEnd((e) => {
            runOnJS(onMove)(e.translationX, e.translationY);
            translateX.value = 0;
            translateY.value = 0;
        });

    const tapGesture = Gesture.Tap()
        .onEnd(() => {
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
            runOnJS(onSelect)();
        });

    const composed = Gesture.Exclusive(panGesture, tapGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    // Animation effect style
    const effectStyle = useElementAnimation(element.animation);

    const renderElement = () => {
        const { transform, style, textStyle, content, imageUri } = element;

        switch (element.type) {
            case 'ellipse':
                if (element.gradientConfig) {
                    return (
                        <View style={{
                            width: transform.width,
                            height: transform.height,
                            borderRadius: Math.max(transform.width, transform.height) / 2,
                            overflow: 'hidden',
                            ...(style.stroke ? { borderColor: style.stroke, borderWidth: style.strokeWidth || 2 } : {}),
                            ...getShadowStyle(style.shadow),
                        }}>
                            <GradientBackground
                                width={transform.width}
                                height={transform.height}
                                config={element.gradientConfig}
                                opacity={style.opacity}
                            />
                        </View>
                    );
                }
                return (
                    <View
                        style={{
                            width: transform.width,
                            height: transform.height,
                            backgroundColor: style.fill || colors.secondary,
                            borderRadius: Math.max(transform.width, transform.height) / 2,
                            opacity: style.opacity ?? 1,
                            ...(style.stroke ? { borderColor: style.stroke, borderWidth: style.strokeWidth || 2 } : {}),
                            ...getShadowStyle(style.shadow),
                        }}
                    />
                );

            case 'text': {
                // Detect icon elements converted from TemplateConverter (content starts with "icon:")
                const isIconElement = content?.startsWith('icon:');
                if (isIconElement && content) {
                    const iconName = content.replace('icon:', '');
                    return (
                        <View
                            style={{
                                width: transform.width,
                                height: transform.height,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <MaterialCommunityIcons
                                name={iconName as any}
                                size={textStyle?.fontSize || 24}
                                color={textStyle?.color || colors.onSurface}
                            />
                        </View>
                    );
                }
                return (
                    <View
                        style={{
                            width: transform.width,
                            height: transform.height,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 2,
                            paddingVertical: 0,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: textStyle?.fontSize || 24,
                                fontFamily: textStyle?.fontFamily || 'System',
                                fontWeight: (textStyle?.fontWeight as any) || 'normal',
                                color: textStyle?.color || colors.onSurface,
                                textAlign: textStyle?.textAlign || 'center',
                                lineHeight: textStyle?.lineHeight ?? Math.round((textStyle?.fontSize || 24) * 1.2),
                                textAlignVertical: 'center',
                                includeFontPadding: true,
                                ...(style.shadow ? {
                                    textShadowColor: style.shadow.color,
                                    textShadowOffset: { width: style.shadow.offsetX, height: style.shadow.offsetY },
                                    textShadowRadius: style.shadow.blur,
                                } : {}),
                            }}
                            numberOfLines={3}
                        >
                            {parseDataBindings(content || 'Text')}
                        </Text>
                    </View>
                );
            }

            case 'image':
                // Check if image has filter config
                if (element.imageFilterConfig && element.imageFilterConfig.filter !== 'none') {
                    return (
                        <View style={{
                            width: transform.width,
                            height: transform.height,
                            ...getShadowStyle(style.shadow)
                        }}>
                            <FilteredImage
                                uri={imageUri || ''}
                                width={transform.width}
                                height={transform.height}
                                filterConfig={element.imageFilterConfig}
                                cornerRadius={(style.cornerRadius as number) || 12}
                            />
                        </View>
                    );
                }
                return (
                    <Image
                        source={{ uri: imageUri }}
                        style={{
                            width: transform.width,
                            height: transform.height,
                            borderRadius: (style.cornerRadius as number) || 12,
                            ...getShadowStyle(style.shadow),
                        }}
                        resizeMode="cover"
                    />
                );

            case 'path':
            case 'line':
                // Render SVG path for polygons, stars, and custom paths
                if (element.path) {
                    // Use viewBox to scale path properly with element size
                    // Paths are stored in normalized 0-1 coordinates
                    return (
                        <Svg
                            width={transform.width}
                            height={transform.height}
                            viewBox="0 0 1 1"
                            preserveAspectRatio="none"
                            style={{ 
                                opacity: style.opacity ?? 1,
                                ...getShadowStyle(style.shadow)
                            }}
                        >
                            <SvgPath
                                d={element.path}
                                fill={style.fill || colors.primary}
                                stroke={style.stroke}
                                strokeWidth={style.strokeWidth ? style.strokeWidth / Math.max(transform.width, transform.height) : 0}
                            />
                        </Svg>
                    );
                }
                // Fallback if no path data
                return (
                    <View
                        style={{
                            width: transform.width,
                            height: transform.height,
                            backgroundColor: style.fill || colors.primary,
                            borderRadius: (style.cornerRadius as number) || 12,
                            opacity: style.opacity ?? 1,
                            ...getShadowStyle(style.shadow),
                        }}
                    />
                );

            case 'rectangle':
            default:
                if (element.gradientConfig) {
                    return (
                        <View style={{
                            width: transform.width,
                            height: transform.height,
                            borderRadius: (style.cornerRadius as number) || 12,
                            overflow: 'hidden',
                            ...getShadowStyle(style.shadow),
                        }}>
                            <GradientBackground
                                width={transform.width}
                                height={transform.height}
                                config={element.gradientConfig}
                                cornerRadius={(style.cornerRadius as number) || 12}
                                opacity={style.opacity}
                            />
                        </View>
                    );
                }
                return (
                    <View
                        style={{
                            width: transform.width,
                            height: transform.height,
                            backgroundColor: style.fill || colors.primary,
                            borderRadius: (style.cornerRadius as number) || 12,
                            opacity: style.opacity ?? 1,
                            ...getShadowStyle(style.shadow),
                        }}
                    />
                );

            case 'analogClock': {
                const clockSize = Math.min(transform.width, transform.height);
                const clockConfig = element.clockConfig || {};
                return (
                    <View
                        style={{
                            width: transform.width,
                            height: transform.height,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <AnalogClock
                            size={clockSize}
                            faceStyle={clockConfig.faceStyle || 'modern'}
                            handStyle={clockConfig.handStyle || 'modern'}
                            showSeconds={clockConfig.showSeconds !== false}
                            showNumbers={clockConfig.showNumbers !== false}
                            showTicks={clockConfig.showTicks !== false}
                            smoothSeconds={clockConfig.smoothSeconds}
                            faceColor={clockConfig.faceColor || style.fill}
                            hourHandColor={clockConfig.hourHandColor}
                            minuteHandColor={clockConfig.minuteHandColor}
                            secondHandColor={clockConfig.secondHandColor}
                            tickColor={clockConfig.tickColor}
                            numberColor={clockConfig.numberColor}
                        />
                    </View>
                );
            }

            case 'digitalClock': {
                const clockConfig = element.clockConfig || {};
                const textStyle = element.textStyle;
                return (
                    <View
                        style={{
                            width: transform.width,
                            height: transform.height,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: style.fill || 'transparent',
                            borderRadius: (style.cornerRadius as number) || 0,
                            opacity: style.opacity ?? 1,
                        }}
                    >
                        <DigitalClock
                            width={transform.width}
                            height={transform.height}
                            format={clockConfig.format || '12h'}
                            showSeconds={clockConfig.showSeconds !== false}
                            showAmPm={clockConfig.showAmPm !== false}
                            textColor={textStyle?.color || clockConfig.hourHandColor || '#FFFFFF'}
                            secondaryColor={clockConfig.secondHandColor}
                            fontFamily={textStyle?.fontFamily}
                            fontSize={textStyle?.fontSize}
                            fontWeight={textStyle?.fontWeight as 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900'}
                            textAlign={textStyle?.textAlign}
                        />
                    </View>
                );
            }

            case 'curvedText': {
                const curvedConfig = element.curvedTextConfig || {};
                const textStyle = element.textStyle;
                return (
                    <CurvedText
                        text={element.content || 'Curved Text'}
                        width={transform.width}
                        height={transform.height}
                        curveType={curvedConfig.curveType || 'arc'}
                        curveAmount={curvedConfig.curveAmount ?? 50}
                        startOffset={curvedConfig.startOffset ?? 0}
                        fontSize={textStyle?.fontSize || 24}
                        fontFamily={textStyle?.fontFamily}
                        fontWeight={textStyle?.fontWeight as any}
                        fill={textStyle?.color || '#FFFFFF'}
                        letterSpacing={textStyle?.letterSpacing}
                        textAnchor="middle"
                    />
                );
            }

            case 'scriptWidget':
                return <ScriptWidgetView element={element} />;

            case 'gradient': {
                const gradientConfig = element.gradientConfig || {
                    type: 'linear' as const,
                    colors: ['#FF512F', '#F09819'],
                    angle: 135,
                };
                return (
                    <GradientBackground
                        width={transform.width}
                        height={transform.height}
                        config={gradientConfig}
                        cornerRadius={typeof style.cornerRadius === 'number' ? style.cornerRadius : 0}
                        opacity={style.opacity}
                    />
                );
            }
            
            case 'group': {
                const children = element.children?.map(id => state.elements[id]).filter(Boolean) || [];
                return (
                    <View style={{ width: transform.width, height: transform.height }}>
                        {children.map(child => (
                            <ElementRenderer 
                                key={child.id} 
                                element={child} 
                                absolutePositioning={true} // Position relative to group container
                            />
                        ))}
                        {/* Render a faint border for group selection if selected */}
                        {isSelected && (
                             <View 
                                style={{ 
                                    ...StyleSheet.absoluteFillObject, 
                                    borderWidth: 1, 
                                    borderColor: colors.primary, 
                                    borderStyle: 'dashed',
                                    borderRadius: 4,
                                    opacity: 0.5
                                }} 
                            />
                        )}
                    </View>
                );
            }
        }
    };

    if (!element.visible) return null;

    return (
        <GestureDetector gesture={composed}>
            <Animated.View
                style={[
                    styles.canvasElement,
                    {
                        left: element.transform.x,
                        top: element.transform.y,
                        width: element.transform.width,
                        height: element.transform.height,
                    },
                    animatedStyle,
                ]}
            >
                <Animated.View style={[{ width: '100%', height: '100%' }, effectStyle]}>
                    {renderElement()}
                </Animated.View>
                {isSelected && (
                    <>
                        <View style={[styles.selectionBorder, { borderColor: colors.primary }]} />
                        <ResizeHandle position="tl" onResize={onResize} color={colors.primary} />
                        <ResizeHandle position="tr" onResize={onResize} color={colors.primary} />
                        <ResizeHandle position="bl" onResize={onResize} color={colors.primary} />
                        <ResizeHandle position="br" onResize={onResize} color={colors.primary} />
                    </>
                )}
            </Animated.View>
        </GestureDetector>
    );
};

// Layer Item
interface LayerItemProps {
    element: CanvasElement;
    isSelected: boolean;
    onSelect: () => void;
    onToggleVisibility: () => void;
    onToggleLock: () => void;
    onDelete: () => void;
}

const LayerItem: React.FC<LayerItemProps> = ({
    element,
    isSelected,
    onSelect,
    onToggleVisibility,
    onToggleLock,
    onDelete,
}) => {
    const colors = useColors();

    const getLayerIcon = (type: ElementType): keyof typeof MaterialCommunityIcons.glyphMap => {
        switch (type) {
            case 'rectangle': return 'rectangle-outline';
            case 'ellipse': return 'circle-outline';
            case 'text': return 'format-text';
            case 'image': return 'image-outline';
            case 'analogClock': return 'clock-outline';
            case 'digitalClock': return 'clock-digital';
            case 'curvedText': return 'format-text-rotation-angle-down';
            case 'gradient': return 'gradient-vertical';
            case 'path': return 'vector-polygon';
            case 'scriptWidget': return 'code-braces';
            case 'group': return 'vector-combine';
            default: return 'shape-outline';
        }
    };

    return (
        <Pressable onPress={onSelect}>
            <View
                style={[
                    styles.layerItem,
                    {
                        backgroundColor: isSelected ? colors.primaryContainer : 'transparent',
                        borderColor: isSelected ? colors.primary : 'transparent',
                    },
                ]}
            >
                <MaterialCommunityIcons
                    name={getLayerIcon(element.type)}
                    size={18}
                    color={isSelected ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                />
                <BodySmall
                    style={[
                        styles.layerName,
                        { color: isSelected ? colors.onPrimaryContainer : colors.onSurface },
                    ]}
                    numberOfLines={1}
                >
                    {element.name}
                </BodySmall>
                <Pressable onPress={onToggleVisibility} hitSlop={8}>
                    <MaterialCommunityIcons
                        name={element.visible ? 'eye-outline' : 'eye-off-outline'}
                        size={16}
                        color={colors.onSurfaceVariant}
                    />
                </Pressable>
                <Pressable onPress={onToggleLock} hitSlop={8}>
                    <MaterialCommunityIcons
                        name={element.locked ? 'lock' : 'lock-open-outline'}
                        size={16}
                        color={element.locked ? colors.primary : colors.onSurfaceVariant}
                    />
                </Pressable>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onDelete();
                    }}
                    hitSlop={8}
                >
                    <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={16}
                        color={colors.error}
                    />
                </Pressable>
            </View>
        </Pressable>
    );
};

// Main Editor Content
const EditorContent: React.FC = () => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const route = useRoute<RouteProp<EditorRouteParams, 'Editor'>>();
    const {
        state,
        dispatch,
        addElement,
        deleteSelected: deleteSelectedBase,
        duplicateSelected: duplicateSelectedBase,
        undo,
        redo,
        bringForward,
        sendBackward,
        updateElement: updateElementBase,
        selectElement,
        loadWidget,
        groupSelected,
        ungroupSelected,
    } = useCanvas();

    const [selectedTool, setSelectedTool] = useState<ToolType>('select');
    const [zoom, setZoom] = useState(1);
    const [showLayerPanel, setShowLayerPanel] = useState(true);
    const [showTextModal, setShowTextModal] = useState(false);
    const [showScriptModal, setShowScriptModal] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showWidgetPalette, setShowWidgetPalette] = useState(false);
    const [showShapePicker, setShowShapePicker] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showDataModal, setShowDataModal] = useState(false);
    const [showTextStyleModal, setShowTextStyleModal] = useState(false);
    const [showClockStyleModal, setShowClockStyleModal] = useState(false);
    const [showCurvedTextStyleModal, setShowCurvedTextStyleModal] = useState(false);
    const [showGradientStyleModal, setShowGradientStyleModal] = useState(false);
    const [showImageFilterModal, setShowImageFilterModal] = useState(false);
    const [showShadowStyleModal, setShowShadowStyleModal] = useState(false);
    const [showAnimationStyleModal, setShowAnimationStyleModal] = useState(false);
    const [showCanvasSettingsModal, setShowCanvasSettingsModal] = useState(false);
    const [colorPickerElementId, setColorPickerElementId] = useState<string | null>(null);
    const [pendingPosition, setPendingPosition] = useState({ x: 0, y: 0 });
    const [scriptModalInitial, setScriptModalInitial] = useState(DEFAULT_SCRIPT);
    const [scriptModalElementId, setScriptModalElementId] = useState<string | null>(null);
    const [showBackConfirm, setShowBackConfirm] = useState(false);
    const [nudgeMenuPosition, setNudgeMenuPosition] = useState({ x: 0, y: 0 });
    const [nudgeBounds, setNudgeBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const nudgeRef = useRef<View>(null);
    const suppressCanvasTapRef = useRef(false);
    const suppressCanvasTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Ref for canvas capture (for export)
    const canvasRef = useRef<View>(null);

    // Handle tool selection - open palette for widget tool
    const handleToolSelect = (tool: ToolType) => {
        if (tool === 'widget') {
            setShowWidgetPalette(true);
        } else if (tool === 'data') {
            setShowDataModal(true);
        } else if (tool === 'shape') {
            setShowShapePicker(true);
        } else if (tool === 'script') {
            // Script editing is handled via ScriptEditorScreen
            navigation.navigate('ScriptEditor', { widgetId: '' });
        } else if (tool === 'clock') {
            // Add analog clock directly to canvas
            handleAddAnalogClock();
        } else if (tool === 'digitalClock') {
            // Add digital clock directly to canvas
            handleAddDigitalClock();
        } else if (tool === 'curvedText') {
            // Add curved text directly to canvas
            handleAddCurvedText();
        } else if (tool === 'gradient') {
            // Add gradient directly to canvas
            handleAddGradient();
        } else {
            setSelectedTool(tool);
        }
    };

    // Canvas transform values
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Get the currently selected element
    const selectedElement = state.selectedIds.length > 0
        ? state.elements[state.selectedIds[0]]
        : null;

    React.useEffect(() => {
        scale.value = zoom;
        savedScale.value = zoom;
    }, [zoom]);

    // Start data updates and set up refresh interval for live data elements
    const [, forceUpdate] = React.useReducer(x => x + 1, 0);
    const hasDataBindings = React.useMemo(() => {
        return Object.values(state.elements).some(el =>
            el?.type === 'text' && el.content && /\{[^}]+\}/.test(el.content)
        );
    }, [state.elements]);

    React.useEffect(() => {
        startDataUpdates();
        // Only refresh when there are data-bound text elements (clocks manage their own timers)
        if (!hasDataBindings) return;
        const interval = setInterval(() => forceUpdate(), 1000);
        return () => clearInterval(interval);
    }, [hasDataBindings]);

    const [widgetId, setWidgetId] = useState<string | undefined>(route.params?.widgetId);
    const [widgetName, setWidgetName] = useState<string>(route.params?.templateName || 'My Widget');
    const [isSaving, setIsSaving] = useState(false);
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [tempWidgetName, setTempWidgetName] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isLoading, setIsLoading] = useState(!!route.params?.widgetId);

    // Keyboard Shortcuts
    const areShortcutsEnabled = !(
        showTextModal ||
        showScriptModal ||
        showWidgetPalette ||
        showShapePicker ||
        showExportModal ||
        showPreviewModal ||
        showDataModal ||
        showColorPicker ||
        showTextStyleModal ||
        showClockStyleModal ||
        showCurvedTextStyleModal ||
        showGradientStyleModal ||
        showImageFilterModal ||
        showShadowStyleModal ||
        showAnimationStyleModal ||
        showCanvasSettingsModal ||
        showBackConfirm ||
        showNamePrompt
    );

    useKeyboardShortcuts(areShortcutsEnabled);

    // Load widget from saved data OR from template
    React.useEffect(() => {
        const loadExistingWidget = async () => {
            const paramWidgetId = route.params?.widgetId;
            const templateElements = route.params?.templateElements;
            const templateElementOrder = route.params?.templateElementOrder;
            const templateCanvasSize = route.params?.templateCanvasSize;
            const templateName = route.params?.templateName;

            // If template data is provided, load it
            if (templateElements && templateElementOrder && templateCanvasSize && loadWidget) {
                loadWidget(templateElements, templateElementOrder, templateCanvasSize);
                if (templateName) {
                    setWidgetName(templateName);
                }
                setHasUnsavedChanges(true); // Mark as unsaved since it's a new widget from template
                return;
            }

            // Otherwise, load from saved widget
            if (paramWidgetId && loadWidget) {
                setIsLoading(true);
                try {
                    const widget = await getWidget(paramWidgetId);
                    if (widget) {
                        loadWidget(widget.elements, widget.elementOrder, widget.canvasSize);
                        setWidgetId(widget.id);
                        setWidgetName(widget.name);
                    }
                } catch (error) {
                    console.error('Error loading widget:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadExistingWidget();
    }, [route.params?.widgetId, route.params?.templateElements, route.params?.templateElementOrder, route.params?.templateCanvasSize, route.params?.templateName, loadWidget]);

    // Wrap canvas operations to track unsaved changes
    const deleteSelected = useCallback(() => {
        deleteSelectedBase();
        setHasUnsavedChanges(true);
    }, [deleteSelectedBase]);

    const duplicateSelected = useCallback(() => {
        duplicateSelectedBase();
        setHasUnsavedChanges(true);
    }, [duplicateSelectedBase]);

    const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
        updateElementBase(id, updates);
        setHasUnsavedChanges(true);
    }, [updateElementBase]);

    const handleBack = () => {
        console.log('handleBack called');
        console.log('hasUnsavedChanges:', hasUnsavedChanges);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (hasUnsavedChanges) {
            console.log('Showing back confirmation modal');
            setShowBackConfirm(true);
        } else {
            console.log('No unsaved changes, navigating back directly');
            navigation.goBack();
        }
    };

    const handleConfirmBack = () => {
        console.log('Discard confirmed, navigating back');
        setShowBackConfirm(false);
        navigation.goBack();
    };

    const doSaveWidget = async (name: string) => {
        if (state.elementOrder.length === 0) {
            Alert.alert('Empty Widget', 'Add some elements before saving!');
            return;
        }

        setIsSaving(true);
        try {
            // Capture canvas thumbnail as base64
            let thumbnail: string | undefined;
            try {
                if (canvasRef.current) {
                    if (Platform.OS === 'web') {
                        // Web: use html-to-image (findNodeHandle not supported on web)
                        const dataUrl = await htmlToImage.toPng(canvasRef.current as unknown as HTMLElement, {
                            width: 300,
                            quality: 0.6,
                        });
                        if (dataUrl) {
                            thumbnail = dataUrl;
                        }
                    } else {
                        // Native: use react-native-view-shot
                        const base64 = await captureRef(canvasRef, {
                            format: 'png',
                            quality: 0.6,
                            width: 300,
                            result: 'base64',
                        });
                        if (base64) {
                            thumbnail = `data:image/png;base64,${base64}`;
                        }
                    }
                }
            } catch (thumbErr) {
                // Non-fatal – save without thumbnail
                console.warn('Thumbnail capture failed:', thumbErr);
            }

            const savedWidget = await saveWidget({
                id: widgetId,
                name,
                elements: state.elements,
                elementOrder: state.elementOrder,
                canvasSize: state.canvasSize,
                width: state.canvasSize.width,
                height: state.canvasSize.height,
                elementCount: state.elementOrder.length,
                thumbnail,
            });

            setWidgetId(savedWidget.id);
            setWidgetName(savedWidget.name);
            setHasUnsavedChanges(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Saved!', `"${savedWidget.name}" has been saved successfully.`);
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save widget. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = () => {
        if (widgetId) {
            // Already saved before, just save with existing name
            doSaveWidget(widgetName);
        } else {
            // First save, prompt for name
            setTempWidgetName(widgetName);
            setShowNamePrompt(true);
        }
    };

    const handlePreview = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowPreviewModal(true);
    };

    const handleRequestTextInput = (x: number, y: number) => {
        setPendingPosition({ x, y });
        setShowTextModal(true);
    };

    const handleTextSubmit = (text: string, fontFamily: string, fontSize: number, fontWeight: string) => {
        const newElement: Omit<CanvasElement, 'id'> = {
            type: 'text',
            name: `Text ${state.elementOrder.length + 1}`,
            transform: {
                x: pendingPosition.x,
                y: pendingPosition.y,
                width: Math.max(120, text.length * fontSize * 0.6),
                height: fontSize + 16,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            style: { opacity: 1 },
            textStyle: {
                fontFamily,
                fontSize,
                fontWeight,
                color: colors.onSurface,
                textAlign: 'center',
            },
            content: text,
            visible: true,
            locked: false,
        };

        addElement(newElement);
        setHasUnsavedChanges(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const handleScriptSubmit = (script: string) => {
        if (scriptModalElementId) {
            updateElement(scriptModalElementId, { script });
            setHasUnsavedChanges(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
        }

        const newElement: Omit<CanvasElement, 'id'> = {
            type: 'scriptWidget',
            name: `Script ${state.elementOrder.length + 1}`,
            transform: {
                x: 50,
                y: 50,
                width: 200,
                height: 120,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            style: { opacity: 1 },
            script,
            scriptRefreshSec: 5,
            visible: true,
            locked: false,
        };

        addElement(newElement);
        setHasUnsavedChanges(true);
        setSelectedTool('select');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    // Handle data element submission (time, date, weather)
    const handleDataElementSubmit = (config: DataElementConfig) => {
        // Create a display name based on the type
        const typeNames = { time: 'Time', date: 'Date', weather: 'Weather' };
        const displayName = `${typeNames[config.type]} ${state.elementOrder.length + 1}`;

        // Get initial value from data provider
        const initialValue = dataProvider.getValue(config.dataKey as any);

        const newElement: Omit<CanvasElement, 'id'> = {
            type: 'text',
            name: displayName,
            transform: {
                x: 50,
                y: 50,
                width: Math.max(120, String(initialValue).length * config.fontSize * 0.6),
                height: config.fontSize + 16,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            style: { opacity: 1 },
            textStyle: {
                fontFamily: config.fontFamily,
                fontSize: config.fontSize,
                fontWeight: config.fontWeight,
                color: config.color,
                textAlign: 'center',
            },
            // Store data binding key in content with special prefix
            content: `{${config.dataKey}}`,
            visible: true,
            locked: false,
        };

        addElement(newElement);
        setHasUnsavedChanges(true);
        setShowDataModal(false);
        setSelectedTool('select');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Handle shape selection from Shape Picker
    const handleShapeSelect = (shape: ShapePreset) => {
        const centerX = 50;
        const centerY = 50;
        const defaultSize = 120;

        // Determine element type based on shape
        let elementType: ElementType = 'rectangle';
        if (shape.type === 'ellipse') {
            elementType = 'ellipse';
        } else if (shape.type === 'path' || shape.type === 'polygon' || shape.type === 'star') {
            elementType = 'path';
        }

        // Generate path data for path-based shapes
        // Paths are stored in normalized 0-1 coordinates for proper scaling
        let pathData: string | undefined;
        if (shape.path) {
            // Shape paths from MD3Shapes are already in 0-1 normalized form
            pathData = shape.path;
        } else if (shape.type === 'polygon') {
            // Generate polygon path in normalized 0-1 coordinates
            const sides = shape.properties?.sides || 6;
            const rotation = shape.properties?.rotation || 0;
            const cx = 0.5;
            const cy = 0.5;
            const radius = 0.48; // Slight padding
            const points = Array.from({ length: sides }, (_, i) => {
                const angle = (i * 2 * Math.PI) / sides - Math.PI / 2 + (rotation * Math.PI) / 180;
                return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
            });
            pathData = `M${points.join(' L')} Z`;
        } else if (shape.type === 'star') {
            // Generate star path in normalized 0-1 coordinates
            const numPoints = shape.properties?.points || 5;
            const innerRadius = shape.properties?.innerRadius || 0.4;
            const cx = 0.5;
            const cy = 0.5;
            const outerRadius = 0.48; // Slight padding
            const inner = outerRadius * innerRadius;
            const points = Array.from({ length: numPoints * 2 }, (_, i) => {
                const angle = (i * Math.PI) / numPoints - Math.PI / 2;
                const r = i % 2 === 0 ? outerRadius : inner;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
            });
            pathData = `M${points.join(' L')} Z`;
        }

        // Build style object with MD3 corner config
        const style: CanvasElement['style'] = {
            fill: colors.primary,
            opacity: 1,
            strokeWidth: 0,
        };

        if (shape.cornerConfig) {
            style.cornerFamily = shape.cornerConfig.family;
            style.cornerTopLeft = shape.cornerConfig.topLeft;
            style.cornerTopRight = shape.cornerConfig.topRight;
            style.cornerBottomRight = shape.cornerConfig.bottomRight;
            style.cornerBottomLeft = shape.cornerConfig.bottomLeft;
            // Also set legacy cornerRadius for backwards compatibility
            const avg = (shape.cornerConfig.topLeft + shape.cornerConfig.topRight +
                shape.cornerConfig.bottomRight + shape.cornerConfig.bottomLeft) / 4;
            style.cornerRadius = avg;
        }

        const newElement: Omit<CanvasElement, 'id'> = {
            type: elementType,
            name: `${shape.name} ${state.elementOrder.length + 1}`,
            transform: {
                x: centerX,
                y: centerY,
                width: defaultSize,
                height: defaultSize,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            style,
            shapePresetId: shape.id,
            polygonSides: shape.type === 'polygon' ? shape.properties?.sides : undefined,
            starPoints: shape.type === 'star' ? shape.properties?.points : undefined,
            starInnerRadius: shape.type === 'star' ? shape.properties?.innerRadius : undefined,
            path: pathData,
            visible: true,
            locked: false,
        };

        addElement(newElement);
        setHasUnsavedChanges(true);
        setShowShapePicker(false);
        setSelectedTool('select');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Handle adding analog clock to canvas
    const handleAddAnalogClock = () => {
        const centerX = 50;
        const centerY = 50;
        const defaultSize = 150;

        const newElement: Omit<CanvasElement, 'id'> = {
            type: 'analogClock',
            name: `Analog Clock ${state.elementOrder.length + 1}`,
            transform: {
                x: centerX,
                y: centerY,
                width: defaultSize,
                height: defaultSize,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            style: {
                fill: colors.surfaceContainer,
                opacity: 1,
            },
            clockConfig: {
                faceStyle: 'modern',
                handStyle: 'modern',
                showSeconds: true,
                showNumbers: true,
                showTicks: true,
                smoothSeconds: false,
            },
            visible: true,
            locked: false,
        };

        addElement(newElement);
        setHasUnsavedChanges(true);
        setSelectedTool('select');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Handle adding digital clock to canvas
    const handleAddDigitalClock = () => {
        const centerX = 50;
        const centerY = 50;

        const newElement: Omit<CanvasElement, 'id'> = {
            type: 'digitalClock',
            name: `Digital Clock ${state.elementOrder.length + 1}`,
            transform: {
                x: centerX,
                y: centerY,
                width: 200,
                height: 60,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            style: {
                fill: 'transparent',
                opacity: 1,
            },
            clockConfig: {
                format: '12h',
                showSeconds: true,
                showAmPm: true,
                hourHandColor: '#FFFFFF', // Used as textColor for digital
                secondHandColor: '#FFFFFF', // Used as secondaryColor
            },
            textStyle: {
                fontFamily: 'System',
                fontSize: 0,
                fontWeight: '400',
                color: '#FFFFFF',
                textAlign: 'center',
            },
            visible: true,
            locked: false,
        };

        addElement(newElement);
        setHasUnsavedChanges(true);
        setSelectedTool('select');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Handle adding curved text to canvas
    const handleAddCurvedText = () => {
        const centerX = 50;
        const centerY = 50;

        const newElement: Omit<CanvasElement, 'id'> = {
            type: 'curvedText',
            name: `Curved Text ${state.elementOrder.length + 1}`,
            content: 'Curved Text',
            transform: {
                x: centerX,
                y: centerY,
                width: 200,
                height: 100,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            style: {
                fill: 'transparent',
                opacity: 1,
            },
            curvedTextConfig: {
                curveType: 'arc',
                curveAmount: 50,
                startOffset: 0,
            },
            textStyle: {
                fontFamily: 'System',
                fontSize: 24,
                fontWeight: '400',
                color: '#FFFFFF',
                textAlign: 'center',
            },
            visible: true,
            locked: false,
        };

        addElement(newElement);
        setHasUnsavedChanges(true);
        setSelectedTool('select');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleAddGradient = () => {
        const centerX = 50;
        const centerY = 50;

        const newElement: Omit<CanvasElement, 'id'> = {
            type: 'gradient',
            name: `Gradient ${state.elementOrder.length + 1}`,
            transform: {
                x: centerX,
                y: centerY,
                width: 200,
                height: 150,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            style: {
                fill: 'transparent',
                opacity: 1,
                cornerRadius: 12,
            },
            gradientConfig: {
                type: 'linear',
                colors: ['#FF512F', '#F09819'],
                angle: 135,
            },
            visible: true,
            locked: false,
        };

        addElement(newElement);
        setHasUnsavedChanges(true);
        setSelectedTool('select');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Handle all style changes from ColorPickerModal in a single update
    const handleStyleApply = React.useCallback((newColor: string, newOpacity: number, newCornerRadius: number) => {
        const elementId = colorPickerElementId;
        const element = elementId ? state.elements[elementId] : null;

        console.log('handleStyleApply called:', { newColor, newOpacity, newCornerRadius, elementId, elementType: element?.type });

        if (!element || !elementId) {
            console.log('No element found - returning');
            return;
        }

        if (element.type === 'text' || element.type === 'curvedText') {
            // Update text color only (opacity/cornerRadius don't apply to text types in the same way)
            updateElement(elementId, {
                textStyle: {
                    ...element.textStyle!,
                    color: newColor,
                },
            });
        } else {
            // Update all shape style properties at once
            updateElement(elementId, {
                style: {
                    ...element.style,
                    fill: newColor,
                    opacity: newOpacity,
                    cornerRadius: newCornerRadius,
                },
            });
        }
        
        setShowColorPicker(false);
        setColorPickerElementId(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [colorPickerElementId, state.elements, updateElement]);

    // Handle text style changes from TextStyleModal
    const handleTextStyleApply = (textStyleUpdates: Partial<import('@canvas/CanvasContext').TextStyle>) => {
        console.log('handleTextStyleApply:', textStyleUpdates, 'element:', selectedElement?.id);
        if (!selectedElement || selectedElement.type !== 'text') {
            console.log('No text element selected');
            return;
        }

        updateElement(selectedElement.id, {
            textStyle: {
                ...selectedElement.textStyle!,
                ...textStyleUpdates,
            },
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Handle clock style changes from ClockStyleModal
    const handleClockStyleApply = (
        clockConfig: import('@canvas/CanvasContext').ClockConfig,
        textStyleUpdates?: Partial<import('@canvas/CanvasContext').TextStyle>
    ) => {
        if (!selectedElement || (selectedElement.type !== 'analogClock' && selectedElement.type !== 'digitalClock')) {
            return;
        }

        const updates: any = {
            clockConfig: {
                ...selectedElement.clockConfig,
                ...clockConfig,
            },
        };

        if (textStyleUpdates && selectedElement.type === 'digitalClock') {
            updates.textStyle = {
                ...(selectedElement.textStyle || {}),
                ...textStyleUpdates,
            };
        }

        updateElement(selectedElement.id, updates);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Handle curved text style changes from CurvedTextStyleModal
    const handleCurvedTextStyleApply = (
        curvedConfig: import('@canvas/CanvasContext').CurvedTextConfig,
        textStyleUpdates: Partial<import('@canvas/CanvasContext').TextStyle>,
        content: string
    ) => {
        if (!selectedElement || selectedElement.type !== 'curvedText') {
            return;
        }

        updateElement(selectedElement.id, {
            curvedTextConfig: {
                ...selectedElement.curvedTextConfig,
                ...curvedConfig,
            },
            textStyle: {
                ...(selectedElement.textStyle || {}),
                ...textStyleUpdates,
            } as import('@canvas/CanvasContext').TextStyle,
            content,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Handle gradient style changes from GradientStyleModal
    const handleGradientStyleApply = (
        gradientConfig: import('@canvas/CanvasContext').GradientConfig
    ) => {
        if (!selectedElement || (selectedElement.type !== 'gradient' && selectedElement.type !== 'rectangle' && selectedElement.type !== 'ellipse' && selectedElement.type !== 'path' && selectedElement.type !== 'line')) {
            return;
        }

        updateElement(selectedElement.id, {
            gradientConfig: {
                ...selectedElement.gradientConfig,
                ...gradientConfig,
            },
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Handle image filter changes from ImageFilterModal
    const handleImageFilterApply = (
        imageFilterConfig: import('@canvas/CanvasContext').ImageFilterConfig
    ) => {
        if (!selectedElement || selectedElement.type !== 'image') {
            return;
        }

        updateElement(selectedElement.id, {
            imageFilterConfig: {
                ...selectedElement.imageFilterConfig,
                ...imageFilterConfig,
            },
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleShadowStyleApply = (shadowConfig: ShadowConfig | undefined) => {
        if (selectedElement?.id) {
            updateElement(selectedElement.id, {
                style: {
                    ...selectedElement.style,
                    shadow: shadowConfig,
                },
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleAnimationStyleApply = (animationConfig: AnimationConfig | undefined) => {
        if (selectedElement?.id) {
            updateElement(selectedElement.id, {
                animation: animationConfig,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleRequestImagePicker = async (x: number, y: number) => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photo library to add images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const newElement: Omit<CanvasElement, 'id'> = {
                type: 'image',
                name: `Image ${state.elementOrder.length + 1}`,
                transform: {
                    x,
                    y,
                    width: 100,
                    height: 100,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                },
                style: {
                    opacity: 1,
                    cornerRadius: 12,
                },
                imageUri: result.assets[0].uri,
                visible: true,
                locked: false,
            };

            addElement(newElement);
            setHasUnsavedChanges(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    // Check if a point is inside any element
    const getElementAtPoint = useCallback((x: number, y: number): string | null => {
        // Check elements in reverse order (top to bottom)
        for (let i = state.elementOrder.length - 1; i >= 0; i--) {
            const id = state.elementOrder[i];
            const el = state.elements[id];
            if (el && el.visible) {
                const { transform } = el;
                if (
                    x >= transform.x &&
                    x <= transform.x + transform.width &&
                    y >= transform.y &&
                    y <= transform.y + transform.height
                ) {
                    return id;
                }
            }
        }
        return null;
    }, [state.elements, state.elementOrder]);

    const updateNudgeBounds = useCallback(() => {
        nudgeRef.current?.measureInWindow((x, y, width, height) => {
            setNudgeBounds({ x, y, width, height });
        });
    }, []);

    useEffect(() => {
        if (state.selectedIds.length > 0) {
            requestAnimationFrame(updateNudgeBounds);
        }
    }, [state.selectedIds.length, nudgeMenuPosition.x, nudgeMenuPosition.y, showLayerPanel, updateNudgeBounds]);

    const handleCanvasTap = useCallback((absoluteX: number, absoluteY: number) => {
        if (suppressCanvasTapRef.current) {
            return;
        }

        if (
            absoluteX >= nudgeBounds.x &&
            absoluteX <= nudgeBounds.x + nudgeBounds.width &&
            absoluteY >= nudgeBounds.y &&
            absoluteY <= nudgeBounds.y + nudgeBounds.height
        ) {
            return;
        }

        // Convert tap position to canvas coordinates
        // Account for canvas centering and offset
        const canvasOffsetX = (SCREEN_WIDTH - 56 - 360) / 2;
        const canvasOffsetY = (SCREEN_HEIGHT - 180 - 360) / 2;

        const x = (absoluteX - translateX.value - canvasOffsetX) / scale.value;
        const y = (absoluteY - translateY.value - canvasOffsetY) / scale.value;

        // Check if we're tapping on an existing element
        const hitElement = getElementAtPoint(x, y);

        if (hitElement) {
            // Tapped on an element - select it
            selectElement(hitElement);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            return;
        }

        // Tapped on empty canvas area
        if (selectedTool === 'select') {
            dispatch({ type: 'CLEAR_SELECTION' });
            return;
        }

        if (selectedTool === 'text') {
            handleRequestTextInput(x - 60, y - 20);
            return;
        }

        if (selectedTool === 'image') {
            handleRequestImagePicker(x - 50, y - 50);
            return;
        }

        if (selectedTool === 'script') {
            navigation.navigate('ScriptEditor', { widgetId: '' });
            return;
        }

        // Create shape element
        const isEllipse = selectedTool === 'ellipse';
        const elementType: ElementType = isEllipse ? 'ellipse' : 'rectangle';

        const newElement: Omit<CanvasElement, 'id'> = {
            type: elementType,
            name: `${isEllipse ? 'Circle' : 'Rectangle'} ${state.elementOrder.length + 1}`,
            transform: {
                x: x - 50,
                y: y - 50,
                width: 100,
                height: 100,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
            },
            style: {
                fill: isEllipse ? colors.secondary : colors.primary,
                opacity: 1,
                cornerRadius: isEllipse ? 50 : 12,
            },
            visible: true,
            locked: false,
        };

        addElement(newElement);
        setHasUnsavedChanges(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [selectedTool, addElement, colors, state.elementOrder.length, dispatch, getElementAtPoint, nudgeBounds, selectElement, scale, translateX, translateY]);

    const handleElementSelect = useCallback((id: string) => {
        selectElement(id);
    }, [selectElement]);

    const handleElementMove = useCallback((id: string, deltaX: number, deltaY: number) => {
        dispatch({ type: 'MOVE_ELEMENTS', ids: [id], deltaX, deltaY });
    }, [dispatch]);

    // Handle nudge for selected element
    const handleNudge = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (state.selectedIds.length === 0) return;
        suppressCanvasTapRef.current = true;
        if (suppressCanvasTapTimeoutRef.current) {
            clearTimeout(suppressCanvasTapTimeoutRef.current);
        }
        suppressCanvasTapTimeoutRef.current = setTimeout(() => {
            suppressCanvasTapRef.current = false;
        }, 200);
        const nudgeAmount = 2; // 2 pixels per nudge
        let deltaX = 0;
        let deltaY = 0;
        switch (direction) {
            case 'up': deltaY = -nudgeAmount; break;
            case 'down': deltaY = nudgeAmount; break;
            case 'left': deltaX = -nudgeAmount; break;
            case 'right': deltaX = nudgeAmount; break;
        }
        dispatch({ type: 'MOVE_ELEMENTS', ids: state.selectedIds, deltaX, deltaY });
        setHasUnsavedChanges(true);
    }, [state.selectedIds, dispatch]);

    const handleElementResize = useCallback((id: string, dw: number, dh: number, dx: number, dy: number) => {
        const element = state.elements[id];
        if (!element || element.locked) return;

        const newWidth = Math.max(20, element.transform.width + dw);
        const newHeight = Math.max(20, element.transform.height + dh);

        const newTransform = {
            x: element.transform.x + dx,
            y: element.transform.y + dy,
            width: newWidth,
            height: newHeight,
        };

        // For text elements, scale the font size proportionally
        if (element.type === 'text' && element.textStyle) {
            const oldSize = Math.min(element.transform.width, element.transform.height);
            const newSize = Math.min(newWidth, newHeight);
            const scaleFactor = newSize / oldSize;
            const currentFontSize = element.textStyle.fontSize || 24;
            const newFontSize = Math.max(8, Math.min(200, Math.round(currentFontSize * scaleFactor)));

            updateElement(id, {
                transform: { ...element.transform, ...newTransform },
                textStyle: {
                    ...element.textStyle,
                    fontSize: newFontSize,
                },
            });
        } else {
            dispatch({ type: 'RESIZE_ELEMENT', id, transform: newTransform });
        }
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [state.elements, dispatch, updateElement]);

    const toggleLayerVisibility = (id: string) => {
        const element = state.elements[id];
        if (element) {
            updateElement(id, { visible: !element.visible });
        }
    };

    const toggleLayerLock = (id: string) => {
        const element = state.elements[id];
        if (element) {
            updateElement(id, { locked: !element.locked });
        }
    };

    const handleBringForward = () => {
        if (state.selectedIds.length > 0) {
            bringForward(state.selectedIds[0]);
        }
    };

    const handleSendBackward = () => {
        if (state.selectedIds.length > 0) {
            sendBackward(state.selectedIds[0]);
        }
    };

    // Canvas gestures
    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            scale.value = Math.min(4, Math.max(0.25, savedScale.value * e.scale));
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            runOnJS(setZoom)(scale.value);
        });

    const panGesture = Gesture.Pan()
        .minPointers(2)
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const tapGesture = Gesture.Tap()
        .onEnd((e) => {
            runOnJS(handleCanvasTap)(e.absoluteX, e.absoluteY);
        });

    const canvasGesture = Gesture.Simultaneous(
        Gesture.Exclusive(tapGesture, Gesture.Simultaneous(pinchGesture, panGesture))
    );

    const animatedCanvasStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <TextModal
                visible={showTextModal}
                onClose={() => setShowTextModal(false)}
                onSubmit={handleTextSubmit}
            />

            <ScriptModal
                visible={showScriptModal}
                initialScript={scriptModalInitial}
                onClose={() => setShowScriptModal(false)}
                onSubmit={handleScriptSubmit}
            />

            {/* Widget Components Palette */}
            <WidgetPaletteModal
                visible={showWidgetPalette}
                onClose={() => setShowWidgetPalette(false)}
                onAddComponent={(element) => {
                    addElement(element);
                    setHasUnsavedChanges(true);
                    setSelectedTool('select');
                }}
            />

            {/* Shape Picker Modal (MD3 Shapes) */}
            <ShapePickerModal
                visible={showShapePicker}
                onClose={() => setShowShapePicker(false)}
                onSelectShape={handleShapeSelect}
            />

            {/* Export Widget Modal */}
            <ExportModal
                visible={showExportModal}
                onClose={() => setShowExportModal(false)}
                widgetRef={canvasRef}
                widgetName={widgetName || 'My Widget'}
            />

            <PreviewModal
                visible={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                elements={state.elementOrder.map(id => state.elements[id]).filter(Boolean)}
                canvasWidth={state.canvasSize.width}
                canvasHeight={state.canvasSize.height}
                canvasColor={colors.surface}
                backgroundImage={null}
            />

            {/* Data Element Modal (Time, Date, Weather) */}
            <DataElementModal
                visible={showDataModal}
                onClose={() => setShowDataModal(false)}
                onSubmit={handleDataElementSubmit}
            />

            {/* Color Picker Modal */}
            <ColorPickerModal
                visible={showColorPicker}
                onClose={() => setShowColorPicker(false)}
                currentColor={
                    selectedElement?.type === 'text'
                        ? selectedElement.textStyle?.color || '#FFFFFF'
                        : selectedElement?.style?.fill || '#6750A4'
                }
                currentOpacity={selectedElement?.style?.opacity ?? 1}
                currentCornerRadius={(selectedElement?.style?.cornerRadius as number) ?? 12}
                onApply={handleStyleApply}
            />

            {/* Text Style Modal */}
            <TextStyleModal
                visible={showTextStyleModal}
                onClose={() => setShowTextStyleModal(false)}
                currentTextStyle={selectedElement?.textStyle}
                onApply={handleTextStyleApply}
            />

            {/* Clock Style Modal */}
            <ClockStyleModal
                visible={showClockStyleModal}
                onClose={() => setShowClockStyleModal(false)}
                currentConfig={selectedElement?.clockConfig}
                currentTextStyle={selectedElement?.textStyle}
                onApply={handleClockStyleApply}
                clockType={selectedElement?.type as 'analogClock' | 'digitalClock'}
            />

            {/* Curved Text Style Modal */}
            <CurvedTextStyleModal
                visible={showCurvedTextStyleModal}
                onClose={() => setShowCurvedTextStyleModal(false)}
                currentConfig={selectedElement?.curvedTextConfig}
                currentTextStyle={selectedElement?.textStyle}
                currentContent={selectedElement?.content}
                onApply={handleCurvedTextStyleApply}
            />

            {/* Gradient Style Modal */}
            <GradientStyleModal
                visible={showGradientStyleModal}
                onClose={() => setShowGradientStyleModal(false)}
                currentConfig={selectedElement?.gradientConfig}
                onApply={handleGradientStyleApply}
            />

            {/* Image Filter Modal */}
            <ImageFilterModal
                visible={showImageFilterModal}
                onClose={() => setShowImageFilterModal(false)}
                currentConfig={selectedElement?.imageFilterConfig}
                imageUri={selectedElement?.imageUri}
                onApply={handleImageFilterApply}
            />

            {/* Shadow Style Modal */}
            <ShadowStyleModal
                visible={showShadowStyleModal}
                onClose={() => setShowShadowStyleModal(false)}
                currentConfig={selectedElement?.style?.shadow}
                onApply={handleShadowStyleApply}
            />

            {/* Animation Style Modal */}
            <AnimationStyleModal
                visible={showAnimationStyleModal}
                onClose={() => setShowAnimationStyleModal(false)}
                currentConfig={selectedElement?.animation}
                onApply={handleAnimationStyleApply}
            />

            {/* Canvas Settings Modal */}
            <CanvasSettingsModal
                visible={showCanvasSettingsModal}
                onClose={() => setShowCanvasSettingsModal(false)}
            />

            {/* Back Confirmation Modal */}
            <Modal visible={showBackConfirm} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <TitleMedium style={{ color: colors.onSurface, marginBottom: 8 }}>
                            Unsaved Changes
                        </TitleMedium>
                        <BodyMedium style={{ color: colors.onSurfaceVariant, marginBottom: 24 }}>
                            You have unsaved changes. Are you sure you want to go back?
                        </BodyMedium>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <Pressable
                                onPress={() => setShowBackConfirm(false)}
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: colors.surfaceContainerHigh },
                                ]}
                            >
                                <BodyMedium style={{ color: colors.onSurface }}>
                                    Cancel
                                </BodyMedium>
                            </Pressable>
                            <Pressable
                                onPress={handleConfirmBack}
                                style={[
                                    styles.modalButton,
                                    { backgroundColor: colors.error },
                                ]}
                            >
                                <BodyMedium style={{ color: colors.onError }}>
                                    Discard
                                </BodyMedium>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Save Name Prompt Modal */}
            <Modal visible={showNamePrompt} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <TitleMedium style={{ color: colors.onSurface, marginBottom: 16 }}>
                            Save Widget
                        </TitleMedium>
                        <LabelMedium style={{ color: colors.onSurfaceVariant, marginBottom: 8 }}>
                            Widget Name
                        </LabelMedium>
                        <TextInput
                            value={tempWidgetName}
                            onChangeText={setTempWidgetName}
                            placeholder="Enter widget name..."
                            placeholderTextColor={colors.onSurfaceVariant}
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: colors.surfaceContainerHigh,
                                    color: colors.onSurface,
                                    minHeight: 48,
                                },
                            ]}
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, { backgroundColor: colors.surfaceContainerHigh }]}
                                onPress={() => setShowNamePrompt(false)}
                            >
                                <BodyMedium style={{ color: colors.onSurface }}>Cancel</BodyMedium>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                                onPress={() => {
                                    setShowNamePrompt(false);
                                    doSaveWidget(tempWidgetName || 'My Widget');
                                }}
                            >
                                <BodyMedium style={{ color: colors.onPrimary }}>
                                    {isSaving ? 'Saving...' : 'Save'}
                                </BodyMedium>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            <ToolSidebar
                selectedTool={selectedTool}
                onToolSelect={handleToolSelect}
                onUndo={undo}
                onRedo={redo}
            />

            <View style={styles.mainArea}>
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <PremiumIconButton
                        icon="arrow-left"
                        variant="standard"
                        onPress={handleBack}
                    />
                    <TitleMedium style={{ color: colors.onSurface, flex: 1 }}>
                        Widget Editor
                    </TitleMedium>
                    <PremiumIconButton
                        icon="grid"
                        variant="standard"
                        onPress={() => setShowCanvasSettingsModal(true)}
                    />
                    <PremiumIconButton
                        icon="content-save"
                        variant="standard"
                        onPress={handleSave}
                    />
                    <PremiumIconButton
                        icon="export-variant"
                        variant="filled"
                        onPress={() => setShowExportModal(true)}
                    />
                </View>

                {/* Canvas */}
                <GestureDetector gesture={canvasGesture}>
                    <View style={[styles.canvasWrapper, { backgroundColor: colors.surfaceContainerLow }]}>
                        <GridBackground visible={state.showGrid} gridSize={state.gridSize} />
                        <Animated.View style={[styles.canvasContent, animatedCanvasStyle]}>
                            <View ref={canvasRef} style={[styles.widgetCanvas, { width: state.canvasSize.width, height: state.canvasSize.height, backgroundColor: colors.surface }]}>
                                {state.elementOrder.map((id) => {
                                    const element = state.elements[id];
                                    if (!element) return null;
                                    return (
                                        <CanvasElementView
                                            key={id}
                                            element={element}
                                            isSelected={state.selectedIds.includes(id)}
                                            onSelect={() => handleElementSelect(id)}
                                            onMove={(dx, dy) => handleElementMove(id, dx, dy)}
                                            onResize={(dw, dh, dx, dy) => handleElementResize(id, dw, dh, dx, dy)}
                                        />
                                    );
                                })}
                            </View>
                        </Animated.View>
                    </View>
                </GestureDetector>

                {state.selectedIds.length > 0 && (
                    <View style={[styles.floatingToolbarContainer, { top: insets.top + 60 }]}>
                        <FloatingToolbar
                            onDuplicate={duplicateSelected}
                            onDelete={deleteSelected}
                            onBringForward={handleBringForward}
                            onSendBackward={handleSendBackward}
                            onGroup={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                groupSelected();
                            }}
                            onUngroup={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                ungroupSelected();
                            }}
                            canGroup={state.selectedIds.length > 1}
                            canUngroup={state.selectedIds.length === 1 && state.elements[state.selectedIds[0]]?.type === 'group'}
                            onColorPress={() => {
                                setColorPickerElementId(selectedElement?.id || null);
                                setShowColorPicker(true);
                            }}
                            onTextStylePress={() => setShowTextStyleModal(true)}
                            onClockStylePress={() => setShowClockStyleModal(true)}
                            onCurvedTextStylePress={() => setShowCurvedTextStyleModal(true)}
                            onGradientStylePress={() => setShowGradientStyleModal(true)}
                            onImageFilterPress={() => setShowImageFilterModal(true)}
                            onShadowStylePress={() => setShowShadowStyleModal(true)}
                            onAnimationStylePress={() => setShowAnimationStyleModal(true)}
                            isTextElement={selectedElement?.type === 'text'}
                            isClockElement={selectedElement?.type === 'analogClock' || selectedElement?.type === 'digitalClock'}
                            isCurvedTextElement={selectedElement?.type === 'curvedText'}
                            isGradientElement={selectedElement?.type === 'gradient' || selectedElement?.type === 'rectangle' || selectedElement?.type === 'ellipse' || selectedElement?.type === 'path' || selectedElement?.type === 'line'}
                            isImageElement={selectedElement?.type === 'image'}
                            currentColor={
                                selectedElement?.type === 'text'
                                    ? selectedElement.textStyle?.color
                                    : selectedElement?.style.fill as string
                            }
                        />
                    </View>
                )}

                {/* Nudge Controls - positioned at bottom left, above zoom controls */}
                {state.selectedIds.length > 0 && (
                    <View
                        ref={nudgeRef}
                        onLayout={updateNudgeBounds}
                        style={[styles.nudgeControlsContainer, {
                            left: 16 + nudgeMenuPosition.x,
                            bottom: (showLayerPanel ? 280 : 100) - nudgeMenuPosition.y,
                        }]}
                    >
                        <NudgeControls
                            onNudge={handleNudge}
                            position={nudgeMenuPosition}
                            onPositionChange={setNudgeMenuPosition}
                        />
                    </View>
                )}

                <View style={[styles.zoomContainer, { bottom: showLayerPanel ? 184 : 24 }]}>
                    <ZoomControls zoom={zoom} onZoomChange={setZoom} />
                </View>

                <Pressable
                    style={[styles.layerToggle, { backgroundColor: colors.surfaceContainer, bottom: showLayerPanel ? 184 : 24 }]}
                    onPress={() => setShowLayerPanel(!showLayerPanel)}
>
                    <MaterialCommunityIcons
                        name={showLayerPanel ? 'chevron-down' : 'layers'}
                        size={20}
                        color={colors.onSurfaceVariant}
                    />
                </Pressable>

                {showLayerPanel && (
                    <View style={[styles.layerPanel, { backgroundColor: colors.surfaceContainer }]}>
                        <View style={styles.layerPanelHeader}>
                            <TitleSmall style={{ color: colors.onSurface }}>
                                Layers ({state.elementOrder.length})
                            </TitleSmall>
                        </View>
                        <ScrollView style={styles.layerList}>
                            {[...state.elementOrder].reverse().map((id) => {
                                const element = state.elements[id];
                                if (!element) return null;
                                return (
                                    <LayerItem
                                        key={id}
                                        element={element}
                                        isSelected={state.selectedIds.includes(id)}
                                        onSelect={() => dispatch({ type: 'SELECT_ELEMENTS', ids: [id] })}
                                        onToggleVisibility={() => toggleLayerVisibility(id)}
                                        onToggleLock={() => toggleLayerLock(id)}
                                        onDelete={() => {
                                            dispatch({ type: 'DELETE_ELEMENTS', ids: [id] });
                                            setHasUnsavedChanges(true);
                                        }}
                                    />
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
};

// Main Editor Screen with Provider
export const EditorScreen: React.FC = () => {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <CanvasProvider>
                <EditorContent />
            </CanvasProvider>
        </GestureHandlerRootView>
    );
};

// Styles
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    toolSidebar: {
        width: 56,
        paddingHorizontal: 8,
    },
    toolSidebarContent: {
        alignItems: 'center',
        gap: 4,
        paddingBottom: 16,
    },
    toolButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolDivider: {
        width: 24,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginVertical: 8,
    },
    mainArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingBottom: 8,
        gap: 4,
        zIndex: 10, // Ensure header is above canvas for touch events
    },
    canvasWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    canvasGrid: {
        ...StyleSheet.absoluteFillObject,
    },
    canvasContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    widgetCanvas: {
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    canvasElement: {
        position: 'absolute',
    },
    selectionBorder: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 2,
        borderStyle: 'solid',
        borderRadius: 12,
    },
    resizeHandle: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#fff',
    },
    floatingToolbarContainer: {
        position: 'absolute',
        left: 8,
        right: 8,
        alignItems: 'center',
        zIndex: 5,
    },
    floatingToolbar: {
        maxWidth: '100%',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden',
    },
    floatingToolbarContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    toolbarButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolbarDivider: {
        width: 1,
        height: 24,
        marginHorizontal: 4,
    },
    zoomContainer: {
        position: 'absolute',
        left: 16,
    },
    zoomControls: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        overflow: 'hidden',
    },
    zoomButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomValue: {
        paddingHorizontal: 8,
    },
    layerToggle: {
        position: 'absolute',
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    layerPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 180,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 16,
    },
    layerPanelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    layerList: {
        flex: 1,
    },
    layerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 4,
        gap: 10,
    },
    layerName: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
    },
    textInput: {
        borderRadius: 16,
        padding: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    fontRow: {
        flexDirection: 'row',
        gap: 8,
    },
    fontChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    sizeChip: {
        width: 40,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 24,
    },
    modalButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    // Color Picker styles
    colorPalette: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    colorSwatch: {
        width: 36,
        height: 36,
        borderRadius: 8,
    },
    colorPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    previewBox: {
        width: 48,
        height: 48,
    },
    sliderRow: {
        flexDirection: 'row',
        gap: 8,
    },
    opacityChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    colorIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#fff',
    },
    // Nudge Controls styles
    nudgeControlsContainer: {
        position: 'absolute',
        left: 16,
        zIndex: 10,
    },
    nudgeControls: {
        padding: 6,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        alignItems: 'center',
    },
    nudgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    nudgeButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
    },
    nudgeCenter: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
    },
});

export default EditorScreen;