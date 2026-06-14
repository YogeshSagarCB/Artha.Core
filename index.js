import 'react-native-gesture-handler';
import React from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import QuickAddOverlay from './src/screens/QuickAddOverlay';
import { ThemeProvider } from './src/theme/ThemeContext';

// Main app entry point
AppRegistry.registerComponent(appName, () => App);

// Separate root for the floating widget overlay activity
const QuickAddOverlayWithTheme = () => (
  <ThemeProvider>
    <QuickAddOverlay />
  </ThemeProvider>
);

AppRegistry.registerComponent('QuickAddOverlay', () => QuickAddOverlayWithTheme);
