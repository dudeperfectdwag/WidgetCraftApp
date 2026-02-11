/**
 * WidgetCraft - Main Navigator
 * Root navigation configuration with tabs and stack
 */

import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@theme/index';
import { RootStackParamList, MainTabParamList } from './types';
import { CustomTabBar } from './CustomTabBar';

// Import screens
import {
    HomeScreen,
    TemplatesScreen,
    CreateScreen,
    LibraryScreen,
    SettingsScreen,
    EditorScreen,
    DataScreen,
    SearchScreen,
    ScriptEditorScreen,
} from '@screens/index';

// ============================================
// Stack & Tab Navigators
// ============================================

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ============================================
// Main Tab Navigator
// ============================================

const MainTabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} />
            <Tab.Screen name="TemplatesTab" component={TemplatesScreen} />
            <Tab.Screen name="CreateTab" component={CreateScreen} />
            <Tab.Screen name="LibraryTab" component={LibraryScreen} />
            <Tab.Screen name="SettingsTab" component={SettingsScreen} />
        </Tab.Navigator>
    );
};

// ============================================
// Root Stack Navigator
// ============================================

export const RootNavigator: React.FC = () => {
    const { isDark, colors } = useTheme();

    // Create custom navigation theme based on our Material You theme
    const navigationTheme = {
        ...(isDark ? DarkTheme : DefaultTheme),
        colors: {
            ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
            primary: colors.primary,
            background: colors.background,
            card: colors.surfaceContainerLow,
            text: colors.onSurface,
            border: colors.outlineVariant,
            notification: colors.error,
        },
    };

    return (
        <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: 300,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                }}
            >
                <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                <Stack.Screen name="Editor" component={EditorScreen} />
                <Stack.Screen name="ScriptEditor" component={ScriptEditorScreen} />
                <Stack.Screen name="Data" component={DataScreen} />
                <Stack.Screen name="Search" component={SearchScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
