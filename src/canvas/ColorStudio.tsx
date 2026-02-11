/**
 * WidgetCraft - Color & Gradient Studio
 * Premium color picker and gradient editor with:
 * - HSB color wheel picker
 * - RGB/HSB/Hex input modes
 * - Gradient builder with stops
 * - Eyedropper tool
 * - Color palettes & presets
 * - Recent/favorite colors
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    Pressable,
    ScrollView,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import Svg, { Circle, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useColors } from '@theme/index';
import {
    PremiumCard,
    PremiumButton,
    PremiumChip,
    PremiumSlider,
    TitleMedium,
    TitleSmall,
    BodySmall,
    LabelSmall,
} from '@components/common';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Types

export interface HSBColor {
    h: number; // 0-360
    s: number; // 0-100
    b: number; // 0-100
}

export interface RGBColor {
    r: number; // 0-255
    g: number; // 0-255
    b: number; // 0-255
}

export interface GradientStop {
    color: string;
    position: number; // 0-1
}

export interface GradientConfig {
    type: 'linear' | 'radial';
    angle: number;
    stops: GradientStop[];
}

// ============================================
// Color Conversion Utilities
// ============================================

const hsbToRgb = (h: number, s: number, b: number): RGBColor => {
    s /= 100;
    b /= 100;
    const k = (n: number) => (n + h / 60) % 6;
    const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return {
        r: Math.round(255 * f(5)),
        g: Math.round(255 * f(3)),
        b: Math.round(255 * f(1)),
    };
};

const rgbToHsb = (r: number, g: number, b: number): HSBColor => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    let h = 0;
    const s = max === 0 ? 0 : (diff / max) * 100;
    const v = max * 100;

    if (diff !== 0) {
        switch (max) {
            case r: h = 60 * ((g - b) / diff + (g < b ? 6 : 0)); break;
            case g: h = 60 * ((b - r) / diff + 2); break;
            case b: h = 60 * ((r - g) / diff + 4); break;
        }
    }

    return { h: Math.round(h), s: Math.round(s), b: Math.round(v) };
};

const hexToRgb = (hex: string): RGBColor | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null;
};

const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
};

const hsbToHex = (h: number, s: number, b: number): string => {
    const rgb = hsbToRgb(h, s, b);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
};

// ============================================
// Color Wheel Picker
// ============================================

interface ColorWheelProps {
    size: number;
    hue: number;
    saturation: number;
    brightness: number;
    onColorChange: (hsb: HSBColor) => void;
}

const ColorWheel: React.FC<ColorWheelProps> = ({
    size,
    hue,
    saturation,
    brightness,
    onColorChange,
}) => {
    const colors = useColors();
    const center = size / 2;
    const radius = size / 2 - 20;

    const thumbX = useSharedValue(center + radius * (saturation / 100) * Math.cos((hue * Math.PI) / 180));
    const thumbY = useSharedValue(center + radius * (saturation / 100) * Math.sin((hue * Math.PI) / 180));

    const updateColor = useCallback((x: number, y: number) => {
        const dx = x - center;
        const dy = y - center;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const clampedDist = Math.min(distance, radius);

        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        const newSaturation = (clampedDist / radius) * 100;

        onColorChange({
            h: Math.round(angle),
            s: Math.round(newSaturation),
            b: brightness,
        });
    }, [center, radius, brightness, onColorChange]);

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            const x = Math.max(0, Math.min(size, e.x));
            const y = Math.max(0, Math.min(size, e.y));
            thumbX.value = x;
            thumbY.value = y;
            runOnJS(updateColor)(x, y);
        });

    const tapGesture = Gesture.Tap()
        .onEnd((e) => {
            const x = Math.max(0, Math.min(size, e.x));
            const y = Math.max(0, Math.min(size, e.y));
            thumbX.value = withTiming(x, { duration: 100 });
            thumbY.value = withTiming(y, { duration: 100 });
            runOnJS(updateColor)(x, y);
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        });

    const composed = Gesture.Simultaneous(panGesture, tapGesture);

    const thumbStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: thumbX.value - 12 },
            { translateY: thumbY.value - 12 },
        ],
    }));

    // Update thumb position when props change
    useEffect(() => {
        const x = center + radius * (saturation / 100) * Math.cos((hue * Math.PI) / 180);
        const y = center + radius * (saturation / 100) * Math.sin((hue * Math.PI) / 180);
        thumbX.value = withTiming(x, { duration: 150 });
        thumbY.value = withTiming(y, { duration: 150 });
    }, [hue, saturation]);

    return (
        <GestureDetector gesture={composed}>
            <View style={[styles.colorWheel, { width: size, height: size }]}>
                {/* Hue ring */}
                <View style={[styles.hueRing, { width: size, height: size, borderRadius: size / 2 }]}>
                    {Array.from({ length: 12 }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.hueSegment,
                                {
                                    backgroundColor: `hsl(${i * 30}, 100%, 50%)`,
                                    transform: [{ rotate: `${i * 30}deg` }],
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Center white to saturation gradient */}
                <View
                    style={[
                        styles.saturationCircle,
                        {
                            width: size - 40,
                            height: size - 40,
                            borderRadius: (size - 40) / 2,
                            backgroundColor: `hsl(${hue}, 100%, ${brightness / 2}%)`,
                        }
                    ]}
                >
                    <View
                        style={[
                            styles.saturationOverlay,
                            { borderRadius: (size - 40) / 2 }
                        ]}
                    />
                </View>

                {/* Thumb */}
                <Animated.View style={[styles.wheelThumb, thumbStyle]}>
                    <View
                        style={[
                            styles.wheelThumbInner,
                            { backgroundColor: hsbToHex(hue, saturation, brightness) },
                        ]}
                    />
                </Animated.View>
            </View>
        </GestureDetector>
    );
};

// ============================================
// Brightness Slider
// ============================================

interface BrightnessSliderProps {
    hue: number;
    saturation: number;
    brightness: number;
    onBrightnessChange: (brightness: number) => void;
}

const BrightnessSlider: React.FC<BrightnessSliderProps> = ({
    hue,
    saturation,
    brightness,
    onBrightnessChange,
}) => {
    const colors = useColors();

    return (
        <View style={styles.brightnessSlider}>
            <LinearGradient
                colors={[
                    '#000000',
                    hsbToHex(hue, saturation, 100),
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.brightnessGradient}
            />
            <PremiumSlider
                value={brightness}
                min={0}
                max={100}
                onValueChange={onBrightnessChange}
            />
        </View>
    );
};

// ============================================
// Color Input Fields
// ============================================

interface ColorInputsProps {
    color: string;
    onColorChange: (color: string) => void;
}

const ColorInputs: React.FC<ColorInputsProps> = ({ color, onColorChange }) => {
    const colors = useColors();
    const [inputMode, setInputMode] = useState<'hex' | 'rgb' | 'hsb'>('hex');
    const [hexValue, setHexValue] = useState(color);

    useEffect(() => {
        setHexValue(color);
    }, [color]);

    const handleHexChange = (text: string) => {
        const cleaned = text.replace(/[^0-9A-Fa-f#]/g, '');
        setHexValue(cleaned);
        if (/^#[0-9A-Fa-f]{6}$/i.test(cleaned)) {
            onColorChange(cleaned.toUpperCase());
        }
    };

    const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };
    const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);

    return (
        <View style={styles.colorInputs}>
            <View style={styles.inputModeRow}>
                {(['hex', 'rgb', 'hsb'] as const).map((mode) => (
                    <PremiumChip
                        key={mode}
                        label={mode.toUpperCase()}
                        variant={inputMode === mode ? 'filled' : 'outlined'}
                        selected={inputMode === mode}
                        size="small"
                        onPress={() => setInputMode(mode)}
                    />
                ))}
            </View>

            {inputMode === 'hex' && (
                <View style={styles.inputRow}>
                    <View style={[styles.inputField, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <TextInput
                            value={hexValue}
                            onChangeText={handleHexChange}
                            style={[styles.input, { color: colors.onSurface }]}
                            placeholder="#000000"
                            placeholderTextColor={colors.onSurfaceVariant}
                            maxLength={7}
                            autoCapitalize="characters"
                        />
                    </View>
                </View>
            )}

            {inputMode === 'rgb' && (
                <View style={styles.inputRow}>
                    {['R', 'G', 'B'].map((label, i) => (
                        <View key={label} style={[styles.inputField, styles.inputFieldSmall, { backgroundColor: colors.surfaceContainerHigh }]}>
                            <LabelSmall style={{ color: colors.onSurfaceVariant }}>{label}</LabelSmall>
                            <TextInput
                                value={String([rgb.r, rgb.g, rgb.b][i])}
                                style={[styles.input, { color: colors.onSurface }]}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>
                    ))}
                </View>
            )}

            {inputMode === 'hsb' && (
                <View style={styles.inputRow}>
                    {['H', 'S', 'B'].map((label, i) => (
                        <View key={label} style={[styles.inputField, styles.inputFieldSmall, { backgroundColor: colors.surfaceContainerHigh }]}>
                            <LabelSmall style={{ color: colors.onSurfaceVariant }}>{label}</LabelSmall>
                            <TextInput
                                value={String([hsb.h, hsb.s, hsb.b][i])}
                                style={[styles.input, { color: colors.onSurface }]}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

// ============================================
// Color Presets
// ============================================

const COLOR_PALETTES = {
    material: [
        '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
        '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
        '#FFEB3B', '#FFC107', '#FF9800', '#FF5722', '#795548', '#607D8B',
    ],
    pastels: [
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E8BAFF',
        '#FFBAE8', '#BAF2FF', '#C9FFBA', '#FFECBA', '#FFBAEC', '#BAFFEC',
    ],
    dark: [
        '#1A1A1A', '#2D2D2D', '#404040', '#525252', '#656565', '#787878',
        '#1A1A2E', '#16213E', '#0F3460', '#533483', '#5C2D91', '#5B2C6F',
    ],
};

interface ColorPresetsProps {
    onColorSelect: (color: string) => void;
    recentColors?: string[];
}

const ColorPresets: React.FC<ColorPresetsProps> = ({ onColorSelect, recentColors = [] }) => {
    const colors = useColors();
    const [selectedPalette, setSelectedPalette] = useState<keyof typeof COLOR_PALETTES>('material');

    return (
        <View style={styles.presets}>
            <View style={styles.paletteSelector}>
                {(Object.keys(COLOR_PALETTES) as Array<keyof typeof COLOR_PALETTES>).map((palette) => (
                    <PremiumChip
                        key={palette}
                        label={palette.charAt(0).toUpperCase() + palette.slice(1)}
                        variant={selectedPalette === palette ? 'filled' : 'outlined'}
                        selected={selectedPalette === palette}
                        size="small"
                        onPress={() => setSelectedPalette(palette)}
                    />
                ))}
            </View>

            <View style={styles.colorGrid}>
                {COLOR_PALETTES[selectedPalette].map((color, index) => (
                    <Pressable
                        key={index}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onColorSelect(color);
                        }}
                    >
                        <View
                            style={[
                                styles.colorSwatch,
                                { backgroundColor: color },
                            ]}
                        />
                    </Pressable>
                ))}
            </View>

            {recentColors.length > 0 && (
                <>
                    <LabelSmall style={{ color: colors.onSurfaceVariant, marginTop: 16, marginBottom: 8 }}>
                        Recent
                    </LabelSmall>
                    <View style={styles.colorGrid}>
                        {recentColors.slice(0, 6).map((color, index) => (
                            <Pressable
                                key={index}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    onColorSelect(color);
                                }}
                            >
                                <View
                                    style={[
                                        styles.colorSwatch,
                                        { backgroundColor: color },
                                    ]}
                                />
                            </Pressable>
                        ))}
                    </View>
                </>
            )}
        </View>
    );
};

// ============================================
// Gradient Editor
// ============================================

interface GradientEditorProps {
    gradient: GradientConfig;
    onGradientChange: (gradient: GradientConfig) => void;
}

export const GradientEditor: React.FC<GradientEditorProps> = ({
    gradient,
    onGradientChange,
}) => {
    const colors = useColors();
    const [selectedStop, setSelectedStop] = useState(0);

    const gradientColors = gradient.stops.map(s => s.color) as [string, string, ...string[]];

    const addStop = () => {
        if (gradient.stops.length >= 5) return;
        const newStops = [...gradient.stops];
        const newPosition = 0.5;
        const newColor = gradient.stops[0]?.color || '#FFFFFF';
        newStops.push({ color: newColor, position: newPosition });
        newStops.sort((a, b) => a.position - b.position);
        onGradientChange({ ...gradient, stops: newStops });
    };

    const removeStop = (index: number) => {
        if (gradient.stops.length <= 2) return;
        const newStops = gradient.stops.filter((_, i) => i !== index);
        onGradientChange({ ...gradient, stops: newStops });
        setSelectedStop(Math.max(0, selectedStop - 1));
    };

    const updateStopColor = (color: string) => {
        const newStops = [...gradient.stops];
        newStops[selectedStop] = { ...newStops[selectedStop], color };
        onGradientChange({ ...gradient, stops: newStops });
    };

    return (
        <View style={styles.gradientEditor}>
            {/* Gradient Preview */}
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{
                    x: gradient.type === 'linear' ? Math.cos((gradient.angle * Math.PI) / 180) : 0.5,
                    y: gradient.type === 'linear' ? Math.sin((gradient.angle * Math.PI) / 180) : 0.5,
                }}
                style={styles.gradientPreview}
            />

            {/* Gradient Stops */}
            <View style={styles.stopsContainer}>
                <View style={[styles.stopsTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </View>
                {gradient.stops.map((stop, index) => (
                    <Pressable
                        key={index}
                        onPress={() => setSelectedStop(index)}
                        onLongPress={() => removeStop(index)}
                        style={[
                            styles.stopHandle,
                            {
                                left: `${stop.position * 100}%`,
                                borderColor: selectedStop === index ? colors.primary : colors.outline,
                            },
                        ]}
                    >
                        <View style={[styles.stopColor, { backgroundColor: stop.color }]} />
                    </Pressable>
                ))}
            </View>

            {/* Controls */}
            <View style={styles.gradientControls}>
                <View style={styles.controlRow}>
                    <LabelSmall style={{ color: colors.onSurfaceVariant }}>Type</LabelSmall>
                    <View style={styles.typeButtons}>
                        <PremiumChip
                            label="Linear"
                            variant={gradient.type === 'linear' ? 'filled' : 'outlined'}
                            selected={gradient.type === 'linear'}
                            size="small"
                            onPress={() => onGradientChange({ ...gradient, type: 'linear' })}
                        />
                        <PremiumChip
                            label="Radial"
                            variant={gradient.type === 'radial' ? 'filled' : 'outlined'}
                            selected={gradient.type === 'radial'}
                            size="small"
                            onPress={() => onGradientChange({ ...gradient, type: 'radial' })}
                        />
                    </View>
                </View>

                {gradient.type === 'linear' && (
                    <View style={styles.controlRow}>
                        <LabelSmall style={{ color: colors.onSurfaceVariant }}>Angle</LabelSmall>
                        <View style={styles.angleControl}>
                            <PremiumSlider
                                value={gradient.angle}
                                min={0}
                                max={360}
                                onValueChange={(angle) => onGradientChange({ ...gradient, angle })}
                            />
                            <LabelSmall style={{ color: colors.onSurface }}>{Math.round(gradient.angle)}°</LabelSmall>
                        </View>
                    </View>
                )}

                <PremiumButton
                    label="Add Stop"
                    variant="outlined"
                    size="small"
                    icon="plus"
                    onPress={addStop}
                    disabled={gradient.stops.length >= 5}
                />
            </View>
        </View>
    );
};

// ============================================
// Main Color Studio Component
// ============================================

export interface ColorStudioProps {
    color: string;
    onColorChange: (color: string) => void;
    showGradient?: boolean;
    gradient?: GradientConfig;
    onGradientChange?: (gradient: GradientConfig) => void;
}

export const ColorStudio: React.FC<ColorStudioProps> = ({
    color,
    onColorChange,
    showGradient = false,
    gradient,
    onGradientChange,
}) => {
    const colors = useColors();
    const [mode, setMode] = useState<'solid' | 'gradient'>(showGradient ? 'gradient' : 'solid');
    const [recentColors, setRecentColors] = useState<string[]>([]);

    const rgb = hexToRgb(color) || { r: 0, g: 0, b: 0 };
    const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);

    const handleColorChange = useCallback((newHsb: HSBColor) => {
        const newColor = hsbToHex(newHsb.h, newHsb.s, newHsb.b);
        onColorChange(newColor);
    }, [onColorChange]);

    const handleBrightnessChange = useCallback((brightness: number) => {
        const newColor = hsbToHex(hsb.h, hsb.s, brightness);
        onColorChange(newColor);
    }, [hsb.h, hsb.s, onColorChange]);

    const handleColorSelect = useCallback((selectedColor: string) => {
        onColorChange(selectedColor);
        setRecentColors(prev => {
            const filtered = prev.filter(c => c !== selectedColor);
            return [selectedColor, ...filtered].slice(0, 10);
        });
    }, [onColorChange]);

    const defaultGradient: GradientConfig = {
        type: 'linear',
        angle: 90,
        stops: [
            { color: colors.primary, position: 0 },
            { color: colors.secondary, position: 1 },
        ],
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Mode Toggle */}
            {showGradient && (
                <View style={styles.modeToggle}>
                    <PremiumChip
                        label="Solid"
                        variant={mode === 'solid' ? 'filled' : 'outlined'}
                        selected={mode === 'solid'}
                        onPress={() => setMode('solid')}
                    />
                    <PremiumChip
                        label="Gradient"
                        variant={mode === 'gradient' ? 'filled' : 'outlined'}
                        selected={mode === 'gradient'}
                        onPress={() => setMode('gradient')}
                    />
                </View>
            )}

            {mode === 'solid' ? (
                <>
                    {/* Color Preview */}
                    <View style={[styles.colorPreview, { backgroundColor: color }]}>
                        <View style={styles.previewOverlay}>
                            <LabelSmall style={{ color: '#FFFFFF' }}>{color}</LabelSmall>
                        </View>
                    </View>

                    {/* Color Wheel */}
                    <View style={styles.wheelContainer}>
                        <ColorWheel
                            size={SCREEN_WIDTH - 80}
                            hue={hsb.h}
                            saturation={hsb.s}
                            brightness={hsb.b}
                            onColorChange={handleColorChange}
                        />
                    </View>

                    {/* Brightness Slider */}
                    <View style={styles.sliderSection}>
                        <LabelSmall style={{ color: colors.onSurfaceVariant }}>Brightness</LabelSmall>
                        <BrightnessSlider
                            hue={hsb.h}
                            saturation={hsb.s}
                            brightness={hsb.b}
                            onBrightnessChange={handleBrightnessChange}
                        />
                    </View>

                    {/* Color Inputs */}
                    <ColorInputs color={color} onColorChange={onColorChange} />

                    {/* Presets */}
                    <View style={styles.presetsSection}>
                        <TitleSmall style={{ color: colors.onSurface, marginBottom: 12 }}>Palettes</TitleSmall>
                        <ColorPresets
                            onColorSelect={handleColorSelect}
                            recentColors={recentColors}
                        />
                    </View>
                </>
            ) : (
                <GradientEditor
                    gradient={gradient || defaultGradient}
                    onGradientChange={onGradientChange || (() => { })}
                />
            )}
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
        paddingBottom: 40,
    },
    modeToggle: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 20,
    },
    colorPreview: {
        width: '100%',
        height: 60,
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
    },
    previewOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    wheelContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    colorWheel: {
        position: 'relative',
    },
    hueRing: {
        position: 'absolute',
        overflow: 'hidden',
    },
    hueSegment: {
        position: 'absolute',
        width: '50%',
        height: 20,
        left: '50%',
        top: '50%',
        transformOrigin: 'left center',
    },
    saturationCircle: {
        position: 'absolute',
        top: 20,
        left: 20,
        overflow: 'hidden',
    },
    saturationOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'white',
        opacity: 0.5,
    },
    wheelThumb: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    wheelThumbInner: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    sliderSection: {
        marginBottom: 20,
    },
    brightnessSlider: {
        marginTop: 8,
    },
    brightnessGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 40,
        borderRadius: 8,
    },
    colorInputs: {
        marginBottom: 20,
    },
    inputModeRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    inputField: {
        flex: 1,
        borderRadius: 12,
        padding: 12,
    },
    inputFieldSmall: {
        alignItems: 'center',
    },
    input: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    presets: {
        marginTop: 8,
    },
    presetsSection: {
        marginTop: 20,
    },
    paletteSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    colorSwatch: {
        width: 40,
        height: 40,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    gradientEditor: {
        marginTop: 8,
    },
    gradientPreview: {
        width: '100%',
        height: 80,
        borderRadius: 16,
        marginBottom: 20,
    },
    stopsContainer: {
        height: 40,
        marginBottom: 20,
        position: 'relative',
    },
    stopsTrack: {
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
    },
    stopHandle: {
        position: 'absolute',
        top: 0,
        width: 24,
        height: 40,
        marginLeft: -12,
        borderWidth: 3,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    stopColor: {
        flex: 1,
        borderRadius: 4,
        margin: 2,
    },
    gradientControls: {
        gap: 16,
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    angleControl: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
        gap: 8,
    },
});

export default ColorStudio;
