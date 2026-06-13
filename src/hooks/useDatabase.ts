import { useState, useCallback, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getEvents, getDailyInsight, Event } from '../database/NativeDatabase';

export const useDatabase = (date: string) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const events = getEvents();
    const dailyInsight = getDailyInsight(date);
    
    // Filter events by date
    const filteredEvents = events.filter(item => item.timestamp.startsWith(date));
    
    // Add insight as a separate item if it exists
    const combined = [...filteredEvents];
    if (dailyInsight) {
        combined.push({
            id: 9999, // Dummy ID
            timestamp: `${date} 23:59:59`, // Display at end of day
            type: 'daily_insight',
            content: dailyInsight.insight_text
        });
    }
    
    combined.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    setItems(combined);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    refresh();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  return { items, loading, refresh };
};
