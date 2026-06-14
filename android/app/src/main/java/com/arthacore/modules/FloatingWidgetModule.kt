package com.arthacore.modules

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.arthacore.services.FloatingWidgetService
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FloatingWidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "FloatingWidgetModule"

    /**
     * Checks whether the SYSTEM_ALERT_WINDOW permission has been granted.
     * Returns true/false via callback.
     */
    @ReactMethod
    fun checkOverlayPermission(callback: Callback) {
        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(reactContext)
        } else {
            true
        }
        callback.invoke(granted)
    }

    /**
     * Opens the Android settings page where the user can manually grant the
     * "Display over other apps" permission for this app.
     */
    @ReactMethod
    fun requestOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactContext.packageName}")
            ).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            reactContext.startActivity(intent)
        }
    }

    /**
     * Starts the FloatingWidgetService, showing the bubble on screen.
     */
    @ReactMethod
    fun startFloatingWidget() {
        val intent = Intent(reactContext, FloatingWidgetService::class.java).apply {
            action = FloatingWidgetService.ACTION_START
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent)
        } else {
            reactContext.startService(intent)
        }
    }

    /**
     * Stops the FloatingWidgetService, removing the bubble from screen.
     */
    @ReactMethod
    fun stopFloatingWidget() {
        val intent = Intent(reactContext, FloatingWidgetService::class.java).apply {
            action = FloatingWidgetService.ACTION_STOP
        }
        reactContext.startService(intent)
    }

    /**
     * Returns whether the FloatingWidgetService is currently running.
     */
    @ReactMethod
    fun isFloatingWidgetRunning(callback: Callback) {
        callback.invoke(FloatingWidgetService.isRunning)
    }

    /**
     * Called from QuickAddOverlay React component to close the OverlayActivity.
     */
    @ReactMethod
    fun closeOverlay() {
        val activity = getCurrentActivity()
        activity?.finish()
    }
}
