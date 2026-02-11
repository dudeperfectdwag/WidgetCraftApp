/**
 * WidgetCraft - Template Converter
 * Converts WidgetTemplate format to CanvasElement format for the editor
 */

import { CanvasElement, ElementType } from '@canvas/CanvasContext';
import { WidgetTemplate, WidgetComponent, TextComponent, CurvedTextComponent, ShapeComponent, IconComponent, AnalogClockComponent, DigitalClockComponent, ProgressComponent, ScriptWidgetComponent, WIDGET_SIZES } from '../types';

// Generate unique ID for canvas elements
const generateId = (): string => {
    return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Map shape types from template to canvas element types
const mapShapeType = (shapeType: string): ElementType => {
    switch (shapeType) {
        case 'circle':
            return 'ellipse';
        case 'rectangle':
        case 'pill':
        case 'squircle':
        case 'blob':
        case 'cloud':
        case 'flower':
        default:
            return 'rectangle';
    }
};

// Convert color token to actual color (for now, return as-is, will be resolved at render)
const resolveColorToken = (colorToken: string): string => {
    // Color tokens like 'primary', 'onPrimaryContainer' will be resolved at render time
    // For now, we store them and the renderer will resolve them
    // If it's already a hex color, use it directly
    if (colorToken.startsWith('#') || colorToken.startsWith('rgb')) {
        return colorToken;
    }
    // Return a placeholder that can be resolved later
    // For template conversion, we'll use Material You colors
    const tokenMap: Record<string, string> = {
        'primary': '#6750A4',
        'onPrimary': '#FFFFFF',
        'primaryContainer': '#EADDFF',
        'onPrimaryContainer': '#21005D',
        'secondary': '#625B71',
        'onSecondary': '#FFFFFF',
        'secondaryContainer': '#E8DEF8',
        'onSecondaryContainer': '#1D192B',
        'tertiary': '#7D5260',
        'onTertiary': '#FFFFFF',
        'tertiaryContainer': '#FFD8E4',
        'onTertiaryContainer': '#31111D',
        'surface': '#FFFBFE',
        'onSurface': '#1C1B1F',
        'surfaceVariant': '#E7E0EC',
        'onSurfaceVariant': '#49454F',
        'error': '#B3261E',
        'background': '#FFFBFE',
        'onBackground': '#1C1B1F',
        'outline': '#79747E',
        'inverseSurface': '#313033',
        'inverseOnSurface': '#F4EFF4',
        'inversePrimary': '#D0BCFF',
        'primaryFixed': '#EADDFF',
        'primaryFixedDim': '#D0BCFF',
        'onPrimaryFixed': '#21005D',
        'tertiaryFixed': '#FFD8E4',
        'tertiaryFixedDim': '#EFB8C8',
        'onTertiaryFixed': '#31111D',
        'transparent': 'transparent',
    };
    return tokenMap[colorToken] || colorToken;
};

// Convert a TextComponent to CanvasElement
const convertTextComponent = (id: string, component: TextComponent, _template: WidgetTemplate): CanvasElement => {
    const resolvedColor = resolveColorToken(component.color);
    
    return {
        id,
        type: 'text',
        name: component.id || 'Text',
        transform: {
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height,
            rotation: component.rotation || 0,
            scaleX: 1,
            scaleY: 1,
        },
        style: {
            opacity: component.opacity ?? 1,
            shadow: component.shadow,
        },
        textStyle: {
            fontFamily: component.fontFamily || 'System',
            fontSize: component.fontSize,
            fontWeight: component.fontWeight === 'bold' ? '700' : 
                       component.fontWeight === 'semibold' ? '600' :
                       component.fontWeight === 'medium' ? '500' : '400',
            color: resolvedColor,
            textAlign: component.textAlign || 'center',
            letterSpacing: component.letterSpacing,
            lineHeight: component.lineHeight,
        },
        content: component.content,
        visible: component.visible !== false,
        locked: false,
    };
};

// Convert a ShapeComponent to CanvasElement
const convertShapeComponent = (id: string, component: ShapeComponent, _template: WidgetTemplate): CanvasElement => {
    const resolvedFill = resolveColorToken(component.fill);
    const resolvedStroke = component.stroke ? resolveColorToken(component.stroke) : undefined;
    
    return {
        id,
        type: mapShapeType(component.shapeType),
        name: component.id || 'Shape',
        transform: {
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height,
            rotation: component.rotation || 0,
            scaleX: 1,
            scaleY: 1,
        },
        style: {
            fill: resolvedFill,
            fillGradient: component.gradient ? {
                type: component.gradient.type,
                colors: component.gradient.colors,
                stops: component.gradient.stops ?? component.gradient.colors.map((_, i, arr) => i / (arr.length - 1)),
                angle: component.gradient.angle,
            } : undefined,
            stroke: resolvedStroke,
            strokeWidth: component.strokeWidth,
            opacity: (component.opacity ?? 1) * (component.fillOpacity ?? 1),
            cornerRadius: component.cornerRadius || 0,
            cornerFamily: component.cornerFamily,
            shadow: component.shadow,
        },
        gradientConfig: component.gradient,
        visible: component.visible !== false,
        locked: false,
    };
};

// Convert an IconComponent to CanvasElement (as text with icon content)
const convertIconComponent = (id: string, component: IconComponent, _template: WidgetTemplate): CanvasElement => {
    const resolvedColor = resolveColorToken(component.color);
    
    return {
        id,
        type: 'text',
        name: component.id || 'Icon',
        transform: {
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height,
            rotation: component.rotation || 0,
            scaleX: 1,
            scaleY: 1,
        },
        style: {
            opacity: component.opacity ?? 1,
        },
        textStyle: {
            fontFamily: 'MaterialCommunityIcons',
            fontSize: component.size,
            fontWeight: '400',
            color: resolvedColor,
            textAlign: 'center',
        },
        content: `icon:${component.name}`, // Special prefix to indicate icon
        visible: component.visible !== false,
        locked: false,
    };
};

// Convert an AnalogClockComponent to CanvasElement
const convertAnalogClockComponent = (id: string, component: AnalogClockComponent, _template: WidgetTemplate): CanvasElement => {
    return {
        id,
        type: 'analogClock',
        name: component.id || 'Analog Clock',
        transform: {
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height,
            rotation: component.rotation || 0,
            scaleX: 1,
            scaleY: 1,
        },
        style: {
            opacity: component.opacity ?? 1,
        },
        clockConfig: {
            faceStyle: component.faceStyle || 'modern',
            handStyle: component.handStyle || 'modern',
            showSeconds: component.showSeconds ?? true,
            showNumbers: component.showNumbers ?? true,
            showTicks: component.showTicks ?? true,
            smoothSeconds: component.smoothSeconds ?? true,
            faceColor: component.faceColor ? resolveColorToken(component.faceColor) : undefined,
            hourHandColor: component.hourHandColor ? resolveColorToken(component.hourHandColor) : undefined,
            minuteHandColor: component.minuteHandColor ? resolveColorToken(component.minuteHandColor) : undefined,
            secondHandColor: component.secondHandColor ? resolveColorToken(component.secondHandColor) : undefined,
            tickColor: component.tickColor ? resolveColorToken(component.tickColor) : undefined,
            numberColor: component.numberColor ? resolveColorToken(component.numberColor) : undefined,
        },
        visible: component.visible !== false,
        locked: false,
    };
};

// Convert a DigitalClockComponent to CanvasElement
const convertDigitalClockComponent = (id: string, component: DigitalClockComponent, _template: WidgetTemplate): CanvasElement => {
    const resolvedColor = resolveColorToken(component.color);
    return {
        id,
        type: 'digitalClock',
        name: component.id || 'Digital Clock',
        transform: {
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height,
            rotation: component.rotation || 0,
            scaleX: 1,
            scaleY: 1,
        },
        style: {
            opacity: component.opacity ?? 1,
        },
        textStyle: {
            fontFamily: component.fontFamily || 'System',
            fontSize: component.fontSize,
            fontWeight: component.fontWeight === 'bold' ? '700' :
                       component.fontWeight === 'semibold' ? '600' :
                       component.fontWeight === 'medium' ? '500' : '400',
            color: resolvedColor,
            textAlign: component.textAlign || 'center',
        },
        clockConfig: {
            format: component.format || '24h',
            showSeconds: component.showSeconds ?? false,
            showAmPm: component.showAmPm ?? false,
        },
        visible: component.visible !== false,
        locked: false,
    };
};

// Convert a CurvedTextComponent to CanvasElement
const convertCurvedTextComponent = (id: string, component: CurvedTextComponent, _template: WidgetTemplate): CanvasElement => {
    const resolvedColor = resolveColorToken(component.color);
    return {
        id,
        type: 'curvedText',
        name: component.id || 'Curved Text',
        transform: {
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height,
            rotation: component.rotation || 0,
            scaleX: 1,
            scaleY: 1,
        },
        style: {
            opacity: component.opacity ?? 1,
        },
        textStyle: {
            fontFamily: component.fontFamily || 'System',
            fontSize: component.fontSize,
            fontWeight: component.fontWeight === 'bold' ? '700' :
                       component.fontWeight === 'semibold' ? '600' :
                       component.fontWeight === 'medium' ? '500' : '400',
            color: resolvedColor,
            textAlign: 'center',
            letterSpacing: component.letterSpacing,
        },
        content: component.content,
        curvedTextConfig: {
            curveType: component.curveType || 'arc',
            curveAmount: component.curveAmount ?? 50,
            startOffset: component.startOffset ?? 0,
        },
        visible: component.visible !== false,
        locked: false,
    };
};

// Convert a ScriptWidgetComponent to CanvasElement
const convertScriptWidgetComponent = (id: string, component: ScriptWidgetComponent, _template: WidgetTemplate): CanvasElement => {
    return {
        id,
        type: 'scriptWidget',
        name: component.id || 'Script Widget',
        transform: {
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height,
            rotation: component.rotation || 0,
            scaleX: 1,
            scaleY: 1,
        },
        style: {
            opacity: component.opacity ?? 1,
        },
        script: component.script,
        scriptRefreshSec: component.refreshIntervalSec,
        visible: component.visible !== false,
        locked: false,
    };
};

// Convert a ProgressComponent to CanvasElement (rendered as a shape representation)
const convertProgressComponent = (id: string, component: ProgressComponent, _template: WidgetTemplate): CanvasElement => {
    const resolvedColor = resolveColorToken(component.color);

    if (component.progressType === 'circle' || component.progressType === 'arc') {
        // Render circular progress as an ellipse with stroke
        return {
            id,
            type: 'ellipse',
            name: component.id || 'Progress',
            transform: {
                x: component.x,
                y: component.y,
                width: component.width,
                height: component.height,
                rotation: component.rotation || 0,
                scaleX: 1,
                scaleY: 1,
            },
            style: {
                fill: 'transparent',
                stroke: resolvedColor,
                strokeWidth: component.strokeWidth || 6,
                opacity: component.opacity ?? 1,
            },
            visible: component.visible !== false,
            locked: false,
        };
    }

    // Bar progress → rendered as a rounded rectangle
    return {
        id,
        type: 'rectangle',
        name: component.id || 'Progress Bar',
        transform: {
            x: component.x,
            y: component.y,
            width: component.width,
            height: component.height,
            rotation: component.rotation || 0,
            scaleX: 1,
            scaleY: 1,
        },
        style: {
            fill: resolvedColor,
            opacity: component.opacity ?? 1,
            cornerRadius: component.strokeWidth ? component.strokeWidth / 2 : 4,
        },
        visible: component.visible !== false,
        locked: false,
    };
};

// Convert a single WidgetComponent to CanvasElement
const convertComponent = (componentId: string, component: WidgetComponent, template: WidgetTemplate): CanvasElement | null => {
    const id = generateId();
    
    switch (component.type) {
        case 'text':
            return convertTextComponent(id, component as TextComponent, template);
        case 'curvedText':
            return convertCurvedTextComponent(id, component as CurvedTextComponent, template);
        case 'shape':
            return convertShapeComponent(id, component as ShapeComponent, template);
        case 'icon':
            return convertIconComponent(id, component as IconComponent, template);
        case 'analogClock':
            return convertAnalogClockComponent(id, component as AnalogClockComponent, template);
        case 'digitalClock':
            return convertDigitalClockComponent(id, component as DigitalClockComponent, template);
        case 'progress':
            return convertProgressComponent(id, component as ProgressComponent, template);
        case 'scriptWidget':
            return convertScriptWidgetComponent(id, component as ScriptWidgetComponent, template);
        default:
            return null;
    }
};

// Main conversion function
export interface ConvertedTemplate {
    elements: Record<string, CanvasElement>;
    elementOrder: string[];
    canvasSize: { width: number; height: number };
    templateName: string;
}

export const convertTemplateToCanvas = (template: WidgetTemplate): ConvertedTemplate => {
    const elements: Record<string, CanvasElement> = {};
    const elementOrder: string[] = [];
    
    // Get canvas size from template size
    const sizeConfig = WIDGET_SIZES[template.size];
    const canvasSize = {
        width: sizeConfig.width,
        height: sizeConfig.height,
    };
    
    // Convert each component in order
    for (const componentId of template.componentOrder) {
        const component = template.components[componentId];
        if (!component) continue;
        
        const canvasElement = convertComponent(componentId, component, template);
        if (canvasElement) {
            elements[canvasElement.id] = canvasElement;
            elementOrder.push(canvasElement.id);
        }
    }
    
    return {
        elements,
        elementOrder,
        canvasSize,
        templateName: template.name,
    };
};

// Export template info for navigation
export interface TemplateNavigationParams {
    templateId: string;
    elements: Record<string, CanvasElement>;
    elementOrder: string[];
    canvasSize: { width: number; height: number };
    templateName: string;
}

export const prepareTemplateForNavigation = (template: WidgetTemplate): TemplateNavigationParams => {
    const converted = convertTemplateToCanvas(template);
    return {
        templateId: template.id,
        ...converted,
    };
};
