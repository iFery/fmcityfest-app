const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin to ensure AD_ID permission is added to AndroidManifest.xml
 * This is required for Android 13+ (API 33+) when using advertising ID
 * for Firebase Analytics or other advertising services.
 */
const withAndroidAdIdPermission = (config) => {
  return withAndroidManifest(config, async (modConfig) => {
    const androidManifest = modConfig.modResults;
    const { manifest } = androidManifest;

    // Ensure manifest exists
    if (!manifest) {
      console.warn('⚠️  AndroidManifest.xml not found');
      return modConfig;
    }

    // Ensure uses-permission array exists
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

    const permissions = manifest['uses-permission'];
    const adIdPermission = 'com.google.android.gms.permission.AD_ID';
    
    // Check if AD_ID permission already exists
    const hasAdIdPermission = permissions.some(
      (permission) =>
        permission.$ && permission.$['android:name'] === adIdPermission
    );

    if (!hasAdIdPermission) {
      console.log('📝 Adding AD_ID permission to AndroidManifest.xml...');
      
      // Add the permission
      permissions.push({
        $: {
          'android:name': adIdPermission,
        },
      });
      
      console.log('✅ AD_ID permission added to AndroidManifest.xml');
    } else {
      console.log('✅ AD_ID permission already exists in AndroidManifest.xml');
    }

    return modConfig;
  });
};

module.exports = withAndroidAdIdPermission;
