package com.arthacore.services

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.arthacore.database.DatabaseHelper
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.http.FileContent
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.drive.Drive
import com.google.api.services.drive.DriveScopes
import com.google.api.services.drive.model.File
import org.json.JSONArray
import org.json.JSONObject
import java.io.FileOutputStream
import java.util.*

class BackupWorker(appContext: Context, workerParams: WorkerParameters) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        Log.d("BackupWorker", "Starting backup...")
        val account = GoogleSignIn.getLastSignedInAccount(applicationContext) ?: return Result.failure()
        
        try {
            val jsonData = exportDatabaseToJson()
            val backupFile = java.io.File(applicationContext.cacheDir, "backup.json")
            FileOutputStream(backupFile).use { it.write(jsonData.toByteArray()) }
            
            uploadToGoogleDrive(account, backupFile)
            return Result.success()
        } catch (e: Exception) {
            Log.e("BackupWorker", "Backup failed: ${e.message}")
            return Result.retry()
        }
    }

    private fun exportDatabaseToJson(): String {
        val dbHelper = DatabaseHelper(applicationContext)
        val db = dbHelper.readableDatabase
        val result = JSONObject()
        
        val tables = listOf(DatabaseHelper.TABLE_EVENTS, DatabaseHelper.TABLE_EXPENSES, 
                            DatabaseHelper.TABLE_NOTES,
                            DatabaseHelper.TABLE_REGEX_PATTERNS)
        
        for (table in tables) {
            val cursor = db.rawQuery("SELECT * FROM $table", null)
            val jsonArray = JSONArray()
            if (cursor.moveToFirst()) {
                do {
                    val row = JSONObject()
                    for (i in 0 until cursor.columnCount) {
                        val columnName = cursor.getColumnName(i)
                        when (cursor.getType(i)) {
                            android.database.Cursor.FIELD_TYPE_INTEGER -> row.put(columnName, cursor.getInt(i))
                            android.database.Cursor.FIELD_TYPE_FLOAT -> row.put(columnName, cursor.getDouble(i))
                            android.database.Cursor.FIELD_TYPE_STRING -> row.put(columnName, cursor.getString(i))
                        }
                    }
                    jsonArray.put(row)
                } while (cursor.moveToNext())
            }
            cursor.close()
            result.put(table, jsonArray)
        }
        return result.toString()
    }

    private fun uploadToGoogleDrive(account: GoogleSignInAccount, backupFile: java.io.File) {
        val credential = GoogleAccountCredential.usingOAuth2(applicationContext, Collections.singleton(DriveScopes.DRIVE_APPDATA))
        credential.selectedAccount = account.account
        
        val driveService = Drive.Builder(NetHttpTransport(), GsonFactory.getDefaultInstance(), credential)
            .setApplicationName("Artha.Core")
            .build()
            
        // Check for existing backup file
        val existingFiles = driveService.files().list()
            .setSpaces("appDataFolder")
            .setQ("name = 'backup.json'")
            .execute()
            
        val fileMetadata = File().apply {
            name = "backup.json"
            parents = Collections.singletonList("appDataFolder")
        }
        
        val mediaContent = FileContent("application/json", backupFile)
        
        if (existingFiles.files.isNotEmpty()) {
            val fileId = existingFiles.files[0].id
            driveService.files().update(fileId, null, mediaContent).execute()
        } else {
            driveService.files().create(fileMetadata, mediaContent).execute()
        }
    }
}
