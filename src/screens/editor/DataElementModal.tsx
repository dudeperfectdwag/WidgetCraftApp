/**
 * WidgetCraft - Data Element Modal
 * Modal for adding time, date, and weather elements with font customization
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    TitleMedium,
    BodyMedium,
    LabelMedium,
    LabelSmall,
} from '@components/common';
import { dataProvider, startDataUpdates } from '../../widgets/data/DataSources';

// ============================================
// Types
// ============================================

export type DataElementType = 'time' | 'date' | 'weather';

interface DataFormat {
    id: string;
    label: string;
    preview: string;
    dataKey: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface FontOption {
    name: string;
    family: string;
}

interface FontSize {
    label: string;
    size: number;
}

export interface DataElementConfig {
    type: DataElementType;
    formatId: string;
    dataKey: string;
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
}

interface DataElementModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (config: DataElementConfig) => void;
}

// ============================================
// Data Format Options
// ============================================

const TIME_FORMATS: DataFormat[] = [
    { id: 'time-24h', label: '24 Hour', preview: '14:30', dataKey: 'time.formatted24', icon: 'clock-outline' },
    { id: 'time-12h', label: '12 Hour', preview: '2:30 PM', dataKey: 'time.formatted12', icon: 'clock-outline' },
    { id: 'time-hours', label: 'Hours Only', preview: '14', dataKey: 'time.hours', icon: 'numeric' },
    { id: 'time-minutes', label: 'Minutes Only', preview: '30', dataKey: 'time.minutes', icon: 'numeric' },
];

const DATE_FORMATS: DataFormat[] = [
    { id: 'date-full', label: 'Full Date', preview: 'Jan 15, 2024', dataKey: 'date.formatted', icon: 'calendar' },
    { id: 'date-day', label: 'Day Number', preview: '15', dataKey: 'date.day', icon: 'numeric' },
    { id: 'date-dayname', label: 'Day Name', preview: 'Monday', dataKey: 'date.dayName', icon: 'calendar-today' },
    { id: 'date-dayshort', label: 'Day Short', preview: 'Mon', dataKey: 'date.dayShort', icon: 'calendar-today' },
    { id: 'date-monthname', label: 'Month Name', preview: 'January', dataKey: 'date.monthName', icon: 'calendar-month' },
    { id: 'date-monthshort', label: 'Month Short', preview: 'Jan', dataKey: 'date.monthShort', icon: 'calendar-month' },
    { id: 'date-year', label: 'Year', preview: '2024', dataKey: 'date.year', icon: 'numeric' },
];

const WEATHER_FORMATS: DataFormat[] = [
    { id: 'weather-temp', label: 'Temperature', preview: '23°', dataKey: 'weather.temp', icon: 'thermometer' },
    { id: 'weather-condition', label: 'Condition', preview: 'Partly Cloudy', dataKey: 'weather.condition', icon: 'weather-partly-cloudy' },
    { id: 'weather-high', label: 'High', preview: '28°', dataKey: 'weather.high', icon: 'thermometer-chevron-up' },
    { id: 'weather-low', label: 'Low', preview: '18°', dataKey: 'weather.low', icon: 'thermometer-chevron-down' },
];

const GREETING_FORMATS: DataFormat[] = [
    { id: 'greeting', label: 'Greeting', preview: 'Good Morning', dataKey: 'device.greeting', icon: 'hand-wave' },
];

// ============================================
// Font Options
// ============================================

const FONTS: FontOption[] = [
    { name: 'System', family: 'System' },
    { name: 'Serif', family: 'serif' },
    { name: 'Monospace', family: 'monospace' },
];

const FONT_SIZES: FontSize[] = [
    { label: 'S', size: 16 },
    { label: 'M', size: 24 },
    { label: 'L', size: 32 },
    { label: 'XL', size: 48 },
    { label: '2XL', size: 64 },
];

const FONT_WEIGHTS = [
    { label: 'Light', weight: '300' },
    { label: 'Normal', weight: '400' },
    { label: 'Medium', weight: '500' },
    { label: 'Bold', weight: '700' },
];

const COLORS = [
    '#FFFFFF', '#000000', '#6750A4', '#B91C1C', '#15803D',
    '#1D4ED8', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4',
];

// ============================================
// Component
// ============================================

export const DataElementModal: React.FC<DataElementModalProps> = ({
    visible,
    onClose,
    onSubmit,
}) => {
    const colors = useColors();
    const insets = useSafeAreaInsets();

    // State
    const [selectedType, setSelectedType] = useState<DataElementType>('time');
    const [selectedFormat, setSelectedFormat] = useState<DataFormat>(TIME_FORMATS[0]);
    const [selectedFont, setSelectedFont] = useState(FONTS[0]);
    const [selectedSize, setSelectedSize] = useState(FONT_SIZES[2]); // L (32)
    const [selectedWeight, setSelectedWeight] = useState(FONT_WEIGHTS[1]); // Normal
    const [selectedColor, setSelectedColor] = useState('#FFFFFF');
    const [liveValue, setLiveValue] = useState('');
    const previewFontSize = selectedSize.size;
    const previewLineHeight = Math.round(previewFontSize * 1.2);

    // Start data updates for live preview
    useEffect(() => {
        startDataUpdates();
    }, []);

    // Subscribe to data changes for live preview
    useEffect(() => {
        const value = dataProvider.getValue(selectedFormat.dataKey as any);
        setLiveValue(String(value));

        const unsubscribe = dataProvider.subscribe(
            selectedFormat.dataKey as any,
            (newValue: string) => setLiveValue(String(newValue))
        );

        return unsubscribe;
    }, [selectedFormat]);

    // Get formats for selected type
    const getFormatsForType = (type: DataElementType): DataFormat[] => {
        switch (type) {
            case 'time':
                return TIME_FORMATS;
            case 'date':
                return [...DATE_FORMATS, ...GREETING_FORMATS];
            case 'weather':
                return WEATHER_FORMATS;
            default:
                return TIME_FORMATS;
        }
    };

    // Handle type change
    const handleTypeChange = (type: DataElementType) => {
        setSelectedType(type);
        const formats = getFormatsForType(type);
        setSelectedFormat(formats[0]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Handle submit
    const handleSubmit = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSubmit({
            type: selectedType,
            formatId: selectedFormat.id,
            dataKey: selectedFormat.dataKey,
            fontFamily: selectedFont.family,
            fontSize: selectedSize.size,
            fontWeight: selectedWeight.weight,
            color: selectedColor,
        });
    };

    const formats = getFormatsForType(selectedType);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modal, { backgroundColor: colors.surfaceContainer, paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TitleMedium style={{ color: colors.onSurface }}>
                            Add Data Element
                        </TitleMedium>
                        <Pressable onPress={onClose}>
                            <MaterialCommunityIcons
                                name="close"
                                size={24}
                                color={colors.onSurfaceVariant}
                            />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Live Preview */}
                        <View style={[styles.preview, { backgroundColor: colors.inverseSurface }]}>
                            <BodyMedium
                                style={[
                                    styles.previewText,
                                    {
                                        color: selectedColor,
                                        fontFamily: selectedFont.family,
                                        fontSize: previewFontSize,
                                        lineHeight: previewLineHeight,
                                        fontWeight: selectedWeight.weight as any,
                                        width: '100%',
                                    },
                                ]}
                            >
                                {liveValue || selectedFormat.preview}
                            </BodyMedium>
                        </View>

                        {/* Type Selection */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Type
                        </LabelMedium>
                        <View style={styles.typeRow}>
                            {[
                                { type: 'time' as DataElementType, icon: 'clock-outline', label: 'Time' },
                                { type: 'date' as DataElementType, icon: 'calendar', label: 'Date' },
                                { type: 'weather' as DataElementType, icon: 'weather-partly-cloudy', label: 'Weather' },
                            ].map((item) => (
                                <Pressable
                                    key={item.type}
                                    style={[
                                        styles.typeButton,
                                        {
                                            backgroundColor: selectedType === item.type
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    onPress={() => handleTypeChange(item.type)}
                                >
                                    <MaterialCommunityIcons
                                        name={item.icon as any}
                                        size={24}
                                        color={selectedType === item.type
                                            ? colors.onPrimaryContainer
                                            : colors.onSurfaceVariant
                                        }
                                    />
                                    <LabelSmall
                                        style={{
                                            color: selectedType === item.type
                                                ? colors.onPrimaryContainer
                                                : colors.onSurfaceVariant,
                                        }}
                                    >
                                        {item.label}
                                    </LabelSmall>
                                </Pressable>
                            ))}
                        </View>

                        {/* Format Selection */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Format
                        </LabelMedium>
                        <View style={styles.formatGrid}>
                            {formats.map((format) => (
                                <Pressable
                                    key={format.id}
                                    style={[
                                        styles.formatButton,
                                        {
                                            backgroundColor: selectedFormat.id === format.id
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                            borderColor: selectedFormat.id === format.id
                                                ? colors.primary
                                                : 'transparent',
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedFormat(format);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <MaterialCommunityIcons
                                        name={format.icon}
                                        size={20}
                                        color={selectedFormat.id === format.id
                                            ? colors.onPrimaryContainer
                                            : colors.onSurfaceVariant
                                        }
                                    />
                                    <LabelSmall
                                        style={{
                                            color: selectedFormat.id === format.id
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                            marginTop: 4,
                                        }}
                                    >
                                        {format.label}
                                    </LabelSmall>
                                    <LabelSmall
                                        style={{
                                            color: selectedFormat.id === format.id
                                                ? colors.onPrimaryContainer
                                                : colors.onSurfaceVariant,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {format.preview}
                                    </LabelSmall>
                                </Pressable>
                            ))}
                        </View>

                        {/* Font Family */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Font
                        </LabelMedium>
                        <View style={styles.optionRow}>
                            {FONTS.map((font) => (
                                <Pressable
                                    key={font.name}
                                    style={[
                                        styles.optionButton,
                                        {
                                            backgroundColor: selectedFont.name === font.name
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedFont(font);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <LabelSmall
                                        style={{
                                            color: selectedFont.name === font.name
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                            fontFamily: font.family,
                                        }}
                                    >
                                        {font.name}
                                    </LabelSmall>
                                </Pressable>
                            ))}
                        </View>

                        {/* Font Size */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Size
                        </LabelMedium>
                        <View style={styles.optionRow}>
                            {FONT_SIZES.map((size) => (
                                <Pressable
                                    key={size.label}
                                    style={[
                                        styles.sizeButton,
                                        {
                                            backgroundColor: selectedSize.label === size.label
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedSize(size);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <LabelSmall
                                        style={{
                                            color: selectedSize.label === size.label
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                        }}
                                    >
                                        {size.label}
                                    </LabelSmall>
                                </Pressable>
                            ))}
                        </View>

                        {/* Font Weight */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Weight
                        </LabelMedium>
                        <View style={styles.optionRow}>
                            {FONT_WEIGHTS.map((weight) => (
                                <Pressable
                                    key={weight.label}
                                    style={[
                                        styles.optionButton,
                                        {
                                            backgroundColor: selectedWeight.label === weight.label
                                                ? colors.primaryContainer
                                                : colors.surfaceContainerHigh,
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedWeight(weight);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <LabelSmall
                                        style={{
                                            color: selectedWeight.label === weight.label
                                                ? colors.onPrimaryContainer
                                                : colors.onSurface,
                                            fontWeight: weight.weight as any,
                                        }}
                                    >
                                        {weight.label}
                                    </LabelSmall>
                                </Pressable>
                            ))}
                        </View>

                        {/* Color */}
                        <LabelMedium style={[styles.sectionLabel, { color: colors.onSurfaceVariant }]}>
                            Color
                        </LabelMedium>
                        <View style={styles.colorRow}>
                            {COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    style={[
                                        styles.colorButton,
                                        { backgroundColor: color },
                                        selectedColor === color && {
                                            borderWidth: 3,
                                            borderColor: colors.primary,
                                        },
                                    ]}
                                    onPress={() => {
                                        setSelectedColor(color);
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                />
                            ))}
                        </View>
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <Pressable
                            style={[styles.cancelButton, { backgroundColor: colors.surfaceContainerHigh }]}
                            onPress={onClose}
                        >
                            <LabelMedium style={{ color: colors.onSurface }}>Cancel</LabelMedium>
                        </Pressable>
                        <Pressable
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={handleSubmit}
                        >
                            <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
                            <LabelMedium style={{ color: colors.onPrimary }}>Add to Canvas</LabelMedium>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingBottom: 12,
    },
    content: {
        paddingHorizontal: 20,
    },
    preview: {
        minHeight: 100,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'stretch',
        marginBottom: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    previewText: {
        textAlign: 'center',
    },
    sectionLabel: {
        marginBottom: 8,
        marginTop: 16,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 4,
    },
    formatGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    formatButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 90,
        borderWidth: 2,
    },
    optionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    optionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    sizeButton: {
        width: 48,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    colorButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    actions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButton: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
});

export default DataElementModal;
