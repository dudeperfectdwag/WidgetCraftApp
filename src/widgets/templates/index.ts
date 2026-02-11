/**
 * WidgetCraft - Templates Index
 * Export all widget templates
 */

import { clockTemplates } from './ClockWidgets';
import { weatherTemplates } from './WeatherWidgets';
import { utilityTemplates } from './UtilityWidgets';
import { quoteTemplates } from './QuoteWidgets';
import { mediaTemplates } from './MediaWidgets';
import { shortcutTemplates } from './ShortcutWidgets';
import { WidgetTemplate, WidgetCategory, WidgetSize } from '../types';

// ============================================
// All Templates
// ============================================

export const allTemplates: WidgetTemplate[] = [
    ...clockTemplates,
    ...weatherTemplates,
    ...utilityTemplates,
    ...quoteTemplates,
    ...mediaTemplates,
    ...shortcutTemplates,
];

// ============================================
// Template Lookup
// ============================================

export const templateById: Record<string, WidgetTemplate> = allTemplates.reduce(
    (acc, template) => {
        acc[template.id] = template;
        return acc;
    },
    {} as Record<string, WidgetTemplate>
);

// ============================================
// Filter Helpers
// ============================================

export const getTemplatesByCategory = (category: WidgetCategory): WidgetTemplate[] => {
    return allTemplates.filter((t) => t.category === category);
};

export const getTemplatesBySize = (size: WidgetSize): WidgetTemplate[] => {
    return allTemplates.filter((t) => t.size === size);
};

export const searchTemplates = (query: string): WidgetTemplate[] => {
    const lower = query.toLowerCase();
    return allTemplates.filter(
        (t) =>
            t.name.toLowerCase().includes(lower) ||
            t.description.toLowerCase().includes(lower)
    );
};

// ============================================
// Category Info
// ============================================

export const CATEGORY_INFO: Record<WidgetCategory, { label: string; icon: string; color: string }> = {
    time: { label: 'Clocks & Time', icon: 'clock-outline', color: 'primary' },
    weather: { label: 'Weather', icon: 'weather-partly-cloudy', color: 'secondary' },
    utility: { label: 'Utility', icon: 'cog-outline', color: 'tertiary' },
    media: { label: 'Music & Media', icon: 'music-note', color: 'tertiary' },
    productivity: { label: 'Quotes & Text', icon: 'format-quote-close', color: 'primary' },
    social: { label: 'Social', icon: 'account-group', color: 'secondary' },
    shortcuts: { label: 'Shortcuts', icon: 'apps', color: 'primary' },
    script: { label: 'Scripts', icon: 'code-braces', color: 'primary' },
};

// Re-export individual template arrays
export { clockTemplates, weatherTemplates, utilityTemplates, quoteTemplates, mediaTemplates, shortcutTemplates };

// Re-export template converter
export { convertTemplateToCanvas, prepareTemplateForNavigation } from './TemplateConverter';
export type { ConvertedTemplate, TemplateNavigationParams } from './TemplateConverter';
