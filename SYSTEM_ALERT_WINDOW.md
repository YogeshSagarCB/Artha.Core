# System Alert Window (Chat Head) Implementation Guide

## Overview
This document outlines the technical feasibility and implementation strategy for adding a system-wide "Chat Head" behavior to the Android application. This allows users to interact with a floating widget that persists across the OS, even when the app is in the background.

## Technical Feasibility
- **Android:** Fully supported via native `WindowManager` and `SYSTEM_ALERT_WINDOW` permission.
- **iOS:** **Not supported.** iOS sandboxing strictly prevents applications from drawing over other apps. This feature will be an Android-exclusive enhancement.

## Implementation Details (Android)

### 1. Permissions
The app must declare the `SYSTEM_ALERT_WINDOW` permission in the `AndroidManifest.xml`.
```xml
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW"/>
```
*Note: Users must manually grant this permission via a deep-link to the Android Settings menu (`Settings.ACTION_MANAGE_OVERLAY_PERMISSION`). It cannot be requested via a standard runtime permission prompt.*

### 2. Background Service
To keep the chat head alive when the main app is closed or minimized, the logic must run inside an Android `Service`.
- A dedicated `FloatingWidgetService` will be created.
- The service lifecycle will be managed by the main app, starting when requested and stopping when disabled or when system resources are critically low.

### 3. Window Manager Integration
The service will utilize the Android `WindowManager` API to draw the floating view over other apps.
- The layout parameters must specify `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY`.
- This flag instructs the OS to render the view on top of all other running applications.

### 4. Interactions (Drag & Click)
A custom `View.OnTouchListener` will be attached to the floating view to handle user interactions.
- **Drag:** The listener will calculate movement deltas and continuously update the `x` and `y` properties of the `WindowManager.LayoutParams`, allowing the bubble to be dragged freely around the screen.
- **Click:** When tapped, the system will either:
  - Inflate a larger native UI directly within the overlay (for quick actions).
  - Launch a React Native Activity with a transparent background, simulating an expanding modal to handle complex input (e.g., adding an event).

### 5. React Native Bridge
We recommend building a **Custom Native Module** for reliability. Many existing third-party React Native libraries for overlays are unmaintained or flaky.
- The custom module will handle all Kotlin/Java implementation of the Service and WindowManager.
- It will expose standard methods to React Native (e.g., `startOverlay()`, `stopOverlay()`) and dispatch events across the JS Bridge when the chat head is clicked or interacted with.
