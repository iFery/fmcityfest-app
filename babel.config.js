module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // další pluginy, pokud je máš
    'react-native-reanimated/plugin', // musí být vždy poslední
  ],
};
