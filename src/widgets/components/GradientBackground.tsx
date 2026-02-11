/**
 * WidgetCraft - Gradient Background Component
 * Renders linear or radial gradients as canvas elements
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useColors } from '@theme/index';

export type GradientType = 'linear' | 'radial';

export interface GradientStop {
    color: string;
    offset: number; // 0-1
}

export interface GradientConfig {
    type: GradientType;
    colors: string[];
    stops?: number[]; // Optional custom stop positions (0-1)
    angle?: number; // Degrees for linear gradient (0-360)
    // Radial gradient options
    centerX?: number; // 0-1, default 0.5
    centerY?: number; // 0-1, default 0.5
    radiusX?: number; // 0-1, default 0.5
    radiusY?: number; // 0-1, default 0.5
}

export interface GradientBackgroundProps {
    width: number;
    height: number;
    config: GradientConfig;
    cornerRadius?: number;
    opacity?: number;
}

// Preset gradients for quick selection
export const GRADIENT_PRESETS: Record<string, GradientConfig> = {
    sunset: {
        type: 'linear',
        colors: ['#FF512F', '#F09819'],
        angle: 135,
    },
    ocean: {
        type: 'linear',
        colors: ['#2193b0', '#6dd5ed'],
        angle: 180,
    },
    purple: {
        type: 'linear',
        colors: ['#834d9b', '#d04ed6'],
        angle: 135,
    },
    forest: {
        type: 'linear',
        colors: ['#134E5E', '#71B280'],
        angle: 45,
    },
    fire: {
        type: 'radial',
        colors: ['#f12711', '#f5af19'],
        centerX: 0.5,
        centerY: 0.5,
    },
    midnight: {
        type: 'linear',
        colors: ['#232526', '#414345'],
        angle: 180,
    },
    aurora: {
        type: 'linear',
        colors: ['#00C9FF', '#92FE9D'],
        angle: 90,
    },
    candy: {
        type: 'linear',
        colors: ['#D8B5FF', '#1EAE98'],
        angle: 120,
    },
    warmth: {
        type: 'radial',
        colors: ['#FFAFBD', '#ffc3a0'],
        centerX: 0.5,
        centerY: 0.5,
    },
    cosmic: {
        type: 'linear',
        colors: ['#0f0c29', '#302b63', '#24243e'],
        angle: 135,
    },
    rainbow: {
        type: 'linear',
        colors: ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'],
        angle: 90,
    },
    glass: {
        type: 'linear',
        colors: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'],
        angle: 180,
    },
};

/**
 * Convert angle in degrees to SVG linear gradient coordinates
 * Angle 0 = bottom to top, 90 = left to right, etc.
 */
function angleToCoordinates(angle: number): { x1: string; y1: string; x2: string; y2: string } {
    // Normalize angle to 0-360
    const normalizedAngle = ((angle % 360) + 360) % 360;
    const radians = (normalizedAngle * Math.PI) / 180;
    
    // Calculate direction vector
    const dx = Math.sin(radians);
    const dy = -Math.cos(radians);
    
    // Convert to 0-1 range for SVG
    const x1 = 0.5 - dx * 0.5;
    const y1 = 0.5 - dy * 0.5;
    const x2 = 0.5 + dx * 0.5;
    const y2 = 0.5 + dy * 0.5;
    
    return {
        x1: `${(x1 * 100).toFixed(1)}%`,
        y1: `${(y1 * 100).toFixed(1)}%`,
        x2: `${(x2 * 100).toFixed(1)}%`,
        y2: `${(y2 * 100).toFixed(1)}%`,
    };
}

/**
 * Generate evenly distributed stops if not provided
 */
function generateStops(colors: string[], customStops?: number[]): GradientStop[] {
    if (customStops && customStops.length === colors.length) {
        return colors.map((color, i) => ({ color, offset: customStops[i] }));
    }
    
    return colors.map((color, i) => ({
        color,
        offset: colors.length === 1 ? 0 : i / (colors.length - 1),
    }));
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
    width,
    height,
    config,
    cornerRadius = 0,
    opacity = 1,
}) => {
    const colors = useColors();
    const gradientId = useMemo(() => `gradient-${Math.random().toString(36).substr(2, 9)}`, []);

    const resolvedColors = useMemo(
        () => config.colors.map((color) => {
            if (color.startsWith('#') || color.startsWith('rgb') || color === 'transparent') {
                return color;
            }
            return (colors as unknown as Record<string, string>)[color] || color;
        }),
        [config.colors, colors]
    );

    const stops = useMemo(
        () => generateStops(resolvedColors, config.stops),
        [resolvedColors, config.stops]
    );
    
    const linearCoords = useMemo(() => {
        if (config.type === 'linear') {
            return angleToCoordinates(config.angle ?? 0);
        }
        return null;
    }, [config.type, config.angle]);

    if (resolvedColors.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { width, height, opacity }]}>
            <Svg width={width} height={height}>
                <Defs>
                    {config.type === 'linear' && linearCoords && (
                        <LinearGradient
                            id={gradientId}
                            x1={linearCoords.x1}
                            y1={linearCoords.y1}
                            x2={linearCoords.x2}
                            y2={linearCoords.y2}
                        >
                            {stops.map((stop, index) => (
                                <Stop
                                    key={index}
                                    offset={`${stop.offset * 100}%`}
                                    stopColor={stop.color}
                                    stopOpacity={1}
                                />
                            ))}
                        </LinearGradient>
                    )}
                    {config.type === 'radial' && (
                        <RadialGradient
                            id={gradientId}
                            cx={`${(config.centerX ?? 0.5) * 100}%`}
                            cy={`${(config.centerY ?? 0.5) * 100}%`}
                            rx={`${(config.radiusX ?? 0.5) * 100}%`}
                            ry={`${(config.radiusY ?? 0.5) * 100}%`}
                            fx={`${(config.centerX ?? 0.5) * 100}%`}
                            fy={`${(config.centerY ?? 0.5) * 100}%`}
                        >
                            {stops.map((stop, index) => (
                                <Stop
                                    key={index}
                                    offset={`${stop.offset * 100}%`}
                                    stopColor={stop.color}
                                    stopOpacity={1}
                                />
                            ))}
                        </RadialGradient>
                    )}
                </Defs>
                <Rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    rx={cornerRadius}
                    ry={cornerRadius}
                    fill={`url(#${gradientId})`}
                />
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
});

export default GradientBackground;
