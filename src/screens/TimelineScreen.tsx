import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Button, ActivityIndicator, Alert, Platform, Image, ScrollView, KeyboardAvoidingView } from 'react-native';
import { RadioButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useDatabase } from '../hooks/useDatabase';
import { addNote, addExpense, deleteEvent, getSetting, addDailyInsight, updateExpense, updateNote, deleteInsight, getCategories, deleteDailyInsight } from '../database/NativeDatabase';
import { generateInsights } from '../api/GeminiClient';

// Component to handle expandable text
const ExpandableText = ({ text, style }: { text: string; style?: any }) => {
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);
  const numberOfLines = 3;

  return (
    <View>
      <Text
        style={style}
        numberOfLines={expanded ? undefined : numberOfLines}
        onTextLayout={(e) => {
          if (e.nativeEvent.lines.length > numberOfLines) {
            setShowToggle(true);
          }
        }}
      >
        {text}
      </Text>
      {showToggle && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={styles.showMore}>{expanded ? 'Show Less' : 'Show More'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const TimelineScreen = ({ navigation }: any) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPicker, setShowPicker] = useState(false);
  const { items, loading, refresh } = useDatabase(date);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEventId, setEditingEditingEventId] = useState<number | null>(null);
  
  const [type, setType] = useState<'note' | 'expense'>('note');
  const [value, setValue] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [generating, setGenerating] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (items.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: items.length - 1, viewPosition: 0, animated: true });
      }, 500);
    }
  }, [items.length]);

  const categories = getCategories();
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = date === todayStr;

  const changeDate = (days: number) => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + days);
      
      if (newDate > new Date()) return;
      
      setDate(newDate.toISOString().split('T')[0]);
  };

  const handleGenerateInsights = async () => {
    const apiKey = getSetting('gemini_api_key');
    const modelName = getSetting('gemini_model') || 'gemini-1.5-flash';
    const customPrompt = getSetting('prompt_daily_insight') || 'Analyze the following financial events for a single day and provide 3 concise, actionable insights. Focus on spending habits, identifying potential areas to save, and any notable patterns.';
    
    if (!apiKey) {
      Alert.alert('Configuration Missing', 'Please add your Gemini API Key in Settings.');
      return;
    }

    setGenerating(true);
    try {
      const insightText = await generateInsights(items.filter(i => i.type !== 'daily_insight'), apiKey, modelName, customPrompt);
      addDailyInsight(date, insightText);
      
      Alert.alert('Success', 'Insight saved');
      refresh(); 
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('AI Error Details', errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingEditingEventId(null);
    setType('note');
    setValue('');
    setAmount('');
    setMerchant('');
    setCategory('Uncategorized');
    setModalVisible(true);
  };

  const handleEditPress = (item: any) => {
    if (item.type === 'daily_insight') return; 
    setIsEditing(true);
    setEditingEditingEventId(item.id);
    setType(item.type as 'note' | 'expense');
    setValue(item.type === 'note' ? item.content || '' : item.comment || '');
    setAmount(item.type === 'expense' ? String(item.amount) : '');
    setMerchant(item.type === 'expense' ? item.merchant || '' : '');
    setCategory(item.type === 'expense' ? item.category || 'Uncategorized' : 'Uncategorized');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (type === 'expense' && (!amount || isNaN(parseFloat(amount)) || !merchant)) {
      Alert.alert('Error', 'Please enter valid amount and merchant');
      return;
    }

    if (isEditing && editingEventId) {
      if (type === 'expense') {
        updateExpense(editingEventId, parseFloat(amount), merchant, value, category);
      } else {
        updateNote(editingEventId, value);
      }
    } else {
      if (type === 'expense') {
        addExpense(parseFloat(amount), merchant, value, category);
      } else {
        addNote(value);
      }
    }

    setModalVisible(false);
    refresh();
    setTimeout(() => {
        refresh();
    }, 100);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => item.type !== 'daily_insight' && handleEditPress(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
        <View style={[styles.badge, { backgroundColor: getBadgeColor(item.type) }]}>
          <Text style={styles.badgeText}>{getTypeEmoji(item.type)}</Text>
        </View>
      </View>
      
      {item.type === 'expense' && (
        <View>
          <Text style={styles.amount}>₹{item.amount || 0}</Text>
          <Text style={styles.merchant}>{item.merchant || 'Unknown Merchant'} ({item.category || 'Uncategorized'})</Text>
          {item.comment ? <ExpandableText text={item.comment} style={styles.comment} /> : null}
        </View>
      )}
      {item.type === 'note' && (
        <ExpandableText text={item.content || ''} style={styles.content} />
      )}
      {item.type === 'daily_insight' && (
        <ExpandableText text={item.content} style={styles.content} />
      )}
      
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={async () => { 
          console.log('deleteDailyInsight function is:', deleteDailyInsight);
          Alert.alert('Delete', 'Delete this event?', [
            { text: 'Cancel' },
            { text: 'Delete', onPress: async () => { 
              if (item.type === 'daily_insight') await deleteDailyInsight(date);
              else await deleteEvent(item.id);
              refresh(); 
            }, style: 'destructive' }
          ]);
        }}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const getTypeEmoji = (type: string) => {
    switch(type) {
        case 'expense': return '💰';
        case 'note': return '📝';
        case 'daily_insight': return '🤖';
        default: return '❓';
    }
  };

  const getBadgeColor = (type: string) => {
    switch(type) {
      case 'expense': return '#f44336';
      case 'note': return '#2196f3';
      case 'daily_insight': return '#9c27b0';
      default: return '#9e9e9e';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateHeader}>
          <TouchableOpacity onPress={() => changeDate(-1)}><Image source={require('../assets/icons/TimelineIcon.png')} style={{width: 30, height: 30}} /></TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPicker(true)}>
            <Text style={styles.dateText}>{date}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => changeDate(1)}
            disabled={isToday}
            style={{ opacity: isToday ? 0.3 : 1 }}
          >
            <Image source={require('../assets/icons/TimelineIcon.png')} style={{width: 30, height: 30, transform: [{scaleX: -1}]}} />
          </TouchableOpacity>
      </View>
      
      {showPicker && (
        <DateTimePicker
          value={new Date(date)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
                setDate(selectedDate.toISOString().split('T')[0]);
            }
          }}
        />
      )}

      <FlatList
        ref={listRef}
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.type + item.id.toString()}
        onRefresh={refresh}
        refreshing={loading}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.empty}>Your timeline is empty. Add a note or expense!</Text>}
        onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
                listRef.current?.scrollToIndex({ index: info.index, viewPosition: 0, animated: true });
            });
        }}
      />
      
      <View style={styles.fabContainer}>
        <TouchableOpacity style={[styles.fab, styles.aiFab]} onPress={handleGenerateInsights} disabled={generating}>
          {generating ? <ActivityIndicator color="white" /> : <Image source={require('../assets/icons/AiInsightsIcon.png')} style={{width: 40, height: 40}} resizeMode="contain" />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, styles.addFab]} onPress={handleOpenAdd}>
          <Image source={require('../assets/icons/AddIcon.png')} style={{width: 40, height: 40}} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={styles.modalWrapper}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>{isEditing ? 'Edit Event' : 'Add New Event'}</Text>
              
              {!isEditing && (
                <View style={styles.radioGroup}>
                  <TouchableOpacity style={styles.radioItem} onPress={() => setType('note')}>
                    <RadioButton value="note" status={type === 'note' ? 'checked' : 'unchecked'} onPress={() => setType('note')} />
                    <Text>📝</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.radioItem} onPress={() => setType('expense')}>
                    <RadioButton value="expense" status={type === 'expense' ? 'checked' : 'unchecked'} onPress={() => setType('expense')} />
                    <Text>💰</Text>
                  </TouchableOpacity>
                </View>
              )}

              {type === 'expense' && (
                <View>
                  <Text style={styles.inputLabel}>Amount</Text>
                  <TextInput placeholder="100.00" value={amount} onChangeText={setAmount} keyboardType="numeric" style={styles.input} />
                  <Text style={styles.inputLabel}>Merchant</Text>
                  <TextInput placeholder="e.g. Amazon" value={merchant} onChangeText={setMerchant} style={styles.input} />
                  <Text style={styles.inputLabel}>Category</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={category}
                      onValueChange={(itemValue) => setCategory(itemValue)}
                      style={styles.picker}
                      itemStyle={{ color: '#000000' }}
                    >
                      {categories.map(cat => <Picker.Item key={cat} label={cat} value={cat} color="#000000" />)}
                    </Picker>
                  </View>
                </View>
              )}
              
              <Text style={styles.inputLabel}>{type === 'expense' ? 'Comment (Optional)' : 'Content'}</Text>
              <TextInput
                placeholder={type === 'expense' ? 'Comment' : 'Write your note here...'}
                value={value}
                onChangeText={setValue}
                style={[styles.input, { height: type === 'note' ? 100 : 45 }]}
                multiline={type === 'note'}
              />
              
              <View style={styles.modalButtons}>
                <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
                <Button title={isEditing ? "Update" : "Save"} onPress={handleSave} color="#2196f3" />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f9' },
  listContent: { paddingBottom: 100 },
  dateHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 10, backgroundColor: 'white' },
  dateText: { fontWeight: 'bold', fontSize: 16, marginHorizontal: 20 },
  card: { backgroundColor: 'white', padding: 18, marginHorizontal: 15, marginVertical: 8, borderRadius: 12, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timestamp: { fontSize: 12, color: '#888' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { fontSize: 14 },
  amount: { fontSize: 22, color: '#f44336', fontWeight: 'bold' },
  merchant: { fontSize: 16, color: '#333', fontWeight: '600' },
  comment: { fontSize: 14, color: '#666', fontStyle: 'italic', marginTop: 4 },
  label: { fontSize: 16, color: '#444', marginTop: 4 },
  content: { fontSize: 16, color: '#444', lineHeight: 22 },
  showMore: { color: '#2196f3', marginTop: 5, fontWeight: 'bold' },
  deleteButton: { marginTop: 15, alignSelf: 'flex-end', padding: 5 },
  deleteText: { color: '#f44336', fontSize: 12, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 100, color: '#999', fontSize: 16 },
  fabContainer: { position: 'absolute', bottom: 30, right: 30, flexDirection: 'row', gap: 15 },
  fab: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  addFab: { backgroundColor: 'transparent' },
  aiFab: { backgroundColor: 'transparent' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalWrapper: { backgroundColor: 'white', borderRadius: 20, width: '90%', maxHeight: '80%' },
  modalScrollContent: { padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  radioGroup: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25, backgroundColor: '#f8f9fa', padding: 10, borderRadius: 10 },
  radioItem: { flexDirection: 'row', alignItems: 'center' },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 8, fontWeight: 'bold' },
  input: { borderBottomWidth: 1, borderColor: '#ddd', marginBottom: 20, padding: 10, fontSize: 16, backgroundColor: '#fafafa' },
  picker: { backgroundColor: '#fcfcfc', marginBottom: 20 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15, backgroundColor: '#fafafa' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }
});

export default TimelineScreen;
