import { NativeModules, Platform } from 'react-native';

const { FloatingWidgetModule } = NativeModules;

export interface IFloatingWidgetModule {
  checkOverlayPermission(callback: (granted: boolean) => void): void;
  requestOverlayPermission(): void;
  startFloatingWidget(): void;
  stopFloatingWidget(): void;
  isFloatingWidgetRunning(callback: (running: boolean) => void): void;
  closeOverlay(): void;
}

/**
 * A typed wrapper around the FloatingWidgetModule native module.
 * Only available on Android; all methods are no-ops on iOS.
 */
const FloatingWidget: IFloatingWidgetModule = Platform.OS === 'android'
  ? FloatingWidgetModule as IFloatingWidgetModule
  : {
      checkOverlayPermission: (cb) => cb(false),
      requestOverlayPermission: () => {},
      startFloatingWidget: () => {},
      stopFloatingWidget: () => {},
      isFloatingWidgetRunning: (cb) => cb(false),
      closeOverlay: () => {},
    };

export default FloatingWidget;
