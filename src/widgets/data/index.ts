/**
 * WidgetCraft - Data Index
 * Export data binding components
 */

export { WidgetDataProvider, useWidgetData, useDataValue, useParsedText } from './DataContext';
export {
    dataProvider,
    parseDataBindings,
    startDataUpdates,
    stopDataUpdates,
    updateBattery,
    updateWeather,
    updateMusic,
    getCurrentWeatherData,
} from './DataSources';
