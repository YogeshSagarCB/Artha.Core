package com.arthacore

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * A transparent activity that hosts the QuickAddOverlay React Native component.
 * It is launched by FloatingWidgetService when the user taps the floating bubble.
 * The transparent theme makes it look like a modal floating over other apps.
 */
class OverlayActivity : ReactActivity() {

    override fun getMainComponentName(): String = "QuickAddOverlay"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }
}
