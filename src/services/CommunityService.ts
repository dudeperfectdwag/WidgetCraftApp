/**
 * WidgetCraft - Community Service
 * Handles sharing, browsing, searching and downloading community widgets
 * via Supabase backend.
 */

import { supabase, CommunityWidgetRow, CommunityWidgetInsert } from './supabase';
import { SavedWidget, getWidget } from './WidgetStorage';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Constants ────────────────────────────────────────────────

const DEVICE_ID_KEY = '@widgetcraft/device_id';
const PAGE_SIZE = 20;

// ── Helpers ──────────────────────────────────────────────────

/** Get or create a persistent anonymous device id. */
export const getDeviceId = async (): Promise<string> => {
    let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        id = `${Device.modelName ?? 'device'}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
};

// ── Public types ─────────────────────────────────────────────

export interface CommunityWidget {
    id: string;
    name: string;
    description: string;
    authorName: string;
    category: string;
    tags: string[];
    thumbnailUrl: string | null;
    width: number;
    height: number;
    elementCount: number;
    downloads: number;
    likes: number;
    createdAt: string;
    /** The full serialised widget data (only loaded on download) */
    widgetData?: object;
}

export type SortOption = 'newest' | 'popular' | 'most_downloaded' | 'most_liked';

export interface BrowseOptions {
    page?: number;
    pageSize?: number;
    category?: string;
    searchQuery?: string;
    sort?: SortOption;
    tags?: string[];
}

// ── Row ↔ CommunityWidget mappers ────────────────────────────

const rowToWidget = (row: CommunityWidgetRow, includeData = false): CommunityWidget => ({
    id: row.id,
    name: row.name,
    description: row.description,
    authorName: row.author_name,
    category: row.category,
    tags: row.tags ?? [],
    thumbnailUrl: row.thumbnail_url,
    width: row.width,
    height: row.height,
    elementCount: row.element_count,
    downloads: row.downloads,
    likes: row.likes,
    createdAt: row.created_at,
    ...(includeData ? { widgetData: row.widget_data } : {}),
});

// ── CATEGORIES ───────────────────────────────────────────────

export const COMMUNITY_CATEGORIES = [
    'All',
    'Weather',
    'Clock',
    'Calendar',
    'Fitness',
    'Music',
    'Battery',
    'Quotes',
    'Photo',
    'Utility',
    'Custom',
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

// ── Share a widget to the community ──────────────────────────

export const shareWidgetToCommunity = async (
    widgetId: string,
    name: string,
    description: string,
    authorName: string,
    category: string,
    tags: string[] = [],
): Promise<CommunityWidget> => {
    const widget = await getWidget(widgetId);
    if (!widget) throw new Error('Widget not found in local storage');

    const deviceId = await getDeviceId();

    const insert: CommunityWidgetInsert = {
        name,
        description,
        author_name: authorName,
        author_device_id: deviceId,
        category,
        tags,
        thumbnail_url: widget.thumbnail ?? null,
        widget_data: widget as unknown as object,
        width: widget.width,
        height: widget.height,
        element_count: widget.elementCount,
    };

    const { data, error } = await supabase
        .from('community_widgets')
        .insert(insert)
        .select()
        .single();

    if (error) throw error;
    return rowToWidget(data as CommunityWidgetRow);
};

// ── Browse / Search ──────────────────────────────────────────

export const browseCommunityWidgets = async (
    options: BrowseOptions = {},
): Promise<{ widgets: CommunityWidget[]; total: number }> => {
    const {
        page = 0,
        pageSize = PAGE_SIZE,
        category,
        searchQuery,
        sort = 'newest',
        tags,
    } = options;

    let query = supabase
        .from('community_widgets')
        .select('id,name,description,author_name,author_device_id,category,tags,thumbnail_url,width,height,element_count,downloads,likes,created_at,updated_at', { count: 'exact' });

    // Category filter
    if (category && category !== 'All') {
        query = query.eq('category', category);
    }

    // Full-text / ilike search
    if (searchQuery && searchQuery.trim().length > 0) {
        const term = `%${searchQuery.trim()}%`;
        query = query.or(`name.ilike.${term},description.ilike.${term},tags.cs.{${searchQuery.trim()}}`);
    }

    // Tag filter
    if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
    }

    // Sorting
    switch (sort) {
        case 'popular':
            query = query.order('likes', { ascending: false });
            break;
        case 'most_downloaded':
            query = query.order('downloads', { ascending: false });
            break;
        case 'most_liked':
            query = query.order('likes', { ascending: false });
            break;
        case 'newest':
        default:
            query = query.order('created_at', { ascending: false });
            break;
    }

    // Pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
        widgets: (data as CommunityWidgetRow[]).map((r) => rowToWidget(r)),
        total: count ?? 0,
    };
};

// ── Get trending / featured ──────────────────────────────────

export const getTrendingWidgets = async (limit = 6): Promise<CommunityWidget[]> => {
    const { data, error } = await supabase
        .from('community_widgets')
        .select('id,name,description,author_name,author_device_id,category,tags,thumbnail_url,width,height,element_count,downloads,likes,created_at,updated_at')
        .order('downloads', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data as CommunityWidgetRow[]).map((r) => rowToWidget(r));
};

export const getNewestWidgets = async (limit = 6): Promise<CommunityWidget[]> => {
    const { data, error } = await supabase
        .from('community_widgets')
        .select('id,name,description,author_name,author_device_id,category,tags,thumbnail_url,width,height,element_count,downloads,likes,created_at,updated_at')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data as CommunityWidgetRow[]).map((r) => rowToWidget(r));
};

// ── Download / import single widget ──────────────────────────

export const downloadCommunityWidget = async (
    communityId: string,
): Promise<SavedWidget> => {
    // Fetch full widget data
    const { data, error } = await supabase
        .from('community_widgets')
        .select('*')
        .eq('id', communityId)
        .single();

    if (error) throw error;
    const row = data as CommunityWidgetRow;

    // Increment download counter (fire-and-forget)
    supabase.rpc('increment_downloads', { widget_id: communityId }).then();

    return row.widget_data as unknown as SavedWidget;
};

// ── Like a widget ────────────────────────────────────────────

export const likeCommunityWidget = async (communityId: string): Promise<void> => {
    const { error } = await supabase.rpc('increment_likes', { widget_id: communityId });
    if (error) throw error;
};

// ── Delete own shared widget ─────────────────────────────────

export const deleteSharedWidget = async (communityId: string): Promise<void> => {
    const deviceId = await getDeviceId();
    const { error } = await supabase
        .from('community_widgets')
        .delete()
        .eq('id', communityId)
        .eq('author_device_id', deviceId);

    if (error) throw error;
};

// ── Check if a widget is already shared ──────────────────────

export const isWidgetShared = async (localWidgetId: string): Promise<boolean> => {
    const deviceId = await getDeviceId();
    const { count, error } = await supabase
        .from('community_widgets')
        .select('id', { count: 'exact', head: true })
        .contains('widget_data', { id: localWidgetId })
        .eq('author_device_id', deviceId);

    if (error) return false;
    return (count ?? 0) > 0;
};
