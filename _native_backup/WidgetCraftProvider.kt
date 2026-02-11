package com.widgetcraft.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.*
import android.os.BatteryManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.RemoteViews
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.sin

/**
 * KWGT-style AppWidgetProvider: renders the ENTIRE widget as a single bitmap.
 *
 * Architecture:
 *   1. Background image (the screenshot from the editor) is drawn first
 *   2. Each serialized canvas element is drawn on top via Canvas
 *   3. Data bindings ({time.hours}, {date.day}, etc.) are resolved to live values
 *   4. Analog clocks are drawn with properly styled hands and face
 *   5. The final bitmap is pushed via setImageViewBitmap() to a single ImageView
 *   6. AlarmManager schedules redraw every 60 seconds for live data widgets
 */
class WidgetCraftProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        Log.d(TAG, "onUpdate called for widget IDs: ${appWidgetIds.joinToString()}")
        var hasLiveData = false
        for (appWidgetId in appWidgetIds) {
            val isLive = updateWidget(context, appWidgetManager, appWidgetId)
            if (isLive) hasLiveData = true
        }

        // Schedule periodic updates only if any widget has live data
        if (hasLiveData) {
            scheduleNextUpdate(context)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_UPDATE_WIDGET) {
            Log.d(TAG, "Received UPDATE_WIDGET action")
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(ComponentName(context, WidgetCraftProvider::class.java))
            if (ids.isNotEmpty()) {
                onUpdate(context, mgr, ids)
            }
        }
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        for (appWidgetId in appWidgetIds) {
            getWidgetImageFile(context, appWidgetId).delete()
            editor.remove("elements_$appWidgetId")
        }
        editor.apply()
    }

    override fun onDisabled(context: Context) {
        // Last widget removed — cancel any scheduled alarms
        cancelUpdate(context)
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle
    ) {
        // Re-render when widget is resized
        updateWidget(context, appWidgetManager, appWidgetId)
    }

    companion object {
        private const val TAG = "WidgetCraftProvider"
        private const val LATEST_IMAGE_NAME = "latest_widget.png"
        private const val PREFS_NAME = "widget_config"
        private const val ACTION_UPDATE_WIDGET = "com.widgetcraft.app.UPDATE_WIDGET"
        private const val UPDATE_INTERVAL_MS = 60_000L  // 1 minute

        fun getWidgetDir(context: Context): File {
            val dir = File(context.filesDir, "widgets")
            if (!dir.exists()) dir.mkdirs()
            return dir
        }

        fun getWidgetImageFile(context: Context, appWidgetId: Int): File {
            return File(getWidgetDir(context), "widget_$appWidgetId.png")
        }

        fun getLatestImageFile(context: Context): File {
            return File(getWidgetDir(context), LATEST_IMAGE_NAME)
        }

        /**
         * Update a single widget — returns true if widget has live data (needs periodic updates)
         */
        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ): Boolean {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)

            // Determine widget size in pixels
            val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
            val density = context.resources.displayMetrics.density
            val widthDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 180)
            val heightDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 90)
            val widthPx = (widthDp * density).toInt().coerceAtLeast(100)
            val heightPx = (heightDp * density).toInt().coerceAtLeast(50)

            // Load background image
            var imageFile = getWidgetImageFile(context, appWidgetId)
            if (!imageFile.exists()) {
                val latestFile = getLatestImageFile(context)
                if (latestFile.exists()) {
                    latestFile.copyTo(imageFile, overwrite = true)
                    Log.d(TAG, "Copied latest image to widget $appWidgetId")
                }
            }

            // Load element config
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val elementsJson = prefs.getString("elements_$appWidgetId", null)

            var hasLiveData: Boolean

            if (elementsJson != null) {
                // Full bitmap rendering with live data
                val bitmap = renderWidget(context, imageFile, elementsJson, widthPx, heightPx)
                hasLiveData = hasLiveDataElements(elementsJson)
                if (bitmap != null) {
                    views.setImageViewBitmap(R.id.widget_image, bitmap)
                    Log.d(TAG, "Rendered widget $appWidgetId: ${bitmap.width}x${bitmap.height}, live=$hasLiveData")
                } else {
                    Log.w(TAG, "Failed to render widget $appWidgetId, falling back to image")
                    setStaticImage(views, imageFile, appWidgetId)
                    hasLiveData = false
                }
            } else {
                // No element config — just show static image
                setStaticImage(views, imageFile, appWidgetId)
                hasLiveData = false
            }

            // Set click to open app
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launchIntent != null) {
                val pendingIntent = PendingIntent.getActivity(
                    context, appWidgetId, launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_image, pendingIntent)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
            return hasLiveData
        }

        private fun setStaticImage(views: RemoteViews, imageFile: File, widgetId: Int) {
            if (imageFile.exists()) {
                val bitmap = BitmapFactory.decodeFile(imageFile.absolutePath)
                if (bitmap != null) {
                    views.setImageViewBitmap(R.id.widget_image, bitmap)
                    Log.d(TAG, "Set static image for widget $widgetId: ${bitmap.width}x${bitmap.height}")
                }
            }
        }

        // ============================================
        // Rendering Engine
        // ============================================

        private fun renderWidget(
            context: Context,
            backgroundFile: File,
            elementsJson: String,
            widthPx: Int,
            heightPx: Int
        ): Bitmap? {
            return try {
                val bitmap = Bitmap.createBitmap(widthPx, heightPx, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)

                // Draw background image scaled to fill
                if (backgroundFile.exists()) {
                    val bgBitmap = BitmapFactory.decodeFile(backgroundFile.absolutePath)
                    if (bgBitmap != null) {
                        val srcRect = Rect(0, 0, bgBitmap.width, bgBitmap.height)
                        val dstRect = Rect(0, 0, widthPx, heightPx)
                        canvas.drawBitmap(bgBitmap, srcRect, dstRect, null)
                        bgBitmap.recycle()
                    }
                }

                // Parse and draw elements
                val elements = JSONArray(elementsJson)
                for (i in 0 until elements.length()) {
                    try {
                        drawElement(context, canvas, elements.getJSONObject(i), widthPx, heightPx)
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to draw element $i", e)
                    }
                }

                bitmap
            } catch (e: Exception) {
                Log.e(TAG, "Error rendering widget", e)
                null
            }
        }

        private fun drawElement(
            context: Context,
            canvas: Canvas,
            element: JSONObject,
            widgetW: Int,
            widgetH: Int
        ) {
            val type = element.optString("type", "")
            val x = (element.optDouble("xPercent", 0.0) * widgetW).toFloat()
            val y = (element.optDouble("yPercent", 0.0) * widgetH).toFloat()
            val w = (element.optDouble("widthPercent", 0.0) * widgetW).toFloat()
            val h = (element.optDouble("heightPercent", 0.0) * widgetH).toFloat()
            val rotation = element.optDouble("rotation", 0.0).toFloat()
            val opacity = (element.optDouble("opacity", 1.0) * 255).toInt()

            canvas.save()
            if (rotation != 0f) {
                canvas.rotate(rotation, x + w / 2, y + h / 2)
            }

            when (type) {
                "rectangle" -> drawRectangle(canvas, element, x, y, w, h, opacity)
                "ellipse" -> drawEllipse(canvas, element, x, y, w, h, opacity)
                "text" -> drawText(canvas, element, x, y, w, h, opacity, widgetH)
                "digitalClock" -> drawDigitalClock(canvas, element, x, y, w, h, opacity, widgetH)
                "analogClock" -> drawAnalogClock(canvas, element, x, y, w, h, opacity)
                "image" -> { /* Images stay in the background screenshot */ }
            }

            canvas.restore()
        }

        // ============================================
        // Shape Drawing
        // ============================================

        private fun drawRectangle(
            canvas: Canvas, element: JSONObject,
            x: Float, y: Float, w: Float, h: Float, opacity: Int
        ) {
            val rect = RectF(x, y, x + w, y + h)
            val cornerRadius = element.optDouble("cornerRadius", 0.0).toFloat()

            // Fill
            val fill = element.optString("fill", "")
            if (fill.isNotEmpty()) {
                val paint = Paint(Paint.ANTI_ALIAS_FLAG)
                paint.style = Paint.Style.FILL
                paint.color = parseColor(fill)
                paint.alpha = opacity
                canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint)
            }

            // Stroke
            val stroke = element.optString("stroke", "")
            if (stroke.isNotEmpty()) {
                val paint = Paint(Paint.ANTI_ALIAS_FLAG)
                paint.style = Paint.Style.STROKE
                paint.color = parseColor(stroke)
                paint.strokeWidth = element.optDouble("strokeWidth", 1.0).toFloat()
                paint.alpha = opacity
                canvas.drawRoundRect(rect, cornerRadius, cornerRadius, paint)
            }
        }

        private fun drawEllipse(
            canvas: Canvas, element: JSONObject,
            x: Float, y: Float, w: Float, h: Float, opacity: Int
        ) {
            val rect = RectF(x, y, x + w, y + h)

            val fill = element.optString("fill", "")
            if (fill.isNotEmpty()) {
                val paint = Paint(Paint.ANTI_ALIAS_FLAG)
                paint.style = Paint.Style.FILL
                paint.color = parseColor(fill)
                paint.alpha = opacity
                canvas.drawOval(rect, paint)
            }

            val stroke = element.optString("stroke", "")
            if (stroke.isNotEmpty()) {
                val paint = Paint(Paint.ANTI_ALIAS_FLAG)
                paint.style = Paint.Style.STROKE
                paint.color = parseColor(stroke)
                paint.strokeWidth = element.optDouble("strokeWidth", 1.0).toFloat()
                paint.alpha = opacity
                canvas.drawOval(rect, paint)
            }
        }

        // ============================================
        // Text Drawing
        // ============================================

        private fun drawText(
            canvas: Canvas, element: JSONObject,
            x: Float, y: Float, w: Float, h: Float,
            opacity: Int, widgetH: Int
        ) {
            val content = element.optString("content", "")
            if (content.isEmpty()) return

            // Resolve data bindings
            val resolvedText = resolveDataBindings(content)

            val paint = createTextPaint(element, opacity, widgetH)
            drawTextInBounds(canvas, resolvedText, paint, element, x, y, w, h)
        }

        private fun drawDigitalClock(
            canvas: Canvas, element: JSONObject,
            x: Float, y: Float, w: Float, h: Float,
            opacity: Int, widgetH: Int
        ) {
            val clockConfig = element.optJSONObject("clockConfig")
            val format = clockConfig?.optString("format", "12h") ?: "12h"
            val showAmPm = clockConfig?.optBoolean("showAmPm", true) ?: true

            val cal = Calendar.getInstance()
            val timeText = if (format == "24h") {
                SimpleDateFormat("HH:mm", Locale.getDefault()).format(cal.time)
            } else {
                val base = SimpleDateFormat("h:mm", Locale.getDefault()).format(cal.time)
                if (showAmPm) {
                    val ampm = SimpleDateFormat("a", Locale.getDefault()).format(cal.time)
                    "$base $ampm"
                } else {
                    base
                }
            }

            val paint = createTextPaint(element, opacity, widgetH)
            drawTextInBounds(canvas, timeText, paint, element, x, y, w, h)
        }

        private fun createTextPaint(element: JSONObject, opacity: Int, widgetH: Int): Paint {
            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            paint.color = parseColor(element.optString("color", "#FFFFFF"))
            paint.alpha = opacity

            // Scale font size relative to widget height
            val fontSize = element.optDouble("fontSize", 16.0).toFloat()
            // Scale: fontSize is in design-space pixels; scale to widget pixel size
            paint.textSize = fontSize * (widgetH / 300f).coerceIn(0.5f, 3f)

            // Font weight
            val fontWeight = element.optString("fontWeight", "normal")
            paint.typeface = when {
                fontWeight.contains("bold", ignoreCase = true) || (fontWeight.toIntOrNull() ?: 400) >= 700 ->
                    Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                else ->
                    Typeface.DEFAULT
            }

            return paint
        }

        private fun drawTextInBounds(
            canvas: Canvas, text: String, paint: Paint,
            element: JSONObject,
            x: Float, y: Float, w: Float, h: Float
        ) {
            val textAlign = element.optString("textAlign", "center")
            val textWidth = paint.measureText(text)
            val fontMetrics = paint.fontMetrics
            val textHeight = fontMetrics.descent - fontMetrics.ascent

            // Horizontal alignment
            val drawX = when (textAlign) {
                "left" -> x
                "right" -> x + w - textWidth
                else -> x + (w - textWidth) / 2  // center
            }

            // Vertical center
            val drawY = y + (h - textHeight) / 2 - fontMetrics.ascent

            canvas.drawText(text, drawX, drawY, paint)
        }

        // ============================================
        // Analog Clock Drawing
        // ============================================

        private fun drawAnalogClock(
            canvas: Canvas, element: JSONObject,
            x: Float, y: Float, w: Float, h: Float, opacity: Int
        ) {
            val config = element.optJSONObject("clockConfig") ?: JSONObject()
            val cx = x + w / 2
            val cy = y + h / 2
            val radius = min(w, h) / 2 * 0.9f

            val cal = Calendar.getInstance()
            val hour = cal.get(Calendar.HOUR)
            val minute = cal.get(Calendar.MINUTE)
            val second = cal.get(Calendar.SECOND)

            val showSeconds = config.optBoolean("showSeconds", false)
            val showNumbers = config.optBoolean("showNumbers", true)
            val showTicks = config.optBoolean("showTicks", true)
            val faceStyle = config.optString("faceStyle", "classic")
            val handStyle = config.optString("handStyle", "classic")

            // Colors
            val faceColor = parseColor(config.optString("faceColor", "#FFFFFF"))
            val hourHandColor = parseColor(config.optString("hourHandColor", "#000000"))
            val minuteHandColor = parseColor(config.optString("minuteHandColor", "#000000"))
            val secondHandColor = parseColor(config.optString("secondHandColor", "#FF0000"))
            val tickColor = parseColor(config.optString("tickColor", "#333333"))
            val numberColor = parseColor(config.optString("numberColor", "#000000"))

            canvas.save()

            // Draw face
            val facePaint = Paint(Paint.ANTI_ALIAS_FLAG)
            facePaint.style = Paint.Style.FILL
            facePaint.color = faceColor
            facePaint.alpha = opacity
            canvas.drawCircle(cx, cy, radius, facePaint)

            // Face border
            val borderPaint = Paint(Paint.ANTI_ALIAS_FLAG)
            borderPaint.style = Paint.Style.STROKE
            borderPaint.color = tickColor
            borderPaint.strokeWidth = 2f
            borderPaint.alpha = opacity
            canvas.drawCircle(cx, cy, radius, borderPaint)

            // Draw ticks
            if (showTicks) {
                drawClockTicks(canvas, cx, cy, radius, faceStyle, tickColor, opacity)
            }

            // Draw numbers
            if (showNumbers) {
                drawClockNumbers(canvas, cx, cy, radius, faceStyle, numberColor, opacity)
            }

            // Draw hands
            val handWidths = getHandWidths(handStyle, radius)

            // Hour hand
            val hourAngle = (hour % 12) * 30.0 + minute * 0.5
            drawClockHand(canvas, cx, cy, radius * 0.5f, hourAngle.toFloat(),
                hourHandColor, handWidths.first, opacity, handStyle)

            // Minute hand
            val minuteAngle = minute * 6.0
            drawClockHand(canvas, cx, cy, radius * 0.7f, minuteAngle.toFloat(),
                minuteHandColor, handWidths.second, opacity, handStyle)

            // Second hand
            if (showSeconds) {
                val secondAngle = second * 6.0
                drawClockHand(canvas, cx, cy, radius * 0.8f, secondAngle.toFloat(),
                    secondHandColor, 2f, opacity, "thin")
            }

            // Center dot
            val dotPaint = Paint(Paint.ANTI_ALIAS_FLAG)
            dotPaint.style = Paint.Style.FILL
            dotPaint.color = hourHandColor
            dotPaint.alpha = opacity
            canvas.drawCircle(cx, cy, radius * 0.05f, dotPaint)

            canvas.restore()
        }

        private fun drawClockTicks(
            canvas: Canvas, cx: Float, cy: Float, radius: Float,
            faceStyle: String, tickColor: Int, opacity: Int
        ) {
            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            paint.color = tickColor
            paint.alpha = opacity

            for (i in 0 until 60) {
                val angle = Math.toRadians((i * 6 - 90).toDouble())
                val isMajor = i % 5 == 0

                when (faceStyle) {
                    "minimal" -> {
                        // Only 4 ticks at 12, 3, 6, 9
                        if (i % 15 == 0) {
                            paint.strokeWidth = 3f
                            val inner = radius * 0.8f
                            val outer = radius * 0.92f
                            drawTickLine(canvas, cx, cy, inner, outer, angle, paint)
                        }
                    }
                    "dots" -> {
                        if (isMajor) {
                            val dotRadius = radius * 0.03f
                            val dotDist = radius * 0.85f
                            val dx = cx + cos(angle).toFloat() * dotDist
                            val dy = cy + sin(angle).toFloat() * dotDist
                            canvas.drawCircle(dx, dy, dotRadius, paint)
                        }
                    }
                    else -> {
                        // classic, modern, lines
                        val inner = if (isMajor) radius * 0.78f else radius * 0.88f
                        val outer = radius * 0.92f
                        paint.strokeWidth = if (isMajor) 3f else 1f
                        drawTickLine(canvas, cx, cy, inner, outer, angle, paint)
                    }
                }
            }
        }

        private fun drawTickLine(
            canvas: Canvas, cx: Float, cy: Float,
            inner: Float, outer: Float, angle: Double, paint: Paint
        ) {
            val x1 = cx + cos(angle).toFloat() * inner
            val y1 = cy + sin(angle).toFloat() * inner
            val x2 = cx + cos(angle).toFloat() * outer
            val y2 = cy + sin(angle).toFloat() * outer
            canvas.drawLine(x1, y1, x2, y2, paint)
        }

        private fun drawClockNumbers(
            canvas: Canvas, cx: Float, cy: Float, radius: Float,
            faceStyle: String, numberColor: Int, opacity: Int
        ) {
            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            paint.color = numberColor
            paint.alpha = opacity
            paint.textSize = radius * 0.2f
            paint.textAlign = Paint.Align.CENTER
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)

            val romanNumerals = arrayOf("I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII")

            for (i in 1..12) {
                val angle = Math.toRadians((i * 30 - 90).toDouble())
                val numDist = radius * 0.7f
                val nx = cx + cos(angle).toFloat() * numDist
                val ny = cy + sin(angle).toFloat() * numDist

                val fontMetrics = paint.fontMetrics
                val textY = ny - (fontMetrics.ascent + fontMetrics.descent) / 2

                val label = if (faceStyle == "roman") romanNumerals[i - 1] else i.toString()
                canvas.drawText(label, nx, textY, paint)
            }
        }

        private fun getHandWidths(handStyle: String, radius: Float): Pair<Float, Float> {
            return when (handStyle) {
                "thin" -> Pair(radius * 0.02f, radius * 0.015f)
                "bold" -> Pair(radius * 0.08f, radius * 0.06f)
                "modern" -> Pair(radius * 0.05f, radius * 0.035f)
                "arrow" -> Pair(radius * 0.05f, radius * 0.035f)
                else -> Pair(radius * 0.04f, radius * 0.03f)  // classic
            }
        }

        private fun drawClockHand(
            canvas: Canvas, cx: Float, cy: Float,
            length: Float, angleDegrees: Float,
            color: Int, width: Float, opacity: Int, handStyle: String
        ) {
            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            paint.color = color
            paint.alpha = opacity
            paint.strokeCap = if (handStyle == "modern") Paint.Cap.SQUARE else Paint.Cap.ROUND

            val angleRad = Math.toRadians((angleDegrees - 90).toDouble())
            val endX = cx + cos(angleRad).toFloat() * length
            val endY = cy + sin(angleRad).toFloat() * length

            if (handStyle == "arrow" && width > 3f) {
                // Draw as filled path (arrow/triangle tip)
                val path = Path()
                val tipLen = length
                val baseLen = length * 0.15f
                val halfBase = width * 0.6f

                val tipX = cx + cos(angleRad).toFloat() * tipLen
                val tipY = cy + sin(angleRad).toFloat() * tipLen

                val perpAngle = angleRad + Math.PI / 2
                val baseX = cx + cos(angleRad).toFloat() * baseLen
                val baseY = cy + sin(angleRad).toFloat() * baseLen

                val lx = baseX - cos(perpAngle).toFloat() * halfBase
                val ly = baseY - sin(perpAngle).toFloat() * halfBase
                val rx = baseX + cos(perpAngle).toFloat() * halfBase
                val ry = baseY + sin(perpAngle).toFloat() * halfBase

                path.moveTo(tipX, tipY)
                path.lineTo(lx, ly)
                path.lineTo(rx, ry)
                path.close()

                paint.style = Paint.Style.FILL
                canvas.drawPath(path, paint)

                // Also draw thin line for the tail
                val tailPaint = Paint(paint)
                tailPaint.strokeWidth = 2f
                tailPaint.style = Paint.Style.STROKE
                val tailEndX = cx - cos(angleRad).toFloat() * (length * 0.2f)
                val tailEndY = cy - sin(angleRad).toFloat() * (length * 0.2f)
                canvas.drawLine(cx, cy, tailEndX, tailEndY, tailPaint)
            } else {
                paint.strokeWidth = width
                paint.style = Paint.Style.STROKE
                canvas.drawLine(cx, cy, endX, endY, paint)
            }
        }

        // ============================================
        // Data Binding Resolution
        // ============================================

        private fun resolveDataBindings(template: String): String {
            if (!template.contains("{")) return template

            var result = template
            val cal = Calendar.getInstance()

            // Time bindings
            result = result.replace("{time.hours}", String.format("%02d", cal.get(Calendar.HOUR_OF_DAY)))
            result = result.replace("{time.minutes}", String.format("%02d", cal.get(Calendar.MINUTE)))
            result = result.replace("{time.seconds}", String.format("%02d", cal.get(Calendar.SECOND)))
            result = result.replace("{time.formatted12}", SimpleDateFormat("h:mm", Locale.getDefault()).format(cal.time))
            result = result.replace("{time.formatted24}", SimpleDateFormat("HH:mm", Locale.getDefault()).format(cal.time))
            result = result.replace("{time.ampm}", SimpleDateFormat("a", Locale.getDefault()).format(cal.time))

            // Date bindings
            result = result.replace("{date.day}", cal.get(Calendar.DAY_OF_MONTH).toString())
            result = result.replace("{date.dayName}", SimpleDateFormat("EEEE", Locale.getDefault()).format(cal.time))
            result = result.replace("{date.dayShort}", SimpleDateFormat("EEE", Locale.getDefault()).format(cal.time))
            result = result.replace("{date.month}", (cal.get(Calendar.MONTH) + 1).toString())
            result = result.replace("{date.monthName}", SimpleDateFormat("MMMM", Locale.getDefault()).format(cal.time))
            result = result.replace("{date.monthShort}", SimpleDateFormat("MMM", Locale.getDefault()).format(cal.time))
            result = result.replace("{date.year}", cal.get(Calendar.YEAR).toString())
            result = result.replace("{date.formatted}", SimpleDateFormat("MMM d, yyyy", Locale.getDefault()).format(cal.time))

            // Device bindings
            val hour = cal.get(Calendar.HOUR_OF_DAY)
            val greeting = when {
                hour < 12 -> "Good Morning"
                hour < 17 -> "Good Afternoon"
                else -> "Good Evening"
            }
            result = result.replace("{device.greeting}", greeting)

            return result
        }

        // ============================================
        // Helpers
        // ============================================

        private fun hasLiveDataElements(elementsJson: String): Boolean {
            return try {
                val elements = JSONArray(elementsJson)
                for (i in 0 until elements.length()) {
                    val el = elements.getJSONObject(i)
                    val type = el.optString("type", "")
                    if (type == "digitalClock" || type == "analogClock") return true
                    val content = el.optString("content", "")
                    if (content.contains("{time.") || content.contains("{date.") ||
                        content.contains("{battery.") || content.contains("{device.")) return true
                }
                false
            } catch (e: Exception) {
                false
            }
        }

        private fun parseColor(colorStr: String): Int {
            return try {
                if (colorStr.isEmpty()) Color.TRANSPARENT
                else Color.parseColor(colorStr)
            } catch (e: Exception) {
                Color.WHITE
            }
        }

        // ============================================
        // Alarm Scheduling
        // ============================================

        private fun scheduleNextUpdate(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, WidgetCraftProvider::class.java)
            intent.action = ACTION_UPDATE_WIDGET

            val pendingIntent = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val triggerTime = System.currentTimeMillis() + UPDATE_INTERVAL_MS

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC, triggerTime, pendingIntent)
                } else {
                    alarmManager.setExact(AlarmManager.RTC, triggerTime, pendingIntent)
                }
                Log.d(TAG, "Scheduled next update in ${UPDATE_INTERVAL_MS / 1000}s")
            } catch (e: SecurityException) {
                // SCHEDULE_EXACT_ALARM permission not granted — fall back to inexact
                Log.w(TAG, "Exact alarm not permitted, using inexact", e)
                alarmManager.set(AlarmManager.RTC, triggerTime, pendingIntent)
            }
        }

        private fun cancelUpdate(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, WidgetCraftProvider::class.java)
            intent.action = ACTION_UPDATE_WIDGET
            val pendingIntent = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            alarmManager.cancel(pendingIntent)
            Log.d(TAG, "Cancelled widget update alarm")
        }
    }
}
