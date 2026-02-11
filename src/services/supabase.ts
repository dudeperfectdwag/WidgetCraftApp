/**
 * WidgetCraft - Supabase Client
 * Singleton Supabase client configured for the app.
 *
 * ⚠️  Replace the placeholder URL and anon key with your project's actual values.
 *     You can find them in the Supabase dashboard → Settings → API.
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Configuration ────────────────────────────────────────────
// TODO: Move to environment variables / expo-constants for production
const SUPABASE_URL = 'https://dlifjkheceaurpeywdis.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_gjxOiBPYpf9hn9euxLSpwA_YLKPx330';

// ── Database type definitions ────────────────────────────────

export interface CommunityWidgetRow {
    id: string;
    name: string;
    description: string;
    author_name: string;
    author_device_id: string;
    category: string;
    tags: string[];
    thumbnail_url: string | null;
    widget_data: object; // serialised SavedWidget
    width: number;
    height: number;
    element_count: number;
    downloads: number;
    likes: number;
    created_at: string;
    updated_at: string;
}

export type CommunityWidgetInsert = Omit<
    CommunityWidgetRow,
    'id' | 'downloads' | 'likes' | 'created_at' | 'updated_at'
>;

// ── Client instantiation ─────────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export default supabase;
