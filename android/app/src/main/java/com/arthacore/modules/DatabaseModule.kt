package com.arthacore.modules

import android.content.ContentValues
import android.util.Log
import com.arthacore.database.DatabaseHelper
import com.facebook.react.bridge.*
import java.util.*

class DatabaseModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val dbHelper = DatabaseHelper(reactContext)
    private val TAG = "ArthaDatabaseModule"

    override fun getName(): String = "DatabaseModule"

    @ReactMethod
    fun getEvents(promise: Promise) {
        val db = dbHelper.readableDatabase
        val cursor = db.rawQuery("SELECT * FROM ${DatabaseHelper.TABLE_EVENTS} ORDER BY ${DatabaseHelper.COLUMN_TIMESTAMP} ASC", null)
        val events = Arguments.createArray()

        if (cursor.moveToFirst()) {
            do {
                val event = Arguments.createMap()
                val eventId = cursor.getInt(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_ID))
                val type = cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_TYPE))

                event.putInt("id", eventId)
                event.putString("timestamp", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_TIMESTAMP)))
                event.putString("type", type)

                when (type) {
                    "expense" -> fetchExpenseDetails(eventId, event)
                    "note" -> fetchNoteDetails(eventId, event)
                }

                events.pushMap(event)
                } while (cursor.moveToNext())
                }
                cursor.close()
                promise.resolve(events)
                }

                private fun fetchExpenseDetails(eventId: Int, map: WritableMap) {
                val db = dbHelper.readableDatabase
                val cursor = db.rawQuery("SELECT * FROM ${DatabaseHelper.TABLE_EXPENSES} WHERE ${DatabaseHelper.COLUMN_EVENT_ID} = ?", arrayOf(eventId.toString()))
                if (cursor.moveToFirst()) {
                map.putDouble("amount", cursor.getDouble(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_AMOUNT)))
                map.putString("merchant", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_MERCHANT)))
                map.putString("comment", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_COMMENT)))
                }
                cursor.close()
                }


    private fun fetchNoteDetails(eventId: Int, map: WritableMap) {
        val db = dbHelper.readableDatabase
        val cursor = db.rawQuery("SELECT * FROM ${DatabaseHelper.TABLE_NOTES} WHERE ${DatabaseHelper.COLUMN_EVENT_ID} = ?", arrayOf(eventId.toString()))
        if (cursor.moveToFirst()) {
            map.putString("content", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_CONTENT)))
        }
        cursor.close()
    }

    @ReactMethod
    fun addExpense(amount: Double, merchant: String, comment: String, promise: Promise) {
        val db = dbHelper.writableDatabase
        db.beginTransaction()
        try {
            val eventValues = ContentValues().apply { put(DatabaseHelper.COLUMN_TYPE, "expense") }
            val eventId = db.insert(DatabaseHelper.TABLE_EVENTS, null, eventValues)
            val expenseValues = ContentValues().apply {
                put(DatabaseHelper.COLUMN_EVENT_ID, eventId)
                put(DatabaseHelper.COLUMN_AMOUNT, amount)
                put(DatabaseHelper.COLUMN_MERCHANT, merchant)
                put(DatabaseHelper.COLUMN_COMMENT, comment)
            }
            db.insert(DatabaseHelper.TABLE_EXPENSES, null, expenseValues)
            db.setTransactionSuccessful()
            promise.resolve(eventId.toInt())
        } catch (e: Exception) {
            promise.reject("DB_ERROR", e.message)
        } finally {
            db.endTransaction()
        }
    }

    @ReactMethod
    fun addNote(content: String, promise: Promise) {
        val db = dbHelper.writableDatabase
        db.beginTransaction()
        try {
            val eventValues = ContentValues().apply { put(DatabaseHelper.COLUMN_TYPE, "note") }
            val eventId = db.insert(DatabaseHelper.TABLE_EVENTS, null, eventValues)
            val noteValues = ContentValues().apply {
                put(DatabaseHelper.COLUMN_EVENT_ID, eventId)
                put(DatabaseHelper.COLUMN_CONTENT, content)
            }
            db.insert(DatabaseHelper.TABLE_NOTES, null, noteValues)
            db.setTransactionSuccessful()
            promise.resolve(eventId.toInt())
        } catch (e: Exception) {
            promise.reject("DB_ERROR", e.message)
        } finally {
            db.endTransaction()
        }
    }

    @ReactMethod
    fun deleteEvent(eventId: Int, promise: Promise) {
        val db = dbHelper.writableDatabase
        db.delete(DatabaseHelper.TABLE_EVENTS, "${DatabaseHelper.COLUMN_ID} = ?", arrayOf(eventId.toString()))
        promise.resolve(true)
    }

    @ReactMethod
    fun getInsights(promise: Promise) {
        val db = dbHelper.readableDatabase
        try {
            val cursor = db.rawQuery("SELECT * FROM ${DatabaseHelper.TABLE_INSIGHTS} ORDER BY ${DatabaseHelper.COLUMN_TIMESTAMP} DESC", null)
            val insights = Arguments.createArray()
            while (cursor.moveToNext()) {
                val insight = Arguments.createMap()
                insight.putInt("id", cursor.getInt(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_ID)))
                insight.putString("timestamp", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_TIMESTAMP)))
                insight.putString("insight_text", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_INSIGHT_TEXT)))
                insights.pushMap(insight)
            }
            cursor.close()
            promise.resolve(insights)
        } catch (e: Exception) {
            promise.reject("DB_ERROR", e.message)
        }
    }

    @ReactMethod
    fun addInsight(text: String, promise: Promise) {
        val db = dbHelper.writableDatabase
        try {
            val values = ContentValues().apply { put(DatabaseHelper.COLUMN_INSIGHT_TEXT, text) }
            val id = db.insert(DatabaseHelper.TABLE_INSIGHTS, null, values)
            if (id != -1L) promise.resolve(id.toInt())
            else promise.reject("DB_INSERT_FAILED", "Failed to insert")
        } catch (e: Exception) {
            promise.reject("DB_ERROR", e.message)
        }
    }

    @ReactMethod
    fun deleteInsight(id: Int, promise: Promise) {
        val db = dbHelper.writableDatabase
        db.delete(DatabaseHelper.TABLE_INSIGHTS, "${DatabaseHelper.COLUMN_ID} = ?", arrayOf(id.toString()))
        promise.resolve(true)
    }

    @ReactMethod
    fun dumpDatabase(promise: Promise) {
        val db = dbHelper.readableDatabase
        val dump = Arguments.createMap()
        
        val tables = listOf("events", "expenses", "notes", "raw_sms_logs", "regex_patterns", "insights", "settings")
        
        for (table in tables) {
            try {
                val cursor = db.rawQuery("SELECT * FROM $table", null)
                val rows = Arguments.createArray()
                while (cursor.moveToNext()) {
                    val row = Arguments.createMap()
                    for (i in 0 until cursor.columnCount) {
                        row.putString(cursor.getColumnName(i), cursor.getString(i))
                    }
                    rows.pushMap(row)
                }
                cursor.close()
                dump.putArray(table, rows)
            } catch (e: Exception) {
                Log.e(TAG, "Error dumping table $table: ${e.message}")
            }
        }
        promise.resolve(dump)
    }

    @ReactMethod
    fun getSetting(key: String, promise: Promise) {
        val db = dbHelper.readableDatabase
        val cursor = db.rawQuery("SELECT ${DatabaseHelper.COLUMN_SETTING_VALUE} FROM ${DatabaseHelper.TABLE_SETTINGS} WHERE ${DatabaseHelper.COLUMN_SETTING_KEY} = ?", arrayOf(key))
        if (cursor.moveToFirst()) {
            promise.resolve(cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_SETTING_VALUE)))
        } else {
            promise.resolve(null)
        }
        cursor.close()
    }

    @ReactMethod
    fun saveSetting(key: String, value: String, promise: Promise) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put(DatabaseHelper.COLUMN_SETTING_KEY, key)
            put(DatabaseHelper.COLUMN_SETTING_VALUE, value)
        }
        val id = db.insertWithOnConflict(DatabaseHelper.TABLE_SETTINGS, null, values, android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE)
        promise.resolve(id != -1L)
    }

    // Other methods like getRawSmsLogs, decryptSms, regex patterns ...
    @ReactMethod
    fun getRawSmsLogs(promise: Promise) {
        val db = dbHelper.readableDatabase
        val cursor = db.rawQuery("SELECT * FROM ${DatabaseHelper.TABLE_RAW_SMS_LOGS} ORDER BY ${DatabaseHelper.COLUMN_RECEIVED_AT} DESC", null)
        val logs = Arguments.createArray()
        if (cursor.moveToFirst()) {
            do {
                val log = Arguments.createMap()
                log.putInt("id", cursor.getInt(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_ID)))
                log.putString("sender", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_SENDER)))
                log.putString("received_at", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_RECEIVED_AT)))
                log.putString("status", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_STATUS)))
                logs.pushMap(log)
            } while (cursor.moveToNext())
        }
        cursor.close()
        promise.resolve(logs)
    }

    @ReactMethod
    fun decryptSms(logId: Int, promise: Promise) {
        promise.resolve("Decrypted placeholder")
    }

    @ReactMethod
    fun getRegexPatterns(promise: Promise) {
        val db = dbHelper.readableDatabase
        val cursor = db.rawQuery("SELECT * FROM ${DatabaseHelper.TABLE_REGEX_PATTERNS}", null)
        val patterns = Arguments.createArray()
        if (cursor.moveToFirst()) {
            do {
                val pattern = Arguments.createMap()
                pattern.putInt("id", cursor.getInt(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_ID)))
                pattern.putString("name", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_NAME)))
                pattern.putString("pattern", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_PATTERN)))
                pattern.putString("description", cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_DESCRIPTION)))
                patterns.pushMap(pattern)
            } while (cursor.moveToNext())
        }
        cursor.close()
        promise.resolve(patterns)
    }

    @ReactMethod
    fun addRegexPattern(name: String, pattern: String, description: String, promise: Promise) {
        val db = dbHelper.writableDatabase
        val values = ContentValues().apply {
            put(DatabaseHelper.COLUMN_NAME, name)
            put(DatabaseHelper.COLUMN_PATTERN, pattern)
            put(DatabaseHelper.COLUMN_DESCRIPTION, description)
        }
        val id = db.insert(DatabaseHelper.TABLE_REGEX_PATTERNS, null, values)
        promise.resolve(id.toInt())
    }

    @ReactMethod
    fun deleteRegexPattern(id: Int, promise: Promise) {
        val db = dbHelper.writableDatabase
        db.delete(DatabaseHelper.TABLE_REGEX_PATTERNS, "${DatabaseHelper.COLUMN_ID} = ?", arrayOf(id.toString()))
        promise.resolve(true)
    }
}
