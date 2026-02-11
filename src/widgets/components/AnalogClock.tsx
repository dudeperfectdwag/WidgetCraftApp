/**
 * WidgetCraft - Analog Clock Component
 * SVG-based analog clock with customizable styles
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import { useColors } from '@theme/index';

// Clock face styles
export type ClockFaceStyle = 'minimal' | 'classic' | 'modern' | 'roman' | 'dots' | 'lines';

// Clock hand styles
export type ClockHandStyle = 'classic' | 'modern' | 'thin' | 'bold' | 'arrow';

export interface AnalogClockProps {
    size?: number;
    // Colors
    faceColor?: string;
    hourHandColor?: string;
    minuteHandColor?: string;
    secondHandColor?: string;
    tickColor?: string;
    numberColor?: string;
    centerDotColor?: string;
    // Styles
    faceStyle?: ClockFaceStyle;
    handStyle?: ClockHandStyle;
    // Options
    showSeconds?: boolean;
    showNumbers?: boolean;
    showTicks?: boolean;
    smoothSeconds?: boolean;
    // Border
    borderWidth?: number;
    borderColor?: string;
}

// Roman numerals for classic style
const ROMAN_NUMERALS = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

export const AnalogClock: React.FC<AnalogClockProps> = ({
    size = 180,
    faceColor,
    hourHandColor,
    minuteHandColor,
    secondHandColor,
    tickColor,
    numberColor,
    centerDotColor,
    faceStyle = 'modern',
    handStyle = 'modern',
    showSeconds = true,
    showNumbers = true,
    showTicks = true,
    smoothSeconds = false,
    borderWidth = 0,
    borderColor,
}) => {
    const colors = useColors();
    const [time, setTime] = useState(new Date());

    // Default colors using theme
    const resolvedFaceColor = faceColor || colors.surfaceContainer;
    const resolvedHourHandColor = hourHandColor || colors.primary;
    const resolvedMinuteHandColor = minuteHandColor || colors.onSurface;
    const resolvedSecondHandColor = secondHandColor || colors.error;
    const resolvedTickColor = tickColor || colors.outline;
    const resolvedNumberColor = numberColor || colors.onSurface;
    const resolvedCenterDotColor = centerDotColor || colors.primary;
    const resolvedBorderColor = borderColor || colors.outline;

    // Update time
    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
        }, smoothSeconds ? 50 : 1000);
        return () => clearInterval(interval);
    }, [smoothSeconds]);

    // Calculate angles
    const hours = time.getHours() % 12;
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    const milliseconds = time.getMilliseconds();

    // Calculate rotation angles (in degrees)
    const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + minute offset
    const minuteAngle = (minutes * 6) + (seconds * 0.1); // 6 degrees per minute + second offset
    const secondAngle = smoothSeconds
        ? (seconds * 6) + (milliseconds * 0.006) // Smooth second hand
        : seconds * 6; // 6 degrees per second

    const center = size / 2;
    const radius = (size / 2) - 8 - (borderWidth / 2);

    // Hand lengths based on style
    const getHandLengths = () => {
        switch (handStyle) {
            case 'thin':
                return { hour: radius * 0.5, minute: radius * 0.7, second: radius * 0.8 };
            case 'bold':
                return { hour: radius * 0.45, minute: radius * 0.65, second: radius * 0.75 };
            case 'arrow':
                return { hour: radius * 0.5, minute: radius * 0.72, second: radius * 0.78 };
            case 'classic':
                return { hour: radius * 0.5, minute: radius * 0.7, second: radius * 0.75 };
            case 'modern':
            default:
                return { hour: radius * 0.48, minute: radius * 0.68, second: radius * 0.8 };
        }
    };

    // Hand widths based on style
    const getHandWidths = () => {
        switch (handStyle) {
            case 'thin':
                return { hour: 2, minute: 1.5, second: 1 };
            case 'bold':
                return { hour: 6, minute: 4, second: 2 };
            case 'arrow':
                return { hour: 4, minute: 3, second: 1.5 };
            case 'classic':
                return { hour: 4, minute: 3, second: 1 };
            case 'modern':
            default:
                return { hour: 4, minute: 2.5, second: 1.5 };
        }
    };

    const handLengths = getHandLengths();
    const handWidths = getHandWidths();

    // Render tick marks
    const renderTicks = () => {
        if (!showTicks) return null;

        const ticks = [];
        for (let i = 0; i < 60; i++) {
            const angle = (i * 6 - 90) * (Math.PI / 180);
            const isHour = i % 5 === 0;
            
            let innerRadius: number;
            let tickWidth: number;

            switch (faceStyle) {
                case 'dots':
                    // Dots instead of lines
                    if (isHour) {
                        const cx = center + (radius - 12) * Math.cos(angle);
                        const cy = center + (radius - 12) * Math.sin(angle);
                        ticks.push(
                            <Circle
                                key={`tick-${i}`}
                                cx={cx}
                                cy={cy}
                                r={3}
                                fill={resolvedTickColor}
                            />
                        );
                    }
                    continue;
                case 'lines':
                    innerRadius = isHour ? radius - 15 : radius - 8;
                    tickWidth = isHour ? 2 : 1;
                    break;
                case 'minimal':
                    if (!isHour) continue;
                    innerRadius = radius - 10;
                    tickWidth = 2;
                    break;
                case 'classic':
                case 'roman':
                    innerRadius = isHour ? radius - 18 : radius - 10;
                    tickWidth = isHour ? 2 : 1;
                    break;
                case 'modern':
                default:
                    innerRadius = isHour ? radius - 14 : radius - 6;
                    tickWidth = isHour ? 2.5 : 1;
                    break;
            }

            const x1 = center + innerRadius * Math.cos(angle);
            const y1 = center + innerRadius * Math.sin(angle);
            const x2 = center + (radius - 2) * Math.cos(angle);
            const y2 = center + (radius - 2) * Math.sin(angle);

            ticks.push(
                <Line
                    key={`tick-${i}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={resolvedTickColor}
                    strokeWidth={tickWidth}
                    strokeLinecap="round"
                />
            );
        }
        return ticks;
    };

    // Render numbers
    const renderNumbers = () => {
        if (!showNumbers) return null;

        const numbers = [];
        const useRoman = faceStyle === 'roman' || faceStyle === 'classic';
        const numberRadius = radius - (faceStyle === 'minimal' ? 20 : 28);

        for (let i = 0; i < 12; i++) {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x = center + numberRadius * Math.cos(angle);
            const y = center + numberRadius * Math.sin(angle);
            
            const displayNumber = useRoman ? ROMAN_NUMERALS[i] : (i === 0 ? '12' : String(i));
            const fontSize = faceStyle === 'roman' ? size * 0.08 : size * 0.1;

            numbers.push(
                <SvgText
                    key={`num-${i}`}
                    x={x}
                    y={y}
                    fill={resolvedNumberColor}
                    fontSize={fontSize}
                    fontWeight={faceStyle === 'modern' ? '500' : '400'}
                    textAnchor="middle"
                    alignmentBaseline="central"
                >
                    {displayNumber}
                </SvgText>
            );
        }
        return numbers;
    };

    // Render clock hand
    const renderHand = (
        angle: number,
        length: number,
        width: number,
        color: string,
        key: string,
        tailLength: number = 0
    ) => {
        const radians = (angle - 90) * (Math.PI / 180);
        const x2 = center + length * Math.cos(radians);
        const y2 = center + length * Math.sin(radians);
        
        // Tail (opposite direction)
        const x1 = tailLength > 0
            ? center - tailLength * Math.cos(radians)
            : center;
        const y1 = tailLength > 0
            ? center - tailLength * Math.sin(radians)
            : center;

        if (handStyle === 'arrow' && key !== 'second') {
            // Arrow-style hand
            const arrowSize = width * 2;
            const tipX = x2;
            const tipY = y2;
            const baseX = center + (length - arrowSize * 2) * Math.cos(radians);
            const baseY = center + (length - arrowSize * 2) * Math.sin(radians);
            
            const perpAngle = radians + Math.PI / 2;
            const leftX = baseX + arrowSize * Math.cos(perpAngle);
            const leftY = baseY + arrowSize * Math.sin(perpAngle);
            const rightX = baseX - arrowSize * Math.cos(perpAngle);
            const rightY = baseY - arrowSize * Math.sin(perpAngle);

            return (
                <G key={key}>
                    <Line
                        x1={x1}
                        y1={y1}
                        x2={baseX}
                        y2={baseY}
                        stroke={color}
                        strokeWidth={width}
                        strokeLinecap="round"
                    />
                    <Path
                        d={`M ${tipX} ${tipY} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`}
                        fill={color}
                    />
                </G>
            );
        }

        return (
            <Line
                key={key}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
            />
        );
    };

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Clock face background */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill={resolvedFaceColor}
                    stroke={borderWidth > 0 ? resolvedBorderColor : 'none'}
                    strokeWidth={borderWidth}
                />

                {/* Tick marks */}
                {renderTicks()}

                {/* Numbers */}
                {renderNumbers()}

                {/* Hour hand */}
                {renderHand(
                    hourAngle,
                    handLengths.hour,
                    handWidths.hour,
                    resolvedHourHandColor,
                    'hour',
                    radius * 0.1
                )}

                {/* Minute hand */}
                {renderHand(
                    minuteAngle,
                    handLengths.minute,
                    handWidths.minute,
                    resolvedMinuteHandColor,
                    'minute',
                    radius * 0.12
                )}

                {/* Second hand */}
                {showSeconds && renderHand(
                    secondAngle,
                    handLengths.second,
                    handWidths.second,
                    resolvedSecondHandColor,
                    'second',
                    radius * 0.15
                )}

                {/* Center dot */}
                <Circle
                    cx={center}
                    cy={center}
                    r={handStyle === 'bold' ? 6 : 4}
                    fill={resolvedCenterDotColor}
                />

                {/* Inner center dot (for some styles) */}
                {(handStyle === 'modern' || handStyle === 'classic') && (
                    <Circle
                        cx={center}
                        cy={center}
                        r={2}
                        fill={resolvedFaceColor}
                    />
                )}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AnalogClock;
