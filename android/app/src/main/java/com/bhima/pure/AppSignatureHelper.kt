package com.bhima.pure

import android.content.Context
import android.content.pm.PackageManager
import android.util.Base64
import android.util.Log
import java.nio.charset.StandardCharsets
import java.security.MessageDigest

class AppSignatureHelper(private val context: Context) {
    companion object {
        private const val TAG = "AppSignatureHelper"
        private const val HASH_TYPE = "SHA-256"
        private const val NUM_HASHED_BYTES = 9
        private const val NUM_BASE64_CHAR = 11
    }

    fun getAppSignatures(): List<String> {
        val appSignatures = mutableListOf<String>()

        try {
            val packageName = context.packageName
            val packageManager = context.packageManager
            val signatures = packageManager.getPackageInfo(
                packageName,
                PackageManager.GET_SIGNATURES
            ).signatures

            signatures?.forEach { signature ->
                val hash = hash(packageName, signature.toCharsString())
                if (hash != null) {
                    appSignatures.add(hash)
                }
            }
        } catch (e: PackageManager.NameNotFoundException) {
            Log.e(TAG, "Package not found", e)
        }

        return appSignatures
    }

    private fun hash(packageName: String, signature: String): String? {
        val appInfo = "$packageName $signature"
        return try {
            val messageDigest = MessageDigest.getInstance(HASH_TYPE)
            messageDigest.update(appInfo.toByteArray(StandardCharsets.UTF_8))
            var hashSignature = messageDigest.digest()

            hashSignature = hashSignature.copyOfRange(0, NUM_HASHED_BYTES)
            var base64Hash = Base64.encodeToString(hashSignature, Base64.NO_PADDING or Base64.NO_WRAP)
            base64Hash = base64Hash.substring(0, NUM_BASE64_CHAR)

            Log.d(TAG, "==============================================")
            Log.d(TAG, "APP HASH FOR SMS RETRIEVER: $base64Hash")
            Log.d(TAG, "Package: $packageName")
            Log.d(TAG, "Use this hash in your SMS template")
            Log.d(TAG, "Example: Your OTP is 123456 $base64Hash")
            Log.d(TAG, "==============================================")

            base64Hash
        } catch (e: Exception) {
            Log.e(TAG, "Error generating hash", e)
            null
        }
    }
}
