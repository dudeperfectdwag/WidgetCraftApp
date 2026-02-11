/**
 * WidgetCraft - Core Type Definitions
 * Comprehensive type system for the widget designer app
 */

// ============================================
// Widget Fundamental Types
// ============================================

export type WidgetId = string;

export interface Position {
    x: number;
    y: number;
}
export interface Size {
    width: number;
    height: number;
}

export interface Bounds extends Position, Size { }

export type ColorValue = string;

export interface GradientStop {
    color: ColorValue;
    position: number;
}

export interface LinearGradient {
    type: 'linear';
    angle: number;
    stops: GradientStop[];
}

export interface RadialGradient {
    type: 'radial';
    center: Position;
    radius: number;
    stops: GradientStop[];
}

export type Gradient = LinearGradient | RadialGradient;

export interface Fill {
    type: 'solid' | 'gradient' | 'image';
    color?: ColorValue;
    gradient?: Gradient;
    imageUrl?: string;
    opacity?: number;
}

export interface Shadow {
    offsetX: number;
    offsetY: number;
    blur: number;
    spread: number;
    color: ColorValue;
}

export interface Border {
    width: number;
    color: ColorValue;
    style: 'solid' | 'dashed' | 'dotted';
}


export type ShapeType =
    | 'rectangle'
    | 'circle'
    | 'ellipse'
    | 'rounded-rectangle'
    | 'polygon'
    | 'star'
    | 'custom';

export interface ShapeConfig {
    type: ShapeType;
    cornerRadius?: number | number[]; // Single valu
    sides?: number;
    points?: number; // For star
    innerRadius?: number; // For star
    path?: string; // SVG path for custom shapes
}

// ============================================
// Text & Typography Types
// ============================================

export interface TextStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontStyle: 'normal' | 'italic';
    color: ColorValue;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: number;
    letterSpacing?: number;
    textDecoration?: 'none' | 'underline' | 'line-through';
    textShadow?: Shadow;
}

// ============================================
// Animation Types
// ============================================

export type EasingType =
    | 'linear'
    | 'easeIn'
    | 'easeOut'
    | 'easeInOut'
    | 'spring'
    | 'bounce';

export interface AnimationKeyframe {
    time: number; // 0-1 (percentage of duration)
    properties: Partial<WidgetLayerProperties>;
}

export interface Animation {
    id: string;
    name: string;
    duration: number; // ms
    delay?: number;
    easing: EasingType;
    loop?: boolean | number; // true for infinite, number for count
    keyframes: AnimationKeyframe[];
}

// ============================================
// Effect Types
// ============================================

export interface BlurEffect {
    type: 'blur';
    radius: number;
}

export interface GlassmorphismEffect {
    type: 'glassmorphism';
    blur: number;
    transparency: number;
    saturation: number;
}

export interface GlowEffect {
    type: 'glow';
    color: ColorValue;
    radius: number;
    intensity: number;
}

export type Effect = BlurEffect | GlassmorphismEffect | GlowEffect;

// ============================================
// Widget Layer Types
// ============================================

export interface WidgetLayerProperties {
    position: Position;
    size: Size;
    rotation?: number; // degrees
    opacity?: number; // 0-1
    fill?: Fill;
    border?: Border;
    shadow?: Shadow;
    effects?: Effect[];
}

export interface WidgetLayerBase extends WidgetLayerProperties {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    zIndex: number;
}

export interface ShapeLayer extends WidgetLayerBase {
    type: 'shape';
    shape: ShapeConfig;
}

export interface TextLayer extends WidgetLayerBase {
    type: 'text';
    content: string;
    textStyle: TextStyle;
    dataBinding?: DataBinding;
}

export interface ImageLayer extends WidgetLayerBase {
    type: 'image';
    imageUrl: string;
    fit: 'cover' | 'contain' | 'fill' | 'none';
}

export interface GroupLayer extends WidgetLayerBase {
    type: 'group';
    children: WidgetLayer[];
}

export type WidgetLayer = ShapeLayer | TextLayer | ImageLayer | GroupLayer;

// ============================================
// Data Source Types
// ============================================

export type DataSourceType =
    | 'time'
    | 'date'
    | 'weather'
    | 'battery'
    | 'storage'
    | 'calendar'
    | 'custom';

export interface DataBinding {
    sourceType: DataSourceType;
    sourceId: string;
    property: string;
    format?: string;
    transform?: string; // Custom script reference
}

export interface DataSource {
    id: string;
    type: DataSourceType;
    name: string;
    refreshInterval?: number; // ms
    config?: Record<string, unknown>;
}

// ============================================
// Custom Script Types
// ============================================

export interface CustomScript {
    id: string;
    name: string;
    description?: string;
    code: string;
    inputs: ScriptInput[];
    outputs: ScriptOutput[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ScriptInput {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'color' | 'data';
    defaultValue?: unknown;
}

export interface ScriptOutput {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'color' | 'style';
}

export interface ScriptExecutionContext {
    data: Record<string, unknown>;
    theme: Record<string, ColorValue>;
    time: Date;
}

// ============================================
// Widget Configuration Types
// ============================================

export interface Widget {
    id: WidgetId;
    name: string;
    description?: string;
    thumbnail?: string;
    size: Size;
    backgroundColor: Fill;
    layers: WidgetLayer[];
    dataSources: DataSource[];
    scripts: CustomScript[];
    animations: Animation[];
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
    isFavorite?: boolean;
}

export interface WidgetTemplate extends Omit<Widget, 'id' | 'createdAt' | 'updatedAt'> {
    templateId: string;
    category: string;
    isPremium?: boolean;
}

// ============================================
// Theme Types
// ============================================

export interface MaterialYouColors {
    primary: ColorValue;
    onPrimary: ColorValue;
    primaryContainer: ColorValue;
    onPrimaryContainer: ColorValue;
    secondary: ColorValue;
    onSecondary: ColorValue;
    secondaryContainer: ColorValue;
    onSecondaryContainer: ColorValue;
    tertiary: ColorValue;
    onTertiary: ColorValue;
    tertiaryContainer: ColorValue;
    onTertiaryContainer: ColorValue;
    error: ColorValue;
    onError: ColorValue;
    errorContainer: ColorValue;
    onErrorContainer: ColorValue;
    background: ColorValue;
    onBackground: ColorValue;
    surface: ColorValue;
    onSurface: ColorValue;
    surfaceVariant: ColorValue;
    onSurfaceVariant: ColorValue;
    outline: ColorValue;
    outlineVariant: ColorValue;
    inverseSurface: ColorValue;
    inverseOnSurface: ColorValue;
    inversePrimary: ColorValue;
    elevation: {
        level0: ColorValue;
        level1: ColorValue;
        level2: ColorValue;
        level3: ColorValue;
        level4: ColorValue;
        level5: ColorValue;
    };
}

export interface AppTheme {
    isDark: boolean;
    colors: MaterialYouColors;
    roundness: number;
    animation: {
        scale: number;
    };
}

// ============================================
// Navigation Types
// ============================================

export type RootStackParamList = {
    Home: undefined;
    Editor: { widgetId?: WidgetId };
    Templates: undefined;
    Settings: undefined;
    WidgetPreview: { widgetId: WidgetId };
    ScriptEditor: { scriptId?: string; widgetId: WidgetId };
};

export type BottomTabParamList = {
    HomeTab: undefined;
    TemplatesTab: undefined;
    CreateTab: undefined;
    LibraryTab: undefined;
    SettingsTab: undefined;
};
