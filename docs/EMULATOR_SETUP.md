# 🎮 Spuštění aplikace v emulátoru

## ⚠️ Důležité upozornění

**Tato aplikace NEMŮŽE běžet v Expo Go**, protože používá nativní Firebase moduly (`@react-native-firebase/*`), které Expo Go nepodporuje.

**Musíte vytvořit custom development build** pomocí `expo-dev-client`.

---

## 📱 Postup pro Android emulátor

### Krok 1: Příprava emulátoru

1. **Nainstalujte Android Studio** (pokud ještě nemáte)
2. **Vytvořte Android emulátor:**
   - Otevřete Android Studio
   - Tools → Device Manager
   - Create Device → vyberte zařízení (např. Pixel 5)
   - Vyberte systémový obrázek (doporučeno API 33 nebo novější)
   - Dokončete vytvoření emulátoru

3. **Spusťte emulátor:**
   ```bash
   # Zkontrolujte, že emulátor běží
   adb devices
   ```

### Krok 2: Vytvoření development buildu

**Možnost A: EAS Build (doporučeno pro začátek)**

```bash
# 1. Přihlaste se do EAS
eas login

# 2. Nakonfigurujte projekt (pokud ještě není)
eas build:configure

# 3. Vytvořte development build pro Android
eas build --profile development --platform android

# 4. Po dokončení buildu stáhněte APK a nainstalujte do emulátoru:
# - Stáhněte APK z EAS Build dashboardu
# - Nainstalujte: adb install path/to/your-app.apk
```

**Možnost B: Lokální build (pokud máte nastavené Android SDK)**

```bash
# 1. Vytvořte lokální build
npx expo run:android

# Tento příkaz:
# - Vytvoří development build
# - Nainstaluje ho do emulátoru
# - Spustí Metro bundler
```

### Krok 3: Spuštění aplikace

Po instalaci development buildu:

```bash
# 1. Spusťte Metro bundler
npm start

# 2. V emulátoru otevřete nainstalovanou aplikaci
# 3. Aplikace se automaticky připojí k Metro bundleru
```

---

## 🍎 Postup pro iOS simulátor

### Krok 1: Příprava simulátoru

1. **Nainstalujte Xcode** (pouze macOS)
2. **Otevřete simulátor:**
   ```bash
   open -a Simulator
   ```

### Krok 2: Vytvoření development buildu

**Možnost A: EAS Build**

```bash
# 1. Přihlaste se do EAS
eas login

# 2. Vytvořte development build pro iOS
eas build --profile development --platform ios

# 3. Po dokončení buildu:
# - Stáhněte .app bundle nebo .ipa
# - Nainstalujte do simulátoru (přes Xcode nebo drag & drop)
```

**Možnost B: Lokální build**

```bash
# 1. Vytvořte lokální build
npx expo run:ios

# Tento příkaz:
# - Vytvoří development build
# - Nainstaluje ho do simulátoru
# - Spustí Metro bundler
```

### Krok 3: Spuštění aplikace

Po instalaci development buildu:

```bash
# 1. Spusťte Metro bundler
npm start

# 2. V simulátoru otevřete nainstalovanou aplikaci
# 3. Aplikace se automaticky připojí k Metro bundleru
```

---

## 🔄 Rychlý workflow pro vývoj

### Po prvním buildu:

```bash
# 1. Spusťte Metro bundler
npm start

# 2. Otevřete aplikaci v emulátoru/simulátoru
# 3. Změny v kódu se automaticky načtou (Fast Refresh)
```

### Pro nový build (po změnách v nativním kódu):

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

---

## 🛠️ Alternativní příkazy

V `package.json` jsou připravené skripty:

```bash
# Spustit Metro bundler
npm start

# Spustit s automatickým otevřením Android emulátoru
npm run android

# Spustit s automatickým otevřením iOS simulátoru
npm run ios
```

**Poznámka**: `npm run android` a `npm run ios` budou fungovat pouze pokud:
- Máte již nainstalovaný development build v emulátoru/simulátoru
- Nebo použijete `npx expo run:android/ios` pro vytvoření a instalaci buildu

---

## ❌ Co NEFUNGUJE

- ❌ `expo start` → otevření v Expo Go (Firebase moduly nejsou podporovány)
- ❌ `npx expo start --tunnel` → stejný problém
- ❌ Spuštění bez development buildu

## ✅ Co FUNGUJE

- ✅ `npx expo run:android` → vytvoří a nainstaluje development build
- ✅ `npx expo run:ios` → vytvoří a nainstaluje development build
- ✅ `eas build --profile development` → vytvoří build na cloudu
- ✅ Po instalaci buildu: `npm start` → spustí Metro bundler

---

## 🐛 Řešení problémů

### "Unable to resolve module @react-native-firebase/..."
- Ujistěte se, že máte nainstalovaný development build, ne Expo Go
- Zkuste znovu vytvořit build: `npx expo run:android` nebo `npx expo run:ios`

### "Metro bundler se nepřipojuje"
- Zkontrolujte, že Metro bundler běží (`npm start`)
- V aplikaci zatřeste zařízením a zvolte "Reload"
- Nebo restartujte aplikaci

### "Build fails"
- Zkontrolujte, že máte správně nastavené Android SDK / Xcode
- Zkontrolujte, že Firebase konfigurační soubory jsou na správném místě
- Zkontrolujte logy buildu pro detaily

---

## 📚 Další zdroje

- [Expo Development Build](https://docs.expo.dev/development/introduction/)
- [Running on Android](https://docs.expo.dev/workflow/android-studio-emulator/)
- [Running on iOS](https://docs.expo.dev/workflow/ios-simulator/)

