package com.arthacore.services

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.arthacore.database.DatabaseHelper
import java.util.regex.Pattern
import android.content.ContentValues

class NotificationService : NotificationListenerService() {

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        // Filter only for Google Messages
        if (sbn.packageName == "com.google.android.apps.messaging") {
            val extras = sbn.notification.extras
            val title = extras.getString("android.title") ?: ""
            val text = extras.getCharSequence("android.text")?.toString() ?: ""

            parseWithRegex(title, text)
        }
    }

    private fun parseWithRegex(sender: String, body: String) {
        val dbHelper = DatabaseHelper(applicationContext)
        val db = dbHelper.readableDatabase
        
        val cursor = db.rawQuery("SELECT * FROM ${DatabaseHelper.TABLE_REGEX_PATTERNS} ORDER BY ${DatabaseHelper.COLUMN_PRIORITY} DESC", null)
        
        if (cursor.moveToFirst()) {
            do {
                val patternStr = cursor.getString(cursor.getColumnIndexOrThrow(DatabaseHelper.COLUMN_PATTERN))
                try {
                    val pattern = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE)
                    val matcher = pattern.matcher(body)
                    
                    if (matcher.find()) {
                        val amountStr = try { matcher.group("amount") } catch (e: Exception) { null }
                        val merchant = try { matcher.group("merchant") } catch (e: Exception) { null }
                        
                        if (amountStr != null && merchant != null) {
                            val amount = amountStr.toDoubleOrNull() ?: 0.0
                            createExpense(amount, merchant, "Parsed via Notification: $sender")
                            break
                        }
                    }
                } catch (e: Exception) {
                    Log.e("NotificationService", "Regex error: ${e.message}")
                }
            } while (cursor.moveToNext())
        }
        cursor.close()
    }

    private fun createExpense(amount: Double, merchant: String, comment: String) {
        val dbHelper = DatabaseHelper(applicationContext)
        val db = dbHelper.writableDatabase
        db.beginTransaction()
        try {
            val eventValues = ContentValues().apply {
                put(DatabaseHelper.COLUMN_TYPE, "expense")
            }
            val eventId = db.insert(DatabaseHelper.TABLE_EVENTS, null, eventValues)

            val expenseValues = ContentValues().apply {
                put(DatabaseHelper.COLUMN_EVENT_ID, eventId)
                put(DatabaseHelper.COLUMN_AMOUNT, amount)
                put(DatabaseHelper.COLUMN_MERCHANT, merchant)
                put(DatabaseHelper.COLUMN_COMMENT, comment)
            }
            db.insert(DatabaseHelper.TABLE_EXPENSES, null, expenseValues)
            db.setTransactionSuccessful()
        } catch (e: Exception) {
            Log.e("NotificationService", "Failed to create expense: ${e.message}")
        } finally {
            db.endTransaction()
        }
    }
}
