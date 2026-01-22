const fs = require('fs');
const path = require('path');

/**
 * Expo plugin that ensures Firebase config is copied to native folders during prebuild.
 * 
 * NOTE: The actual copying to root directory happens in app.config.js BEFORE plugins run.
 * This plugin only ensures the config is also in native folders during prebuild.
 */
module.exports = (config) => {
  // Get environment with same priority as app.config.js
  const environment = process.env.APP_ENV || 
                      process.env.EAS_BUILD_PROFILE || 
                      process.env.NODE_ENV || 
                      'development';
  
  // Map environment to config folder name
  const envFolder = environment === 'production' ? 'prod' : 'dev';
  
  const rootDir = path.resolve(__dirname, '..');
  const configDir = path.join(rootDir, 'config', 'firebase', envFolder);
  const androidSource = path.join(configDir, 'google-services.json');
  
  // During prebuild, ensure native folders have the correct config
  // This is a backup - the main copying happens in app.config.js
  const androidAppDir = path.join(rootDir, 'android', 'app');
  if (fs.existsSync(androidAppDir) && fs.existsSync(androidSource)) {
    const androidTargetApp = path.join(androidAppDir, 'google-services.json');
    fs.copyFileSync(androidSource, androidTargetApp);
    console.log(`✅ [withFirebaseConfig] Ensured ${envFolder} config in android/app/`);
  }
  
  return config;
};
