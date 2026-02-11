/**
 * WidgetCraft - Widget Renderer
 * Renders a widget template with components and data bindings
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text as RNText } from 'react-native';
import { useColors } from '@theme/index';
import { dataProvider, startDataUpdates, useParsedText } from '../data';
import {
    WidgetTemplate,
    WidgetComponent,
    TextComponent,
    ShapeComponent,
    IconComponent,
    ProgressComponent,
    AnalogClockComponent,
    DigitalClockComponent,
    CurvedTextComponent,
    ScriptWidgetComponent,
    DataBindingKey,
    WIDGET_SIZES,
} from '../types';
import { createScriptRuntime, defaultRuntimeOptions, ScriptOutput } from '../../services/ScriptRuntime';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Rect, Path, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    useSharedValue,
} from 'react-native-reanimated';
import { AnalogClock } from './AnalogClock';
import { DigitalClock } from './DigitalClock';
import { CurvedText } from './CurvedText';

// ============================================
// Color Token Resolution
// ============================================

const useResolvedColor = (colorToken: string): string => {
    const colors = useColors();

    // If it's a color token (starts with lowercase), resolve it
    if (colorToken && !colorToken.startsWith('#') && !colorToken.startsWith('rgb')) {
        // Access color from MaterialYouScheme by key
        const colorValue = (colors as unknown as Record<string, string>)[colorToken];
        return colorValue || colorToken;
    }

    return colorToken;
};

// ============================================
// Text Component Renderer
// ============================================

interface TextRendererProps {
    component: TextComponent;
}

const TextRenderer: React.FC<TextRendererProps> = ({ component }) => {
    const colors = useColors();
    const resolvedColor = useResolvedColor(component.color);
    const parsedContent = useParsedText(component.content);

    const fontWeightMap: Record<string, '400' | '500' | '600' | '700'> = {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    };

    return (
        <View
            style={[
                styles.absolute,
                {
                    left: component.x,
                    top: component.y,
                    width: component.width,
                    height: component.height,
                    opacity: component.opacity ?? 1,
                    transform: [{ rotate: `${component.rotation || 0}deg` }],
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 2,
                    paddingVertical: 0,
                },
            ]}
        >
            <Animated.Text
                style={{
                    fontSize: component.fontSize,
                    fontFamily: component.fontFamily || 'System',
                    fontWeight: fontWeightMap[component.fontWeight] || '400',
                    color: resolvedColor,
                    textAlign: component.textAlign || 'center',
                    letterSpacing: component.letterSpacing,
                    lineHeight: component.lineHeight ?? Math.round(component.fontSize * 1.2),
                    textAlignVertical: 'center',
                    includeFontPadding: true,
                }}
                numberOfLines={3}
            >
                {parsedContent}
            </Animated.Text>
        </View>
    );
};

// ============================================
// Shape Component Renderer
// ============================================

interface ShapeRendererProps {
    component: ShapeComponent;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({ component }) => {
    const colors = useColors();
    const resolvedFill = useResolvedColor(component.fill);
    const resolvedStroke = useResolvedColor(component.stroke || 'transparent');

    const resolveColorToken = (colorToken: string): string => {
        if (colorToken.startsWith('#') || colorToken.startsWith('rgb') || colorToken === 'transparent') {
            return colorToken;
        }
        const colorValue = (colors as unknown as Record<string, string>)[colorToken];
        return colorValue || colorToken;
    };

    const getSquirclePath = (w: number, h: number, r: number): string => {
        const k = 0.552284749831; // Bezier approximation for squircle
        r = Math.min(r, w / 2, h / 2);

        return `
            M ${r} 0
            L ${w - r} 0
            C ${w - r + r * k} 0 ${w} ${r - r * k} ${w} ${r}
            L ${w} ${h - r}
            C ${w} ${h - r + r * k} ${w - r + r * k} ${h} ${w - r} ${h}
            L ${r} ${h}
            C ${r - r * k} ${h} 0 ${h - r + r * k} 0 ${h - r}
            L 0 ${r}
            C 0 ${r - r * k} ${r - r * k} 0 ${r} 0
            Z
        `;
    };

    // Render SVG gradient defs if a gradient config exists
    const renderGradientDefs = (gradientId: string) => {
        const gradient = component.gradient;
        if (!gradient) return null;
        const resolvedGradientColors = gradient.colors.map(resolveColorToken);
        const stops = gradient.stops ?? resolvedGradientColors.map((_: string, i: number, arr: string[]) => i / (arr.length - 1));
        if (gradient.type === 'radial') {
            return (
                <Defs>
                    <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                        {resolvedGradientColors.map((c: string, i: number) => (
                            <Stop key={i} offset={stops[i]} stopColor={c} />
                        ))}
                    </RadialGradient>
                </Defs>
            );
        }
        const angle = (gradient.angle ?? 0) * (Math.PI / 180);
        const x1 = 50 - 50 * Math.sin(angle);
        const y1 = 50 + 50 * Math.cos(angle);
        const x2 = 50 + 50 * Math.sin(angle);
        const y2 = 50 - 50 * Math.cos(angle);
        return (
            <Defs>
                <LinearGradient id={gradientId} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
                    {resolvedGradientColors.map((c: string, i: number) => (
                        <Stop key={i} offset={stops[i]} stopColor={c} />
                    ))}
                </LinearGradient>
            </Defs>
        );
    };

    const hasGradient = !!component.gradient;
    const gradientId = `grad-${component.id}`;
    const fillValue = hasGradient ? `url(#${gradientId})` : resolvedFill;

    const renderShape = () => {
        const { width, height, shapeType, cornerRadius = 0, fillOpacity = 1 } = component;
        const opacity = (component.opacity ?? 1) * fillOpacity;

        switch (shapeType) {
            case 'circle':
                return (
                    <Svg width={width} height={height}>
                        {renderGradientDefs(gradientId)}
                        <Circle
                            cx={width / 2}
                            cy={height / 2}
                            r={Math.min(width, height) / 2}
                            fill={fillValue}
                            opacity={opacity}
                            stroke={resolvedStroke}
                            strokeWidth={component.strokeWidth || 0}
                        />
                    </Svg>
                );

            case 'pill':
                const pillRadius = Math.min(width, height) / 2;
                return (
                    <Svg width={width} height={height}>
                        {renderGradientDefs(gradientId)}
                        <Rect
                            x={0}
                            y={0}
                            width={width}
                            height={height}
                            rx={pillRadius}
                            ry={pillRadius}
                            fill={fillValue}
                            opacity={opacity}
                        />
                    </Svg>
                );

            case 'squircle':
                return (
                    <Svg width={width} height={height}>
                        {renderGradientDefs(gradientId)}
                        <Path
                            d={getSquirclePath(width, height, cornerRadius || 16)}
                            fill={fillValue}
                            opacity={opacity}
                        />
                    </Svg>
                );

            case 'rectangle':
            default:
                return (
                    <View
                        style={{
                            width,
                            height,
                            backgroundColor: resolvedFill,
                            borderRadius: cornerRadius,
                            opacity,
                        }}
                    />
                );
        }
    };

    return (
        <View
            style={[
                styles.absolute,
                {
                    left: component.x,
                    top: component.y,
                    transform: [{ rotate: `${component.rotation || 0}deg` }],
                },
            ]}
        >
            {renderShape()}
        </View>
    );
};

// ============================================
// Icon Component Renderer
// ============================================

interface IconRendererProps {
    component: IconComponent;
}

const IconRenderer: React.FC<IconRendererProps> = ({ component }) => {
    const resolvedColor = useResolvedColor(component.color);

    return (
        <View
            style={[
                styles.absolute,
                {
                    left: component.x,
                    top: component.y,
                    opacity: component.opacity ?? 1,
                },
            ]}
        >
            <MaterialCommunityIcons
                name={component.name as any}
                size={component.size}
                color={resolvedColor}
            />
        </View>
    );
};

// ============================================
// Progress Component Renderer
// ============================================

interface ProgressRendererProps {
    component: ProgressComponent;
}

const ProgressRenderer: React.FC<ProgressRendererProps> = ({ component }) => {
    const resolvedColor = useResolvedColor(component.color);
    const resolvedBg = useResolvedColor(component.backgroundColor || 'surfaceVariant');

    // For data-bound values
    const value = typeof component.value === 'number' ? component.value : 75;
    const maxValue = component.maxValue || 100;
    const progress = value / maxValue;

    const { width, height, progressType, strokeWidth = 8 } = component;

    switch (progressType) {
        case 'circle':
            const radius = (Math.min(width, height) - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference * (1 - progress);

            return (
                <View
                    style={[
                        styles.absolute,
                        { left: component.x, top: component.y, opacity: component.opacity ?? 1 },
                    ]}
                >
                    <Svg width={width} height={height}>
                        {/* Background circle */}
                        <Circle
                            cx={width / 2}
                            cy={height / 2}
                            r={radius}
                            stroke={resolvedBg}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            opacity={0.3}
                        />
                        {/* Progress circle */}
                        <Circle
                            cx={width / 2}
                            cy={height / 2}
                            r={radius}
                            stroke={resolvedColor}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${width / 2} ${height / 2})`}
                        />
                    </Svg>
                </View>
            );

        case 'bar':
            const barWidth = width * progress;
            return (
                <View
                    style={[
                        styles.absolute,
                        { left: component.x, top: component.y, opacity: component.opacity ?? 1 },
                    ]}
                >
                    <View
                        style={{
                            width,
                            height,
                            backgroundColor: resolvedBg,
                            borderRadius: height / 2,
                            overflow: 'hidden',
                            opacity: 0.3,
                        }}
                    />
                    <View
                        style={{
                            position: 'absolute',
                            width: barWidth,
                            height,
                            backgroundColor: resolvedColor,
                            borderRadius: height / 2,
                        }}
                    />
                </View>
            );

        default:
            return null;
    }
};

// ============================================
// Analog Clock Component Renderer
// ============================================

interface AnalogClockRendererProps {
    component: AnalogClockComponent;
}

const AnalogClockRenderer: React.FC<AnalogClockRendererProps> = ({ component }) => {
    const clockSize = Math.min(component.width, component.height);
    const resolvedFaceColor = useResolvedColor(component.faceColor || 'surface');
    const resolvedHourColor = useResolvedColor(component.hourHandColor || 'onSurface');
    const resolvedMinuteColor = useResolvedColor(component.minuteHandColor || 'onSurface');
    const resolvedSecondColor = useResolvedColor(component.secondHandColor || 'primary');
    const resolvedTickColor = useResolvedColor(component.tickColor || 'onSurface');
    const resolvedNumberColor = useResolvedColor(component.numberColor || 'onSurface');

    return (
        <View
            style={[
                styles.absolute,
                {
                    left: component.x,
                    top: component.y,
                    width: component.width,
                    height: component.height,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: component.opacity ?? 1,
                },
            ]}
        >
            <AnalogClock
                size={clockSize}
                faceStyle={component.faceStyle || 'modern'}
                handStyle={component.handStyle || 'modern'}
                showSeconds={component.showSeconds !== false}
                showNumbers={component.showNumbers !== false}
                showTicks={component.showTicks !== false}
                smoothSeconds={component.smoothSeconds}
                faceColor={resolvedFaceColor}
                hourHandColor={resolvedHourColor}
                minuteHandColor={resolvedMinuteColor}
                secondHandColor={resolvedSecondColor}
                tickColor={resolvedTickColor}
                numberColor={resolvedNumberColor}
            />
        </View>
    );
};

// ============================================
// Digital Clock Component Renderer
// ============================================

interface DigitalClockRendererProps {
    component: DigitalClockComponent;
}

const DigitalClockRenderer: React.FC<DigitalClockRendererProps> = ({ component }) => {
    const resolvedColor = useResolvedColor(component.color);

    return (
        <View
            style={[
                styles.absolute,
                {
                    left: component.x,
                    top: component.y,
                    width: component.width,
                    height: component.height,
                    justifyContent: 'center',
                    alignItems: 'center',
                    opacity: component.opacity ?? 1,
                },
            ]}
        >
            <DigitalClock
                width={component.width}
                height={component.height}
                format={component.format || '24h'}
                showSeconds={component.showSeconds ?? false}
                showAmPm={component.showAmPm ?? false}
                textColor={resolvedColor}
                fontFamily={component.fontFamily}
                fontSize={component.fontSize}
                fontWeight={component.fontWeight as any}
            />
        </View>
    );
};

// ============================================
// Curved Text Component Renderer
// ============================================

interface CurvedTextRendererProps {
    component: CurvedTextComponent;
}

const CurvedTextRenderer: React.FC<CurvedTextRendererProps> = ({ component }) => {
    const resolvedColor = useResolvedColor(component.color);
    const parsedContent = useParsedText(component.content);

    return (
        <View
            style={[
                styles.absolute,
                {
                    left: component.x,
                    top: component.y,
                    width: component.width,
                    height: component.height,
                    opacity: component.opacity ?? 1,
                    transform: [{ rotate: `${component.rotation || 0}deg` }],
                },
            ]}
        >
            <CurvedText
                text={parsedContent}
                width={component.width}
                height={component.height}
                curveType={component.curveType || 'arc'}
                curveAmount={component.curveAmount ?? 50}
                startOffset={component.startOffset ?? 0}
                fontSize={component.fontSize}
                fontFamily={component.fontFamily}
                fontWeight={component.fontWeight as any}
                fill={resolvedColor}
                letterSpacing={component.letterSpacing}
                textAnchor="middle"
            />
        </View>
    );
};

// ============================================
// Script Widget Renderer
// ============================================

interface ScriptWidgetRendererProps {
    component: ScriptWidgetComponent;
}

const ScriptWidgetRenderer: React.FC<ScriptWidgetRendererProps> = ({ component }) => {
    const colors = useColors();
    const [output, setOutput] = useState<ScriptOutput | undefined>();
    const [error, setError] = useState<string | undefined>();
    const runtime = useMemo(() => createScriptRuntime(), []);

    useEffect(() => {
        startDataUpdates();
        const run = () => {
            const result = runtime.run(
                component.script,
                {
                    now: Date.now(),
                    get: (key: DataBindingKey) => dataProvider.getValue(key),
                },
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
        const interval = setInterval(run, (component.refreshIntervalSec ?? 5) * 1000);
        return () => clearInterval(interval);
    }, [component.script, component.refreshIntervalSec, runtime]);

    const renderOutput = () => {
        if (!output) return null;
        switch (output.type) {
            case 'text':
                return <RNText style={{ color: colors.onSurface }}>{output.value}</RNText>;
            case 'list':
                return (
                    <View>
                        {output.items.map((item, index) => (
                            <RNText key={index} style={{ color: colors.onSurface }}>
                                {item.value}
                            </RNText>
                        ))}
                    </View>
                );
            case 'shape':
                return (
                    <View
                        style={{
                            width: component.width * 0.5,
                            height: component.height * 0.5,
                            backgroundColor: colors.primary,
                            borderRadius: output.shape === 'circle' ? 999 : 8,
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <View
            style={{
                position: 'absolute',
                left: component.x,
                top: component.y,
                width: component.width,
                height: component.height,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            {error ? (
                <RNText style={{ color: colors.error, fontSize: 12 }}>{error}</RNText>
            ) : renderOutput()}
        </View>
    );
};

// ============================================
// Component Dispatcher
// ============================================

interface ComponentRendererProps {
    component: WidgetComponent;
}

const ComponentRenderer: React.FC<ComponentRendererProps> = ({ component }) => {
    if (component.visible === false) return null;

    switch (component.type) {
        case 'text':
            return <TextRenderer component={component as TextComponent} />;
        case 'shape':
            return <ShapeRenderer component={component as ShapeComponent} />;
        case 'icon':
            return <IconRenderer component={component as IconComponent} />;
        case 'progress':
            return <ProgressRenderer component={component as ProgressComponent} />;
        case 'analogClock':
            return <AnalogClockRenderer component={component as AnalogClockComponent} />;
        case 'digitalClock':
            return <DigitalClockRenderer component={component as DigitalClockComponent} />;
        case 'curvedText':
            return <CurvedTextRenderer component={component as CurvedTextComponent} />;
        case 'scriptWidget':
            return <ScriptWidgetRenderer component={component as ScriptWidgetComponent} />;
        default:
            return null;
    }
};

// ============================================
// Main Widget Renderer
// ============================================

interface WidgetRendererProps {
    template: WidgetTemplate;
    scale?: number;
    style?: object;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
    template,
    scale = 1,
    style,
}) => {
    const colors = useColors();
    const sizeConfig = WIDGET_SIZES[template.size];
    const { width, height } = sizeConfig;

    const resolvedBg = useResolvedColor(template.backgroundColor);

    return (
        <View
            style={[
                styles.widgetContainer,
                {
                    width: width * scale,
                    height: height * scale,
                    backgroundColor: resolvedBg,
                },
                style,
            ]}
        >
            <View style={{ width, height, transform: [{ scale }], transformOrigin: 'top left' }}>
                {template.componentOrder.map((id) => {
                    const component = template.components[id];
                    if (!component) return null;
                    return <ComponentRenderer key={id} component={component} />;
                })}
            </View>
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    widgetContainer: {
        overflow: 'hidden',
        transformOrigin: 'top left',
    },
    absolute: {
        position: 'absolute',
    },
});

export default WidgetRenderer;
