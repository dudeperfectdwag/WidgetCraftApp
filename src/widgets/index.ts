/**
 * WidgetCraft - Widgets Module Index
 * Main export for widget system
 */

// Types
export * from './types';

// Templates
export {
    allTemplates,
    templateById,
    getTemplatesByCategory,
    getTemplatesBySize,
    searchTemplates,
    CATEGORY_INFO,
    clockTemplates,
    weatherTemplates,
    utilityTemplates,
    quoteTemplates,
    mediaTemplates,
    shortcutTemplates,
} from './templates';

// Data
export {
    WidgetDataProvider,
    useWidgetData,
    useDataValue,
    useParsedText,
    dataProvider,
    parseDataBindings,
    startDataUpdates,
    stopDataUpdates,
    updateBattery,
    updateWeather,
    updateMusic,
} from './data';

// Components
export { WidgetRenderer } from './components';

// Export
export { WidgetExporter } from './export/WidgetExporter';
