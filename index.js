import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import QuickAddOverlay from './src/screens/QuickAddOverlay';

// Main app entry point
AppRegistry.registerComponent(appName, () => App);

// Separate root for the floating widget overlay activity
AppRegistry.registerComponent('QuickAddOverlay', () => QuickAddOverlay);
