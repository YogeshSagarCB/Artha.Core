export const open = jest.fn().mockReturnValue({
  execute: jest.fn().mockReturnValue({
    rows: {
      _array: [] 
    }
  }),
  close: jest.fn(),
});
export const QuickSQLiteConnection = jest.fn();
