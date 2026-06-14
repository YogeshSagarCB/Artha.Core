import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getRawSmsLogs, SmsLog } from '../database/NativeDatabase';
import { useTheme } from '../theme/ThemeContext';
import { createStyles as createBaseStyles } from '../theme/styleFactory';

const SpamLogsScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshLogs = async () => {
    setLoading(true);
    const data = getRawSmsLogs();
    setLogs(data.filter(l => l.status === 'spam'));
    setLoading(false);
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const renderItem = ({ item }: { item: SmsLog }) => (
    <View style={styles.card}>
      <Text style={styles.timestamp}>{item.received_at}</Text>
      <Text style={styles.sender}>{item.sender}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refreshLogs}
        refreshing={loading}
      />
    </View>
  );
};

const createStyles = (theme: any) => {
    const base = createBaseStyles(theme);
    return StyleSheet.create({
      ...base,
      card: { backgroundColor: theme.surface, padding: 15, margin: 10, borderRadius: 8, elevation: 1 },
      timestamp: { fontSize: 12, color: theme.text_secondary },
      sender: { fontWeight: 'bold', fontSize: 16, marginVertical: 5, color: theme.text_primary },
    });
};

export default SpamLogsScreen;
