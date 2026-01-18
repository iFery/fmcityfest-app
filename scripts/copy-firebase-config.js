#!/usr/bin/env node

/**
 * Build script to copy Firebase configuration files based on environment
 * 
 * Usage:
 *   node scripts/copy-firebase-config.js dev
 *   node scripts/copy-firebase-config.js prod
 */

const fs = require('fs');
const path = require('path');

const ENVIRONMENTS = ['dev', 'prod'];
const environment = process.argv[2] || 'dev';

if (!ENVIRONMENTS.includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error(`   Valid options: ${ENVIRONMENTS.join(', ')}`);
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const configDir = path.join(rootDir, 'config', 'firebase', environment);
const androidTarget = path.join(rootDir, 'android', 'app', 'google-services.json');
const iosTarget = path.join(rootDir, 'ios', 'FMCityFest', 'GoogleService-Info.plist');

const androidSource = path.join(configDir, 'google-services.json');
const iosSource = path.join(configDir, 'GoogleService-Info.plist');

console.log(`📋 Copying Firebase config for environment: ${environment.toUpperCase()}`);

// Copy Android config
if (fs.existsSync(androidSource)) {
  // Ensure target directory exists
  const androidTargetDir = path.dirname(androidTarget);
  if (!fs.existsSync(androidTargetDir)) {
    fs.mkdirSync(androidTargetDir, { recursive: true });
  }
  
  fs.copyFileSync(androidSource, androidTarget);
  console.log(`✅ Copied: ${androidSource} → ${androidTarget}`);
} else {
  console.error(`❌ Source file not found: ${androidSource}`);
  process.exit(1);
}

// Copy iOS config
if (fs.existsSync(iosSource)) {
  // Ensure target directory exists
  const iosTargetDir = path.dirname(iosTarget);
  if (!fs.existsSync(iosTargetDir)) {
    fs.mkdirSync(iosTargetDir, { recursive: true });
  }
  
  fs.copyFileSync(iosSource, iosTarget);
  console.log(`✅ Copied: ${iosSource} → ${iosTarget}`);
} else {
  console.error(`❌ Source file not found: ${iosSource}`);
  process.exit(1);
}

console.log(`✨ Firebase config copied successfully for ${environment.toUpperCase()} environment`);


