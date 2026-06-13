package com.arthacore.services

import android.content.BroadcastReceiver
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import android.util.Log
import com.arthacore.database.DatabaseHelper
import com.arthacore.security.KeystoreWrapper
import java.util.regex.Pattern

class SMSReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        Log.d("SMSReceiver", "onReceive triggered with action: ${intent.action}")
        if (intent.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
            val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
            if (messages == null) {
                Log.d("SMSReceiver", "No messages found in intent")
                return
            }
            for (message in messages) {
                val sender = message.displayOriginatingAddress
                val body = message.displayMessageBody
                Log.d("SMSReceiver", "Processing message from: $sender")
                handleSms(context, sender, body)
            }
        }
    }

    private fun handleSms(context: Context, sender: String, body: String) {
        val dbHelper = DatabaseHelper(context)
        val keystoreWrapper = KeystoreWrapper()
        
        // Check if message contains numbers
        val hasNumbers = body.contains(Regex("\\d"))
        val status = if (hasNumbers) "received" else "spam"
        
        // 1. Encrypt and log raw SMS
        val encryptedBody = keystoreWrapper.encrypt(body)
        val db = dbHelper.writableDatabase
        
        val logValues = ContentValues().apply {
            put(DatabaseHelper.COLUMN_SENDER, sender)
            put(DatabaseHelper.COLUMN_BODY, encryptedBody)
            put(DatabaseHelper.COLUMN_STATUS, status)
        }
        val logId = db.insert(DatabaseHelper.TABLE_RAW_SMS_LOGS, null, logValues)
        
        // 2. Attempt to parse with Regex Patterns only if not spam
        if (hasNumbers) {
            parseWithRegex(context, logId, sender, body)
        }
    }

    private fun parseWithRegex(context: Context, logId: Long, sender: String, body: String) {
        val dbHelper = DatabaseHelper(context)
        val db = dbHelper.readableDatabase
        
        // Fetch patterns ordered by priority descending
        val cursor = db.rawQuery("SELECT * FROM ${DatabaseHelper.TABLE_REGEX_PATTERNS} ORDER BY ${DatabaseHelper.COLUMN_PRIORITY} DESC", null)
        var parsed = false
        
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
                            createExpense(context, amount, merchant, "Parsed from SMS: $sender")
                            parsed = true
                            break
                        }
                    }
                } catch (e: Exception) {
                    Log.e("SMSReceiver", "Regex error: ${e.message}")
                }
            } while (cursor.moveToNext())
        }
        cursor.close()
        
        if (parsed) {
            val updateValues = ContentValues().apply {
                put(DatabaseHelper.COLUMN_STATUS, "parsed")
            }
            val writableDb = dbHelper.writableDatabase
            writableDb.update(DatabaseHelper.TABLE_RAW_SMS_LOGS, updateValues, "${DatabaseHelper.COLUMN_ID} = ?", arrayOf(logId.toString()))
        }
    }

    private fun createExpense(context: Context, amount: Double, merchant: String, comment: String) {
        val dbHelper = DatabaseHelper(context)
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
            Log.e("SMSReceiver", "Failed to create expense: ${e.message}")
        } finally {
            db.endTransaction()
        }
    }
}
