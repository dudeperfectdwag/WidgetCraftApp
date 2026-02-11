import React from 'react';
import { Modal, View, StyleSheet, Pressable, Dimensions, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from '@utils/HapticService';

import { ElementRenderer } from '../../widgets/components/ElementRenderer';
import { CanvasElement } from '../../canvas/CanvasContext';
import { useColors } from '../../theme/hooks';
import { PremiumIconButton } from '../../components/common/PremiumIconButton';
import { Typography } from '../../components/common/Typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PreviewModalProps {
    visible: boolean;
    onClose: () => void;
    elements: CanvasElement[];
    canvasWidth: number;
    canvasHeight: number;
    canvasColor: string;
    backgroundImage: string | null;
}

const MockAppIcon = ({ color }: { color: string }) => (
    <View style={styles.appIconContainer}>
        <View style={[styles.appIcon, { backgroundColor: color }]} />
        <View style={styles.appIconLabel} />
    </View>
);

const Dock = () => (
    <View style={styles.dock}>
        <MockAppIcon color="#4CAF50" />
        <MockAppIcon color="#2196F3" />
        <MockAppIcon color="#FFC107" />
        <MockAppIcon color="#E91E63" />
    </View>
);

export const PreviewModal: React.FC<PreviewModalProps> = ({
    visible,
    onClose,
    elements,
    canvasWidth,
    canvasHeight,
    canvasColor,
    backgroundImage,
}) => {
    const colors = useColors();

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Wallpaper Background */}
                <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }} 
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
                
                {/* Overlay gradient for legibility */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* Header / Top Bar */}
                <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 50 : 30 }]}>
                    <View style={styles.statusBarMock}>
                        <Typography variant="labelMedium" style={{ color: 'white' }}>9:41</Typography>
                        <View style={styles.statusIcons}>
                            <MaterialCommunityIcons name="signal" size={16} color="white" />
                            <MaterialCommunityIcons name="wifi" size={16} color="white" style={{ marginHorizontal: 4 }} />
                            <MaterialCommunityIcons name="battery-70" size={16} color="white" />
                        </View>
                    </View>
                    
                    <View style={styles.headerControls}>
                        <Pressable 
                            style={styles.closeButton}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                onClose();
                            }}
                        >
                            <MaterialCommunityIcons name="close" size={24} color="white" />
                            <Typography variant="labelMedium" style={{ color: 'white', marginLeft: 8 }}>
                                Exit Preview
                            </Typography>
                        </Pressable>
                    </View>
                </View>

                {/* Content Area */}
                <View style={styles.content}>
                    {/* Mock Grid - Top Row */}
                    <View style={styles.iconRow}>
                        <MockAppIcon color="#FF5722" />
                        <MockAppIcon color="#9C27B0" />
                        <MockAppIcon color="#00BCD4" />
                        <MockAppIcon color="#3F51B5" />
                    </View>

                    {/* Widget Preview Container */}
                    <View style={styles.widgetContainer}>
                        <View 
                            style={[
                                styles.widgetFrame, 
                                { 
                                    width: canvasWidth, 
                                    height: canvasHeight,
                                    backgroundColor: canvasColor,
                                }
                            ]}
                        >
                            {/* Widget Background Image */}
                            {backgroundImage && (
                                <Image
                                    source={{ uri: backgroundImage }}
                                    style={StyleSheet.absoluteFillObject}
                                    resizeMode="cover"
                                />
                            )}

                            {/* Elements */}
                            {elements.map((element) => (
                                <ElementRenderer
                                    key={element.id}
                                    element={element}
                                />
                            ))}
                        </View>
                    </View>

                    {/* Mock Grid - Bottom Row (if space permits) */}
                    <View style={styles.iconRow}>
                        <MockAppIcon color="#607D8B" />
                        <MockAppIcon color="#795548" />
                        <MockAppIcon color="#8BC34A" />
                        <MockAppIcon color="#FF9800" />
                    </View>
                </View>

                {/* Bottom Dock */}
                <Dock />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        width: '100%',
        paddingHorizontal: 20,
    },
    statusBarMock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerControls: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    closeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        gap: 40,
    },
    widgetContainer: {
        // Add shadow for better visual separation from wallpaper
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 20,
    },
    widgetFrame: {
        overflow: 'hidden',
        // Start with standard rounding, widget itself might have different radius but this is container
        borderRadius: 22, 
    },
    dock: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        height: 90,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingHorizontal: 10,
        // Blur effect simulation
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 10,
    },
    appIconContainer: {
        alignItems: 'center',
    },
    appIcon: {
        width: 60,
        height: 60,
        borderRadius: 14,
        marginBottom: 8,
    },
    appIconLabel: {
        width: 40,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderRadius: 3,
    },
});
