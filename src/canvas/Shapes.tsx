/**
 * WidgetCraft - Shape Components
 * SVG-based shape primitives with:
 * - Rectangle, ellipse, polygon, star, line, path
 * - MD3 corner system (rounded and cut corners)
 * - Asymmetric corners support
 * - Gradient fills and stroke effects
 * - Shadow and glow effects
 * - Morphing animations
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, {
    Rect,
    Circle,
    Ellipse,
    Polygon,
    Line,
    Path,
    Defs,
    LinearGradient as SvgLinearGradient,
    RadialGradient,
    Stop,
    G,
    ClipPath,
} from 'react-native-svg';
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useColors } from '@theme/index';
import { generateCornerPath, CornerConfig, CornerFamily } from './MD3Shapes';

// Create animated SVG components
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// ============================================
// Types
// ============================================

export interface GradientDef {
    type: 'linear' | 'radial';
    colors: string[];
    stops?: number[];
    angle?: number; // For linear gradient (degrees)
}

export interface ShadowDef {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread?: number;
}

export interface BaseShapeProps {
    width: number;
    height: number;
    fill?: string;
    gradient?: GradientDef;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    shadow?: ShadowDef;
    rotation?: number;
    style?: StyleProp<ViewStyle>;
}

// ============================================
// Gradient Helper
// ============================================

export interface GradientRendererProps {
    id: string;
    gradient: GradientDef;
}

export const GradientRenderer: React.FC<GradientRendererProps> = ({ id, gradient }) => {
    const stops = gradient.stops || gradient.colors.map((_, i) => i / (gradient.colors.length - 1));

    if (gradient.type === 'radial') {
        return (
            <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
                {gradient.colors.map((color, i) => (
                    <Stop key={i} offset={`${stops[i] * 100}%`} stopColor={color} />
                ))}
            </RadialGradient>
        );
    }

    // Linear gradient - calculate x1, y1, x2, y2 from angle
    const angle = gradient.angle || 0;
    const angleRad = (angle * Math.PI) / 180;
    const x1 = 50 - Math.cos(angleRad) * 50;
    const y1 = 50 - Math.sin(angleRad) * 50;
    const x2 = 50 + Math.cos(angleRad) * 50;
    const y2 = 50 + Math.sin(angleRad) * 50;

    return (
        <SvgLinearGradient id={id} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
            {gradient.colors.map((color, i) => (
                <Stop key={i} offset={`${stops[i] * 100}%`} stopColor={color} />
            ))}
        </SvgLinearGradient>
    );
};

// ============================================
// Shape: Rectangle
// ============================================

export interface RectangleShapeProps extends BaseShapeProps {
    cornerRadius?: number | [number, number, number, number];
}

export const RectangleShape: React.FC<RectangleShapeProps> = ({
    width,
    height,
    fill = '#000000',
    gradient,
    stroke,
    strokeWidth = 0,
    opacity = 1,
    cornerRadius = 0,
    shadow,
    rotation = 0,
    style,
}) => {
    const gradientId = useMemo(() => `rect-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
    const rx = Array.isArray(cornerRadius) ? cornerRadius[0] : cornerRadius;

    const fillValue = gradient ? `url(#${gradientId})` : fill;

    return (
        <View style={[styles.shapeContainer, { width, height }, style]}>
            {shadow && (
                <View
                    style={[
                        styles.shadowLayer,
                        {
                            backgroundColor: shadow.color,
                            borderRadius: rx,
                            transform: [
                                { translateX: shadow.offsetX },
                                { translateY: shadow.offsetY },
                            ],
                            opacity: 0.3,
                        },
                    ]}
                />
            )}
            <Svg
                width={width}
                height={height}
                style={{ transform: [{ rotate: `${rotation}deg` }] }}
            >
                {gradient && (
                    <Defs>
                        <GradientRenderer id={gradientId} gradient={gradient} />
                    </Defs>
                )}
                <Rect
                    x={strokeWidth / 2}
                    y={strokeWidth / 2}
                    width={width - strokeWidth}
                    height={height - strokeWidth}
                    rx={rx}
                    fill={fillValue}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                />
            </Svg>
        </View>
    );
};

// ============================================
// Shape: MD3 Rectangle (with asymmetric/cut corners)
// ============================================

export interface MD3RectangleShapeProps extends BaseShapeProps {
    cornerFamily?: CornerFamily;
    cornerTopLeft?: number;
    cornerTopRight?: number;
    cornerBottomRight?: number;
    cornerBottomLeft?: number;
}

export const MD3RectangleShape: React.FC<MD3RectangleShapeProps> = ({
    width,
    height,
    fill = '#000000',
    gradient,
    stroke,
    strokeWidth = 0,
    opacity = 1,
    cornerFamily = 'rounded',
    cornerTopLeft = 0,
    cornerTopRight = 0,
    cornerBottomRight = 0,
    cornerBottomLeft = 0,
    shadow,
    rotation = 0,
    style,
}) => {
    const gradientId = useMemo(() => `md3rect-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
    const fillValue = gradient ? `url(#${gradientId})` : fill;

    // Check if all corners are the same and rounded - use simple Rect
    const allSame = cornerTopLeft === cornerTopRight && 
                    cornerTopRight === cornerBottomRight && 
                    cornerBottomRight === cornerBottomLeft;
    const useSimpleRect = allSame && cornerFamily === 'rounded';

    // Generate the corner path for asymmetric/cut corners
    const pathData = useMemo(() => {
        if (useSimpleRect) return '';
        const innerWidth = width - strokeWidth;
        const innerHeight = height - strokeWidth;
        const cornerConfig: CornerConfig = {
            family: cornerFamily,
            topLeft: cornerTopLeft,
            topRight: cornerTopRight,
            bottomRight: cornerBottomRight,
            bottomLeft: cornerBottomLeft,
        };
        return generateCornerPath(innerWidth, innerHeight, cornerConfig);
    }, [width, height, strokeWidth, cornerFamily, cornerTopLeft, cornerTopRight, cornerBottomRight, cornerBottomLeft, useSimpleRect]);

    return (
        <View style={[styles.shapeContainer, { width, height }, style]}>
            {shadow && (
                <View
                    style={[
                        styles.shadowLayer,
                        {
                            backgroundColor: shadow.color,
                            borderRadius: Math.max(cornerTopLeft, cornerTopRight, cornerBottomRight, cornerBottomLeft),
                            transform: [
                                { translateX: shadow.offsetX },
                                { translateY: shadow.offsetY },
                            ],
                            opacity: 0.3,
                        },
                    ]}
                />
            )}
            <Svg
                width={width}
                height={height}
                style={{ transform: [{ rotate: `${rotation}deg` }] }}
            >
                {gradient && (
                    <Defs>
                        <GradientRenderer id={gradientId} gradient={gradient} />
                    </Defs>
                )}
                {useSimpleRect ? (
                    <Rect
                        x={strokeWidth / 2}
                        y={strokeWidth / 2}
                        width={width - strokeWidth}
                        height={height - strokeWidth}
                        rx={cornerTopLeft}
                        fill={fillValue}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        opacity={opacity}
                    />
                ) : (
                    <G transform={`translate(${strokeWidth / 2}, ${strokeWidth / 2})`}>
                        <Path
                            d={pathData}
                            fill={fillValue}
                            stroke={stroke}
                            strokeWidth={strokeWidth}
                            opacity={opacity}
                        />
                    </G>
                )}
            </Svg>
        </View>
    );
};

// ============================================
// Shape: Ellipse / Circle
// ============================================

export interface EllipseShapeProps extends BaseShapeProps {
    // Ellipse uses width/height for rx/ry
}

export const EllipseShape: React.FC<EllipseShapeProps> = ({
    width,
    height,
    fill = '#000000',
    gradient,
    stroke,
    strokeWidth = 0,
    opacity = 1,
    shadow,
    rotation = 0,
    style,
}) => {
    const gradientId = useMemo(() => `ellipse-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
    const rx = (width - strokeWidth) / 2;
    const ry = (height - strokeWidth) / 2;
    const cx = width / 2;
    const cy = height / 2;

    const fillValue = gradient ? `url(#${gradientId})` : fill;

    return (
        <View style={[styles.shapeContainer, { width, height }, style]}>
            {shadow && (
                <View
                    style={[
                        styles.shadowLayer,
                        {
                            backgroundColor: shadow.color,
                            borderRadius: width / 2,
                            transform: [
                                { translateX: shadow.offsetX },
                                { translateY: shadow.offsetY },
                            ],
                            opacity: 0.3,
                        },
                    ]}
                />
            )}
            <Svg
                width={width}
                height={height}
                style={{ transform: [{ rotate: `${rotation}deg` }] }}
            >
                {gradient && (
                    <Defs>
                        <GradientRenderer id={gradientId} gradient={gradient} />
                    </Defs>
                )}
                <Ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx}
                    ry={ry}
                    fill={fillValue}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                />
            </Svg>
        </View>
    );
};

// ============================================
// Shape: Polygon (Regular)
// ============================================

export interface PolygonShapeProps extends BaseShapeProps {
    sides: number;
}

export const PolygonShape: React.FC<PolygonShapeProps> = ({
    width,
    height,
    sides,
    fill = '#000000',
    gradient,
    stroke,
    strokeWidth = 0,
    opacity = 1,
    shadow,
    rotation = 0,
    style,
}) => {
    const gradientId = useMemo(() => `polygon-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
    const fillValue = gradient ? `url(#${gradientId})` : fill;

    // Generate polygon points
    const points = useMemo(() => {
        const cx = width / 2;
        const cy = height / 2;
        const r = Math.min(cx, cy) - strokeWidth;
        const angleOffset = -Math.PI / 2; // Start from top

        return Array.from({ length: sides }, (_, i) => {
            const angle = angleOffset + (2 * Math.PI * i) / sides;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
    }, [width, height, sides, strokeWidth]);

    return (
        <View style={[styles.shapeContainer, { width, height }, style]}>
            <Svg
                width={width}
                height={height}
                style={{ transform: [{ rotate: `${rotation}deg` }] }}
            >
                {gradient && (
                    <Defs>
                        <GradientRenderer id={gradientId} gradient={gradient} />
                    </Defs>
                )}
                <Polygon
                    points={points}
                    fill={fillValue}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                />
            </Svg>
        </View>
    );
};

// ============================================
// Shape: Star
// ============================================

export interface StarShapeProps extends BaseShapeProps {
    points: number;
    innerRadius?: number; // As percentage of outer radius (0-1)
}

export const StarShape: React.FC<StarShapeProps> = ({
    width,
    height,
    points,
    innerRadius = 0.4,
    fill = '#000000',
    gradient,
    stroke,
    strokeWidth = 0,
    opacity = 1,
    shadow,
    rotation = 0,
    style,
}) => {
    const gradientId = useMemo(() => `star-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
    const fillValue = gradient ? `url(#${gradientId})` : fill;

    // Generate star path
    const path = useMemo(() => {
        const cx = width / 2;
        const cy = height / 2;
        const outerR = Math.min(cx, cy) - strokeWidth;
        const innerR = outerR * innerRadius;
        const angleOffset = -Math.PI / 2;

        let d = '';
        for (let i = 0; i < points * 2; i++) {
            const angle = angleOffset + (Math.PI * i) / points;
            const r = i % 2 === 0 ? outerR : innerR;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            d += (i === 0 ? 'M' : 'L') + `${x},${y}`;
        }
        d += 'Z';
        return d;
    }, [width, height, points, innerRadius, strokeWidth]);

    return (
        <View style={[styles.shapeContainer, { width, height }, style]}>
            <Svg
                width={width}
                height={height}
                style={{ transform: [{ rotate: `${rotation}deg` }] }}
            >
                {gradient && (
                    <Defs>
                        <GradientRenderer id={gradientId} gradient={gradient} />
                    </Defs>
                )}
                <Path
                    d={path}
                    fill={fillValue}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                />
            </Svg>
        </View>
    );
};

// ============================================
// Shape: Line
// ============================================

export interface LineShapeProps {
    width: number;
    height: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
    opacity?: number;
    style?: StyleProp<ViewStyle>;
}

export const LineShape: React.FC<LineShapeProps> = ({
    width,
    height,
    x1 = 0,
    y1 = 0,
    x2 = width,
    y2 = height,
    stroke = '#000000',
    strokeWidth = 2,
    strokeDasharray,
    opacity = 1,
    style,
}) => {
    return (
        <View style={[styles.shapeContainer, { width, height }, style]}>
            <Svg width={width} height={height}>
                <Line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    opacity={opacity}
                />
            </Svg>
        </View>
    );
};

// ============================================
// Shape: Custom Path
// ============================================

export interface PathShapeProps extends BaseShapeProps {
    d: string; // SVG path data
}

export const PathShape: React.FC<PathShapeProps> = ({
    width,
    height,
    d,
    fill = '#000000',
    gradient,
    stroke,
    strokeWidth = 0,
    opacity = 1,
    rotation = 0,
    style,
}) => {
    const gradientId = useMemo(() => `path-gradient-${Math.random().toString(36).substr(2, 9)}`, []);
    const fillValue = gradient ? `url(#${gradientId})` : fill;

    return (
        <View style={[styles.shapeContainer, { width, height }, style]}>
            <Svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                style={{ transform: [{ rotate: `${rotation}deg` }] }}
            >
                {gradient && (
                    <Defs>
                        <GradientRenderer id={gradientId} gradient={gradient} />
                    </Defs>
                )}
                <Path
                    d={d}
                    fill={fillValue}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    opacity={opacity}
                />
            </Svg>
        </View>
    );
};

// ============================================
// Shape Presets
// ============================================

export const SHAPE_PRESETS = {
    // Heart path
    heart: (w: number, h: number) => `M${w / 2},${h * 0.85} C${w * 0.15},${h * 0.5} ${w * 0.15},${h * 0.15} ${w / 2},${h * 0.35} C${w * 0.85},${h * 0.15} ${w * 0.85},${h * 0.5} ${w / 2},${h * 0.85}Z`,

    // Arrow right
    arrowRight: (w: number, h: number) => `M0,${h * 0.3} L${w * 0.65},${h * 0.3} L${w * 0.65},0 L${w},${h / 2} L${w * 0.65},${h} L${w * 0.65},${h * 0.7} L0,${h * 0.7}Z`,

    // Cloud
    cloud: (w: number, h: number) => `M${w * 0.25},${h * 0.7} A${w * 0.15},${h * 0.2} 0 1,1 ${w * 0.35},${h * 0.35} A${w * 0.2},${h * 0.25} 0 1,1 ${w * 0.65},${h * 0.35} A${w * 0.15},${h * 0.2} 0 1,1 ${w * 0.8},${h * 0.6} A${w * 0.1},${h * 0.15} 0 1,1 ${w * 0.75},${h * 0.7}Z`,

    // Speech bubble
    speechBubble: (w: number, h: number) => `M${w * 0.1},${h * 0.1} L${w * 0.9},${h * 0.1} Q${w},${h * 0.1} ${w},${h * 0.2} L${w},${h * 0.6} Q${w},${h * 0.7} ${w * 0.9},${h * 0.7} L${w * 0.35},${h * 0.7} L${w * 0.2},${h} L${w * 0.3},${h * 0.7} L${w * 0.1},${h * 0.7} Q0,${h * 0.7} 0,${h * 0.6} L0,${h * 0.2} Q0,${h * 0.1} ${w * 0.1},${h * 0.1}Z`,
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    shapeContainer: {
        position: 'relative',
    },
    shadowLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
});

export default {
    RectangleShape,
    MD3RectangleShape,
    EllipseShape,
    PolygonShape,
    StarShape,
    LineShape,
    PathShape,
    SHAPE_PRESETS,
};
