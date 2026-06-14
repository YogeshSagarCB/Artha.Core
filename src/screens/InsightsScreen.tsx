import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getExpensesByCategory, getEvents, getSetting, addGlobalInsight, getGlobalInsights, deleteGlobalInsight } from '../database/NativeDatabase';
import { generateInsights } from '../api/GeminiClient';
import { useTheme } from '../theme/ThemeContext';
import { createStyles as createBaseStyles } from '../theme/styleFactory';

const InsightsScreen = () => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expenses, setExpenses] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [expandedInsights, setExpandedInsights] = useState<Record<number, boolean>>({});
  const [generating, setGenerating] = useState(false);
  const [isInsightsExpanded, setIsInsightsExpanded] = useState(true);

  const toggleInsight = (id: number) => {
    setExpandedInsights(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const refreshData = useCallback(() => {
    try {
        const catExpenses = getExpensesByCategory(yearMonth);
        setExpenses(catExpenses);
        
        const globalInsights = getGlobalInsights();
        setInsights(globalInsights);
    } catch (e) {
        console.error('Refresh Data Error:', e);
    }
  }, [yearMonth]);

  useFocusEffect(refreshData);

  const handleGenerateAllInsights = async () => {
    const apiKey = getSetting('gemini_api_key');
    const modelName = getSetting('gemini_model') || 'gemini-1.5-flash';
    const customPrompt = getSetting('prompt_global_insight') || 'Analyze the following comprehensive financial event history and provide 3 concise, actionable insights. Focus on long-term spending habits, identifying potential areas to save, and notable trends over time. Ensure the output is formatted as a clean, easy-to-read list.';
    
    if (!apiKey) {
      Alert.alert('Configuration Missing', 'Please add your Gemini API Key in Settings.');
      return;
    }

    setGenerating(true);
    try {
      const allEvents = getEvents();
      const insightText = await generateInsights(allEvents.filter(i => i.type !== 'daily_insight'), apiKey, modelName, customPrompt);
      addGlobalInsight(insightText);
      
      Alert.alert('Success', 'Global insight generated');
      refreshData();
    } catch (error: any) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      Alert.alert('AI Error Details', errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const changeMonth = (months: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + months);
    if (newDate > new Date()) return;
    setCurrentDate(newDate);
  };

  const isCurrentMonth = 
    currentDate.getMonth() === new Date().getMonth() && 
    currentDate.getFullYear() === new Date().getFullYear();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={() => setIsInsightsExpanded(prev => !prev)} style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Global Insights</Text>
          <Icon name={isInsightsExpanded ? "expand-less" : "expand-more"} size={28} color={theme.text_primary} />
      </TouchableOpacity>
      
      {isInsightsExpanded && (
        <View>
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateAllInsights} disabled={generating}>
              {generating ? <ActivityIndicator color={theme.surface} /> : <Text style={styles.buttonText}>Generate All-Time Insights</Text>}
          </TouchableOpacity>
          
          {insights.map(item => (
              <View key={item.id} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                    <TouchableOpacity onPress={() => toggleInsight(item.id)}>
                        <Icon name={expandedInsights[item.id] !== false ? "expand-less" : "expand-more"} size={24} color={theme.text_primary} />
                    </TouchableOpacity>
                  </View>
                  {expandedInsights[item.id] !== false && (
                    <>
                      <Text style={styles.insightText}>{item.insight_text}</Text>
                      <TouchableOpacity onPress={async () => { await deleteGlobalInsight(item.id); refreshData(); }}>
                          <Text style={styles.deleteText}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}
              </View>
          ))}
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}><Icon name="chevron-left" size={30} color={theme.text_primary} /></TouchableOpacity>
        <Text style={[styles.title, {color: theme.text_primary}]}>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} disabled={isCurrentMonth} style={{ opacity: isCurrentMonth ? 0.3 : 1 }}>
            <Icon name="chevron-right" size={30} color={theme.text_primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Monthly Expenses by Category</Text>
      {expenses.length === 0 ? <Text style={styles.empty}>No expenses for this month.</Text> : (
          expenses.map(item => (
            <View key={item.category} style={styles.row}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.amount}>₹{(item.total || 0).toFixed(2)}</Text>
            </View>
          ))
      )}
    </ScrollView>
  );
};

const createStyles = (theme: any) => {
    const base = createBaseStyles(theme);
    return StyleSheet.create({
      ...base,
      scrollContent: { padding: 20 },
      header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 20 },
      headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
      title: { fontSize: 20, fontWeight: 'bold' },
      sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text_primary },
      subtitle: { fontSize: 16, color: theme.text_secondary, marginBottom: 15 },
      generateButton: { backgroundColor: theme.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
      buttonText: { color: theme.surface, fontWeight: 'bold' },
      row: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: theme.surface, borderRadius: 10, marginBottom: 10, elevation: 2 },
      category: { fontSize: 16, color: theme.text_primary },
      amount: { fontSize: 16, fontWeight: 'bold', color: theme.text_primary },
      empty: { textAlign: 'center', marginTop: 20, color: theme.text_secondary },
      insightCard: { backgroundColor: theme.surface, padding: 15, borderRadius: 10, marginBottom: 10, elevation: 1 },
      insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
      timestamp: { fontSize: 12, color: theme.primary, marginBottom: 5, fontWeight: 'bold' },
      insightText: { fontSize: 14, color: theme.text_primary },
      deleteText: { color: theme.expense, fontSize: 12, marginTop: 10, fontWeight: 'bold' }
    });
};

export default InsightsScreen;
