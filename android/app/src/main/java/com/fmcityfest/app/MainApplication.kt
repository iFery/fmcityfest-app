package com.fmcityfest.app

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions

class MainApplication : Application(), ReactApplication {
  private val TAG = "MainApplication"

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
          Log.d(TAG, "Getting packages")
          return PackageList(this).packages.apply {
            Log.d(TAG, "Packages loaded: ${this.size}")
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // add(MyReactNativePackage())
          }
        }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    Log.d(TAG, "onCreate started")
    
    try {
      Log.d(TAG, "Attempting to initialize Firebase")
      // Initialize Firebase first
      if (FirebaseApp.getApps(this).isEmpty()) {
        Log.d(TAG, "Firebase apps list is empty, initializing")
        try {
          FirebaseApp.initializeApp(this)
          Log.d(TAG, "Firebase initialized successfully")
        } catch (e: Exception) {
          Log.e(TAG, "Error during Firebase initialization", e)
          // Try to get Firebase options
          try {
            val options = FirebaseOptions.Builder()
              .setProjectId("fm-city-fest")
              .setApplicationId("1:669881751446:android:914d534ef4c32c32676fb7")
              .setApiKey("AIzaSyDDNaFrS-oHBjVGoWF-h7Mjcldxm02ckmY")
              .setStorageBucket("fm-city-fest.firebasestorage.app")
              .build()
            FirebaseApp.initializeApp(this, options)
            Log.d(TAG, "Firebase initialized with manual options")
          } catch (e2: Exception) {
            Log.e(TAG, "Error during manual Firebase initialization", e2)
            throw e2
          }
        }
      } else {
        Log.d(TAG, "Firebase already initialized")
      }
    } catch (e: Exception) {
      Log.e(TAG, "Error initializing Firebase", e)
    }

    try {
      Log.d(TAG, "Initializing SoLoader")
      SoLoader.init(this, OpenSourceMergedSoMapping)
      Log.d(TAG, "SoLoader initialized successfully")
    } catch (e: Exception) {
      Log.e(TAG, "Error initializing SoLoader", e)
    }

    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      Log.d(TAG, "New architecture enabled, loading")
      load()
      Log.d(TAG, "New architecture loaded")
    }
    
    Log.d(TAG, "onCreate completed")
  }
}
