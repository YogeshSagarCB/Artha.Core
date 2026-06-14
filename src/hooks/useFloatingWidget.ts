import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import FloatingWidget from '../modules/FloatingWidget';

interface UseFloatingWidgetReturn {
  isRunning: boolean;
  hasPermission: boolean | null; // null = not yet checked
  start: () => void;
  stop: () => void;
  requestPermission: () => void;
}

/**
 * Hook to manage the floating chat-head widget lifecycle.
 *
 * Usage:
 *   const { isRunning, hasPermission, start, stop, requestPermission } = useFloatingWidget();
 */
export function useFloatingWidget(): UseFloatingWidgetReturn {
  const [isRunning, setIsRunning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check permission + service state on mount
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    FloatingWidget.checkOverlayPermission((granted) => {
      setHasPermission(granted);
    });

    FloatingWidget.isFloatingWidgetRunning((running) => {
      setIsRunning(running);
    });
  }, []);

  const requestPermission = useCallback(() => {
    FloatingWidget.requestOverlayPermission();
    // After user returns from settings, re-check. A slight delay is needed
    // because the OS grants the permission asynchronously.
    setTimeout(() => {
      FloatingWidget.checkOverlayPermission((granted) => {
        setHasPermission(granted);
      });
    }, 1500);
  }, []);

  const start = useCallback(() => {
    FloatingWidget.checkOverlayPermission((granted) => {
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Artha needs the "Display over other apps" permission to show the floating widget. Please grant it on the next screen.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: requestPermission },
          ]
        );
        return;
      }
      FloatingWidget.startFloatingWidget();
      setIsRunning(true);
    });
  }, [requestPermission]);

  const stop = useCallback(() => {
    FloatingWidget.stopFloatingWidget();
    setIsRunning(false);
  }, []);

  return { isRunning, hasPermission, start, stop, requestPermission };
}
