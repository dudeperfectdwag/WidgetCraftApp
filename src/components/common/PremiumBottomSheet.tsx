/**
 * WidgetCraft - Premium Bottom Sheet Component
 * Beautiful bottom sheets with spring animations and gestures
 */

import React, {
    forwardRef,
    useCallback,
    useMemo,
    ReactNode,
    useImperativeHandle,
    useRef,
} from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
    Pressable,
} from 'react-native';
import BottomSheet, {
    BottomSheetBackdrop,
    BottomSheetView,
    BottomSheetScrollView,
    BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from '@utils/HapticService';
import { useColors } from '@theme/index';
import { LAYOUT } from '@constants/index';

// ============================================
// Types
// ============================================

export interface PremiumBottomSheetRef {
    open: () => void;
    close: () => void;
    snapToIndex: (index: number) => void;
}

export interface PremiumBottomSheetProps {
    children: ReactNode;
    snapPoints?: (string | number)[];
    initialIndex?: number;
    enablePanDownToClose?: boolean;
    enableDynamicSizing?: boolean;
    scrollable?: boolean;
    showHandle?: boolean;
    showBackdrop?: boolean;
    backdropOpacity?: number;
    onOpen?: () => void;
    onClose?: () => void;
    onChange?: (index: number) => void;
    style?: StyleProp<ViewStyle>;
    // Optional header
    header?: ReactNode;
}

// ============================================
// Component
// ============================================

export const PremiumBottomSheet = forwardRef<PremiumBottomSheetRef, PremiumBottomSheetProps>(
    (
        {
            children,
            snapPoints: customSnapPoints,
            initialIndex = -1,
            enablePanDownToClose = true,
            enableDynamicSizing = false,
            scrollable = false,
            showHandle = true,
            showBackdrop = true,
            backdropOpacity = 0.5,
            onOpen,
            onClose,
            onChange,
            style,
            header,
        },
        ref
    ) => {
        const colors = useColors();
        const bottomSheetRef = useRef<BottomSheet>(null);
        const animatedIndex = useSharedValue(initialIndex);

        // Default snap points
        const snapPoints = useMemo(
            () => customSnapPoints || ['25%', '50%', '90%'],
            [customSnapPoints]
        );

        // Expose methods via ref
        useImperativeHandle(ref, () => ({
            open: () => {
                bottomSheetRef.current?.snapToIndex(0);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            close: () => {
                bottomSheetRef.current?.close();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            snapToIndex: (index: number) => {
                bottomSheetRef.current?.snapToIndex(index);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
        }));

        // Handle sheet changes
        const handleSheetChanges = useCallback(
            (index: number) => {
                animatedIndex.value = index;
                onChange?.(index);

                if (index === -1) {
                    onClose?.();
                } else if (index >= 0) {
                    onOpen?.();
                }

                // Haptic feedback on snap
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
            [onChange, onOpen, onClose]
        );

        // Custom backdrop
        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) =>
                showBackdrop ? (
                    <BottomSheetBackdrop
                        {...props}
                        disappearsOnIndex={-1}
                        appearsOnIndex={0}
                        opacity={backdropOpacity}
                        pressBehavior="close"
                    />
                ) : null,
            [showBackdrop, backdropOpacity]
        );

        // Custom handle
        const renderHandle = useCallback(() => {
            if (!showHandle) return null;

            return (
                <View style={styles.handleContainer}>
                    <View
                        style={[
                            styles.handle,
                            { backgroundColor: colors.outlineVariant },
                        ]}
                    />
                </View>
            );
        }, [showHandle, colors]);

        // Container style
        const containerStyle = useMemo(
            () => ({
                backgroundColor: colors.surfaceContainerLow,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
            }),
            [colors]
        );

        const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

        return (
            <BottomSheet
                ref={bottomSheetRef}
                index={initialIndex}
                snapPoints={enableDynamicSizing ? undefined : snapPoints}
                enableDynamicSizing={enableDynamicSizing}
                enablePanDownToClose={enablePanDownToClose}
                onChange={handleSheetChanges}
                backdropComponent={renderBackdrop}
                handleComponent={renderHandle}
                backgroundStyle={containerStyle}
                style={style}
            >
                {header && (
                    <View style={styles.headerContainer}>
                        {header}
                    </View>
                )}
                <ContentWrapper style={styles.contentContainer}>
                    {children}
                </ContentWrapper>
            </BottomSheet>
        );
    }
);

PremiumBottomSheet.displayName = 'PremiumBottomSheet';

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 32,
        height: 4,
        borderRadius: 2,
    },
    headerContainer: {
        paddingHorizontal: LAYOUT.SPACING.md,
        paddingBottom: LAYOUT.SPACING.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: LAYOUT.SPACING.md,
        paddingBottom: LAYOUT.SPACING.lg,
    },
});

export default PremiumBottomSheet;
