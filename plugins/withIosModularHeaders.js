const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const addUseModularHeaders = (contents) => {
  if (contents.includes('use_modular_headers!')) {
    return contents;
  }

  if (contents.includes('use_expo_modules!')) {
    return contents.replace(
      /use_expo_modules!\n/,
      'use_expo_modules!\n  use_modular_headers!\n'
    );
  }

  return contents.replace(
    /target ['"][^'"]+['"] do\n/,
    (match) => `${match}  use_modular_headers!\n`
  );
};

const withIosModularHeaders = (config) =>
  withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const podfilePath = path.join(
        modConfig.modRequest.platformProjectRoot,
        'Podfile'
      );
      const contents = fs.readFileSync(podfilePath, 'utf8');
      const updated = addUseModularHeaders(contents);

      if (updated !== contents) {
        fs.writeFileSync(podfilePath, updated);
        console.log('✅ [withIosModularHeaders] Added use_modular_headers! to Podfile');
      } else {
        console.log('ℹ️  [withIosModularHeaders] Podfile already has use_modular_headers!');
      }

      return modConfig;
    },
  ]);

module.exports = withIosModularHeaders;
