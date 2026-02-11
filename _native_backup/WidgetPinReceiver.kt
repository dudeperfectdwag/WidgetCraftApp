package com.widgetcraft.app

import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * BroadcastReceiver callback after a widget is successfully pinned.
 * Copies the latest widget image to per-widget storage and triggers a refresh.
 */
class WidgetPinReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Widget pin callback received")

        val appWidgetManager = AppWidgetManager.getInstance(context)
        val provider = ComponentName(context, WidgetCraftProvider::class.java)
        val widgetIds = appWidgetManager.getAppWidgetIds(provider)

        if (widgetIds.isEmpty()) {
            Log.w(TAG, "No widget IDs found")
            return
        }

        val newWidgetId = widgetIds.last()
        Log.d(TAG, "New widget ID: $newWidgetId")

        // Copy latest image to widget-specific file
        val latestFile = WidgetCraftProvider.getLatestImageFile(context)
        if (latestFile.exists()) {
            val targetFile = WidgetCraftProvider.getWidgetImageFile(context, newWidgetId)
            latestFile.copyTo(targetFile, overwrite = true)
            Log.d(TAG, "Copied image to ${targetFile.absolutePath}")

            // Copy element config for native rendering
            val prefs = context.getSharedPreferences("widget_config", android.content.Context.MODE_PRIVATE)
            val latestElements = prefs.getString("latest_elements", null)
            if (latestElements != null) {
                prefs.edit().putString("elements_$newWidgetId", latestElements).apply()
                Log.d(TAG, "Copied element config for widget $newWidgetId")
            }

            // Force update the widget
            WidgetCraftProvider.updateWidget(context, appWidgetManager, newWidgetId)
        } else {
            Log.w(TAG, "Latest image file not found")
        }
    }

    companion object {
        private const val TAG = "WidgetPinReceiver"
    }
}
