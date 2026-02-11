/**
 * WidgetCraft - Navigation Types
 * TypeScript definitions for navigation
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { CanvasElement } from '@canvas/CanvasContext';

// ============================================
// ============================================
export type RootStackParamList = {
    MainTabs: NavigatorScreenParams<MainTabParamList>;
    Editor: {
        widgetId?: string;
        // Template params
        templateId?: string;
        templateElements?: Record<string, CanvasElement>;
        templateElementOrder?: string[];
        templateCanvasSize?: { width: number; height: number };
        templateName?: string;
    } | undefined;
    Data: undefined;
    Search: undefined;
    WidgetPreview: { widgetId: string };
    ScriptEditor: { scriptId?: string; widgetId: string };
    TemplateDetail: { templateId: string };
    ColorPicker: {
        initialColor?: string;
        onColorSelected?: (color: string) => void;
    };
    Settings: undefined;
};

// ============================================
// Main Tab Navigator
// ============================================

export type MainTabParamList = {
    HomeTab: undefined;
    TemplatesTab: undefined;
    CreateTab: undefined;
    LibraryTab: undefined;
    SettingsTab: undefined;
};


declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}
