/**
 * WidgetCraft - Shortcut Widget Templates
 * App shortcuts and quick action grids
 *
 * COORDINATE SYSTEM: All components use top-left positioning.
 * (x, y) = top-left corner of the component bounding box.
 * Widget sizes: small=180×90, medium=180×180, large=360×180, extraLarge=360×360
 */

import { WidgetTemplate } from '../types';

// ============================================
// Shortcuts Grid - 2x2 (medium: 180×180)
// Layout: 4 shortcut buttons in a 2×2 grid
// Grid: 20px pad, 65×65 cells, 10px gap
// Col1: x=20, Col2: x=95
// Row1: y=20, Row2: y=95
// Icon centered in each cell: x + (65-28)/2 = x+18.5 ≈ x+19
// ============================================

export const shortcutsGrid: WidgetTemplate = {
    id: 'shortcuts-grid',
    name: 'Shortcuts Grid',
    description: '4 app shortcuts in grid',
    category: 'shortcuts',
    size: 'medium',
    components: {
        bg: {
            id: 'bg',
            type: 'shape',
            x: 0,
            y: 0,
            width: 180,
            height: 180,
            shapeType: 'squircle',
            fill: 'surface',
            cornerRadius: 32,
        },
        // Top-left shortcut
        shortcut1Bg: {
            id: 'shortcut1Bg',
            type: 'shape',
            x: 20,
            y: 20,
            width: 65,
            height: 65,
            shapeType: 'squircle',
            fill: 'primaryContainer',
            cornerRadius: 16,
        },
        shortcut1Icon: {
            id: 'shortcut1Icon',
            type: 'icon',
            x: 39,
            y: 39,
            width: 28,
            height: 28,
            name: 'google',
            color: 'onPrimaryContainer',
            size: 28,
        },
        // Top-right shortcut
        shortcut2Bg: {
            id: 'shortcut2Bg',
            type: 'shape',
            x: 95,
            y: 20,
            width: 65,
            height: 65,
            shapeType: 'squircle',
            fill: 'secondaryContainer',
            cornerRadius: 16,
        },
        shortcut2Icon: {
            id: 'shortcut2Icon',
            type: 'icon',
            x: 114,
            y: 39,
            width: 28,
            height: 28,
            name: 'camera',
            color: 'onSecondaryContainer',
            size: 28,
        },
        // Bottom-left shortcut
        shortcut3Bg: {
            id: 'shortcut3Bg',
            type: 'shape',
            x: 20,
            y: 95,
            width: 65,
            height: 65,
            shapeType: 'squircle',
            fill: 'tertiaryContainer',
            cornerRadius: 16,
        },
        shortcut3Icon: {
            id: 'shortcut3Icon',
            type: 'icon',
            x: 39,
            y: 114,
            width: 28,
            height: 28,
            name: 'message',
            color: 'onTertiaryContainer',
            size: 28,
        },
        // Bottom-right shortcut
        shortcut4Bg: {
            id: 'shortcut4Bg',
            type: 'shape',
            x: 95,
            y: 95,
            width: 65,
            height: 65,
            shapeType: 'squircle',
            fill: 'surfaceVariant',
            cornerRadius: 16,
        },
        shortcut4Icon: {
            id: 'shortcut4Icon',
            type: 'icon',
            x: 114,
            y: 114,
            width: 28,
            height: 28,
            name: 'cog',
            color: 'onSurfaceVariant',
            size: 28,
        },
    },
    componentOrder: [
        'bg',
        'shortcut1Bg', 'shortcut1Icon',
        'shortcut2Bg', 'shortcut2Icon',
        'shortcut3Bg', 'shortcut3Icon',
        'shortcut4Bg', 'shortcut4Icon',
    ],
    backgroundColor: 'transparent',
    colorScheme: {
        primary: 'primary',
        secondary: 'secondary',
        accent: 'tertiary',
        background: 'surface',
        onBackground: 'onSurface',
    },
    dataBindings: [],
};

// ============================================
// Shortcuts Row (large: 360×180)
// Layout: 4 shortcuts in a horizontal row, centered vertically
// 360px wide, 4 items of 60px = 240px. Gap = (360-240)/5 = 24px
// Col positions: 24, 108, 192, 276
// Centered vertically: (180-60)/2 = 60
// Icon (size 24) centered: x + (60-24)/2 = x+18, y + (60-24)/2 = y+18
// ============================================

export const shortcutsRow: WidgetTemplate = {
    id: 'shortcuts-row',
    name: 'Shortcuts Row',
    description: '4 shortcuts in horizontal row',
    category: 'shortcuts',
    size: 'large',
    components: {
        bg: {
            id: 'bg',
            type: 'shape',
            x: 0,
            y: 0,
            width: 360,
            height: 180,
            shapeType: 'squircle',
            fill: 'surfaceVariant',
            cornerRadius: 32,
        },
        // Shortcut 1
        s1Bg: {
            id: 's1Bg',
            type: 'shape',
            x: 24,
            y: 60,
            width: 60,
            height: 60,
            shapeType: 'squircle',
            fill: 'primaryContainer',
            cornerRadius: 16,
        },
        s1Icon: {
            id: 's1Icon',
            type: 'icon',
            x: 42,
            y: 78,
            width: 24,
            height: 24,
            name: 'phone',
            color: 'onPrimaryContainer',
            size: 24,
        },
        // Shortcut 2
        s2Bg: {
            id: 's2Bg',
            type: 'shape',
            x: 108,
            y: 60,
            width: 60,
            height: 60,
            shapeType: 'squircle',
            fill: 'secondaryContainer',
            cornerRadius: 16,
        },
        s2Icon: {
            id: 's2Icon',
            type: 'icon',
            x: 126,
            y: 78,
            width: 24,
            height: 24,
            name: 'email',
            color: 'onSecondaryContainer',
            size: 24,
        },
        // Shortcut 3
        s3Bg: {
            id: 's3Bg',
            type: 'shape',
            x: 192,
            y: 60,
            width: 60,
            height: 60,
            shapeType: 'squircle',
            fill: 'tertiaryContainer',
            cornerRadius: 16,
        },
        s3Icon: {
            id: 's3Icon',
            type: 'icon',
            x: 210,
            y: 78,
            width: 24,
            height: 24,
            name: 'calendar',
            color: 'onTertiaryContainer',
            size: 24,
        },
        // Shortcut 4
        s4Bg: {
            id: 's4Bg',
            type: 'shape',
            x: 276,
            y: 60,
            width: 60,
            height: 60,
            shapeType: 'squircle',
            fill: 'primary',
            cornerRadius: 16,
        },
        s4Icon: {
            id: 's4Icon',
            type: 'icon',
            x: 294,
            y: 78,
            width: 24,
            height: 24,
            name: 'plus',
            color: 'onPrimary',
            size: 24,
        },
    },
    componentOrder: [
        'bg',
        's1Bg', 's1Icon',
        's2Bg', 's2Icon',
        's3Bg', 's3Icon',
        's4Bg', 's4Icon',
    ],
    backgroundColor: 'transparent',
    colorScheme: {
        primary: 'primary',
        secondary: 'secondary',
        accent: 'tertiary',
        background: 'surfaceVariant',
        onBackground: 'onSurfaceVariant',
    },
    dataBindings: [],
};

// Export all shortcut templates
export const shortcutTemplates = [
    shortcutsGrid,
    shortcutsRow,
];
