module.exports = {
  root: true,
  extends: ['expo'],
  env: {
    es2021: true,
    browser: true,
    node: true,
  },
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'coverage/',
    'dist/',
    'build/',
  ],
  overrides: [
    {
      files: ['**/*.test.*', '**/*.spec.*', 'jest.setup.js'],
      env: { jest: true },
    },
    {
      files: ['app.config.js', 'scripts/**', 'plugins/**'],
      env: { node: true },
    },
  ],
};
