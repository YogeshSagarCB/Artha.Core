import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
import { NativeModules } from 'react-native';

const { DatabaseModule } = NativeModules;

const db: QuickSQLiteConnection = open({ name: 'ArthaCore.db' });

// Initialize tables
db.execute(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
    type TEXT NOT NULL
)`);
db.execute(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
)`);
db.execute(`INSERT OR IGNORE INTO categories (name) VALUES ('Uncategorized'), ('Food'), ('Transport'), ('Shopping'), ('Bills')`);

// Safe initialization of expenses table
db.execute(`CREATE TABLE IF NOT EXISTS expenses (
    event_id INTEGER PRIMARY KEY, 
    amount REAL, 
    merchant TEXT, 
    comment TEXT, 
    category TEXT DEFAULT 'Uncategorized',
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
)`);

const expensesTableInfo = db.execute("PRAGMA table_info(expenses)").rows?._array;
const hasCategory = expensesTableInfo?.some((col: any) => col.name === 'category');
if (!hasCategory) {
  db.execute('ALTER TABLE expenses ADD COLUMN category TEXT DEFAULT "Uncategorized"');
}

db.execute(`CREATE TABLE IF NOT EXISTS notes (
    event_id INTEGER PRIMARY KEY, 
    content TEXT, 
    FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
)`);
db.execute(`CREATE TABLE IF NOT EXISTS raw_sms_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    sender TEXT, 
    body TEXT, 
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
    status TEXT
)`);

// Safe initialization of regex_patterns table
const regexTableExists = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='regex_patterns'").rows?.length ?? 0 > 0;
db.execute(`CREATE TABLE IF NOT EXISTS regex_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT UNIQUE, 
    pattern TEXT, 
    description TEXT,
    priority INTEGER DEFAULT 0
)`);
if (!regexTableExists) {
  seedDefaultPatterns();
}
const regexTableInfo = db.execute("PRAGMA table_info(regex_patterns)").rows?._array;
const hasPriority = regexTableInfo?.some((col: any) => col.name === 'priority');
if (!hasPriority) {
  db.execute('ALTER TABLE regex_patterns ADD COLUMN priority INTEGER DEFAULT 0');
}

// Separate tables for insights
db.execute(`CREATE TABLE IF NOT EXISTS daily_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    date TEXT UNIQUE, 
    insight_text TEXT
)`);
db.execute(`CREATE TABLE IF NOT EXISTS global_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
    insight_text TEXT
)`);

db.execute(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY, 
    value TEXT
)`);

// Seed/Update default prompts
db.execute(`INSERT OR REPLACE INTO settings (key, value) VALUES 
    ('prompt_daily_insight', 'Act as a Behavioral Financial Economist. Analyze the following financial events and notes for this day. Follow this structured analysis: 1. Emotional Driver: Identify the likely intent behind the day''s primary expenses. 2. Micro-Optimization: Identify one immediate, low-effort saving opportunity. 3. Habit Adjustment: Suggest one small behavioral pivot for tomorrow based on today''s spending. Output: Exactly 3 concise, impactful bullet points. Maintain a professional, advisory tone.'),
    ('prompt_global_insight', 'Act as a Behavioral Financial Economist. Analyze this long-term financial event history. Follow this structured analysis: 1. Trend Analysis: Identify ''lifestyle creep'' or shifts in spending velocity over time. 2. Behavioral Pattern: Link recurring spending categories to observed habitual patterns. 3. Strategic Pivot: Suggest one high-impact, long-term wealth building or saving tactic based on this historical data. Output: Exactly 3 concise, impactful bullet points. Maintain a professional, advisory tone.')
`);

export const seedDefaultPatterns = (): void => {
  db.execute('INSERT OR IGNORE INTO regex_patterns (name, pattern, description, priority) VALUES (?, ?, ?, ?)', 
    ['Axis Bank Spent', '(?i)Spent INR (?<amount>\\d+\\.?\\d*) at (?<merchant>.+)', 'Matches: Spent INR 100.00 at Starbucks', 10]);
  db.execute('INSERT OR IGNORE INTO regex_patterns (name, pattern, description, priority) VALUES (?, ?, ?, ?)', 
    ['Axis Bank Debit', '(?i)INR (?<amount>\\d+\\.?\\d*) debited from (?<merchant>.+)', 'Matches: INR 100.00 debited from Zomato', 8]);
  db.execute('INSERT OR IGNORE INTO regex_patterns (name, pattern, description, priority) VALUES (?, ?, ?, ?)', 
    ['ICICI Bank Spent', '(?i)Rs (?<amount>\\d+\\.?\\d*) spent on (?<merchant>.+) on', 'Matches: Rs 100.00 spent on Amazon on', 6]);
};

export interface Event {
  id: number;
  timestamp: string;
  type: 'expense' | 'note' | 'daily_insight';
  amount?: number;
  merchant?: string;
  comment?: string;
  category?: string;
  content?: string;
}

export interface RegexPattern {
  id: number;
  name: string;
  pattern: string;
  description: string;
}

export interface SmsLog {
  id: number;
  sender: string;
  body: string;
  received_at: string;
  status: string;
}

export const getEvents = (): Event[] => {
  const query = `
    SELECT e.id, datetime(e.timestamp, 'localtime') as timestamp, e.type, ex.amount, ex.merchant, ex.comment, ex.category, n.content
    FROM events e
    LEFT JOIN expenses ex ON e.id = ex.event_id
    LEFT JOIN notes n ON e.id = n.event_id
    ORDER BY datetime(e.timestamp, 'localtime') ASC
  `;
  const result = db.execute(query);
  return result.rows?._array as Event[];
};

export const getDailyInsight = (date: string): any => {
    const result = db.execute('SELECT * FROM daily_insights WHERE date = ?', [date]);
    return result.rows?.length ? result.rows.item(0) : null;
};


export const addDailyInsight = (date: string, text: string): number => {
  const result = db.execute('INSERT OR REPLACE INTO daily_insights (date, insight_text) VALUES (?, ?)', [date, text]);
  return result.insertId || 0;
};

export const deleteDailyInsight = (date: string): boolean => {
    db.execute('DELETE FROM daily_insights WHERE date = ?', [date]);
    return true;
};

export const addGlobalInsight = (text: string): number => {
  const result = db.execute('INSERT INTO global_insights (insight_text) VALUES (?)', [text]);
  return result.insertId || 0;
};

export const getGlobalInsights = (): any[] => {
  const result = db.execute('SELECT id, datetime(timestamp, "localtime") as timestamp, insight_text FROM global_insights ORDER BY timestamp DESC');
  return result.rows?._array || [];
};

export const deleteGlobalInsight = (id: number): boolean => {
    db.execute('DELETE FROM global_insights WHERE id = ?', [id]);
    return true;
};

export const addExpense = (amount: number, merchant: string, comment: string, category: string): number => {
  db.transaction((tx) => {
    tx.execute('INSERT INTO events (type) VALUES (?)', ['expense']);
    const res = tx.execute('SELECT last_insert_rowid() as id');
    const eventId = res.rows?.item(0).id;
    tx.execute('INSERT INTO expenses (event_id, amount, merchant, comment, category) VALUES (?, ?, ?, ?, ?)', [eventId, amount, merchant, comment, category]);
  });
  return 0; 
};

export const addNote = (content: string): number => {
  db.transaction((tx) => {
    tx.execute('INSERT INTO events (type) VALUES (?)', ['note']);
    const res = tx.execute('SELECT last_insert_rowid() as id');
    const eventId = res.rows?.item(0).id;
    tx.execute('INSERT INTO notes (event_id, content) VALUES (?, ?)', [eventId, content]);
  });
  return 0;
};

export const deleteEvent = (eventId: number): boolean => {
  db.execute('DELETE FROM events WHERE id = ?', [eventId]);
  return true;
};
export const getSetting = (key: string): string | null => {
  const result = db.execute('SELECT value FROM settings WHERE key = ?', [key]);
  return result.rows?.length ? (result.rows.item(0).value as string) : null;
};
export const saveSetting = (key: string, value: string): boolean => {
  db.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  return true;
};
export const getRawSmsLogs = (): SmsLog[] => {
  const result = db.execute('SELECT id, sender, body, datetime(received_at, "localtime") as received_at, status FROM raw_sms_logs ORDER BY received_at DESC');
  return result.rows?._array as SmsLog[] || [];
};
export const decryptSms = async (logId: number): Promise<string> => {
  return DatabaseModule.decryptSms(logId);
};
export const getRegexPatterns = (): RegexPattern[] => {
  const result = db.execute('SELECT * FROM regex_patterns');
  return result.rows?._array as RegexPattern[] || [];
};
export const addRegexPattern = (name: string, pattern: string, description: string): number => {
  const result = db.execute('INSERT INTO regex_patterns (name, pattern, description) VALUES (?, ?, ?)', [name, pattern, description]);
  return result.insertId || 0;
};
export const deleteRegexPattern = (id: number): boolean => {
  db.execute('DELETE FROM regex_patterns WHERE id = ?', [id]);
  return true;
};
export const updateRegexPattern = (id: number, name: string, pattern: string, description: string): boolean => {
  db.execute('UPDATE regex_patterns SET name = ?, pattern = ?, description = ? WHERE id = ?', [name, pattern, description, id]);
  return true;
};
export const updateExpense = (eventId: number, amount: number, merchant: string, comment: string, category: string): boolean => {
  db.execute('UPDATE expenses SET amount = ?, merchant = ?, comment = ?, category = ? WHERE event_id = ?', [amount, merchant, comment, category, eventId]);
  return true;
};
export const updateNote = (eventId: number, content: string): boolean => {
  db.execute('UPDATE notes SET content = ? WHERE event_id = ?', [content, eventId]);
  return true;
};
export const getExpensesByCategory = (yearMonth: string): any[] => {
  const query = `
    SELECT category, SUM(amount) as total
    FROM expenses e
    JOIN events ev ON e.event_id = ev.id
    WHERE strftime('%Y-%m', ev.timestamp) = ?
    GROUP BY category
  `;
  const result = db.execute(query, [yearMonth]);
  return result.rows?._array || [];
};
export const getCategories = (): string[] => {
  const result = db.execute('SELECT name FROM categories ORDER BY name ASC');
  return result.rows?._array?.map((c: any) => c.name) || ['Uncategorized'];
};
export const addCategory = (name: string): boolean => {
  try {
    db.execute('INSERT INTO categories (name) VALUES (?)', [name]);
    return true;
  } catch (e) {
    return false;
  }
};
export const deleteCategory = (name: string): boolean => {
  db.execute('DELETE FROM categories WHERE name = ?', [name]);
  return true;
};
