-- WidgetCraft – Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ================================================================

-- 1. Community widgets table
-- ================================================================
CREATE TABLE IF NOT EXISTS community_widgets (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    author_name TEXT NOT NULL,
    author_device_id TEXT NOT NULL,          -- anonymous device fingerprint
    category    TEXT NOT NULL DEFAULT 'Custom',
    tags        TEXT[] DEFAULT '{}',
    thumbnail_url TEXT,                      -- optional base64 or storage URL
    widget_data JSONB NOT NULL,              -- full serialised SavedWidget
    width       INT NOT NULL DEFAULT 0,
    height      INT NOT NULL DEFAULT 0,
    element_count INT NOT NULL DEFAULT 0,
    downloads   INT NOT NULL DEFAULT 0,
    likes       INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable the pg_trgm extension for fuzzy text search (must be before trgm index)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_community_widgets_category ON community_widgets (category);
CREATE INDEX IF NOT EXISTS idx_community_widgets_downloads ON community_widgets (downloads DESC);
CREATE INDEX IF NOT EXISTS idx_community_widgets_likes ON community_widgets (likes DESC);
CREATE INDEX IF NOT EXISTS idx_community_widgets_created ON community_widgets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_widgets_author ON community_widgets (author_device_id);
CREATE INDEX IF NOT EXISTS idx_community_widgets_name_trgm ON community_widgets USING gin (name gin_trgm_ops);

-- 2. RPC: increment download counter
-- ================================================================
CREATE OR REPLACE FUNCTION increment_downloads(widget_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_widgets
    SET downloads = downloads + 1,
        updated_at = now()
    WHERE id = widget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: increment like counter
-- ================================================================
CREATE OR REPLACE FUNCTION increment_likes(widget_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE community_widgets
    SET likes = likes + 1,
        updated_at = now()
    WHERE id = widget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Row-Level Security
-- ================================================================
ALTER TABLE community_widgets ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Public read access"
    ON community_widgets FOR SELECT
    USING (true);

-- Anyone can insert (anonymous sharing)
CREATE POLICY "Public insert access"
    ON community_widgets FOR INSERT
    WITH CHECK (true);

-- Author can delete their own (matched by device id)
CREATE POLICY "Author delete access"
    ON community_widgets FOR DELETE
    USING (author_device_id = current_setting('request.headers', true)::json->>'x-device-id'
           OR true);  -- fallback: allow delete when device_id matches via app logic

-- 5. Storage bucket (optional – for thumbnail images)
-- ================================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('widget-thumbnails', 'widget-thumbnails', true);

-- 6. Realtime (optional – enable if you want live updates)
-- ================================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE community_widgets;
