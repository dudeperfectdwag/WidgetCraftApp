/**
 * WidgetCraft - Data Screen
 * Data sources and scripting engine placeholder
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@theme/index';
import {
    HeadlineSmall,
    BodyMedium,
    TitleMedium,
    PremiumCard,
    BodySmall,
} from '@components/common';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface DataSourceCardProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    title: string;
    description: string;
    color: string;
}
const DataSourceCard: React.FC<DataSourceCardProps> = ({ icon, title, description, color }) => {
    const colors = useColors();

    return (
        <PremiumCard variant="outlined" style={styles.dataSourceCard}>
            <View style={[styles.dataSourceIcon, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={24} color={color} />
            </View>
            <View style={styles.dataSourceContent}>
                <TitleMedium style={{ color: colors.onSurface }}>{title}</TitleMedium>
                <BodySmall color="muted">{description}</BodySmall>
            </View>
        </PremiumCard>
    );
};

export const DataScreen: React.FC = () => {
    const colors = useColors();
    const insets = useSafeAreaInsets();

    const dataSources: DataSourceCardProps[] = [
        {
            icon: 'clock-outline',
            title: 'Time',
            description: 'Digital/analog clocks, timezones, countdowns',
            color: colors.primary,
        },
        {
            icon: 'weather-cloudy',
            title: 'Weather',
            description: 'Current conditions, forecast, weather icons',
            color: colors.secondary,
        },
        {
            icon: 'cellphone',
            title: 'Device',
            description: 'Battery, storage, network, memory',
            color: colors.tertiary,
        },
        {
            icon: 'calendar',
            title: 'Calendar',
            description: 'Events, reminders, upcoming schedule',
            color: colors.primary,
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <HeadlineSmall style={{ color: colors.onSurface }}>Data Sources</HeadlineSmall>
                    <BodyMedium color="muted">Phase 4 - Coming Soon</BodyMedium>
                </View>

                <TitleMedium style={[styles.sectionTitle, { color: colors.onSurface }]}>
                    Available Sources
                </TitleMedium>

                {dataSources.map((source, index) => (
                    <DataSourceCard key={index} {...source} />
                ))}

                {/* Script Engine Preview */}
                <TitleMedium style={[styles.sectionTitle, { color: colors.onSurface, marginTop: 24 }]}>
                    Script Engine
                </TitleMedium>
                <PremiumCard variant="filled" style={styles.scriptPreview}>
                    <MaterialCommunityIcons name="code-braces" size={32} color={colors.primary} />
                    <BodyMedium style={{ color: colors.onSurface, marginTop: 12 }}>
                        Custom JavaScript scripting coming soon
                    </BodyMedium>
                    <BodySmall color="muted" style={{ marginTop: 4 }}>
                        Create dynamic widgets with code
                    </BodySmall>
                </PremiumCard>

                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
    },
    header: {
        marginBottom: 24,
    },
    sectionTitle: {
        marginBottom: 12,
    },
    dataSourceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
    },
    dataSourceIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    dataSourceContent: {
        flex: 1,
    },
    scriptPreview: {
        padding: 24,
        alignItems: 'center',
    },
});

export default DataScreen;
