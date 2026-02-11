import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useCanvas } from '../canvas/CanvasContext';

export const useKeyboardShortcuts = (enabled: boolean = true) => {
    const { 
        state, 
        dispatch,
        undo, 
        redo, 
        deleteSelected, 
        copySelected, 
        paste, 
        duplicateSelected, 
        moveSelected,
        groupSelected,
        ungroupSelected,
        bringForward,
        sendBackward
    } = useCanvas();

    useEffect(() => {
        if (Platform.OS !== 'web' || !enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input is focused
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                return;
            }

            const isCtrlOrCmd = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;

            // Undo / Redo
            if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (shift) {
                    redo();
                } else {
                    undo();
                }
                return;
            }
            if (isCtrlOrCmd && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
                return;
            }

            // Copy
            if (isCtrlOrCmd && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                copySelected();
                return;
            }

            // Paste
            if (isCtrlOrCmd && e.key.toLowerCase() === 'v') {
                e.preventDefault();
                paste();
                return;
            }

            // Duplicate
            if (isCtrlOrCmd && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                duplicateSelected();
                return;
            }

            // Select All
            if (isCtrlOrCmd && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                const allIds = state.elementOrder; // elementOrder contains all active IDs
                dispatch({ type: 'SELECT_ELEMENTS', ids: allIds });
                return;
            }

            // Group / Ungroup
            if (isCtrlOrCmd && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                if (shift) {
                    ungroupSelected();
                } else {
                    groupSelected();
                }
                return;
            }

            // Save (prevent browser save)
            if (isCtrlOrCmd && e.key.toLowerCase() === 's') {
                e.preventDefault();
                // Optionally trigger save here if a callback was passed
                return;
            }

            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                deleteSelected();
                return;
            }

            // Nudge (Arrow Keys)
            if (state.selectedIds.length > 0) {
                const nudgeAmount = shift ? 10 : 1;
                
                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault();
                        moveSelected(0, -nudgeAmount);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        moveSelected(0, nudgeAmount);
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        moveSelected(-nudgeAmount, 0);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        moveSelected(nudgeAmount, 0);
                        break;
                }
                
                // Layer Reordering with brackets
                if (e.key === '[' && isCtrlOrCmd) {
                    e.preventDefault();
                    sendBackward(state.selectedIds[0]);
                }
                if (e.key === ']' && isCtrlOrCmd) {
                    e.preventDefault();
                    bringForward(state.selectedIds[0]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        enabled, 
        state.selectedIds, 
        state.elementOrder, 
        undo, 
        redo, 
        copySelected, 
        paste, 
        duplicateSelected, 
        deleteSelected, 
        moveSelected, 
        groupSelected, 
        ungroupSelected,
        dispatch
    ]);
};
