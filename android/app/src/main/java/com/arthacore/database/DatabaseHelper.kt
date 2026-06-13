package com.arthacore.database

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.content.ContentValues

class DatabaseHelper(context: Context) : SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        const val DATABASE_NAME = "ArthaCore.db"
        const val DATABASE_VERSION = 2

        // Table Names
        const val TABLE_EVENTS = "events"
        const val TABLE_EXPENSES = "expenses"
        const val TABLE_NOTES = "notes"
        const val TABLE_RAW_SMS_LOGS = "raw_sms_logs"
        const val TABLE_REGEX_PATTERNS = "regex_patterns"
        const val TABLE_INSIGHTS = "insights"
        const val TABLE_SETTINGS = "settings"

        // Common Column Names
        const val COLUMN_ID = "id"
        const val COLUMN_EVENT_ID = "event_id"
        const val COLUMN_TIMESTAMP = "timestamp"

        // Events Table Columns
        const val COLUMN_TYPE = "type"

        // Expenses Table Columns
        const val COLUMN_AMOUNT = "amount"
        const val COLUMN_MERCHANT = "merchant"
        const val COLUMN_COMMENT = "comment"

        // Moods Table Columns
        const val COLUMN_RATING = "rating"
        const val COLUMN_LABEL = "label"

        // Notes Table Columns
        const val COLUMN_CONTENT = "content"

        // Raw SMS Logs Table Columns
        const val COLUMN_SENDER = "sender"
        const val COLUMN_BODY = "body"
        const val COLUMN_RECEIVED_AT = "received_at"
        const val COLUMN_STATUS = "status"

        // Regex Patterns Table Columns
        const val COLUMN_NAME = "name"
        const val COLUMN_PATTERN = "pattern"
        const val COLUMN_DESCRIPTION = "description"
        const val COLUMN_PRIORITY = "priority"

        // Insights Table Columns
        const val COLUMN_INSIGHT_TEXT = "insight_text"

        // Settings Table Columns
        const val COLUMN_SETTING_KEY = "key"
        const val COLUMN_SETTING_VALUE = "value"
    }

    override fun onCreate(db: SQLiteDatabase) {
        val createEventsTable = ("CREATE TABLE $TABLE_EVENTS (" +
                "$COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "$COLUMN_TIMESTAMP DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                "$COLUMN_TYPE TEXT NOT NULL)")

        val createExpensesTable = ("CREATE TABLE $TABLE_EXPENSES (" +
                "$COLUMN_EVENT_ID INTEGER PRIMARY KEY, " +
                "$COLUMN_AMOUNT REAL, " +
                "$COLUMN_MERCHANT TEXT, " +
                "$COLUMN_COMMENT TEXT, " +
                "FOREIGN KEY($COLUMN_EVENT_ID) REFERENCES $TABLE_EVENTS($COLUMN_ID) ON DELETE CASCADE)")

        val createNotesTable = ("CREATE TABLE $TABLE_NOTES (" +
                "$COLUMN_EVENT_ID INTEGER PRIMARY KEY, " +
                "$COLUMN_CONTENT TEXT, " +
                "FOREIGN KEY($COLUMN_EVENT_ID) REFERENCES $TABLE_EVENTS($COLUMN_ID) ON DELETE CASCADE)")

        val createRawSmsLogsTable = ("CREATE TABLE $TABLE_RAW_SMS_LOGS (" +
                "$COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "$COLUMN_SENDER TEXT, " +
                "$COLUMN_BODY TEXT, " +
                "$COLUMN_RECEIVED_AT DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                "$COLUMN_STATUS TEXT)")

        val createRegexPatternsTable = ("CREATE TABLE $TABLE_REGEX_PATTERNS (" +
                "$COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "$COLUMN_NAME TEXT, " +
                "$COLUMN_PATTERN TEXT, " +
                "$COLUMN_DESCRIPTION TEXT, " +
                "$COLUMN_PRIORITY INTEGER DEFAULT 0)")

        val createInsightsTable = ("CREATE TABLE $TABLE_INSIGHTS (" +
                "$COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT, " +
                "$COLUMN_TIMESTAMP DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                "$COLUMN_INSIGHT_TEXT TEXT)")

        val createSettingsTable = ("CREATE TABLE $TABLE_SETTINGS (" +
                "$COLUMN_SETTING_KEY TEXT PRIMARY KEY, " +
                "$COLUMN_SETTING_VALUE TEXT)")

        db.execSQL(createEventsTable)
        db.execSQL(createExpensesTable)
        db.execSQL(createNotesTable)
        db.execSQL(createRawSmsLogsTable)
        db.execSQL(createRegexPatternsTable)
        db.execSQL(createInsightsTable)
        db.execSQL(createSettingsTable)

        // Seed default patterns
        val defaultPatterns = listOf(
            ContentValues().apply {
                put(COLUMN_NAME, "General Bank Transaction")
                put(COLUMN_PATTERN, "(?i)spent (?<amount>\\d+\\.?\\d*) at (?<merchant>.+)")
                put(COLUMN_DESCRIPTION, "Default format: Spent 100.00 at Merchant")
                put(COLUMN_PRIORITY, 10)
            },
            ContentValues().apply {
                put(COLUMN_NAME, "Account Debit")
                put(COLUMN_PATTERN, "(?i)INR (?<amount>\\d+\\.?\\d*) debited from (?<merchant>.+)")
                put(COLUMN_DESCRIPTION, "Format: INR 100.00 debited from Merchant")
                put(COLUMN_PRIORITY, 5)
            }
        )
        for (values in defaultPatterns) {
            db.insert(TABLE_REGEX_PATTERNS, null, values)
        }
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            db.execSQL("CREATE TABLE IF NOT EXISTS $TABLE_INSIGHTS (" +
                    "$COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "$COLUMN_TIMESTAMP DATETIME DEFAULT CURRENT_TIMESTAMP, " +
                    "$COLUMN_INSIGHT_TEXT TEXT)")
            db.execSQL("CREATE TABLE IF NOT EXISTS $TABLE_SETTINGS (" +
                    "$COLUMN_SETTING_KEY TEXT PRIMARY KEY, " +
                    "$COLUMN_SETTING_VALUE TEXT)")
        }
        
        // Ensure priority column exists
        val cursor = db.rawQuery("PRAGMA table_info($TABLE_REGEX_PATTERNS)", null)
        var hasPriority = false
        val nameIndex = cursor.getColumnIndex("name")
        if (nameIndex != -1) {
            while (cursor.moveToNext()) {
                if (cursor.getString(nameIndex) == COLUMN_PRIORITY) {
                    hasPriority = true
                    break
                }
            }
        }
        cursor.close()
        if (!hasPriority) {
            db.execSQL("ALTER TABLE $TABLE_REGEX_PATTERNS ADD COLUMN $COLUMN_PRIORITY INTEGER DEFAULT 0")
        }
    }

    override fun onConfigure(db: SQLiteDatabase) {
        super.onConfigure(db)
        db.setForeignKeyConstraintsEnabled(true)
    }
}
