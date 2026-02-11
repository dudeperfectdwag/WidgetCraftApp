/**
 * WidgetCraft - Curved Text Component
 * Renders text along a curved path using SVG
 */

import React from 'react';
import Svg, { Defs, Path, Text, TextPath } from 'react-native-svg';

// Types
export type CurveType = 'arc' | 'wave' | 'circle' | 'custom';

export interface CurvedTextProps {
    // Content
    text: string;
    
    // Size
    width: number;
    height: number;
    
    // Curve settings
    curveType?: CurveType;
    curveAmount?: number; // -100 to 100, negative = curve down, positive = curve up
    startOffset?: number; // 0-100%, where text starts on the path
    
    // Text styling
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    letterSpacing?: number;
    textAnchor?: 'start' | 'middle' | 'end';
    
    // Custom path (for curveType = 'custom')
    customPath?: string;
}

/**
 * Generate SVG path for different curve types.
 * Paths are kept within bounds so text is never clipped by the viewBox.
 */
const generateCurvePath = (
    width: number,
    height: number,
    curveType: CurveType,
    curveAmount: number,
    fontSize: number = 24
): string => {
    const midX = width / 2;
    const midY = height / 2;
    
    // Reserve space for text ascenders/descenders so the path stays in-bounds
    const textPad = fontSize * 0.8;
    const usableHeight = Math.max(height - 2 * textPad, 0);
    
    switch (curveType) {
        case 'arc': {
            // Normalized 0-1 intensity with a slight ease-in for stronger curves
            const t = Math.min(1, Math.pow(Math.abs(curveAmount) / 100, 1.35));
            
            if (curveAmount >= 0) {
                // Curve up: endpoints shift down, apex shifts up
                const baseline = midY + t * (usableHeight / 2);
                const apexY = midY - t * (usableHeight / 2);
                // For quadratic bézier: apex = (baseline + controlY) / 2
                const controlY = 2 * apexY - baseline;
                return `M 0,${baseline} Q ${midX},${controlY} ${width},${baseline}`;
            } else {
                // Curve down: endpoints shift up, apex shifts down
                const baseline = midY - t * (usableHeight / 2);
                const apexY = midY + t * (usableHeight / 2);
                const controlY = 2 * apexY - baseline;
                return `M 0,${baseline} Q ${midX},${controlY} ${width},${baseline}`;
            }
        }
        
        case 'wave': {
            // Sine wave pattern - amplitude clamped to available space
            const t = Math.abs(curveAmount) / 100;
            const maxAmplitude = usableHeight / 2;
            const amplitude = t * maxAmplitude;
            const quarterX = width / 4;
            const threeQuarterX = (width * 3) / 4;
            
            if (curveAmount >= 0) {
                return `M 0,${midY} Q ${quarterX},${midY - amplitude} ${midX},${midY} Q ${threeQuarterX},${midY + amplitude} ${width},${midY}`;
            } else {
                return `M 0,${midY} Q ${quarterX},${midY + amplitude} ${midX},${midY} Q ${threeQuarterX},${midY - amplitude} ${width},${midY}`;
            }
        }
        
        case 'circle': {
            // Circular path (top half or bottom half)
            const radius = Math.min(width, usableHeight) / 2;
            const centerY = curveAmount >= 0 ? (midY + usableHeight / 2) : (midY - usableHeight / 2);
            
            // Arc path: large arc, counter-clockwise for top, clockwise for bottom
            if (curveAmount >= 0) {
                return `M ${midX - radius},${centerY} A ${radius},${radius} 0 0,1 ${midX + radius},${centerY}`;
            } else {
                return `M ${midX - radius},${centerY} A ${radius},${radius} 0 0,0 ${midX + radius},${centerY}`;
            }
        }
        
        default:
            // Default straight line
            return `M 0,${midY} L ${width},${midY}`;
    }
};

export const CurvedText: React.FC<CurvedTextProps> = ({
    text,
    width,
    height,
    curveType = 'arc',
    curveAmount = 50,
    startOffset = 0,
    fontSize = 24,
    fontFamily,
    fontWeight = 'normal',
    fill = '#FFFFFF',
    stroke,
    strokeWidth = 0,
    letterSpacing = 0,
    textAnchor = 'middle',
    customPath,
}) => {
    // Generate path based on curve type
    const pathData = customPath ?? generateCurvePath(width, height, curveType, curveAmount, fontSize);
    
    // Unique ID for this text path reference
    const pathId = `curvedTextPath_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate offset based on text anchor
    const getStartOffset = (): string => {
        if (startOffset !== 0) return `${startOffset}%`;
        switch (textAnchor) {
            case 'start': return '0%';
            case 'middle': return '50%';
            case 'end': return '100%';
            default: return '50%';
        }
    };

    return (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <Defs>
                <Path id={pathId} d={pathData} fill="none" />
            </Defs>
            <Text
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fontWeight={fontWeight}
                letterSpacing={letterSpacing}
                textAnchor={textAnchor}
            >
                <TextPath
                    href={`#${pathId}`}
                    startOffset={getStartOffset()}
                >
                    {text}
                </TextPath>
            </Text>
        </Svg>
    );
};

export default CurvedText;
