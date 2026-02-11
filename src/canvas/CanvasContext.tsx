/**
 * WidgetCraft - Canvas Context & Types
 * State management for canvas elements, selection, and transformations
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';

import { AnimationConfig } from '../effects/AnimationBuilder';
import { ScriptOutput } from '../services/ScriptRuntime';

export { AnimationConfig }; // Re-export for convenience

// Canvas Element Types
// ============================================

export type ElementType = 'rectangle' | 'ellipse' | 'text' | 'image' | 'line' | 'path' | 'group' | 'analogClock' | 'digitalClock' | 'curvedText' | 'gradient' | 'scriptWidget';

export interface Transform {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
}

// Clock configuration
export interface ClockConfig {
    faceStyle?: 'minimal' | 'classic' | 'modern' | 'roman' | 'dots' | 'lines';
    handStyle?: 'classic' | 'modern' | 'thin' | 'bold' | 'arrow';
    showSeconds?: boolean;
    showNumbers?: boolean;
    showTicks?: boolean;
    smoothSeconds?: boolean;
    // Colors (use theme tokens or hex)
    faceColor?: string;
    hourHandColor?: string;
    minuteHandColor?: string;
    secondHandColor?: string;
    tickColor?: string;
    numberColor?: string;
    // Digital clock specific
    format?: '12h' | '24h';
    showAmPm?: boolean;
}

// Curved text configuration
export interface CurvedTextConfig {
    curveType?: 'arc' | 'wave' | 'circle' | 'custom';
    curveAmount?: number; // -100 to 100
    startOffset?: number; // 0-100%
    customPath?: string;
}

// Gradient configuration
export interface GradientConfig {
    type: 'linear' | 'radial';
    colors: string[];
    stops?: number[]; // Custom stop positions (0-1)
    angle?: number; // Degrees for linear gradient (0-360)
    centerX?: number; // 0-1 for radial
    centerY?: number; // 0-1 for radial
    radiusX?: number; // 0-1 for radial
    radiusY?: number; // 0-1 for radial
}

// Image filter configuration
export type ImageFilterType = 'none' | 'grayscale' | 'sepia' | 'vintage' | 'warm' | 'cool' | 'blur' | 'sharpen' | 'vignette' | 'noir';

export interface ImageFilterConfig {
    filter: ImageFilterType;
    intensity: number; // 0-100
    brightness: number; // -100 to 100
    contrast: number; // -100 to 100
    saturation: number; // -100 to 100
    hue: number; // 0-360
}

export interface ShadowConfig {
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
    spread?: number;
    opacity?: number;
}

export interface ElementStyle {
    fill?: string;
    fillGradient?: {
        type: 'linear' | 'radial';
        colors: string[];
        stops: number[];
        angle?: number;
    };
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    cornerRadius?: number | number[];
    // MD3 Corner configuration for asymmetric/cut corners
    cornerFamily?: 'rounded' | 'cut';
    cornerTopLeft?: number;
    cornerTopRight?: number;
    cornerBottomRight?: number;
    cornerBottomLeft?: number;
    shadow?: ShadowConfig;
}

export interface TextStyle {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    lineHeight?: number;
    letterSpacing?: number;
}

export interface CanvasElement {
    id: string;
    type: ElementType;
    name: string;
    transform: Transform;
    style: ElementStyle;
    textStyle?: TextStyle;
    content?: string; // For text elements
    imageUri?: string; // For image elements
    path?: string; // For path elements (SVG path data)
    children?: string[]; // For group elements (child IDs)
    // Shape-specific properties
    shapePresetId?: string; // ID from MD3_SHAPE_PRESETS
    polygonSides?: number; // For polygon shapes
    starPoints?: number; // For star shapes
    starInnerRadius?: number; // Inner radius ratio for stars (0-1)
    // Clock-specific properties
    clockConfig?: ClockConfig;
    // Curved text properties
    curvedTextConfig?: CurvedTextConfig;
    // Gradient properties
    gradientConfig?: GradientConfig;
    // Image filter properties
    imageFilterConfig?: ImageFilterConfig;
    // Animation properties
    animation?: AnimationConfig;
    // Script widget properties
    script?: string;
    scriptOutput?: ScriptOutput;
    scriptRefreshSec?: number;
    visible: boolean;
    locked: boolean;
    parentId?: string; // For nested elements
}

// ============================================
// Canvas State
// ============================================

export interface CanvasState {
    elements: Record<string, CanvasElement>;
    elementOrder: string[]; // Z-index order (bottom to top)
    selectedIds: string[];
    hoveredId: string | null;
    clipboard: CanvasElement[];
    history: CanvasHistoryEntry[];
    historyIndex: number;
    canvasSize: { width: number; height: number };
    gridSize: number;
    snapToGrid: boolean;
    showGrid: boolean;
    zoom: number;
    pan: { x: number; y: number };
}

export interface CanvasHistoryEntry {
    elements: Record<string, CanvasElement>;
    elementOrder: string[];
    timestamp: number;
}

// ============================================
// Canvas Actions
// ============================================

export type CanvasAction =
    | { type: 'ADD_ELEMENT'; element: CanvasElement }
    | { type: 'UPDATE_ELEMENT'; id: string; updates: Partial<CanvasElement> }
    | { type: 'DELETE_ELEMENTS'; ids: string[] }
    | { type: 'SELECT_ELEMENTS'; ids: string[] }
    | { type: 'ADD_TO_SELECTION'; id: string }
    | { type: 'REMOVE_FROM_SELECTION'; id: string }
    | { type: 'CLEAR_SELECTION' }
    | { type: 'SET_HOVERED'; id: string | null }
    | { type: 'MOVE_ELEMENTS'; ids: string[]; deltaX: number; deltaY: number }
    | { type: 'RESIZE_ELEMENT'; id: string; transform: Partial<Transform> }
    | { type: 'REORDER_ELEMENT'; id: string; direction: 'forward' | 'backward' | 'front' | 'back' }
    | { type: 'DUPLICATE_ELEMENTS'; ids: string[] }
    | { type: 'GROUP_ELEMENTS'; ids: string[] }
    | { type: 'UNGROUP_ELEMENT'; id: string }
    | { type: 'COPY_ELEMENTS'; ids: string[] }
    | { type: 'PASTE_ELEMENTS' }
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'SET_ZOOM'; zoom: number }
    | { type: 'SET_PAN'; pan: { x: number; y: number } }
    | { type: 'TOGGLE_GRID' }
    | { type: 'TOGGLE_SNAP' }
    | { type: 'SET_GRID_SIZE'; size: number }
    | { type: 'LOAD_WIDGET'; elements: Record<string, CanvasElement>; elementOrder: string[]; canvasSize: { width: number; height: number } };

// Initial State
// ============================================

const initialState: CanvasState = {
    elements: {},
    elementOrder: [],
    selectedIds: [],
    hoveredId: null,
    clipboard: [],
    history: [{ // Initialize history with the starting state
        elements: {},
        elementOrder: [],
        timestamp: Date.now(),
    }],
    historyIndex: 0, // Point to the first state
    canvasSize: { width: 360, height: 360 },
    gridSize: 8,
    snapToGrid: true,
    showGrid: true,
    zoom: 1,
    pan: { x: 0, y: 0 },
};

// ============================================
// Utility Functions
// ============================================

const generateId = () => `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const snapToGridValue = (value: number, gridSize: number, enabled: boolean) => {
    if (!enabled) return value;
    return Math.round(value / gridSize) * gridSize;
};

const saveToHistory = (state: CanvasState): CanvasHistoryEntry => ({
    elements: { ...state.elements },
    elementOrder: [...state.elementOrder],
    timestamp: Date.now(),
});

// Helper for actions that modify state:
// 1. Calculate new values
// 2. Append new state to history (truncating future if necessary)
// 3. Update state and historyIndex
const pushToHistory = (state: CanvasState, newElements: Record<string, CanvasElement>, newOrder: string[], newSelection?: string[]): CanvasState => {
    const newEntry = {
        elements: { ...newElements },
        elementOrder: [...newOrder],
        timestamp: Date.now(),
    };

    // Slice history up to current index and append new entry
    const newHistory = [...state.history.slice(0, state.historyIndex + 1), newEntry];

    return {
        ...state,
        elements: newElements,
        elementOrder: newOrder,
        selectedIds: newSelection ?? state.selectedIds,
        history: newHistory,
        historyIndex: newHistory.length - 1,
    };
};

// ============================================
// Reducer
// ============================================

const canvasReducer = (state: CanvasState, action: CanvasAction): CanvasState => {
    switch (action.type) {
        case 'ADD_ELEMENT': {
            const newElements = { ...state.elements, [action.element.id]: action.element };
            const newOrder = [...state.elementOrder, action.element.id];
            
            return pushToHistory(state, newElements, newOrder, [action.element.id]);
        }

        case 'UPDATE_ELEMENT': {
            if (!state.elements[action.id]) return state;
            const existingElement = state.elements[action.id];

            // Deep merge for nested objects (style, textStyle, transform)
            const mergedElement = {
                ...existingElement,
                ...action.updates,
                style: action.updates.style
                    ? { ...existingElement.style, ...action.updates.style }
                    : existingElement.style,
                textStyle: action.updates.textStyle
                    ? { ...existingElement.textStyle, ...action.updates.textStyle }
                    : existingElement.textStyle,
                transform: action.updates.transform
                    ? { ...existingElement.transform, ...action.updates.transform }
                    : existingElement.transform,
            };

            const newElements = {
                ...state.elements,
                [action.id]: mergedElement,
            };
            
            return pushToHistory(state, newElements, state.elementOrder);
        }

        case 'DELETE_ELEMENTS': {
            const newElements = { ...state.elements };
            action.ids.forEach(id => delete newElements[id]);
            const newOrder = state.elementOrder.filter(id => !action.ids.includes(id));
            
            return pushToHistory(state, newElements, newOrder, []);
        }

        case 'SELECT_ELEMENTS':
            return { ...state, selectedIds: action.ids };

        case 'ADD_TO_SELECTION':
            return { ...state, selectedIds: [...state.selectedIds, action.id] };

        case 'REMOVE_FROM_SELECTION':
            return { ...state, selectedIds: state.selectedIds.filter(id => id !== action.id) };

        case 'CLEAR_SELECTION':
            return { ...state, selectedIds: [] };

        case 'SET_HOVERED':
            return { ...state, hoveredId: action.id };

        case 'MOVE_ELEMENTS': {
            // Check if any element actually moved (to avoid history spam if no move)
            if (action.deltaX === 0 && action.deltaY === 0) return state;

            const newElements = { ...state.elements };
            let hasChanges = false;

            action.ids.forEach(id => {
                if (newElements[id] && !newElements[id].locked) {
                    const element = newElements[id];
                    const newX = snapToGridValue(element.transform.x + action.deltaX, state.gridSize, state.snapToGrid);
                    const newY = snapToGridValue(element.transform.y + action.deltaY, state.gridSize, state.snapToGrid);
                    
                    if (newX !== element.transform.x || newY !== element.transform.y) {
                        hasChanges = true;
                        newElements[id] = {
                            ...element,
                            transform: {
                                ...element.transform,
                                x: newX,
                                y: newY,
                            },
                        };
                    }
                }
            });

            if (!hasChanges) return state;
            return pushToHistory(state, newElements, state.elementOrder);
        }

        case 'RESIZE_ELEMENT': {
            if (!state.elements[action.id] || state.elements[action.id].locked) return state;
            const element = state.elements[action.id];
            const newTransform = {
                ...element.transform,
                ...action.transform,
                x: snapToGridValue(action.transform.x ?? element.transform.x, state.gridSize, state.snapToGrid),
                y: snapToGridValue(action.transform.y ?? element.transform.y, state.gridSize, state.snapToGrid),
                width: snapToGridValue(action.transform.width ?? element.transform.width, state.gridSize, state.snapToGrid),
                height: snapToGridValue(action.transform.height ?? element.transform.height, state.gridSize, state.snapToGrid),
            };
            
            const newElements = {
                ...state.elements,
                [action.id]: { ...element, transform: newTransform },
            };
            
            return pushToHistory(state, newElements, state.elementOrder);
        }

        case 'REORDER_ELEMENT': {
            const index = state.elementOrder.indexOf(action.id);
            if (index === -1) return state;
            const newOrder = [...state.elementOrder];
            newOrder.splice(index, 1);

            switch (action.direction) {
                case 'forward':
                    newOrder.splice(Math.min(index + 1, newOrder.length), 0, action.id);
                    break;
                case 'backward':
                    newOrder.splice(Math.max(index - 1, 0), 0, action.id);
                    break;
                case 'front':
                    newOrder.push(action.id);
                    break;
                case 'back':
                    newOrder.unshift(action.id);
                    break;
            }
            
            return pushToHistory(state, state.elements, newOrder);
        }

        case 'DUPLICATE_ELEMENTS': {
            const newElements = { ...state.elements };
            const newOrder = [...state.elementOrder];
            const newIds: string[] = [];

            action.ids.forEach(id => {
                if (state.elements[id]) {
                    const original = state.elements[id];
                    const newId = generateId();
                    newElements[newId] = {
                        ...original,
                        id: newId,
                        name: `${original.name} Copy`,
                        transform: {
                            ...original.transform,
                            x: original.transform.x + 20,
                            y: original.transform.y + 20,
                        },
                    };
                    newOrder.push(newId);
                    newIds.push(newId);
                }
            });

            return pushToHistory(state, newElements, newOrder, newIds);
        }

        case 'GROUP_ELEMENTS': {
            if (action.ids.length < 2) return state;

            const groupId = generateId();
            const newElements = { ...state.elements };
            
            // Sort chosen children by their original Z-order to preserve layering
            const groupChildren = action.ids.sort((a, b) => {
                return state.elementOrder.indexOf(a) - state.elementOrder.indexOf(b);
            });
            
            // Calculate group bounding box
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            groupChildren.forEach(id => {
               const el = newElements[id];
               if (el) {
                   minX = Math.min(minX, el.transform.x);
                   minY = Math.min(minY, el.transform.y);
                   maxX = Math.max(maxX, el.transform.x + el.transform.width);
                   maxY = Math.max(maxY, el.transform.y + el.transform.height);
               } 
            });

            const groupX = minX;
            const groupY = minY;
            const groupWidth = maxX - minX;
            const groupHeight = maxY - minY;

            // Create group element
            const groupElement: CanvasElement = {
                id: groupId,
                type: 'group',
                name: 'Group',
                transform: {
                    x: groupX,
                    y: groupY,
                    width: groupWidth,
                    height: groupHeight,
                    rotation: 0,
                    scaleX: 1,
                    scaleY: 1,
                },
                style: {},
                visible: true,
                locked: false,
                children: groupChildren,
            };

            newElements[groupId] = groupElement;

            // Remove children from root element order, add group instead
            // Position group at the highest index of its children
            
            groupChildren.forEach(childId => {
                const child = newElements[childId];
                if (child) {
                    // Update children to be relative to group
                    newElements[childId] = { 
                        ...child, 
                        parentId: groupId,
                        transform: {
                            ...child.transform,
                            x: child.transform.x - groupX,
                            y: child.transform.y - groupY,
                        }
                    };
                }
            });

            const newOrder = state.elementOrder.filter(id => !groupChildren.includes(id));
            newOrder.push(groupId);

            return pushToHistory(state, newElements, newOrder, [groupId]);
        }

        case 'UNGROUP_ELEMENT': {
            if (!state.elements[action.id] || state.elements[action.id].type !== 'group') return state;
            
            const group = state.elements[action.id];
            const childrenIds = group.children || [];
            const groupX = group.transform.x;
            const groupY = group.transform.y;
            
            const newElements = { ...state.elements };
            delete newElements[action.id]; // Remove group element
            
            childrenIds.forEach(childId => {
                if (newElements[childId]) {
                    const child = newElements[childId];
                    // Remove parentId reference and restore absolute position
                    const { parentId, ...rest } = child; 
                    newElements[childId] = {
                        ...rest as CanvasElement,
                        transform: {
                            ...child.transform,
                            x: child.transform.x + groupX,
                            y: child.transform.y + groupY,
                        }
                    };
                }
            });

            // Replace group in order with its children
            const groupIndex = state.elementOrder.indexOf(action.id);
            const newOrder = [...state.elementOrder];
            if (groupIndex !== -1) {
                newOrder.splice(groupIndex, 1, ...childrenIds);
            } else {
                newOrder.push(...childrenIds);
            }

            return pushToHistory(state, newElements, newOrder, childrenIds);
        }
        case 'COPY_ELEMENTS': {
            const clipboard = action.ids
                .map(id => state.elements[id])
                .filter(Boolean);
            return { ...state, clipboard };
        }

        case 'PASTE_ELEMENTS': {
            if (state.clipboard.length === 0) return state;
            const newElements = { ...state.elements };
            const newOrder = [...state.elementOrder];
            const newIds: string[] = [];

            state.clipboard.forEach(element => {
                const newId = generateId();
                newElements[newId] = {
                    ...element,
                    id: newId,
                    name: `${element.name} Copy`,
                    transform: {
                        ...element.transform,
                        x: element.transform.x + 20,
                        y: element.transform.y + 20,
                    },
                };
                newOrder.push(newId);
                newIds.push(newId);
            });

            return pushToHistory(state, newElements, newOrder, newIds);
        }

        case 'UNDO': {
            if (state.historyIndex <= 0) return state; // Can't undo past initial state
            const prevIndex = state.historyIndex - 1;
            const historyEntry = state.history[prevIndex];
            
            return {
                ...state,
                elements: historyEntry.elements,
                elementOrder: historyEntry.elementOrder,
                historyIndex: prevIndex,
                selectedIds: [], // Deselect on undo to avoid ghost selection
            };
        }

        case 'REDO': {
            if (state.historyIndex >= state.history.length - 1) return state;
            const nextIndex = state.historyIndex + 1;
            const historyEntry = state.history[nextIndex];
            
            return {
                ...state,
                elements: historyEntry.elements,
                elementOrder: historyEntry.elementOrder,
                historyIndex: nextIndex,
                selectedIds: [], 
            };
        }

        case 'SET_ZOOM':
            return { ...state, zoom: action.zoom };

        case 'SET_PAN':
            return { ...state, pan: action.pan };

        case 'TOGGLE_GRID':
            return { ...state, showGrid: !state.showGrid };

        case 'TOGGLE_SNAP':
            return { ...state, snapToGrid: !state.snapToGrid };

        case 'SET_GRID_SIZE':
            return { ...state, gridSize: action.size };

        case 'LOAD_WIDGET': {
            // Reset history when loading a new widget
            const initialLoadEntry = {
                elements: action.elements,
                elementOrder: action.elementOrder,
                timestamp: Date.now()
            };
            return {
                ...state,
                elements: action.elements,
                elementOrder: action.elementOrder,
                canvasSize: action.canvasSize,
                selectedIds: [],
                history: [initialLoadEntry],
                historyIndex: 0,
            };
        }

        default:
            return state;
    }
};

// ============================================
// Context
// ============================================

interface CanvasContextType {
    state: CanvasState;
    dispatch: React.Dispatch<CanvasAction>;
    // Convenience methods
    addElement: (element: Omit<CanvasElement, 'id'>) => string;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    deleteSelected: () => void;
    selectElement: (id: string, additive?: boolean) => void;
    moveSelected: (deltaX: number, deltaY: number) => void;
    duplicateSelected: () => void;
    copySelected: () => void;
    paste: () => void;
    undo: () => void;
    redo: () => void;
    groupSelected: () => void;
    ungroupSelected: () => void;
    bringForward: (id: string) => void;
    sendBackward: (id: string) => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    loadWidget: (elements: Record<string, CanvasElement>, elementOrder: string[], canvasSize: { width: number; height: number }) => void;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

export const useCanvas = () => {
    const context = useContext(CanvasContext);
    if (!context) {
        throw new Error('useCanvas must be used within a CanvasProvider');
    }
    return context;
};

// ============================================
// Provider
// ============================================

interface CanvasProviderProps {
    children: React.ReactNode;
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(canvasReducer, initialState);

    const addElement = useCallback((element: Omit<CanvasElement, 'id'>): string => {
        const id = generateId();
        dispatch({ type: 'ADD_ELEMENT', element: { ...element, id } as CanvasElement });
        return id;
    }, []);

    const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
        dispatch({ type: 'UPDATE_ELEMENT', id, updates });
    }, []);

    const deleteSelected = useCallback(() => {
        dispatch({ type: 'DELETE_ELEMENTS', ids: state.selectedIds });
    }, [state.selectedIds]);

    const selectElement = useCallback((id: string, additive = false) => {
        if (additive) {
            if (state.selectedIds.includes(id)) {
                dispatch({ type: 'REMOVE_FROM_SELECTION', id });
            } else {
                dispatch({ type: 'ADD_TO_SELECTION', id });
            }
        } else {
            dispatch({ type: 'SELECT_ELEMENTS', ids: [id] });
        }
    }, [state.selectedIds]);

    const moveSelected = useCallback((deltaX: number, deltaY: number) => {
        dispatch({ type: 'MOVE_ELEMENTS', ids: state.selectedIds, deltaX, deltaY });
    }, [state.selectedIds]);

    const duplicateSelected = useCallback(() => {
        dispatch({ type: 'DUPLICATE_ELEMENTS', ids: state.selectedIds });
    }, [state.selectedIds]);

    const copySelected = useCallback(() => {
        dispatch({ type: 'COPY_ELEMENTS', ids: state.selectedIds });
    }, [state.selectedIds]);

    const paste = useCallback(() => {
        dispatch({ type: 'PASTE_ELEMENTS' });
    }, []);

    const undo = useCallback(() => {
        dispatch({ type: 'UNDO' });
    }, []);

    const redo = useCallback(() => {
        dispatch({ type: 'REDO' });
    }, []);

    const groupSelected = useCallback(() => {
        dispatch({ type: 'GROUP_ELEMENTS', ids: state.selectedIds });
    }, [state.selectedIds]);

    const ungroupSelected = useCallback(() => {
        if (state.selectedIds.length === 1) {
            dispatch({ type: 'UNGROUP_ELEMENT', id: state.selectedIds[0] });
        }
    }, [state.selectedIds]);

    const bringForward = useCallback((id: string) => {
        dispatch({ type: 'REORDER_ELEMENT', id, direction: 'forward' });
    }, []);

    const sendBackward = useCallback((id: string) => {
        dispatch({ type: 'REORDER_ELEMENT', id, direction: 'backward' });
    }, []);

    const bringToFront = useCallback((id: string) => {
        dispatch({ type: 'REORDER_ELEMENT', id, direction: 'front' });
    }, []);

    const sendToBack = useCallback((id: string) => {
        dispatch({ type: 'REORDER_ELEMENT', id, direction: 'back' });
    }, []);

    const loadWidget = useCallback((
        elements: Record<string, CanvasElement>, 
        elementOrder: string[], 
        canvasSize: { width: number; height: number }
    ) => {
        dispatch({ type: 'LOAD_WIDGET', elements, elementOrder, canvasSize });
    }, []);

    const value: CanvasContextType = {
        state,
        dispatch,
        addElement,
        updateElement,
        deleteSelected,
        selectElement,
        moveSelected,
        duplicateSelected,
        copySelected,
        paste,
        undo,
        redo,
        groupSelected,
        ungroupSelected,
        bringForward,
        sendBackward,
        bringToFront,
        sendToBack,
        loadWidget,
    };

    return (
        <CanvasContext.Provider value={value}>
            {children}
        </CanvasContext.Provider>
    );
};

export default CanvasContext;
