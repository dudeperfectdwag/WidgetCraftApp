/**
 * WidgetCraft - Premium Divider Component
 * Subtle dividers with optional labels
 */

import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { useColors } from '@theme/index';
import { LabelSmall } from './Typography';
import { LAYOUT } from '@constants/index';

// ============================================
// Types
// ============================================

export interface PremiumDividerProps {
    label?: string;
    orientation?: 'horizontal' | 'vertical';
    thickness?: number;
    spacing?: number;
    inset?: 'none' | 'left' | 'right' | 'both';
    style?: StyleProp<ViewStyle>;
}

// ============================================
// Component
// ============================================

export const PremiumDivider: React.FC<PremiumDividerProps> = ({
    label,
    orientation = 'horizontal',
    thickness = 1,
    spacing = LAYOUT.SPACING.md,
    inset = 'none',
    style,
}) => {
    const colors = useColors();

    const getInsetPadding = (): ViewStyle => {
        switch (inset) {
            case 'left': return { paddingLeft: LAYOUT.SPACING.md };
            case 'right': return { paddingRight: LAYOUT.SPACING.md };
            case 'both': return { paddingHorizontal: LAYOUT.SPACING.md };
            default: return {};
        }
    };

    if (orientation === 'vertical') {
        return (
            <View
                style={[
                    styles.vertical,
                    {
                        width: thickness,
                        backgroundColor: colors.outlineVariant,
                        marginHorizontal: spacing,
                    },
                    style,
                ]}
            />
        );
    }

    if (label) {
        return (
            <View
                style={[
                    styles.labelContainer,
                    { marginVertical: spacing },
                    getInsetPadding(),
                    style,
                ]}
            >
                <View
                    style={[
                        styles.line,
                        {
                            height: thickness,
                            backgroundColor: colors.outlineVariant,
                        },
                    ]}
                />
                <LabelSmall
                    color="muted"
                    style={styles.label}
                >
                    {label}
                </LabelSmall>
                <View
                    style={[
                        styles.line,
                        {
                            height: thickness,
                            backgroundColor: colors.outlineVariant,
                        },
                    ]}
                />
            </View>
        );
    }

    return (
        <View
            style={[
                styles.horizontal,
                {
                    height: thickness,
                    backgroundColor: colors.outlineVariant,
                    marginVertical: spacing,
                },
                getInsetPadding(),
                style,
            ]}
        />
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    horizontal: {
        width: '100%',
    },
    vertical: {
        height: '100%',
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    line: {
        flex: 1,
    },
    label: {
        marginHorizontal: LAYOUT.SPACING.md,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default PremiumDivider;
