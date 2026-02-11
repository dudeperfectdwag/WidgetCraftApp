package com.widgetcraft.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

class WidgetPinModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetPinModule"

    companion object {
        private const val TAG = "WidgetPinModule"
    }

    @ReactMethod
    fun isSupported(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val appWidgetManager = AppWidgetManager.getInstance(reactApplicationContext)
            promise.resolve(appWidgetManager.isRequestPinAppWidgetSupported)
        } else {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun pinWidget(imageUri: String, label: String, widgetId: String, promise: Promise) {
        try {
            val context = reactApplicationContext

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                promise.reject("NOT_SUPPORTED", "Widget pinning requires Android 8.0 or higher")
                return
            }

            val appWidgetManager = AppWidgetManager.getInstance(context)

            if (!appWidgetManager.isRequestPinAppWidgetSupported) {
                promise.reject("PIN_NOT_SUPPORTED", "This launcher does not support pinning widgets")
                return
            }

            // Load the widget image from the provided URI
            Log.d(TAG, "Loading image from URI: $imageUri")
            val bitmap = loadBitmapFromUri(context, imageUri)
            if (bitmap == null) {
                promise.reject("BITMAP_ERROR", "Failed to load widget image from: $imageUri")
                return
            }
            Log.d(TAG, "Loaded bitmap: ${bitmap.width}x${bitmap.height}")

            // Save the image as "latest_widget.png"
            val latestFile = WidgetCraftProvider.getLatestImageFile(context)
            FileOutputStream(latestFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                out.flush()
            }
            bitmap.recycle()
            Log.d(TAG, "Saved latest widget image: ${latestFile.absolutePath}")

            // Create the provider component
            val provider = ComponentName(context, WidgetCraftProvider::class.java)

            // Create a callback intent for when the widget is pinned
            val callbackIntent = Intent(context, WidgetPinReceiver::class.java)
            callbackIntent.action = "com.widgetcraft.app.WIDGET_PINNED"

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val successCallback = PendingIntent.getBroadcast(context, 0, callbackIntent, flags)

            // Request to pin the widget
            val success = appWidgetManager.requestPinAppWidget(provider, null, successCallback)
            Log.d(TAG, "requestPinAppWidget result: $success")

            if (success) {
                promise.resolve(true)
            } else {
                promise.reject("PIN_FAILED", "Failed to request widget pin")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error pinning widget", e)
            promise.reject("PIN_ERROR", "Error pinning widget: ${e.message}", e)
        }
    }

    @ReactMethod
    fun pinWidgetWithConfig(imageUri: String, label: String, widgetId: String,
                            elementsJson: String, promise: Promise) {
        try {
            val context = reactApplicationContext

            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
                promise.reject("NOT_SUPPORTED", "Widget pinning requires Android 8.0 or higher")
                return
            }

            val appWidgetManager = AppWidgetManager.getInstance(context)

            if (!appWidgetManager.isRequestPinAppWidgetSupported) {
                promise.reject("PIN_NOT_SUPPORTED", "This launcher does not support pinning widgets")
                return
            }

            // Load the widget image from the provided URI
            Log.d(TAG, "Loading image from URI: $imageUri")
            val bitmap = loadBitmapFromUri(context, imageUri)
            if (bitmap == null) {
                promise.reject("BITMAP_ERROR", "Failed to load widget image from: $imageUri")
                return
            }
            Log.d(TAG, "Loaded bitmap: ${bitmap.width}x${bitmap.height}")

            // Save the image as "latest_widget.png"
            val latestFile = WidgetCraftProvider.getLatestImageFile(context)
            FileOutputStream(latestFile).use { out ->
                bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
                out.flush()
            }
            bitmap.recycle()
            Log.d(TAG, "Saved latest widget image: ${latestFile.absolutePath}")

            // Save elements JSON for native rendering
            val prefs = context.getSharedPreferences("widget_config", Context.MODE_PRIVATE)
            prefs.edit().putString("latest_elements", elementsJson).apply()
            Log.d(TAG, "Saved elements config (${elementsJson.length} chars)")

            // Create the provider component
            val provider = ComponentName(context, WidgetCraftProvider::class.java)

            // Create a callback intent for when the widget is pinned
            val callbackIntent = Intent(context, WidgetPinReceiver::class.java)
            callbackIntent.action = "com.widgetcraft.app.WIDGET_PINNED"

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val successCallback = PendingIntent.getBroadcast(context, 0, callbackIntent, flags)

            // Request to pin the widget
            val success = appWidgetManager.requestPinAppWidget(provider, null, successCallback)
            Log.d(TAG, "requestPinAppWidget result: $success")

            if (success) {
                promise.resolve(true)
            } else {
                promise.reject("PIN_FAILED", "Failed to request widget pin")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error pinning widget with config", e)
            promise.reject("PIN_ERROR", "Error pinning widget: ${e.message}", e)
        }
    }

    private fun loadBitmapFromUri(context: Context, uriString: String): Bitmap? {
        return try {
            when {
                uriString.startsWith("file://") || uriString.startsWith("/") -> {
                    val path = if (uriString.startsWith("file://")) {
                        Uri.parse(uriString).path ?: return null
                    } else {
                        uriString
                    }
                    val file = File(path)
                    if (!file.exists()) return null
                    BitmapFactory.decodeFile(file.absolutePath)
                }
                uriString.startsWith("content://") -> {
                    val uri = Uri.parse(uriString)
                    val inputStream: InputStream? = context.contentResolver.openInputStream(uri)
                    inputStream?.use { BitmapFactory.decodeStream(it) }
                }
                else -> {
                    val file = File(uriString)
                    if (file.exists()) BitmapFactory.decodeFile(file.absolutePath) else null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error loading bitmap from $uriString", e)
            null
        }
    }
}
