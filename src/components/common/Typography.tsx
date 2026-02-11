/**
 * WidgetCraft - Typography Components
 * Material Design 3 text components with proper type scale
 */

import React, { ReactNode } from 'react';
import {
    Text as RNText,
    TextStyle,
    StyleProp,
    TextProps as RNTextProps,
} from 'react-native';
import { useColors } from '@theme/index';
import { TYPOGRAPHY } from '@constants/index';

// ============================================
// Types
// ============================================

export type TypographyVariant = keyof typeof TYPOGRAPHY;

export interface TypographyProps extends Omit<RNTextProps, 'style'> {
    children: ReactNode;
    variant?: TypographyVariant;
    color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'surface' | 'muted' | string;
    align?: 'left' | 'center' | 'right' | 'justify';
    weight?: TextStyle['fontWeight'];
    style?: StyleProp<TextStyle>;
}

// ============================================
// Typography Component
// ============================================

export const Typography: React.FC<TypographyProps> = ({
    children,
    variant = 'bodyMedium',
    color = 'surface',
    align,
    weight,
    style,
    ...rest
}) => {
    const colors = useColors();
    const typeStyle = TYPOGRAPHY[variant];

    // Get color value
    const getColor = (): string => {
        switch (color) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.secondary;
            case 'tertiary': return colors.tertiary;
            case 'error': return colors.error;
            case 'surface': return colors.onSurface;
            case 'muted': return colors.onSurfaceVariant;
            default: return color; // Allow custom colors
        }
    };

    return (
        <RNText
            style={[
                {
                    fontSize: typeStyle.fontSize,
                    lineHeight: typeStyle.lineHeight,
                    letterSpacing: typeStyle.letterSpacing,
                    color: getColor(),
                    textAlign: align,
                    fontWeight: weight,
                },
                style,
            ]}
            {...rest}
        >
            {children}
        </RNText>
    );
};

// ============================================
// Convenient Type Components
// ============================================

export const DisplayLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="displayLarge" {...props} />
);

export const DisplayMedium: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="displayMedium" {...props} />
);

export const DisplaySmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="displaySmall" {...props} />
);

export const HeadlineLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="headlineLarge" {...props} />
);

export const HeadlineMedium: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="headlineMedium" {...props} />
);

export const HeadlineSmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="headlineSmall" {...props} />
);

export const TitleLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="titleLarge" weight="500" {...props} />
);

export const TitleMedium: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="titleMedium" weight="500" {...props} />
);

export const TitleSmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="titleSmall" weight="500" {...props} />
);

export const LabelLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="labelLarge" weight="500" {...props} />
);

export const LabelMedium: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="labelMedium" weight="500" {...props} />
);

export const LabelSmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="labelSmall" weight="500" {...props} />
);

export const BodyLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="bodyLarge" {...props} />
);

export const BodyMedium: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="bodyMedium" {...props} />
);

export const BodySmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
    <Typography variant="bodySmall" {...props} />
);

export default Typography;
