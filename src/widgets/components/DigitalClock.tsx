/**
 * WidgetCraft - Digital Clock Component
 * Customizable digital clock with multiple display styles
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, AppState, AppStateStatus } from 'react-native';

// Types
export type DigitalClockStyle = 'default' | 'minimal' | 'retro' | 'modern' | 'bold' | 'elegant';

export interface DigitalClockProps {
    // Size
    width?: number;
    height?: number;
    
    // Time format
    format?: '12h' | '24h';
    showSeconds?: boolean;
    showAmPm?: boolean;
    showDate?: boolean;
    
    // Display style
    displayStyle?: DigitalClockStyle;
    
    // Colors
    backgroundColor?: string;
    textColor?: string;
    secondaryColor?: string; // For seconds, AM/PM, separators
    
    // Font customization
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    letterSpacing?: number;
    textAlign?: 'left' | 'center' | 'right';
    
    // Separator
    separatorStyle?: 'colon' | 'dot' | 'space' | 'none';
    blinkSeparator?: boolean;
}

// Style presets
const STYLE_PRESETS: Record<DigitalClockStyle, {
    fontWeight: DigitalClockProps['fontWeight'];
    letterSpacing: number;
    separatorStyle: DigitalClockProps['separatorStyle'];
    secondaryOpacity: number;
}> = {
    default: {
        fontWeight: '400',
        letterSpacing: 2,
        separatorStyle: 'colon',
        secondaryOpacity: 0.7,
    },
    minimal: {
        fontWeight: '300',
        letterSpacing: 4,
        separatorStyle: 'space',
        secondaryOpacity: 0.5,
    },
    retro: {
        fontWeight: '700',
        letterSpacing: 0,
        separatorStyle: 'colon',
        secondaryOpacity: 1,
    },
    modern: {
        fontWeight: '200',
        letterSpacing: 6,
        separatorStyle: 'dot',
        secondaryOpacity: 0.6,
    },
    bold: {
        fontWeight: '900',
        letterSpacing: 1,
        separatorStyle: 'colon',
        secondaryOpacity: 0.8,
    },
    elegant: {
        fontWeight: '300',
        letterSpacing: 8,
        separatorStyle: 'none',
        secondaryOpacity: 0.4,
    },
};

export const DigitalClock: React.FC<DigitalClockProps> = ({
    width = 200,
    height = 60,
    format = '12h',
    showSeconds = true,
    showAmPm = true,
    showDate = false,
    displayStyle = 'default',
    backgroundColor = 'transparent',
    textColor = '#FFFFFF',
    secondaryColor,
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    textAlign = 'center',
    separatorStyle,
    blinkSeparator = true,
}) => {
    const [time, setTime] = useState(new Date());
    const [showSeparator, setShowSeparator] = useState(true);

    // Get style preset
    const preset = STYLE_PRESETS[displayStyle];
    
    // Apply props or use preset defaults
    const finalFontWeight = fontWeight ?? preset.fontWeight;
    const finalLetterSpacing = letterSpacing ?? preset.letterSpacing;
    const finalSeparatorStyle = separatorStyle ?? preset.separatorStyle;
    const finalSecondaryColor = secondaryColor ?? textColor;

    // Update time every second (or 500ms for blink effect)
    useEffect(() => {
        let interval = setInterval(() => {
            setTime(new Date());
            if (blinkSeparator) {
                setShowSeparator(prev => !prev);
            }
        }, blinkSeparator ? 500 : 1000);

        // Restart timer when returning from background
        const appStateRef: { current: AppStateStatus } = { current: AppState.currentState };
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
                setTime(new Date());
                clearInterval(interval);
                interval = setInterval(() => {
                    setTime(new Date());
                    if (blinkSeparator) {
                        setShowSeparator(prev => !prev);
                    }
                }, blinkSeparator ? 500 : 1000);
            }
            appStateRef.current = nextState;
        });

        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, [blinkSeparator]);

    // Format time components
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const seconds = time.getSeconds();
    
    const displayHours = format === '12h' 
        ? hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
        : hours;
    
    const amPm = hours >= 12 ? 'PM' : 'AM';
    
    const formatNumber = (num: number): string => num.toString().padStart(2, '0');

    // Get separator character
    const getSeparator = (): string => {
        if (!showSeparator && blinkSeparator) return ' ';
        switch (finalSeparatorStyle) {
            case 'colon': return ':';
            case 'dot': return '·';
            case 'space': return ' ';
            case 'none': return '';
            default: return ':';
        }
    };

    // Format date
    const formatDate = (): string => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[time.getDay()]}, ${months[time.getMonth()]} ${time.getDate()}`;
    };

    // Calculate font size based on container
    const baseFontSize = (fontSize && fontSize > 0) ? fontSize : Math.min(width * 0.25, height * 0.6);
    const secondsFontSize = baseFontSize * 0.6;
    const amPmFontSize = baseFontSize * 0.35;
    const dateFontSize = baseFontSize * 0.3;
    const alignItems = textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center';

    return (
        <View style={[
            styles.container,
            {
                width,
                height,
                backgroundColor,
                alignItems,
            }
        ]}>
            {/* Main time display */}
            <View style={styles.timeRow}>
                {/* Hours */}
                <Text style={[
                    styles.timeText,
                    {
                        color: textColor,
                        fontSize: baseFontSize,
                        fontWeight: finalFontWeight,
                        fontFamily,
                        letterSpacing: finalLetterSpacing,
                        textAlign,
                    }
                ]}>
                    {format === '12h' ? displayHours : formatNumber(displayHours)}
                </Text>

                {/* Separator */}
                {finalSeparatorStyle !== 'none' && (
                    <Text style={[
                        styles.separator,
                        {
                            color: finalSecondaryColor,
                            fontSize: baseFontSize,
                            fontWeight: finalFontWeight,
                            fontFamily,
                            opacity: showSeparator || !blinkSeparator ? 1 : 0,
                            textAlign,
                        }
                    ]}>
                        {getSeparator()}
                    </Text>
                )}

                {/* Minutes */}
                <Text style={[
                    styles.timeText,
                    {
                        color: textColor,
                        fontSize: baseFontSize,
                        fontWeight: finalFontWeight,
                        fontFamily,
                        letterSpacing: finalLetterSpacing,
                        textAlign,
                    }
                ]}>
                    {formatNumber(minutes)}
                </Text>

                {/* Seconds */}
                {showSeconds && (
                    <>
                        {finalSeparatorStyle !== 'none' && (
                            <Text style={[
                                styles.separator,
                                {
                                    color: finalSecondaryColor,
                                    fontSize: baseFontSize,
                                    fontWeight: finalFontWeight,
                                    fontFamily,
                                    opacity: (showSeparator || !blinkSeparator ? 1 : 0) * preset.secondaryOpacity,
                                    textAlign,
                                }
                            ]}>
                                {getSeparator()}
                            </Text>
                        )}
                        <Text style={[
                            styles.timeText,
                            {
                                color: finalSecondaryColor,
                                fontSize: secondsFontSize,
                                fontWeight: finalFontWeight,
                                fontFamily,
                                letterSpacing: finalLetterSpacing,
                                opacity: preset.secondaryOpacity,
                                alignSelf: 'flex-end',
                                marginBottom: baseFontSize * 0.1,
                                textAlign,
                            }
                        ]}>
                            {formatNumber(seconds)}
                        </Text>
                    </>
                )}

                {/* AM/PM */}
                {format === '12h' && showAmPm && (
                    <Text style={[
                        styles.amPm,
                        {
                            color: finalSecondaryColor,
                            fontSize: amPmFontSize,
                            fontWeight: '500',
                            fontFamily,
                            opacity: preset.secondaryOpacity,
                            textAlign,
                        }
                    ]}>
                        {amPm}
                    </Text>
                )}
            </View>

            {/* Date display */}
            {showDate && (
                <Text style={[
                    styles.dateText,
                    {
                        color: finalSecondaryColor,
                        fontSize: dateFontSize,
                        fontWeight: '400',
                        fontFamily,
                        letterSpacing: finalLetterSpacing * 0.5,
                        opacity: preset.secondaryOpacity,
                        textAlign,
                    }
                ]}>
                    {formatDate()}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        includeFontPadding: false,
        textAlignVertical: 'center',
    },
    separator: {
        includeFontPadding: false,
        textAlignVertical: 'center',
        marginHorizontal: 2,
    },
    amPm: {
        includeFontPadding: false,
        marginLeft: 6,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    dateText: {
        includeFontPadding: false,
        marginTop: 4,
    },
});

export default DigitalClock;
