const { withInfoPlist, withEntitlementsPlist, withXcodeProject } = require('@expo/config-plugins');

/**
 * Expo config plugin to configure iOS app settings
 * Automatically sets app display name, category, supported devices,
 * and capabilities (push notifications, background modes)
 * 
 * This ensures these settings are preserved even when using `expo prebuild --clean`
 */
const withIosAppConfig = (config) => {
  // Configure Info.plist
  config = withInfoPlist(config, (modConfig) => {
    const { modResults } = modConfig;

    // App Display Name (CFBundleDisplayName)
    // This is the name shown under the app icon on iOS home screen
    modResults.CFBundleDisplayName = 'FM CITY FEST';

    // App Category (LSApplicationCategoryType)
    // Category for App Store (Sports)
    modResults.LSApplicationCategoryType = 'public.app-category.sports';

    // Supported Devices (UIDeviceFamily)
    // 1 = iPhone, 2 = iPad
    // iPhone only (UIDeviceFamily = 1)
    modResults.UIDeviceFamily = [1];

    // Background Modes (UIBackgroundModes)
    // Required for remote notifications (push notifications in background)
    // NOTE: UIBackgroundModes goes ONLY in Info.plist, NOT in entitlements
    if (!modResults.UIBackgroundModes) {
      modResults.UIBackgroundModes = [];
    }
    if (!modResults.UIBackgroundModes.includes('remote-notification')) {
      modResults.UIBackgroundModes.push('remote-notification');
    }

    console.log('✅ [withIosAppConfig] Info.plist configured:');
    console.log('   - Display Name: FM CITY FEST');
    console.log('   - Category: Sports');
    console.log('   - Supported Devices: iPhone only');
    console.log('   - Background Modes: remote-notification');

    return modConfig;
  });

  // Configure Entitlements (for Push Notifications capability only)
  // NOTE: UIBackgroundModes does NOT go in entitlements - only in Info.plist
  config = withEntitlementsPlist(config, (modConfig) => {
    const { modResults } = modConfig;

    // Enable Push Notifications
    modResults['aps-environment'] = 'production';

    // Remove UIBackgroundModes from entitlements if it exists (it shouldn't be there)
    if (modResults['UIBackgroundModes']) {
      delete modResults['UIBackgroundModes'];
    }

    console.log('✅ [withIosAppConfig] Entitlements configured:');
    console.log('   - Push Notifications: enabled (aps-environment)');

    return modConfig;
  });

  // Configure Xcode project to disable Mac Catalyst
  // This prevents "Mac" from appearing in supported destinations
  config = withXcodeProject(config, (modConfig) => {
    const { modResults } = modConfig;
    const project = modResults;

    // Get all build configurations (Debug, Release, etc.)
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const key in configurations) {
      const configObj = configurations[key];
      if (configObj.buildSettings) {
        // Disable Mac Catalyst support
        configObj.buildSettings['SUPPORTS_MACCATALYST'] = 'NO';
        
        // Ensure targeted device family is iPhone only (1)
        configObj.buildSettings['TARGETED_DEVICE_FAMILY'] = '1';
      }
    }

    console.log('✅ [withIosAppConfig] Xcode project configured:');
    console.log('   - Mac Catalyst: disabled (SUPPORTS_MACCATALYST = NO)');
    console.log('   - Targeted Device Family: iPhone only (1)');

    return modConfig;
  });

  return config;
};

module.exports = withIosAppConfig;
