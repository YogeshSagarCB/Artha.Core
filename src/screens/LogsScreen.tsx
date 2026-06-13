import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Alert } from 'react-native';
import { getRawSmsLogs, decryptSms, addExpense, SmsLog } from '../database/NativeDatabase';

const LogsScreen = ({ navigation }: any) => {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SmsLog | null>(null);
  const [decryptedBody, setDecryptedBody] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');

  const refreshLogs = async () => {
    setLoading(true);
    const data = getRawSmsLogs();
    // Filter out spam
    setLogs(data.filter(l => l.status !== 'spam'));
    setLoading(false);
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const handleLogPress = async (log: SmsLog) => {
    try {
      const body = await decryptSms(log.id);
      setSelectedLog(log);
      setDecryptedBody(body);
      setModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to decrypt SMS');
    }
  };

  const handleConvert = async () => {
    if (selectedLog) {
      await addExpense(parseFloat(amount), merchant, `Manually converted from SMS: ${selectedLog.sender}`);
      setModalVisible(false);
      setAmount('');
      setMerchant('');
      refreshLogs();
      Alert.alert('Success', 'Expense added to timeline');
    }
  };

  const renderItem = ({ item }: { item: SmsLog }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleLogPress(item)}>
      <View style={styles.row}>
        <Text style={styles.sender}>{item.sender}</Text>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'parsed' ? '#4caf50' : '#ffa000' }]}>
          <Text style={styles.statusText}>{item.status === 'parsed' ? 'PARSED' : 'RECEIVED'}</Text>
        </View>
      </View>
      <Text style={styles.timestamp}>{item.received_at}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.spamLink} onPress={() => navigation.navigate('SpamLogs')}>
        <Text style={styles.spamLinkText}>View Spam SMS</Text>
      </TouchableOpacity>
      
      <FlatList
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={refreshLogs}
        refreshing={loading}
      />

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Convert SMS to Expense</Text>
            <Text style={styles.smsBody}>"{decryptedBody}"</Text>
            <TextInput
              placeholder="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Merchant"
              value={merchant}
              onChangeText={setMerchant}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <Button title="Close" onPress={() => setModalVisible(false)} color="gray" />
              <Button title="Add Expense" onPress={handleConvert} color="#e91e63" />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  card: { backgroundColor: 'white', padding: 15, margin: 10, borderRadius: 8, elevation: 1 },
  timestamp: { fontSize: 12, color: '#666' },
  sender: { fontWeight: 'bold', fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  spamLink: { padding: 15, alignItems: 'center', backgroundColor: '#eee' },
  spamLinkText: { color: '#2196f3', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  smsBody: { fontStyle: 'italic', backgroundColor: '#eee', padding: 10, borderRadius: 5, marginBottom: 15 },
  input: { borderBottomWidth: 1, borderColor: '#ddd', marginBottom: 15, padding: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' }
});

export default LogsScreen;
