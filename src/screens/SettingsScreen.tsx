import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Button, Alert, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { signIn, signOut, getCurrentUser, scheduleBackup, restoreFromDrive, User } from '../api/NativeAuth';
import * as DB from '../database/NativeDatabase';
import { fetchModels } from '../api/GeminiClient';

const SettingsScreen = ({ navigation }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [patterns, setPatterns] = useState<DB.RegexPattern[]>([]);
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
  const [dailyPrompt, setDailyPrompt] = useState('');
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [regexName, setRegexName] = useState('');
  const [regexPattern, setRegexPattern] = useState('');
  const [regexDescription, setRegexDescription] = useState('');

  // Category State
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
  
  // Regex State
  const [isRegexExpanded, setIsRegexExpanded] = useState(false);
  // Prompt State
  const [isPromptsExpanded, setIsPromptsExpanded] = useState(false);

  useEffect(() => {
    checkUser();
    refreshPatterns();
    loadSettings();
    refreshCategories();
  }, []);

  const refreshCategories = () => {
    setCategories(DB.getCategories());
  }

  const loadSettings = () => {
    const key = DB.getSetting('gemini_api_key');
    const model = DB.getSetting('gemini_model');
    const dailyP = DB.getSetting('prompt_daily_insight');
    const globalP = DB.getSetting('prompt_global_insight');

    if (key) {
      setGeminiKey(key);
      loadModels(key);
    }
    if (model) setGeminiModel(model);
    if (dailyP) setDailyPrompt(dailyP);
    if (globalP) setGlobalPrompt(globalP);
  };

  const loadModels = async (key: string) => {
    if (!key) return;
    setIsLoadingModels(true);
    const models = await fetchModels(key);
    setAvailableModels(models);
    setIsLoadingModels(false);
  };

  const autoSaveAiSettings = async () => {
    DB.saveSetting('gemini_api_key', geminiKey);
    DB.saveSetting('gemini_model', geminiModel);
    DB.saveSetting('prompt_daily_insight', dailyPrompt);
    DB.saveSetting('prompt_global_insight', globalPrompt);
    if (geminiKey) loadModels(geminiKey);
  };

  const checkUser = async () => {
    const u = await getCurrentUser();
    setUser(u);
  };

  const refreshPatterns = () => {
    setPatterns(DB.getRegexPatterns());
  };

  const handleSignIn = async () => {
    try {
      const u = await signIn();
      setUser(u);
      scheduleBackup();
    } catch (error) {
      Alert.alert('Sign In Failed', String(error));
    }
  };

  const handleAddPattern = async () => {
    if (!regexName || !regexPattern) {
      Alert.alert('Error', 'Name and Pattern are required');
      return;
    }
    if (editingId) {
      DB.updateRegexPattern(editingId, regexName, regexPattern, regexDescription);
    } else {
      DB.addRegexPattern(regexName, regexPattern, regexDescription);
    }
    setModalVisible(false);
    setEditingId(null);
    setRegexName('');
    setRegexPattern('');
    setRegexDescription('');
    refreshPatterns();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <TouchableOpacity onPress={() => setIsPromptsExpanded(!isPromptsExpanded)} style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Gemini AI Configuration</Text>
          <Icon name={isPromptsExpanded ? "expand-less" : "expand-more"} size={28} color="#333" />
        </TouchableOpacity>
        
        {isPromptsExpanded && (
          <View>
            <TextInput
              placeholder="Paste Gemini API Key"
              value={geminiKey}
              onChangeText={setGeminiKey}
              onBlur={autoSaveAiSettings}
              secureTextEntry
              style={[styles.input, { color: '#000', marginTop: 10 }]}
            />
            <View style={styles.pickerContainer}>
              {isLoadingModels ? (
                <ActivityIndicator size="small" style={{ margin: 10 }} />
              ) : (
                <Picker
                  selectedValue={geminiModel}
                  onValueChange={(itemValue) => {
                    setGeminiModel(itemValue);
                    autoSaveAiSettings();
                  }}
                  style={styles.picker}
                >
                  {availableModels.length > 0 ? (
                    availableModels.map((model) => (
                      <Picker.Item key={model} label={model} value={model} color="#000" />
                    ))
                  ) : (
                    <Picker.Item label="Fetch models..." value="none" color="#000" />
                  )}
                </Picker>
              )}
            </View>
            <Text style={styles.inputLabel}>Daily Insight Prompt</Text>
            <TextInput value={dailyPrompt} onChangeText={setDailyPrompt} onBlur={autoSaveAiSettings} style={styles.input} multiline />
            <Text style={styles.inputLabel}>Global Insight Prompt</Text>
            <TextInput value={globalPrompt} onChangeText={setGlobalPrompt} onBlur={autoSaveAiSettings} style={styles.input} multiline />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={() => setIsCategoryExpanded(!isCategoryExpanded)} style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Manage Categories</Text>
          <Icon name={isCategoryExpanded ? "expand-less" : "expand-more"} size={28} color="#333" />
        </TouchableOpacity>
        {isCategoryExpanded && (
          <View>
            <View style={styles.categoryInput}>
              <TextInput placeholder="New Category" value={newCategory} onChangeText={setNewCategory} style={styles.input} />
              <TouchableOpacity onPress={() => {
                if (DB.addCategory(newCategory)) {
                    setNewCategory('');
                    refreshCategories();
                } else {
                    Alert.alert('Error', 'Category already exists');
                }
              }} style={styles.addButton}>
                <Icon name="add" size={28} color="#1976d2" />
              </TouchableOpacity>
            </View>
            <View style={styles.categoryList}>
                {categories.map(cat => (
                    <View key={cat} style={styles.categoryTag}>
                        <Text style={styles.tagText}>{cat}</Text>
                        {cat !== 'Uncategorized' && (
                            <TouchableOpacity onPress={() => { DB.deleteCategory(cat); refreshCategories(); }}>
                                <Icon name="close" size={16} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={() => setIsRegexExpanded(!isRegexExpanded)} style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Bank SMS Regex Patterns</Text>
          <Icon name={isRegexExpanded ? "expand-less" : "expand-more"} size={28} color="#333" />
        </TouchableOpacity>
        {isRegexExpanded && (
          <View>
            <TouchableOpacity style={styles.addPatternButton} onPress={() => { setEditingId(null); setModalVisible(true); }}>
                <Text style={styles.addPatternText}>+ Add New Pattern</Text>
            </TouchableOpacity>
            {patterns.map((item) => (
              <View key={item.id} style={styles.patternCard}>
                <Text style={styles.patternName}>{item.name}</Text>
                <Text style={styles.patternStr}>{item.pattern}</Text>
                <View style={styles.patternActions}>
                  <TouchableOpacity onPress={() => {
                    setEditingId(item.id);
                    setRegexName(item.name);
                    setRegexPattern(item.pattern);
                    setRegexDescription(item.description);
                    setModalVisible(true);
                  }} style={{ marginRight: 15 }}>
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={async () => { DB.deleteRegexPattern(item.id); refreshPatterns(); }}>
                    <Text style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Data Management</Text>
        <Button title="View SMS Logs" onPress={() => navigation.navigate('Logs')} />
        <View style={styles.buttonSpacer} />
        {user ? (
          <View>
            <Text style={{ marginBottom: 10 }}>Signed in as: {user.email}</Text>
            <Button title="Sign Out" onPress={async () => { await signOut(); setUser(null); }} color="#ff5722" />
          </View>
        ) : (
          <Button title="Sign in with Google" onPress={handleSignIn} />
        )}
      </View>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Bank Regex' : 'Add Bank Regex'}</Text>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput placeholder="e.g. Axis Bank" value={regexName} onChangeText={setRegexName} style={styles.input} />
              <Text style={styles.inputLabel}>Regex Pattern</Text>
              <TextInput placeholder="(?i)Spent INR (?<amount>\\d+\\.?\\d*) at (?<merchant>.+)" value={regexPattern} onChangeText={setRegexPattern} style={styles.input} multiline />
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput placeholder="Optional description" value={regexDescription} onChangeText={setRegexDescription} style={styles.input} />
              <Button title="Save" onPress={handleAddPattern} />
              <View style={styles.buttonSpacer} />
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 15 },
  section: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  input: { borderBottomWidth: 1, borderColor: '#ddd', marginBottom: 15, padding: 8, fontSize: 16 },
  inputLabel: { fontSize: 13, color: '#666', fontWeight: 'bold', marginBottom: 5 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15, backgroundColor: '#fafafa' },
  picker: { backgroundColor: '#fcfcfc' },
  categoryInput: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', padding: 8, borderRadius: 20, paddingHorizontal: 12 },
  tagText: { marginRight: 5 },
  addButton: { padding: 5 },
  addPatternButton: { backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  addPatternText: { color: '#1976d2', fontWeight: 'bold' },
  patternCard: { borderBottomWidth: 1, borderColor: '#eee', paddingVertical: 12 },
  patternName: { fontWeight: 'bold', color: '#333' },
  patternStr: { fontFamily: 'monospace', color: '#666', fontSize: 12 },
  patternActions: { flexDirection: 'row', marginTop: 8 },
  editText: { color: '#4caf50', fontSize: 12, fontWeight: 'bold' },
  deleteText: { color: '#f44336', fontSize: 12, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 25, borderRadius: 16, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  buttonSpacer: { height: 10 }
});

export default SettingsScreen;
