/**
 * WidgetCraft - Resize Handles Component
 * Draggable handles for resizing canvas elements with:
 * - 8-point resize handles (corners + edges)
 * - Rotation handle
 * - Visual feedback on interaction
 * - Gesture-based resizing
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@theme/index';


// Types

export type HandlePosition =
    | 'nw' | 'n' | 'ne'
    | 'w' | 'e'
    | 'sw' | 's' | 'se'
    | 'rotate';

export interface ResizeHandlesProps {
    width: number;
    height: number;
    onResizeStart?: (handle: HandlePosition) => void;
    onResize?: (handle: HandlePosition, deltaX: number, deltaY: number) => void;
    onResizeEnd?: (handle: HandlePosition) => void;
    onRotateStart?: () => void;
    onRotate?: (angle: number) => void;
    onRotateEnd?: () => void;
    showRotation?: boolean;
    color?: string;
}

// Single Handle Component

interface HandleProps {
    position: HandlePosition;
    x: number;
    y: number;
    cursor?: string;
    isCorner: boolean;
    color: string;
    onDragStart?: () => void;
    onDrag?: (deltaX: number, deltaY: number) => void;
    onDragEnd?: () => void;
}

const Handle: React.FC<HandleProps> = ({
    position,
    x,
    y,
    isCorner,
    color,
    onDragStart,
    onDrag,
    onDragEnd,
}) => {
    const scale = useSharedValue(1);
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            startX.value = 0;
            startY.value = 0;
            scale.value = withTiming(1.2, { duration: 80 });
            onDragStart?.();
        })
        .onUpdate((event) => {
            const deltaX = event.translationX - startX.value;
            const deltaY = event.translationY - startY.value;
            startX.value = event.translationX;
            startY.value = event.translationY;
            onDrag?.(event.translationX, event.translationY);
        })
        .onEnd(() => {
            scale.value = withTiming(1, { duration: 80 });
            onDragEnd?.();
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handleSize = isCorner ? 12 : 8;
    const handleOffset = handleSize / 2;

    return (
        <GestureDetector gesture={panGesture}>
            <Animated.View
                style={[
                    styles.handle,
                    {
                        width: handleSize,
                        height: handleSize,
                        borderRadius: isCorner ? 3 : handleSize / 2,
                        backgroundColor: '#FFFFFF',
                        borderColor: color,
                        left: x - handleOffset,
                        top: y - handleOffset,
                    },
                    animatedStyle,
                ]}
            />
        </GestureDetector>
    );
};

// ============================================
// Rotation Handle
// ============================================

interface RotationHandleProps {
    x: number;
    y: number;
    color: string;
    onRotateStart?: () => void;
    onRotate?: (angle: number) => void;
    onRotateEnd?: () => void;
}

const RotationHandle: React.FC<RotationHandleProps> = ({
    x,
    y,
    color,
    onRotateStart,
    onRotate,
    onRotateEnd,
}) => {
    const scale = useSharedValue(1);
    const centerX = useSharedValue(0);
    const centerY = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            scale.value = withTiming(1.2, { duration: 80 });
            onRotateStart?.();
        })
        .onUpdate((event) => {
            // Calculate angle from center
            const angle = Math.atan2(event.translationY, event.translationX) * (180 / Math.PI);
            onRotate?.(angle);
        })
        .onEnd(() => {
            scale.value = withTiming(1, { duration: 80 });
            onRotateEnd?.();
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <View style={[styles.rotationContainer, { left: x - 12, top: y - 32 }]}>
            {/* Connection line */}
            <View style={[styles.rotationLine, { backgroundColor: color }]} />

            <GestureDetector gesture={panGesture}>
                <Animated.View
                    style={[
                        styles.rotationHandle,
                        { backgroundColor: color },
                        animatedStyle,
                    ]}
                >
                    <MaterialCommunityIcons name="rotate-right" size={12} color="#FFFFFF" />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

// ============================================
// Main Resize Handles Component
// ============================================

export const ResizeHandles: React.FC<ResizeHandlesProps> = ({
    width,
    height,
    onResizeStart,
    onResize,
    onResizeEnd,
    onRotateStart,
    onRotate,
    onRotateEnd,
    showRotation = true,
    color,
}) => {
    const colors = useColors();
    const handleColor = color || colors.primary;

    // Calculate handle positions
    const handles: { position: HandlePosition; x: number; y: number; isCorner: boolean }[] = [
        // Corners
        { position: 'nw', x: 0, y: 0, isCorner: true },
        { position: 'ne', x: width, y: 0, isCorner: true },
        { position: 'sw', x: 0, y: height, isCorner: true },
        { position: 'se', x: width, y: height, isCorner: true },
        // Edges
        { position: 'n', x: width / 2, y: 0, isCorner: false },
        { position: 's', x: width / 2, y: height, isCorner: false },
        { position: 'w', x: 0, y: height / 2, isCorner: false },
        { position: 'e', x: width, y: height / 2, isCorner: false },
    ];

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Selection border */}
            <View
                style={[
                    styles.selectionBorder,
                    {
                        width,
                        height,
                        borderColor: handleColor,
                    },
                ]}
            />

            {/* Resize handles */}
            {handles.map((handle) => (
                <Handle
                    key={handle.position}
                    position={handle.position}
                    x={handle.x}
                    y={handle.y}
                    isCorner={handle.isCorner}
                    color={handleColor}
                    onDragStart={() => onResizeStart?.(handle.position)}
                    onDrag={(deltaX, deltaY) => onResize?.(handle.position, deltaX, deltaY)}
                    onDragEnd={() => onResizeEnd?.(handle.position)}
                />
            ))}

            {/* Rotation handle */}
            {showRotation && (
                <RotationHandle
                    x={width / 2}
                    y={0}
                    color={handleColor}
                    onRotateStart={onRotateStart}
                    onRotate={onRotate}
                    onRotateEnd={onRotateEnd}
                />
            )}
        </View>
    );
};

// ============================================
// Bounding Box for Multi-Select
// ============================================

export interface BoundingBoxProps {
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
}

export const BoundingBox: React.FC<BoundingBoxProps> = ({
    x,
    y,
    width,
    height,
    color,
}) => {
    const colors = useColors();
    const boxColor = color || colors.primary;

    return (
        <View
            style={[
                styles.boundingBox,
                {
                    left: x,
                    top: y,
                    width,
                    height,
                    borderColor: boxColor,
                },
            ]}
        >
            {/* Corner indicators */}
            <View style={[styles.boundingCorner, styles.boundingNW, { backgroundColor: boxColor }]} />
            <View style={[styles.boundingCorner, styles.boundingNE, { backgroundColor: boxColor }]} />
            <View style={[styles.boundingCorner, styles.boundingSW, { backgroundColor: boxColor }]} />
            <View style={[styles.boundingCorner, styles.boundingSE, { backgroundColor: boxColor }]} />
        </View>
    );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    handle: {
        position: 'absolute',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    selectionBorder: {
        position: 'absolute',
        borderWidth: 2,
        borderStyle: 'solid',
    },
    rotationContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    rotationLine: {
        width: 1,
        height: 20,
    },
    rotationHandle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    boundingBox: {
        position: 'absolute',
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    boundingCorner: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 1,
    },
    boundingNW: { top: -3, left: -3 },
    boundingNE: { top: -3, right: -3 },
    boundingSW: { bottom: -3, left: -3 },
    boundingSE: { bottom: -3, right: -3 },
});

export default ResizeHandles;
