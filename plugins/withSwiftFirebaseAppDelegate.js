const { IOSConfig, WarningAggregator, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');

const FIREBASE_IMPORT_RE = /^\s*import\s+Firebase(Core)?\s*$/m;
const FIREBASE_CONFIGURE = 'FirebaseApp.configure()';

function addFirebaseImport(contents) {
  if (FIREBASE_IMPORT_RE.test(contents)) {
    return contents;
  }

  const lines = contents.split('\n');
  let lastImportIndex = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].startsWith('import ')) {
      lastImportIndex = i;
    } else if (lastImportIndex !== -1) {
      break;
    }
  }

  if (lastImportIndex >= 0) {
    lines.splice(lastImportIndex + 1, 0, 'import FirebaseCore');
    return lines.join('\n');
  }

  return `import FirebaseCore\n${contents}`;
}

function addFirebaseConfigure(contents) {
  if (contents.includes(FIREBASE_CONFIGURE)) {
    return contents;
  }

  const marker = 'didFinishLaunchingWithOptions';
  const markerIndex = contents.indexOf(marker);
  if (markerIndex === -1) {
    return contents;
  }

  const braceIndex = contents.indexOf('{', markerIndex);
  if (braceIndex === -1) {
    return contents;
  }

  const insertPos = braceIndex + 1;
  const insertion = `\n    ${FIREBASE_CONFIGURE}\n`;
  return contents.slice(0, insertPos) + insertion + contents.slice(insertPos);
}

module.exports = config => {
  return withDangerousMod(config, [
    'ios',
    async modConfig => {
      const fileInfo = IOSConfig.Paths.getAppDelegate(modConfig.modRequest.projectRoot);
      if (fileInfo.language !== 'swift') {
        return modConfig;
      }

      const contents = fs.readFileSync(fileInfo.path, 'utf8');
      const withImport = addFirebaseImport(contents);
      const withConfigure = addFirebaseConfigure(withImport);

      if (withConfigure === contents) {
        WarningAggregator.addWarningIOS(
          'withSwiftFirebaseAppDelegate',
          'Could not inject FirebaseApp.configure() into AppDelegate.swift. Please verify it is present manually.',
        );
        return modConfig;
      }

      fs.writeFileSync(fileInfo.path, withConfigure, 'utf8');
      return modConfig;
    },
  ]);
};
