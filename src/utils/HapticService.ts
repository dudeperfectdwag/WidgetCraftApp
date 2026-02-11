/**
 * HapticService - Global haptic feedback wrapper
 * 
 * Drop-in replacement for `expo-haptics` that respects a global enabled toggle.
 * Import `* as Haptics from '@utils/HapticService'` instead of `expo-haptics`.
 * The API surface stays identical so call sites don't need changes.
 */

import * as ExpoHaptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@haptics_enabled';

// Module-level state
let _enabled = true;
let _loaded = false;

// ── Persistence ──────────────────────────────────────────────

/** Load saved haptic preference from storage. Call once at app startup. */
export const loadHapticsSetting = async (): Promise<boolean> => {
    try {
        const val = await AsyncStorage.getItem(STORAGE_KEY);
        _enabled = val !== 'false'; // default true if key absent
        _loaded = true;
    } catch {
        _enabled = true;
    }
    return _enabled;
};

/** Update the enabled flag and persist it. */
export const setHapticsEnabled = async (enabled: boolean): Promise<void> => {
    _enabled = enabled;
    try {
        await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
    } catch {
        // Silently fail – haptic preference is non-critical
    }
};

/** Read current enabled state synchronously. */
export const isHapticsEnabled = (): boolean => _enabled;

// ── Wrapped Haptic Functions ─────────────────────────────────

export const impactAsync = async (
    style: ExpoHaptics.ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle.Medium,
): Promise<void> => {
    if (_enabled) {
        await ExpoHaptics.impactAsync(style);
    }
};

export const notificationAsync = async (
    type: ExpoHaptics.NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType.Success,
): Promise<void> => {
    if (_enabled) {
        await ExpoHaptics.notificationAsync(type);
    }
};

export const selectionAsync = async (): Promise<void> => {
    if (_enabled) {
        await ExpoHaptics.selectionAsync();
    }
};

// ── Re-export enums so call-site code stays identical ────────

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;
