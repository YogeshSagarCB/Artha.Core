/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('../src/database/NativeDatabase', () => ({
  getEvents: jest.fn().mockReturnValue([]),
  getDailyInsight: jest.fn().mockReturnValue(null),
  addDailyInsight: jest.fn().mockReturnValue(0),
  deleteDailyInsight: jest.fn().mockReturnValue(true),
  addGlobalInsight: jest.fn().mockReturnValue(0),
  getGlobalInsights: jest.fn().mockReturnValue([]),
  deleteGlobalInsight: jest.fn().mockReturnValue(true),
  addExpense: jest.fn().mockReturnValue(0),
  addNote: jest.fn().mockReturnValue(0),
  deleteEvent: jest.fn().mockReturnValue(true),
  getSetting: jest.fn().mockReturnValue(null),
  saveSetting: jest.fn().mockReturnValue(true),
  getRawSmsLogs: jest.fn().mockReturnValue([]),
  decryptSms: jest.fn().mockResolvedValue(''),
  getRegexPatterns: jest.fn().mockReturnValue([]),
  addRegexPattern: jest.fn().mockReturnValue(0),
  deleteRegexPattern: jest.fn().mockReturnValue(true),
  updateRegexPattern: jest.fn().mockReturnValue(true),
  updateExpense: jest.fn().mockReturnValue(true),
  updateNote: jest.fn().mockReturnValue(true),
  getExpensesByCategory: jest.fn().mockReturnValue([]),
  getCategories: jest.fn().mockReturnValue(['Uncategorized']),
  addCategory: jest.fn().mockReturnValue(true),
  deleteCategory: jest.fn().mockReturnValue(true),
  seedDefaultPatterns: jest.fn(),
}));

jest.useFakeTimers();

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
