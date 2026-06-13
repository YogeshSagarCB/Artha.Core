package com.arthacore.modules

import android.content.ContentValues
import android.util.Log
import androidx.work.*
import com.arthacore.database.DatabaseHelper
import com.arthacore.services.BackupWorker
import com.facebook.react.bridge.*
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.drive.Drive
import com.google.api.services.drive.DriveScopes
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.*
import java.util.concurrent.TimeUnit

class SyncModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SyncModule"
    }

    @ReactMethod
    fun scheduleBackup(promise: Promise) {
        val backupRequest = PeriodicWorkRequestBuilder<BackupWorker>(24, TimeUnit.HOURS)
            .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .setInitialDelay(calculateInitialDelay(), TimeUnit.MILLISECONDS)
            .build()

        WorkManager.getInstance(reactApplicationContext).enqueueUniquePeriodicWork(
            "DailyBackup",
            ExistingPeriodicWorkPolicy.KEEP,
            backupRequest
        )
        promise.resolve(true)
    }

    private fun calculateInitialDelay(): Long {
        val calendar = Calendar.getInstance()
        val now = calendar.timeInMillis
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        if (calendar.timeInMillis <= now) {
            calendar.add(Calendar.DAY_OF_YEAR, 1)
        }
        return calendar.timeInMillis - now
    }

    @ReactMethod
    fun restoreFromDrive(promise: Promise) {
        val account = GoogleSignIn.getLastSignedInAccount(reactApplicationContext)
        if (account == null) {
            promise.reject("AUTH_REQUIRED", "Please sign in to Google first")
            return
        }

        Thread {
            try {
                val credential = GoogleAccountCredential.usingOAuth2(reactApplicationContext, Collections.singleton(DriveScopes.DRIVE_APPDATA))
                credential.selectedAccount = account.account
                
                val driveService = Drive.Builder(NetHttpTransport(), GsonFactory.getDefaultInstance(), credential)
                    .setApplicationName("Artha.Core")
                    .build()
                    
                val files = driveService.files().list()
                    .setSpaces("appDataFolder")
                    .setQ("name = 'backup.json'")
                    .execute()
                    
                if (files.files.isEmpty()) {
                    promise.resolve(false)
                    return@Thread
                }
                
                val fileId = files.files[0].id
                val outputStream = ByteArrayOutputStream()
                driveService.files().get(fileId).executeMediaAndDownloadTo(outputStream)
                val jsonString = outputStream.toString()
                
                importJsonToDatabase(jsonString)
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e("SyncModule", "Restore failed: ${e.message}")
                promise.reject("RESTORE_FAILED", e.message)
            }
        }.start()
    }

    private fun importJsonToDatabase(jsonString: String) {
        val dbHelper = DatabaseHelper(reactApplicationContext)
        val db = dbHelper.writableDatabase
        val json = JSONObject(jsonString)
        
        db.beginTransaction()
        try {
            val tables = listOf(DatabaseHelper.TABLE_EVENTS, DatabaseHelper.TABLE_EXPENSES, 
                                DatabaseHelper.TABLE_NOTES,
                                DatabaseHelper.TABLE_REGEX_PATTERNS)
            
            for (table in tables) {
                if (json.has(table)) {
                    val rows = json.getJSONArray(table)
                    // Clear current data for these tables? 
                    // User said: "restore only events, not raw sms logs"
                    // We'll replace the events data.
                    db.delete(table, null, null)
                    
                    for (i in 0 until rows.length()) {
                        val rowJson = rows.getJSONObject(i)
                        val values = ContentValues()
                        val keys = rowJson.keys()
                        while (keys.hasNext()) {
                            val key = keys.next()
                            val value = rowJson.get(key)
                            if (value is Int) values.put(key, value)
                            else if (value is Double) values.put(key, value)
                            else if (value is String) values.put(key, value)
                        }
                        db.insert(table, null, values)
                    }
                }
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
    }
}
