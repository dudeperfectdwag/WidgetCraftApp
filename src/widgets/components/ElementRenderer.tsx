import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image } from 'react-native';
import Svg, { Path as SvgPath, Defs } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import { CanvasElement, ShadowConfig } from '../../canvas/CanvasContext';
import { useColors } from '../../theme/hooks';
import { dataProvider, parseDataBindings, startDataUpdates } from '../data/DataSources';
import { useElementAnimation } from '../../effects/useElementAnimation';
import { AnalogClock } from './AnalogClock';
import { DigitalClock } from './DigitalClock';
import { CurvedText } from './CurvedText';
import { GradientBackground } from './GradientBackground';
import { FilteredImage } from './FilteredImage';
import { RectangleShape, EllipseShape, GradientRenderer } from '../../canvas/Shapes';
import { createScriptRuntime, defaultRuntimeOptions, ScriptOutput } from '../../services/ScriptRuntime';

const resolveColorToken = (colors: Record<string, string>, colorToken?: string): string | undefined => {
    if (!colorToken) return colorToken;
    if (colorToken.startsWith('#') || colorToken.startsWith('rgb') || colorToken === 'transparent') {
        return colorToken;
    }
    return colors[colorToken] || colorToken;
};

// Helper to get shadow style
const getShadowStyle = (shadowConfig: ShadowConfig | undefined, colors: Record<string, string>) => {
    if (!shadowConfig) return {};
    return {
        shadowColor: resolveColorToken(colors, shadowConfig.color),
        shadowOffset: { width: shadowConfig.offsetX ?? 0, height: shadowConfig.offsetY ?? 4 },
        shadowOpacity: shadowConfig.opacity ?? 0.3,
        shadowRadius: shadowConfig.blur ?? 4,
        elevation: 5,
    };
};

type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';

const FONT_WEIGHTS = new Set<FontWeight>([
    'normal', 'bold',
    '100', '200', '300', '400', '500', '600', '700', '800', '900',
]);

const normalizeFontWeight = (weight?: string): FontWeight => {
    if (weight && FONT_WEIGHTS.has(weight as FontWeight)) {
        return weight as FontWeight;
    }
    return 'normal';
};

const normalizeCornerRadius = (
    value?: number | number[]
): number | [number, number, number, number] | undefined => {
    if (!Array.isArray(value)) return value;
    if (value.length === 4) return [value[0], value[1], value[2], value[3]];
    return value.length > 0 ? value[0] : undefined;
};

interface ScriptWidgetElementProps {
    element: CanvasElement;
    colors: ReturnType<typeof useColors>;
}

const ScriptWidgetElement: React.FC<ScriptWidgetElementProps> = ({ element, colors }) => {
    const { transform } = element;
    const [output, setOutput] = useState<ScriptOutput | undefined>();
    const [error, setError] = useState<string | undefined>();
    const runtime = useMemo(() => createScriptRuntime(), []);

    useEffect(() => {
        startDataUpdates();
        const run = () => {
            const result = runtime.run(
                element.script || '',
                {
                    now: Date.now(),
                    get: (key: any) => dataProvider.getValue(key),
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
        const interval = setInterval(run, (element.scriptRefreshSec ?? 5) * 1000);
        return () => clearInterval(interval);
    }, [element.script, element.scriptRefreshSec, runtime]);

    return (
        <View
            style={{
                width: transform.width,
                height: transform.height,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
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
                <View
                    style={{
                        width: transform.width * 0.5,
                        height: transform.height * 0.5,
                        backgroundColor: colors.primary,
                        borderRadius: output.shape === 'circle' ? 999 : 8,
                    }}
                />
            ) : null}
        </View>
    );
};

interface ElementRendererProps {
    element: CanvasElement;
    /**
     * If true, the renderer will properly position the element using absolute positioning
     * based on element.transform.x/y.
     * If false, it renders at 0,0 (useful if wrapped in an already positioned view).
     * @default true
     */
    absolutePositioning?: boolean;
}

export const ElementRenderer: React.FC<ElementRendererProps> = ({ 
    element, 
    absolutePositioning = true 
}) => {
    const colors = useColors();
    const colorMap = colors as unknown as Record<string, string>;
    const effectStyle = useElementAnimation(element.animation);

    if (!element.visible) return null;

    const renderContent = () => {
        const { transform, style, textStyle, content, imageUri } = element;

        switch (element.type) {
            case 'text':
                return (
                    <View
                        style={{
                            width: transform.width,
                            height: transform.height,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 4,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: textStyle?.fontSize || 24,
                                fontFamily: textStyle?.fontFamily || 'System',
                                fontWeight: normalizeFontWeight(textStyle?.fontWeight),
                                color: textStyle?.color || colors.onSurface,
                                textAlign: textStyle?.textAlign || 'center',
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

            case 'image':
                if (element.imageFilterConfig && element.imageFilterConfig.filter !== 'none') {
                    return (
                        <View style={{
                            width: transform.width,
                            height: transform.height,
                            ...getShadowStyle(style.shadow, colorMap)
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
                            ...getShadowStyle(style.shadow, colorMap),
                        }}
                        resizeMode="cover"
                    />
                );

            case 'path':
            case 'line':
                if (element.path) {
                    const gradientId = `path-grad-${element.id}`;
                    return (
                        <Svg
                            width={transform.width}
                            height={transform.height}
                            viewBox="0 0 1 1"
                            preserveAspectRatio="none"
                            style={{ 
                                opacity: style.opacity ?? 1,
                                ...getShadowStyle(style.shadow, colorMap)
                            }}
                        >
                            {element.gradientConfig && (
                                <Defs>
                                    <GradientRenderer id={gradientId} gradient={element.gradientConfig} />
                                </Defs>
                            )}
                            <SvgPath
                                d={element.path}
                                fill={element.gradientConfig ? `url(#${gradientId})` : (style.fill || colors.primary)}
                                stroke={style.stroke}
                                strokeWidth={style.strokeWidth ? style.strokeWidth / Math.max(transform.width, transform.height) : 0}
                            />
                        </Svg>
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
                            ...getShadowStyle(style.shadow, colorMap),
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
                            fontWeight={normalizeFontWeight(textStyle?.fontWeight)}
                            textAlign={textStyle?.textAlign}
                        />
                    </View>
                );
            }

            case 'scriptWidget':
                return <ScriptWidgetElement element={element} colors={colors} />;

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
                        fontWeight={normalizeFontWeight(textStyle?.fontWeight)}
                        fill={textStyle?.color || '#FFFFFF'}
                        letterSpacing={textStyle?.letterSpacing}
                        textAnchor="middle"
                    />
                );
            }

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

            case 'rectangle': {
                return (
                    <RectangleShape
                        width={transform.width}
                        height={transform.height}
                        fill={style.fill || colors.primary}
                        gradient={element.gradientConfig}
                        opacity={style.opacity ?? 1}
                        cornerRadius={normalizeCornerRadius(style.cornerRadius) ?? 12}
                        shadow={style.shadow}
                    />
                );
            }
            case 'ellipse': {
                return (
                    <EllipseShape
                        width={transform.width}
                        height={transform.height}
                        fill={style.fill || colors.secondary}
                        gradient={element.gradientConfig}
                        opacity={style.opacity ?? 1}
                        shadow={style.shadow}
                    />
                );
            }
            default:
                return (
                    <View
                        style={{
                            width: transform.width,
                            height: transform.height,
                            backgroundColor: style.fill || colors.primary,
                            borderRadius: (style.cornerRadius as number) || 12,
                            opacity: style.opacity ?? 1,
                            ...getShadowStyle(style.shadow, colorMap),
                        }}
                    />
                );
        }
    };

    const containerStyle = absolutePositioning ? {
        position: 'absolute' as const,
        left: element.transform.x,
        top: element.transform.y,
        width: element.transform.width,
        height: element.transform.height,
    } : {
        width: element.transform.width,
        height: element.transform.height,
    };

    return (
        <Animated.View style={containerStyle}>
             <Animated.View style={[{ width: '100%', height: '100%' }, effectStyle]}>
                {renderContent()}
            </Animated.View>
        </Animated.View>
    );
};
