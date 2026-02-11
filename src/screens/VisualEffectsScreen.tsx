/**
 * WidgetCraft - Visual Effects Screen
 * Placeholder for visual effects editor
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@theme/index';
import { HeadlineSmall, BodyMedium } from '@components/common';

export const VisualEffectsScreen: React.FC = () => {
    const colors = useColors();
    const insets = useSafeAreaInsets();
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
                <HeadlineSmall style={{ color: colors.onSurface }}>Visual Effects</HeadlineSmall>
                <BodyMedium color="muted">Coming soon in Phase 5</BodyMedium>
            </View>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
});

export default VisualEffectsScreen;