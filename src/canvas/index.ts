/**
 * WidgetCraft - Canvas Module Index
 * Export all canvas-related components and utilities
 */

// Context and State
export {
    CanvasProvider,
    useCanvas,
    type CanvasState,
    type CanvasElement,
    type ElementType,
    type Transform,
    type ElementStyle,
    type TextStyle,
    type CanvasAction,
} from './CanvasContext';

// Components
export {
    ResizeHandles,
    BoundingBox,
    type ResizeHandlesProps,
    type BoundingBoxProps,
    type HandlePosition,
} from './ResizeHandles';

// Shapes
export {
    RectangleShape,
    MD3RectangleShape,
    EllipseShape,
    PolygonShape,
    StarShape,
    LineShape,
    PathShape,
    SHAPE_PRESETS,
    type GradientDef,
    type ShadowDef,
    type BaseShapeProps,
    type RectangleShapeProps,
    type MD3RectangleShapeProps,
    type EllipseShapeProps,
    type PolygonShapeProps,
    type StarShapeProps,
    type LineShapeProps,
    type PathShapeProps,
} from './Shapes';

// MD3 Shape System
export {
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
    type CornerRadiusLevel,
    type CornerFamily,
    type CornerConfig,
    type ShapePreset,
} from './MD3Shapes';

// Color Studio
export {
    ColorStudio,
    GradientEditor,
    type ColorStudioProps,
    type HSBColor,
    type RGBColor,
    type GradientStop,
    type GradientConfig,
} from './ColorStudio';

// Typography Studio
export {
    TypographyStudio,
    FONT_FAMILIES,
    FONT_WEIGHTS,
    type TypographyStudioProps,
    type TextStyleConfig,
    type TextShadow,
} from './TypographyStudio';
