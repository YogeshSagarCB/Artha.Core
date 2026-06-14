import React from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { ThemeProvider } from './src/theme/ThemeContext';

const App = () => {
  return (
    <ThemeProvider>
      <StatusBar barStyle="dark-content" />
      <AppNavigator />
    </ThemeProvider>
  );
};

export default App;
