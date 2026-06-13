import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Alert } from 'react-native';
import { getRawSmsLogs, decryptSms, addExpense, SmsLog } from '../database/NativeDatabase';

const SpamLogsScreen = ({ navigation }: any) => {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: 'white', padding: 15, margin: 10, borderRadius: 8, elevation: 1 },
  timestamp: { fontSize: 12, color: '#666' },
  sender: { fontWeight: 'bold', fontSize: 16, marginVertical: 5 },
});

export default SpamLogsScreen;
