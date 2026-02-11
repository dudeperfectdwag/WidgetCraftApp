import React from 'react';
import { View, Modal, StyleSheet, Switch, Pressable, ScrollView } from 'react-native';
import { useColors } from '../../theme/hooks';
import { TitleMedium, BodyMedium, LabelMedium } from '../../components/common';
import { useCanvas } from '../../canvas/CanvasContext';

interface CanvasSettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const GRID_SIZES = [4, 8, 12, 16, 20, 24];

export const CanvasSettingsModal: React.FC<CanvasSettingsModalProps> = ({ visible, onClose }) => {
    const colors = useColors();
    const { state, dispatch } = useCanvas();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable 
                    onPress={e => e.stopPropagation()}
                    style={[styles.content, { backgroundColor: colors.surface }]}
                >
                    <TitleMedium style={{ color: colors.onSurface, marginBottom: 20 }}>
                        Canvas Settings
                    </TitleMedium>

                    {/* Snap to Grid */}
                    <View style={styles.row}>
                        <View style={styles.textContainer}>
                            <BodyMedium style={{ color: colors.onSurface }}>Snap to Grid</BodyMedium>
                            <LabelMedium style={{ color: colors.onSurfaceVariant }}>
                                Align elements automatically
                            </LabelMedium>
                        </View>
                        <Switch
                            value={state.snapToGrid}
                            onValueChange={() => dispatch({ type: 'TOGGLE_SNAP' })}
                            trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
                            thumbColor={state.snapToGrid ? colors.onPrimary : colors.outline}
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

                    {/* Show Grid */}
                    <View style={styles.row}>
                        <View style={styles.textContainer}>
                            <BodyMedium style={{ color: colors.onSurface }}>Show Grid</BodyMedium>
                            <LabelMedium style={{ color: colors.onSurfaceVariant }}>
                                Display alignment lines
                            </LabelMedium>
                        </View>
                        <Switch
                            value={state.showGrid}
                            onValueChange={() => dispatch({ type: 'TOGGLE_GRID' })}
                            trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
                            thumbColor={state.showGrid ? colors.onPrimary : colors.outline}
                        />
                    </View>

                    {/* Grid Size */}
                    {state.snapToGrid && (
                        <>
                            <LabelMedium style={{ color: colors.onSurfaceVariant, marginTop: 20, marginBottom: 12 }}>
                                Grid Size: {state.gridSize}px
                            </LabelMedium>
                            <View style={styles.sizeContainer}>
                                {GRID_SIZES.map(size => (
                                    <Pressable
                                        key={size}
                                        onPress={() => dispatch({ type: 'SET_GRID_SIZE', size })}
                                        style={[
                                            styles.sizeChip,
                                            { 
                                                backgroundColor: state.gridSize === size 
                                                    ? colors.primaryContainer 
                                                    : colors.surfaceContainerHigh,
                                                borderColor: state.gridSize === size 
                                                    ? colors.primary 
                                                    : 'transparent',
                                                borderWidth: 1
                                            }
                                        ]}
                                    >
                                        <BodyMedium style={{ 
                                            color: state.gridSize === size 
                                                ? colors.onPrimaryContainer 
                                                : colors.onSurface 
                                        }}>
                                            {size}
                                        </BodyMedium>
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    )}

                    <View style={styles.actions}>
                        <Pressable 
                            style={[styles.button, { backgroundColor: colors.primary }]}
                            onPress={onClose}
                        >
                            <BodyMedium style={{ color: colors.onPrimary }}>Done</BodyMedium>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    textContainer: {
        flex: 1,
        paddingRight: 16,
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 12,
    },
    sizeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sizeChip: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actions: {
        marginTop: 24,
        alignItems: 'flex-end',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 24,
    },
});
