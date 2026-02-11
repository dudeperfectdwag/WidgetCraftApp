/**
 * WidgetPreview - Shows a thumbnail screenshot of a widget.
 * Falls back to a placeholder icon when no thumbnail is available.
 */

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';

interface WidgetPreviewProps {
    /** base64 data-uri or https URL */
    thumbnail?: string | null;
    width: number;
    height: number;
    fallbackColor?: string;
    style?: object;
}

const WidgetPreview: React.FC<WidgetPreviewProps> = ({
    thumbnail,
    width,
    height,
    fallbackColor,
    style,
}) => {
    const colors = useColors();

    if (thumbnail) {
        return (
            <View style={[styles.container, { width, height }, style]}>
                <Image
                    source={{ uri: thumbnail }}
                    style={{ width, height, borderRadius: (style as any)?.borderRadius || 0 }}
                    resizeMode="cover"
                />
            </View>
        );
    }

    // Fallback icon
    return (
        <View
            style={[
                styles.fallback,
                {
                    width,
                    height,
                    backgroundColor: (fallbackColor || colors.surfaceContainerHigh) + '30',
                },
                style,
            ]}
        >
            <MaterialCommunityIcons
                name="widgets-outline"
                size={Math.min(width, height) * 0.4}
                color={fallbackColor || colors.onSurfaceVariant}
                style={{ opacity: 0.4 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
    },
    fallback: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: 8,
    },
});

export default WidgetPreview;
