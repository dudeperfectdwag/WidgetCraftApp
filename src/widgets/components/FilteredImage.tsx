/**
 * WidgetCraft - Filtered Image Component
 * Renders images with various filter effects using color matrices
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Svg, { Defs, Filter, FeColorMatrix, FeGaussianBlur, Image as SvgImage } from 'react-native-svg';
import type { ImageFilterType, ImageFilterConfig } from '@canvas/CanvasContext';

export interface FilteredImageProps {
    uri: string;
    width: number;
    height: number;
    filterConfig?: ImageFilterConfig;
    cornerRadius?: number;
}

// Preset filter matrices
const FILTER_MATRICES: Record<ImageFilterType, number[]> = {
    none: [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0,
    ],
    grayscale: [
        0.33, 0.33, 0.33, 0, 0,
        0.33, 0.33, 0.33, 0, 0,
        0.33, 0.33, 0.33, 0, 0,
        0, 0, 0, 1, 0,
    ],
    sepia: [
        0.393, 0.769, 0.189, 0, 0,
        0.349, 0.686, 0.168, 0, 0,
        0.272, 0.534, 0.131, 0, 0,
        0, 0, 0, 1, 0,
    ],
    vintage: [
        0.6, 0.3, 0.1, 0, 0.05,
        0.2, 0.6, 0.2, 0, 0.03,
        0.1, 0.2, 0.5, 0, 0.08,
        0, 0, 0, 1, 0,
    ],
    warm: [
        1.2, 0.1, 0, 0, 0.05,
        0, 1.0, 0, 0, 0,
        0, 0, 0.8, 0, 0,
        0, 0, 0, 1, 0,
    ],
    cool: [
        0.9, 0, 0, 0, 0,
        0, 1.0, 0.1, 0, 0,
        0, 0.1, 1.2, 0, 0.05,
        0, 0, 0, 1, 0,
    ],
    blur: [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0,
    ],
    sharpen: [
        1.2, 0, 0, 0, 0,
        0, 1.2, 0, 0, 0,
        0, 0, 1.2, 0, 0,
        0, 0, 0, 1, 0,
    ],
    vignette: [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0,
    ],
    noir: [
        0.4, 0.4, 0.4, 0, -0.1,
        0.3, 0.3, 0.3, 0, -0.1,
        0.2, 0.2, 0.2, 0, -0.1,
        0, 0, 0, 1, 0,
    ],
};

/**
 * Apply brightness, contrast, saturation adjustments to a color matrix
 */
function applyAdjustments(
    baseMatrix: number[],
    brightness: number,
    contrast: number,
    saturation: number
): number[] {
    const result = [...baseMatrix];
    
    // Brightness adjustment (add to RGB values)
    const brightnessValue = brightness / 100;
    result[4] += brightnessValue;
    result[9] += brightnessValue;
    result[14] += brightnessValue;
    
    // Contrast adjustment (multiply RGB values)
    const contrastValue = 1 + (contrast / 100);
    const contrastOffset = (1 - contrastValue) * 0.5;
    for (let i = 0; i < 3; i++) {
        result[i * 5] *= contrastValue;
        result[i * 5 + 1] *= contrastValue;
        result[i * 5 + 2] *= contrastValue;
        result[i * 5 + 4] += contrastOffset;
    }
    
    // Saturation adjustment
    const satValue = 1 + (saturation / 100);
    const lumR = 0.3086;
    const lumG = 0.6094;
    const lumB = 0.0820;
    const sr = (1 - satValue) * lumR;
    const sg = (1 - satValue) * lumG;
    const sb = (1 - satValue) * lumB;
    
    // Apply saturation to existing matrix
    const satMatrix = [
        sr + satValue, sg, sb, 0, 0,
        sr, sg + satValue, sb, 0, 0,
        sr, sg, sb + satValue, 0, 0,
        0, 0, 0, 1, 0,
    ];
    
    // Multiply matrices (simplified - just blend with saturation)
    for (let i = 0; i < 3; i++) {
        const row = i * 5;
        result[row] = result[row] * satMatrix[row] + result[row + 1] * satMatrix[5 + row] + result[row + 2] * satMatrix[10 + row];
        result[row + 1] = result[row] * satMatrix[row + 1] + result[row + 1] * satMatrix[6] + result[row + 2] * satMatrix[11];
        result[row + 2] = result[row] * satMatrix[row + 2] + result[row + 1] * satMatrix[7] + result[row + 2] * satMatrix[12];
    }
    
    return result;
}

/**
 * Blend between identity matrix and filter matrix based on intensity
 */
function blendMatrix(filterMatrix: number[], intensity: number): number[] {
    const identity = FILTER_MATRICES.none;
    const factor = intensity / 100;
    
    return filterMatrix.map((val, i) => identity[i] + (val - identity[i]) * factor);
}

export const FilteredImage: React.FC<FilteredImageProps> = ({
    uri,
    width,
    height,
    filterConfig,
    cornerRadius = 0,
}) => {
    const filterId = useMemo(() => `filter-${Math.random().toString(36).substr(2, 9)}`, []);
    
    const config = filterConfig || {
        filter: 'none' as ImageFilterType,
        intensity: 100,
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0,
    };

    const colorMatrix = useMemo(() => {
        const baseMatrix = FILTER_MATRICES[config.filter] || FILTER_MATRICES.none;
        let matrix = blendMatrix(baseMatrix, config.intensity);
        matrix = applyAdjustments(matrix, config.brightness, config.contrast, config.saturation);
        return matrix.join(' ');
    }, [config.filter, config.intensity, config.brightness, config.contrast, config.saturation]);

    const hasBlur = config.filter === 'blur' && config.intensity > 0;
    const blurAmount = hasBlur ? (config.intensity / 100) * 5 : 0;

    // For simple cases without filters, use regular Image
    if (config.filter === 'none' && config.brightness === 0 && config.contrast === 0 && config.saturation === 0) {
        return (
            <View style={[styles.container, { width, height, borderRadius: cornerRadius, overflow: 'hidden' }]}>
                <Image
                    source={{ uri }}
                    style={{ width, height }}
                    resizeMode="cover"
                />
            </View>
        );
    }

    // Use SVG filters for complex cases
    return (
        <View style={[styles.container, { width, height, borderRadius: cornerRadius, overflow: 'hidden' }]}>
            <Svg width={width} height={height}>
                <Defs>
                    <Filter id={filterId}>
                        <FeColorMatrix
                            type="matrix"
                            values={colorMatrix}
                        />
                        {hasBlur && (
                            <FeGaussianBlur stdDeviation={blurAmount} />
                        )}
                    </Filter>
                </Defs>
                <SvgImage
                    href={{ uri }}
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    preserveAspectRatio="xMidYMid slice"
                    filter={`url(#${filterId})`}
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

export default FilteredImage;
