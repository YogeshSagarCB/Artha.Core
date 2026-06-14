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
import { useTheme } from '../theme/ThemeContext';
import { createStyles } from '../theme/styleFactory';

/**
 * QuickAddOverlay
 *
 * This screen is rendered inside OverlayActivity — a transparent Android Activity
 * launched when the user taps the floating chat-head bubble.
 *
 * It must be registered as a separate root component in index.js:
 *   AppRegistry.registerComponent('QuickAddOverlay', () => QuickAddOverlay);
 */
const getQuickAddStyles = (theme: any) => {
    const base = createStyles(theme);
    return StyleSheet.create({
      ...base,
      backdrop: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.5)'
      },
      sheetWrapper: {
        width: '100%',
      },
      sheet: {
        backgroundColor: theme.surface,
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
        color: theme.text_primary,
        marginBottom: 18,
        textAlign: 'center',
      },
      typeRow: {
        flexDirection: 'row',
        backgroundColor: theme.background,
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
        backgroundColor: theme.surface,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      typeBtnText: {
        fontSize: 14,
        color: theme.text_secondary,
        fontWeight: '600',
      },
      typeBtnTextActive: {
        color: theme.primary,
      },
      label: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.text_secondary,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      },
      input: {
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.text_primary,
        marginBottom: 16,
      },
      textArea: {
        height: 90,
        textAlignVertical: 'top',
      },
      pickerContainer: {
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 10,
        backgroundColor: theme.background,
        marginBottom: 16,
        overflow: 'hidden',
      },
      picker: {
        color: theme.text_primary,
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
        backgroundColor: theme.background,
      },
      cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text_secondary,
      },
      saveButton: {
        backgroundColor: theme.primary,
      },
      saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.surface,
      },
    });
};

const QuickAddOverlay = () => {
  const { theme } = useTheme();
  const styles = getQuickAddStyles(theme);
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
                  placeholderTextColor={theme.text_secondary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />

                <Text style={styles.label}>Merchant</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Swiggy"
                  placeholderTextColor={theme.text_secondary}
                  value={merchant}
                  onChangeText={setMerchant}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={category}
                    onValueChange={(val) => setCategory(val)}
                    style={styles.picker}
                    dropdownIconColor={theme.text_primary}>
                    {categories.map((cat) => (
                      <Picker.Item key={cat} label={cat} value={cat} color={theme.text_primary} />
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
              placeholderTextColor={theme.text_secondary}
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

export default QuickAddOverlay;
