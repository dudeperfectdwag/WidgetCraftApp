/**
 * Material Design 3 Shape System
 * Based on https://m3.material.io/styles/shape
 * 
 * This module provides:
 * - Corner radius scale (10 levels)
 * - Shape families (rounded, cut)
 * - Asymmetric corner support
 * - Shape morphing utilities
 * - 35+ MD3 shape presets
 */

// ============================================
// MD3 Corner Radius Scale
// ============================================

export const MD3_CORNER_RADIUS = {
    none: 0,           // Level 0: Sharp corners
    extraSmall: 4,     // Level 1: Subtle rounding
    small: 8,          // Level 2: Light rounding
    medium: 12,        // Level 3: Default for many components
    large: 16,         // Level 4: Cards, dialogs
    largeIncreased: 20, // Level 5
    extraLarge: 28,    // Level 6: FABs, bottom sheets
    extraLargeIncreased: 32, // Level 7
    extraExtraLarge: 48, // Level 8: Large containers
    full: 999,         // Level 9: Fully rounded (stadium shape)
} as const;

export type CornerRadiusLevel = keyof typeof MD3_CORNER_RADIUS;

// ============================================
// Corner Configuration Types
// ============================================

export type CornerFamily = 'rounded' | 'cut';

export interface CornerConfig {
    family: CornerFamily;
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
}

// Preset corner configurations
export const MD3_CORNER_PRESETS: Record<string, CornerConfig> = {
    // Uniform rounded corners
    sharpRounded: { family: 'rounded', topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
    extraSmallRounded: { family: 'rounded', topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 },
    smallRounded: { family: 'rounded', topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
    mediumRounded: { family: 'rounded', topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
    largeRounded: { family: 'rounded', topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 },
    extraLargeRounded: { family: 'rounded', topLeft: 28, topRight: 28, bottomRight: 28, bottomLeft: 28 },
    fullRounded: { family: 'rounded', topLeft: 999, topRight: 999, bottomRight: 999, bottomLeft: 999 },
    
    // Uniform cut corners
    sharpCut: { family: 'cut', topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0 },
    extraSmallCut: { family: 'cut', topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 },
    smallCut: { family: 'cut', topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
    mediumCut: { family: 'cut', topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
    largeCut: { family: 'cut', topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 },
    extraLargeCut: { family: 'cut', topLeft: 28, topRight: 28, bottomRight: 28, bottomLeft: 28 },
    
    // Asymmetric - Top rounded only
    topRoundedSmall: { family: 'rounded', topLeft: 8, topRight: 8, bottomRight: 0, bottomLeft: 0 },
    topRoundedMedium: { family: 'rounded', topLeft: 12, topRight: 12, bottomRight: 0, bottomLeft: 0 },
    topRoundedLarge: { family: 'rounded', topLeft: 16, topRight: 16, bottomRight: 0, bottomLeft: 0 },
    topRoundedExtraLarge: { family: 'rounded', topLeft: 28, topRight: 28, bottomRight: 0, bottomLeft: 0 },
    
    // Asymmetric - Bottom rounded only
    bottomRoundedSmall: { family: 'rounded', topLeft: 0, topRight: 0, bottomRight: 8, bottomLeft: 8 },
    bottomRoundedMedium: { family: 'rounded', topLeft: 0, topRight: 0, bottomRight: 12, bottomLeft: 12 },
    bottomRoundedLarge: { family: 'rounded', topLeft: 0, topRight: 0, bottomRight: 16, bottomLeft: 16 },
    bottomRoundedExtraLarge: { family: 'rounded', topLeft: 0, topRight: 0, bottomRight: 28, bottomLeft: 28 },
    
    // Asymmetric - Left rounded only
    leftRoundedSmall: { family: 'rounded', topLeft: 8, topRight: 0, bottomRight: 0, bottomLeft: 8 },
    leftRoundedMedium: { family: 'rounded', topLeft: 12, topRight: 0, bottomRight: 0, bottomLeft: 12 },
    leftRoundedLarge: { family: 'rounded', topLeft: 16, topRight: 0, bottomRight: 0, bottomLeft: 16 },
    
    // Asymmetric - Right rounded only
    rightRoundedSmall: { family: 'rounded', topLeft: 0, topRight: 8, bottomRight: 8, bottomLeft: 0 },
    rightRoundedMedium: { family: 'rounded', topLeft: 0, topRight: 12, bottomRight: 12, bottomLeft: 0 },
    rightRoundedLarge: { family: 'rounded', topLeft: 0, topRight: 16, bottomRight: 16, bottomLeft: 0 },
    
    // Diagonal asymmetric
    diagonalTLBR: { family: 'rounded', topLeft: 16, topRight: 0, bottomRight: 16, bottomLeft: 0 },
    diagonalTRBL: { family: 'rounded', topLeft: 0, topRight: 16, bottomRight: 0, bottomLeft: 16 },
    
    // Ticket shape (two sides rounded)
    ticketHorizontal: { family: 'rounded', topLeft: 999, topRight: 0, bottomRight: 0, bottomLeft: 999 },
    ticketVertical: { family: 'rounded', topLeft: 999, topRight: 999, bottomRight: 0, bottomLeft: 0 },
    
    // Mixed cut and rounded (via special handling)
    cutTopRoundedBottom: { family: 'rounded', topLeft: 0, topRight: 0, bottomRight: 12, bottomLeft: 12 },
};

// ============================================
// MD3 Shape Presets (35+ shapes)
// ============================================

export interface ShapePreset {
    id: string;
    name: string;
    category: 'basic' | 'geometric' | 'arrows' | 'symbols' | 'containers' | 'decorative' | 'communication';
    icon: string;
    path?: string; // SVG path for complex shapes
    cornerConfig?: CornerConfig; // For rectangle-based shapes
    type: 'rectangle' | 'ellipse' | 'polygon' | 'path' | 'star';
    properties?: Record<string, number>; // Additional shape properties
}

export const MD3_SHAPE_PRESETS: ShapePreset[] = [
    // ============================================
    // Basic Shapes
    // ============================================
    {
        id: 'rectangle',
        name: 'Rectangle',
        category: 'basic',
        icon: 'rectangle-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.sharpRounded,
    },
    {
        id: 'rounded-rectangle-sm',
        name: 'Rounded Rectangle (S)',
        category: 'basic',
        icon: 'rectangle-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.smallRounded,
    },
    {
        id: 'rounded-rectangle-md',
        name: 'Rounded Rectangle (M)',
        category: 'basic',
        icon: 'rectangle-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.mediumRounded,
    },
    {
        id: 'rounded-rectangle-lg',
        name: 'Rounded Rectangle (L)',
        category: 'basic',
        icon: 'rectangle-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.largeRounded,
    },
    {
        id: 'rounded-rectangle-xl',
        name: 'Rounded Rectangle (XL)',
        category: 'basic',
        icon: 'rectangle-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.extraLargeRounded,
    },
    {
        id: 'stadium',
        name: 'Stadium (Pill)',
        category: 'basic',
        icon: 'pill',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.fullRounded,
    },
    {
        id: 'circle',
        name: 'Circle',
        category: 'basic',
        icon: 'circle-outline',
        type: 'ellipse',
    },
    {
        id: 'ellipse',
        name: 'Ellipse',
        category: 'basic',
        icon: 'ellipse-outline',
        type: 'ellipse',
    },
    {
        id: 'square',
        name: 'Square',
        category: 'basic',
        icon: 'square-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.sharpRounded,
        properties: { aspectRatio: 1 },
    },
    
    // ============================================
    // Cut Corner Shapes
    // ============================================
    {
        id: 'cut-rectangle-sm',
        name: 'Cut Rectangle (S)',
        category: 'basic',
        icon: 'rectangle-outline',
        type: 'path',
        cornerConfig: MD3_CORNER_PRESETS.smallCut,
    },
    {
        id: 'cut-rectangle-md',
        name: 'Cut Rectangle (M)',
        category: 'basic',
        icon: 'rectangle-outline',
        type: 'path',
        cornerConfig: MD3_CORNER_PRESETS.mediumCut,
    },
    {
        id: 'cut-rectangle-lg',
        name: 'Cut Rectangle (L)',
        category: 'basic',
        icon: 'rectangle-outline',
        type: 'path',
        cornerConfig: MD3_CORNER_PRESETS.largeCut,
    },
    
    // ============================================
    // Geometric Shapes
    // ============================================
    {
        id: 'triangle',
        name: 'Triangle',
        category: 'geometric',
        icon: 'triangle-outline',
        type: 'polygon',
        properties: { sides: 3 },
    },
    {
        id: 'pentagon',
        name: 'Pentagon',
        category: 'geometric',
        icon: 'pentagon-outline',
        type: 'polygon',
        properties: { sides: 5 },
    },
    {
        id: 'hexagon',
        name: 'Hexagon',
        category: 'geometric',
        icon: 'hexagon-outline',
        type: 'polygon',
        properties: { sides: 6 },
    },
    {
        id: 'heptagon',
        name: 'Heptagon',
        category: 'geometric',
        icon: 'heptagon-outline',
        type: 'polygon',
        properties: { sides: 7 },
    },
    {
        id: 'octagon',
        name: 'Octagon',
        category: 'geometric',
        icon: 'octagon-outline',
        type: 'polygon',
        properties: { sides: 8 },
    },
    {
        id: 'diamond',
        name: 'Diamond',
        category: 'geometric',
        icon: 'cards-diamond-outline',
        type: 'polygon',
        properties: { sides: 4, rotation: 45 },
    },
    {
        id: 'parallelogram',
        name: 'Parallelogram',
        category: 'geometric',
        icon: 'rectangle-outline',
        type: 'path',
        path: 'M0.2,0 L1,0 L0.8,1 L0,1 Z',
    },
    {
        id: 'trapezoid',
        name: 'Trapezoid',
        category: 'geometric',
        icon: 'rectangle-outline',
        type: 'path',
        path: 'M0.15,0 L0.85,0 L1,1 L0,1 Z',
    },
    
    // ============================================
    // Stars
    // ============================================
    {
        id: 'star-4',
        name: '4-Point Star',
        category: 'decorative',
        icon: 'star-four-points-outline',
        type: 'star',
        properties: { points: 4, innerRadius: 0.4 },
    },
    {
        id: 'star-5',
        name: '5-Point Star',
        category: 'decorative',
        icon: 'star-outline',
        type: 'star',
        properties: { points: 5, innerRadius: 0.4 },
    },
    {
        id: 'star-6',
        name: '6-Point Star',
        category: 'decorative',
        icon: 'star-david-outline',
        type: 'star',
        properties: { points: 6, innerRadius: 0.4 },
    },
    {
        id: 'star-8',
        name: '8-Point Star',
        category: 'decorative',
        icon: 'star-circle-outline',
        type: 'star',
        properties: { points: 8, innerRadius: 0.4 },
    },
    {
        id: 'starburst',
        name: 'Starburst',
        category: 'decorative',
        icon: 'star-shooting-outline',
        type: 'star',
        properties: { points: 12, innerRadius: 0.7 },
    },
    
    // ============================================
    // Arrows & Direction
    // ============================================
    {
        id: 'arrow-right',
        name: 'Arrow Right',
        category: 'arrows',
        icon: 'arrow-right-bold',
        type: 'path',
        path: 'M0,0.3 L0.6,0.3 L0.6,0 L1,0.5 L0.6,1 L0.6,0.7 L0,0.7 Z',
    },
    {
        id: 'arrow-left',
        name: 'Arrow Left',
        category: 'arrows',
        icon: 'arrow-left-bold',
        type: 'path',
        path: 'M1,0.3 L0.4,0.3 L0.4,0 L0,0.5 L0.4,1 L0.4,0.7 L1,0.7 Z',
    },
    {
        id: 'arrow-up',
        name: 'Arrow Up',
        category: 'arrows',
        icon: 'arrow-up-bold',
        type: 'path',
        path: 'M0.3,1 L0.3,0.4 L0,0.4 L0.5,0 L1,0.4 L0.7,0.4 L0.7,1 Z',
    },
    {
        id: 'arrow-down',
        name: 'Arrow Down',
        category: 'arrows',
        icon: 'arrow-down-bold',
        type: 'path',
        path: 'M0.3,0 L0.3,0.6 L0,0.6 L0.5,1 L1,0.6 L0.7,0.6 L0.7,0 Z',
    },
    {
        id: 'chevron-right',
        name: 'Chevron Right',
        category: 'arrows',
        icon: 'chevron-right',
        type: 'path',
        path: 'M0,0 L0.4,0 L1,0.5 L0.4,1 L0,1 L0.6,0.5 Z',
    },
    {
        id: 'chevron-left',
        name: 'Chevron Left',
        category: 'arrows',
        icon: 'chevron-left',
        type: 'path',
        path: 'M1,0 L0.6,0 L0,0.5 L0.6,1 L1,1 L0.4,0.5 Z',
    },
    {
        id: 'double-arrow',
        name: 'Double Arrow',
        category: 'arrows',
        icon: 'arrow-left-right-bold',
        type: 'path',
        path: 'M0,0.5 L0.25,0.2 L0.25,0.4 L0.75,0.4 L0.75,0.2 L1,0.5 L0.75,0.8 L0.75,0.6 L0.25,0.6 L0.25,0.8 Z',
    },
    
    // ============================================
    // Communication & UI
    // ============================================
    {
        id: 'speech-bubble',
        name: 'Speech Bubble',
        category: 'communication',
        icon: 'message-outline',
        type: 'path',
        path: 'M0.1,0 C0.04,0 0,0.04 0,0.1 L0,0.65 C0,0.71 0.04,0.75 0.1,0.75 L0.15,0.75 L0.15,1 L0.4,0.75 L0.9,0.75 C0.96,0.75 1,0.71 1,0.65 L1,0.1 C1,0.04 0.96,0 0.9,0 Z',
    },
    {
        id: 'speech-bubble-rounded',
        name: 'Rounded Speech Bubble',
        category: 'communication',
        icon: 'message-processing-outline',
        type: 'path',
        path: 'M0.15,0 C0.067,0 0,0.067 0,0.15 L0,0.55 C0,0.633 0.067,0.7 0.15,0.7 L0.18,0.7 L0.1,1 L0.45,0.7 L0.85,0.7 C0.933,0.7 1,0.633 1,0.55 L1,0.15 C1,0.067 0.933,0 0.85,0 Z',
    },
    {
        id: 'thought-bubble',
        name: 'Thought Bubble',
        category: 'communication',
        icon: 'thought-bubble-outline',
        type: 'path',
        path: 'M0.5,0 C0.27,0 0.08,0.15 0.08,0.33 C0.08,0.44 0.15,0.53 0.27,0.59 C0.24,0.67 0.18,0.73 0.1,0.78 C0.2,0.77 0.3,0.72 0.37,0.65 C0.41,0.66 0.45,0.67 0.5,0.67 C0.73,0.67 0.92,0.52 0.92,0.33 C0.92,0.15 0.73,0 0.5,0 Z M0.2,0.85 C0.15,0.85 0.11,0.88 0.11,0.92 C0.11,0.96 0.15,1 0.2,1 C0.25,1 0.29,0.96 0.29,0.92 C0.29,0.88 0.25,0.85 0.2,0.85 Z',
    },
    {
        id: 'callout-left',
        name: 'Callout Left',
        category: 'communication',
        icon: 'tooltip-outline',
        type: 'path',
        path: 'M0.15,0 L1,0 L1,1 L0.15,1 L0.15,0.65 L0,0.5 L0.15,0.35 Z',
    },
    {
        id: 'callout-right',
        name: 'Callout Right',
        category: 'communication',
        icon: 'tooltip-outline',
        type: 'path',
        path: 'M0,0 L0.85,0 L0.85,0.35 L1,0.5 L0.85,0.65 L0.85,1 L0,1 Z',
    },
    
    // ============================================
    // Containers & Cards
    // ============================================
    {
        id: 'card-elevated',
        name: 'Elevated Card',
        category: 'containers',
        icon: 'card-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.mediumRounded,
    },
    {
        id: 'card-filled',
        name: 'Filled Card',
        category: 'containers',
        icon: 'card',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.mediumRounded,
    },
    {
        id: 'sheet-bottom',
        name: 'Bottom Sheet',
        category: 'containers',
        icon: 'view-dashboard-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.topRoundedExtraLarge,
    },
    {
        id: 'sheet-side',
        name: 'Side Sheet',
        category: 'containers',
        icon: 'page-layout-sidebar-right',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.leftRoundedLarge,
    },
    {
        id: 'fab-container',
        name: 'FAB Shape',
        category: 'containers',
        icon: 'plus-box-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.largeRounded,
    },
    {
        id: 'fab-extended',
        name: 'Extended FAB',
        category: 'containers',
        icon: 'plus-box-multiple-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.largeRounded,
    },
    {
        id: 'chip',
        name: 'Chip Shape',
        category: 'containers',
        icon: 'label-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.smallRounded,
    },
    {
        id: 'badge',
        name: 'Badge',
        category: 'containers',
        icon: 'numeric-1-circle-outline',
        type: 'rectangle',
        cornerConfig: MD3_CORNER_PRESETS.fullRounded,
        properties: { aspectRatio: 1 },
    },
    
    // ============================================
    // Decorative Shapes
    // ============================================
    {
        id: 'heart',
        name: 'Heart',
        category: 'decorative',
        icon: 'heart-outline',
        type: 'path',
        path: 'M0.5,0.9 C0.12,0.65 0,0.45 0,0.3 C0,0.1 0.15,0 0.3,0 C0.4,0 0.47,0.05 0.5,0.12 C0.53,0.05 0.6,0 0.7,0 C0.85,0 1,0.1 1,0.3 C1,0.45 0.88,0.65 0.5,0.9 Z',
    },
    {
        id: 'cloud',
        name: 'Cloud',
        category: 'decorative',
        icon: 'cloud-outline',
        type: 'path',
        path: 'M0.85,0.75 L0.2,0.75 C0.09,0.75 0,0.66 0,0.55 C0,0.44 0.09,0.35 0.2,0.35 C0.2,0.35 0.21,0.35 0.21,0.35 C0.19,0.3 0.18,0.25 0.18,0.2 C0.18,0.09 0.27,0 0.38,0 C0.45,0 0.51,0.03 0.55,0.08 C0.6,0.03 0.67,0 0.75,0 C0.89,0 1,0.11 1,0.25 C1,0.26 1,0.27 1,0.28 C1,0.28 1,0.28 1,0.28 C1,0.28 1,0.28 1,0.28 L1,0.35 L1,0.55 C1,0.66 0.96,0.75 0.85,0.75 Z',
    },
    {
        id: 'lightning',
        name: 'Lightning Bolt',
        category: 'decorative',
        icon: 'lightning-bolt-outline',
        type: 'path',
        path: 'M0.65,0 L0.2,0.45 L0.45,0.45 L0.35,1 L0.8,0.55 L0.55,0.55 Z',
    },
    {
        id: 'cross',
        name: 'Cross',
        category: 'decorative',
        icon: 'plus-thick',
        type: 'path',
        path: 'M0.35,0 L0.65,0 L0.65,0.35 L1,0.35 L1,0.65 L0.65,0.65 L0.65,1 L0.35,1 L0.35,0.65 L0,0.65 L0,0.35 L0.35,0.35 Z',
    },
    {
        id: 'ribbon',
        name: 'Ribbon Banner',
        category: 'decorative',
        icon: 'ribbon',
        type: 'path',
        path: 'M0,0.25 L0.1,0.5 L0,0.75 L0.15,0.75 L0.15,0.85 L0.85,0.85 L0.85,0.75 L1,0.75 L0.9,0.5 L1,0.25 L0.85,0.25 L0.85,0.15 L0.15,0.15 L0.15,0.25 Z',
    },
    {
        id: 'bookmark',
        name: 'Bookmark',
        category: 'decorative',
        icon: 'bookmark-outline',
        type: 'path',
        path: 'M0.15,0 L0.85,0 L0.85,1 L0.5,0.7 L0.15,1 Z',
    },
    {
        id: 'location-pin',
        name: 'Location Pin',
        category: 'symbols',
        icon: 'map-marker-outline',
        type: 'path',
        path: 'M0.5,0 C0.28,0 0.1,0.18 0.1,0.4 C0.1,0.7 0.5,1 0.5,1 C0.5,1 0.9,0.7 0.9,0.4 C0.9,0.18 0.72,0 0.5,0 Z M0.5,0.55 C0.42,0.55 0.35,0.48 0.35,0.4 C0.35,0.32 0.42,0.25 0.5,0.25 C0.58,0.25 0.65,0.32 0.65,0.4 C0.65,0.48 0.58,0.55 0.5,0.55 Z',
    },
    {
        id: 'shield',
        name: 'Shield',
        category: 'symbols',
        icon: 'shield-outline',
        type: 'path',
        path: 'M0.5,0 L0.9,0.15 L0.9,0.5 C0.9,0.75 0.7,0.95 0.5,1 C0.3,0.95 0.1,0.75 0.1,0.5 L0.1,0.15 Z',
    },
    {
        id: 'gear',
        name: 'Gear',
        category: 'symbols',
        icon: 'cog-outline',
        type: 'path',
        path: 'M0.5,0 L0.57,0 L0.6,0.1 L0.72,0.14 L0.8,0.07 L0.85,0.12 L0.93,0.2 L0.86,0.28 L0.9,0.4 L1,0.43 L1,0.57 L0.9,0.6 L0.86,0.72 L0.93,0.8 L0.85,0.88 L0.8,0.93 L0.72,0.86 L0.6,0.9 L0.57,1 L0.43,1 L0.4,0.9 L0.28,0.86 L0.2,0.93 L0.12,0.85 L0.07,0.8 L0.14,0.72 L0.1,0.6 L0,0.57 L0,0.43 L0.1,0.4 L0.14,0.28 L0.07,0.2 L0.15,0.12 L0.2,0.07 L0.28,0.14 L0.4,0.1 L0.43,0 Z M0.5,0.35 C0.42,0.35 0.35,0.42 0.35,0.5 C0.35,0.58 0.42,0.65 0.5,0.65 C0.58,0.65 0.65,0.58 0.65,0.5 C0.65,0.42 0.58,0.35 0.5,0.35 Z',
    },
    {
        id: 'home',
        name: 'Home',
        category: 'symbols',
        icon: 'home-outline',
        type: 'path',
        path: 'M0.5,0 L0,0.4 L0.15,0.4 L0.15,1 L0.4,1 L0.4,0.65 L0.6,0.65 L0.6,1 L0.85,1 L0.85,0.4 L1,0.4 Z',
    },
    {
        id: 'checkmark',
        name: 'Checkmark',
        category: 'symbols',
        icon: 'check-bold',
        type: 'path',
        path: 'M0.1,0.5 L0.4,0.8 L0.9,0.2 L0.8,0.1 L0.4,0.6 L0.2,0.4 Z',
    },
    {
        id: 'x-mark',
        name: 'X Mark',
        category: 'symbols',
        icon: 'close-thick',
        type: 'path',
        path: 'M0.15,0 L0.5,0.35 L0.85,0 L1,0.15 L0.65,0.5 L1,0.85 L0.85,1 L0.5,0.65 L0.15,1 L0,0.85 L0.35,0.5 L0,0.15 Z',
    },
    {
        id: 'moon',
        name: 'Moon',
        category: 'decorative',
        icon: 'moon-waning-crescent',
        type: 'path',
        path: 'M0.5,0 C0.78,0 1,0.22 1,0.5 C1,0.78 0.78,1 0.5,1 C0.22,1 0,0.78 0,0.5 C0,0.22 0.22,0 0.5,0 Z M0.5,0.15 C0.3,0.15 0.15,0.3 0.15,0.5 C0.15,0.7 0.3,0.85 0.5,0.85 C0.7,0.85 0.85,0.7 0.85,0.5 C0.85,0.3 0.7,0.15 0.5,0.15 Z M0.35,0.25 C0.45,0.35 0.45,0.65 0.35,0.75 C0.25,0.65 0.25,0.35 0.35,0.25 Z',
    },
    {
        id: 'sun',
        name: 'Sun',
        category: 'decorative',
        icon: 'white-balance-sunny',
        type: 'path',
        path: 'M0.5,0.25 C0.64,0.25 0.75,0.36 0.75,0.5 C0.75,0.64 0.64,0.75 0.5,0.75 C0.36,0.75 0.25,0.64 0.25,0.5 C0.25,0.36 0.36,0.25 0.5,0.25 Z M0.5,0 L0.55,0.15 L0.45,0.15 Z M0.5,1 L0.45,0.85 L0.55,0.85 Z M0,0.5 L0.15,0.45 L0.15,0.55 Z M1,0.5 L0.85,0.55 L0.85,0.45 Z M0.85,0.15 L0.75,0.25 L0.7,0.2 Z M0.15,0.85 L0.25,0.75 L0.3,0.8 Z M0.15,0.15 L0.25,0.25 L0.2,0.3 Z M0.85,0.85 L0.75,0.75 L0.8,0.7 Z',
    },
    {
        id: 'leaf',
        name: 'Leaf',
        category: 'decorative',
        icon: 'leaf',
        type: 'path',
        path: 'M0.9,0.1 C0.9,0.1 0.5,0.3 0.3,0.5 C0.1,0.7 0,0.9 0,0.9 C0,0.9 0.3,0.95 0.5,0.75 C0.55,0.7 0.6,0.6 0.55,0.55 C0.5,0.5 0.55,0.45 0.6,0.4 C0.7,0.3 0.9,0.1 0.9,0.1 Z',
    },
    {
        id: 'flame',
        name: 'Flame',
        category: 'decorative',
        icon: 'fire',
        type: 'path',
        path: 'M0.5,0 C0.5,0 0.75,0.25 0.75,0.55 C0.75,0.7 0.65,0.8 0.6,0.85 C0.6,0.75 0.55,0.7 0.5,0.65 C0.45,0.7 0.4,0.75 0.4,0.85 C0.35,0.8 0.25,0.7 0.25,0.55 C0.25,0.25 0.5,0 0.5,0 Z',
    },
    {
        id: 'drop',
        name: 'Water Drop',
        category: 'decorative',
        icon: 'water',
        type: 'path',
        path: 'M0.5,0 C0.5,0 0.85,0.4 0.85,0.65 C0.85,0.85 0.7,1 0.5,1 C0.3,1 0.15,0.85 0.15,0.65 C0.15,0.4 0.5,0 0.5,0 Z',
    },
    {
        id: 'music-note',
        name: 'Music Note',
        category: 'symbols',
        icon: 'music-note',
        type: 'path',
        path: 'M0.7,0 L0.7,0.65 C0.65,0.6 0.55,0.58 0.45,0.6 C0.3,0.65 0.2,0.8 0.25,0.9 C0.3,1 0.45,1 0.6,0.95 C0.7,0.9 0.8,0.8 0.8,0.7 L0.8,0.25 L0.95,0.2 L0.95,0.1 Z',
    },
    {
        id: 'bell',
        name: 'Bell',
        category: 'symbols',
        icon: 'bell-outline',
        type: 'path',
        path: 'M0.5,0 C0.55,0 0.6,0.05 0.6,0.1 L0.6,0.15 C0.75,0.2 0.85,0.35 0.85,0.55 L0.85,0.7 L0.95,0.8 L0.05,0.8 L0.15,0.7 L0.15,0.55 C0.15,0.35 0.25,0.2 0.4,0.15 L0.4,0.1 C0.4,0.05 0.45,0 0.5,0 Z M0.5,0.85 C0.58,0.85 0.65,0.9 0.65,0.95 L0.35,0.95 C0.35,0.9 0.42,0.85 0.5,0.85 Z',
    },
    {
        id: 'lock',
        name: 'Lock',
        category: 'symbols',
        icon: 'lock-outline',
        type: 'path',
        path: 'M0.75,0.4 L0.75,0.3 C0.75,0.15 0.65,0 0.5,0 C0.35,0 0.25,0.15 0.25,0.3 L0.25,0.4 L0.15,0.4 L0.15,1 L0.85,1 L0.85,0.4 Z M0.35,0.3 C0.35,0.2 0.4,0.1 0.5,0.1 C0.6,0.1 0.65,0.2 0.65,0.3 L0.65,0.4 L0.35,0.4 Z M0.5,0.6 C0.55,0.6 0.6,0.65 0.6,0.7 L0.6,0.8 L0.4,0.8 L0.4,0.7 C0.4,0.65 0.45,0.6 0.5,0.6 Z',
    },
    {
        id: 'play',
        name: 'Play',
        category: 'symbols',
        icon: 'play',
        type: 'path',
        path: 'M0.2,0 L0.2,1 L0.9,0.5 Z',
    },
    {
        id: 'pause',
        name: 'Pause',
        category: 'symbols',
        icon: 'pause',
        type: 'path',
        path: 'M0.15,0 L0.4,0 L0.4,1 L0.15,1 Z M0.6,0 L0.85,0 L0.85,1 L0.6,1 Z',
    },
];

// ============================================
// Helper Functions
// ============================================

/**
 * Get corner radius value from level name
 */
export function getCornerRadius(level: CornerRadiusLevel): number {
    return MD3_CORNER_RADIUS[level];
}

/**
 * Create a uniform corner config
 */
export function createUniformCorners(radius: number, family: CornerFamily = 'rounded'): CornerConfig {
    return {
        family,
        topLeft: radius,
        topRight: radius,
        bottomRight: radius,
        bottomLeft: radius,
    };
}

/**
 * Create asymmetric corner config
 */
export function createAsymmetricCorners(
    corners: { topLeft?: number; topRight?: number; bottomRight?: number; bottomLeft?: number },
    family: CornerFamily = 'rounded'
): CornerConfig {
    return {
        family,
        topLeft: corners.topLeft ?? 0,
        topRight: corners.topRight ?? 0,
        bottomRight: corners.bottomRight ?? 0,
        bottomLeft: corners.bottomLeft ?? 0,
    };
}

/**
 * Generate SVG path for rectangle with custom corners (rounded or cut)
 */
export function generateCornerPath(
    width: number,
    height: number,
    corners: CornerConfig
): string {
    const { family, topLeft, topRight, bottomRight, bottomLeft } = corners;
    
    // Clamp radius to half of smaller dimension
    const maxRadius = Math.min(width, height) / 2;
    const tl = Math.min(topLeft, maxRadius);
    const tr = Math.min(topRight, maxRadius);
    const br = Math.min(bottomRight, maxRadius);
    const bl = Math.min(bottomLeft, maxRadius);
    
    if (family === 'cut') {
        // Cut corners (chamfered)
        return `
            M ${tl},0
            L ${width - tr},0
            L ${width},${tr}
            L ${width},${height - br}
            L ${width - br},${height}
            L ${bl},${height}
            L 0,${height - bl}
            L 0,${tl}
            Z
        `.trim().replace(/\s+/g, ' ');
    } else {
        // Rounded corners
        return `
            M ${tl},0
            L ${width - tr},0
            ${tr > 0 ? `Q ${width},0 ${width},${tr}` : `L ${width},0`}
            L ${width},${height - br}
            ${br > 0 ? `Q ${width},${height} ${width - br},${height}` : `L ${width},${height}`}
            L ${bl},${height}
            ${bl > 0 ? `Q 0,${height} 0,${height - bl}` : `L 0,${height}`}
            L 0,${tl}
            ${tl > 0 ? `Q 0,0 ${tl},0` : 'L 0,0'}
            Z
        `.trim().replace(/\s+/g, ' ');
    }
}

/**
 * Scale a normalized path (0-1) to actual dimensions
 */
export function scalePath(normalizedPath: string, width: number, height: number): string {
    return normalizedPath.replace(
        /([0-9]*\.?[0-9]+)/g,
        (match, _p1, offset, string) => {
            const num = parseFloat(match);
            // Determine if this is an X or Y coordinate based on position
            // This is a simplified approach - proper SVG parsing would be more accurate
            const prevChar = string[offset - 1];
            if (prevChar === 'M' || prevChar === 'L' || prevChar === 'Q' || prevChar === 'C' || prevChar === 'Z' || prevChar === ' ' || prevChar === undefined) {
                // Could be X
                return String(num * width);
            }
            if (prevChar === ',') {
                // Is Y
                return String(num * height);
            }
            return String(num * width);
        }
    );
}

/**
 * Get shapes by category
 */
export function getShapesByCategory(category: ShapePreset['category']): ShapePreset[] {
    return MD3_SHAPE_PRESETS.filter(s => s.category === category);
}

/**
 * Get all shape categories
 */
export function getShapeCategories(): ShapePreset['category'][] {
    return ['basic', 'geometric', 'arrows', 'symbols', 'containers', 'communication', 'decorative'];
}

export default {
    MD3_CORNER_RADIUS,
    MD3_CORNER_PRESETS,
    MD3_SHAPE_PRESETS,
    getCornerRadius,
    createUniformCorners,
    createAsymmetricCorners,
    generateCornerPath,
    scalePath,
    getShapesByCategory,
    getShapeCategories,
};
