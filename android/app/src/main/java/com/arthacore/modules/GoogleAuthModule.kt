package com.arthacore.modules

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInAccount
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.Scope
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.tasks.Task

class GoogleAuthModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var googleSignInClient: GoogleSignInClient? = null
    private var authPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
        val gso = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestEmail()
            .requestScopes(Scope("https://www.googleapis.com/auth/drive.appdata"))
            .build()
        googleSignInClient = GoogleSignIn.getClient(reactContext, gso)
    }

    override fun getName(): String {
        return "GoogleAuthModule"
    }

    @ReactMethod
    fun signIn(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist")
            return
        }

        authPromise = promise
        
        // Reset state before signing in
        googleSignInClient?.signOut()?.addOnCompleteListener {
            val signInIntent = googleSignInClient?.signInIntent
            activity.startActivityForResult(signInIntent, RC_SIGN_IN)
        }
    }

    @ReactMethod
    fun signOut(promise: Promise) {
        googleSignInClient?.signOut()?.addOnCompleteListener {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun getCurrentUser(promise: Promise) {
        val account = GoogleSignIn.getLastSignedInAccount(reactApplicationContext)
        if (account != null) {
            val user = Arguments.createMap().apply {
                putString("email", account.email)
                putString("id", account.id)
                putString("displayName", account.displayName)
            }
            promise.resolve(user)
        } else {
            promise.resolve(null)
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == RC_SIGN_IN) {
            val task = GoogleSignIn.getSignedInAccountFromIntent(data)
            handleSignInResult(task)
        }
    }

    private fun handleSignInResult(completedTask: Task<GoogleSignInAccount>) {
        try {
            val account = completedTask.getResult(ApiException::class.java)
            val user = Arguments.createMap().apply {
                putString("email", account?.email)
                putString("id", account?.id)
                putString("displayName", account?.displayName)
            }
            authPromise?.resolve(user)
        } catch (e: ApiException) {
            val errorMessage = when (e.statusCode) {
                7 -> "Network Error"
                10 -> "Developer Error: Check SHA-1 and Package Name in Google Console"
                12500 -> "Sign-in cancelled by user"
                else -> "Sign-in failed: ${e.statusCode}"
            }
            authPromise?.reject("E_SIGN_IN_FAILED", errorMessage)
        } catch (e: Exception) {
            authPromise?.reject("E_SIGN_IN_FAILED", e.localizedMessage ?: "Unknown error")
        } finally {
            authPromise = null
        }
    }

    override fun onNewIntent(intent: Intent) {}

    companion object {
        private const val RC_SIGN_IN = 9001
    }
}
