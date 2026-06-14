import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { RadioButton } from 'react-native-paper';
import FloatingWidget from '../modules/FloatingWidget';
import { addNote, addExpense, getCategories } from '../database/NativeDatabase';

/**
 * QuickAddOverlay
 *
 * This screen is rendered inside OverlayActivity — a transparent Android Activity
 * launched when the user taps the floating chat-head bubble.
 *
 * It must be registered as a separate root component in index.js:
 *   AppRegistry.registerComponent('QuickAddOverlay', () => QuickAddOverlay);
 */
const QuickAddOverlay = () => {
  const [type, setType] = useState<'note' | 'expense'>('expense');
  const [value, setValue] = useState('');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Uncategorized');

  const categories = getCategories();

  const handleClose = () => {
    FloatingWidget.closeOverlay();
  };

  const handleSave = () => {
    if (type === 'expense') {
      if (!amount || isNaN(parseFloat(amount)) || !merchant) {
        Alert.alert('Missing Fields', 'Please enter a valid amount and merchant name.');
        return;
      }
      addExpense(parseFloat(amount), merchant, value, category);
    } else {
      if (!value.trim()) {
        Alert.alert('Missing Fields', 'Please write something for the note.');
        return;
      }
      addNote(value);
    }

    // Brief success feedback then close
    Alert.alert('Saved ✓', type === 'expense' ? `₹${amount} at ${merchant}` : 'Note added', [
      { text: 'OK', onPress: handleClose },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.backdrop}
      activeOpacity={1}
      onPress={handleClose}
    >
      <StatusBar backgroundColor="transparent" translucent />

      <TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handle} />

          <Text style={styles.title}>Quick Add</Text>

          {/* Type toggle */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
              onPress={() => setType('expense')}>
              <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>
                💰 Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'note' && styles.typeBtnActive]}
              onPress={() => setType('note')}>
              <Text style={[styles.typeBtnText, type === 'note' && styles.typeBtnTextActive]}>
                📝 Note
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {type === 'expense' && (
              <>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#aaa"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Merchant</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Swiggy"
                  placeholderTextColor="#aaa"
                  value={merchant}
                  onChangeText={setMerchant}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={category}
                    onValueChange={(val) => setCategory(val)}
                    style={styles.picker}
                    dropdownIconColor="#333">
                    {categories.map((cat) => (
                      <Picker.Item key={cat} label={cat} value={cat} color="#000" />
                    ))}
                  </Picker>
                </View>
              </>
            )}

            <Text style={styles.label}>
              {type === 'expense' ? 'Comment (Optional)' : 'Note'}
            </Text>
            <TextInput
              style={[styles.input, type === 'note' && styles.textArea]}
              placeholder={type === 'expense' ? 'Add a comment...' : 'Write your note...'}
              placeholderTextColor="#aaa"
              value={value}
              onChangeText={setValue}
              multiline={type === 'note'}
            />
          </ScrollView>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  sheetWrapper: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 24,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    maxHeight: '95%',
  },
  handle: {
    display: 'none',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 18,
    textAlign: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f5',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  typeBtnText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#1E88E5',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f3f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  saveButton: {
    backgroundColor: '#1E88E5',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

export default QuickAddOverlay;
