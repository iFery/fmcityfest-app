# 🚀 Bezpečný upgrade plán: Expo SDK 51 → SDK 52 / React Native 0.77

**Datum:** 18. ledna 2026  
**Cíl:** Upgrade na Expo SDK 52+ / React Native 0.77+ pro plnou 16 KB page size compliance  
**Aktuální stav:** Expo SDK 51, React Native 0.74.5, NDK r26  

---

## 📊 Přehled upgrade

### Aktuální konfigurace
- **Expo SDK:** 51.0.0
- **React Native:** 0.74.5
- **NDK:** 26.1.10909125
- **AGP:** 8.5.1 ✅
- **Target SDK:** 35 ✅
- **16 KB compliance:** ⚠️ Částečná (AGP ZIP alignment, ne NDK ELF alignment)

### Cílová konfigurace
- **Expo SDK:** 52.0.27 (nebo nejnovější SDK 52)
- **React Native:** 0.77.1 (opt-in, vyžaduje dev build)
- **NDK:** 28.0.12674087 (nebo nejnovější r28+)
- **AGP:** 8.5.1+ (zachováno)
- **16 KB compliance:** ✅ Plná (NDK r28 + AGP 8.5.1)

---

## ⚠️ DŮLEŽITÉ UPOZORNĚNÍ

### Expo Go a React Native 0.77
**⚠️ EXPO GO NEPODPORUJE REACT NATIVE 0.77!**

- Expo Go podporuje pouze React Native 0.76 (default pro SDK 52)
- React Native 0.77 vyžaduje **development build** (custom build)
- **Dobrá zpráva:** Projekt už používá `expo-dev-client`, takže to není problém!

### Breaking Changes
1. **iOS minimum deployment target:** iOS 13.4 → **15.1**
2. **Android minSdkVersion:** 23 → **24**
3. **Android compileSdkVersion:** 34 → **35** (už máte ✅)
4. **New Architecture:** Ve výchozím nastavení zapnutá pro nové projekty (můžete zůstat na staré)
5. **Metro logging:** RN 0.77 odstranilo streaming console.log v Metro (nutné použít React Native DevTools)

---

## 📋 PRE-UPGRADE CHECKLIST

Před začátkem upgrade ověřte:

### 1. Kompatibilita závislostí
```bash
# Spustit expo-doctor pro kontrolu kompatibility
npx expo-doctor@latest
```

### 2. React Native Firebase
- **Aktuální:** @react-native-firebase/* v20.0.0
- **Ověřit:** Zda podporuje React Native 0.77
- **Akce:** Možná bude nutná aktualizace na novější verzi

### 3. Další nativní knihovny
Zkontrolovat kompatibilitu s RN 0.77:
- `@react-native-async-storage/async-storage` ✅ Obecně kompatibilní
- `@react-native-community/netinfo` ✅ Obecně kompatibilní
- `react-native-image-pan-zoom` ⚠️ Ověřit aktualizace
- `@react-navigation/*` ⚠️ Možná aktualizace nutná
- `react-native-screens` ⚠️ Aktualizovat na ~4.8.0 (pro RN 0.77)
- `react-native-safe-area-context` ⚠️ Aktualizovat na ~5.1.0 (pro RN 0.77)

### 4. Backup
```bash
# Commitnout všechny změny
git add .
git commit -m "Pre-upgrade state: Expo SDK 51, RN 0.74.5"

# Vytvořit backup branch
git branch backup-pre-upgrade-$(date +%Y%m%d)
```

### 5. Otestovat aktuální build
```bash
# Otestovat, že aktuální build funguje
npm run build:android
```

---

## 🔄 KROK-PO-KROKU UPGRADE POSTUP

### FÁZE 1: Upgrade na Expo SDK 52 s RN 0.76 (bezpečnější cesta)

Tato fáze je **doporučená** jako první krok. Umožní ověřit, že vše funguje před upgrade na RN 0.77.

#### Krok 1.1: Upgrade Expo SDK
```bash
# Upgrade na Expo SDK 52 (defaultně s RN 0.76)
npx expo install expo@~52.0.27 --fix

# Nebo nejnovější SDK 52
npx expo install expo@latest --fix
```

#### Krok 1.2: Automatický upgrade Expo závislostí
```bash
# Expo automaticky upgraduje kompatibilní balíčky
npx expo install --fix
```

#### Krok 1.3: Aktualizace app.json / app.config.js
```javascript
// Aktualizovat iOS deployment target na 15.1+
// V app.config.js nebo app.json:
ios: {
  deploymentTarget: "15.1",
  // ... ostatní nastavení
}
```

#### Krok 1.4: Aktualizace Android build.gradle
```gradle
// android/build.gradle
ext {
    minSdkVersion = 24  // Změna z 23 na 24
    // compileSdkVersion = 35 - už máte ✅
    // targetSdkVersion = 35 - už máte ✅
}
```

#### Krok 1.5: Regenerace nativních projektů
```bash
# Pokud používáte prebuild (CNG)
npx expo prebuild --clean

# Nebo ručně smazat android/ a ios/ a regenerovat
# rm -rf android ios
# npx expo prebuild
```

#### Krok 1.6: Testování
```bash
# Test lokální build
npm run run:android

# Test EAS build (development)
eas build --profile development --platform android
```

**✅ Pokud vše funguje, pokračujte na Fázi 2.**  
**❌ Pokud jsou problémy, vyřešte je před pokračováním.**

---

### FÁZE 2: Opt-in do React Native 0.77

**⚠️ Tento krok je volitelný a vyžaduje development build!**

#### Krok 2.1: Přidat exclude pro RN do package.json
```json
{
  "expo": {
    "install": {
      "exclude": ["react-native"]
    }
  }
}
```

#### Krok 2.2: Upgrade na React Native 0.77
```bash
# Upgrade React Native
npx expo install react-native@~0.77.1

# Aktualizace kritických závislostí pro RN 0.77
npx expo install \
  react-native-reanimated@~3.16.7 \
  react-native-gesture-handler@~2.22.0 \
  react-native-screens@~4.8.0 \
  react-native-safe-area-context@~5.1.0 \
  react-native-webview@~13.13.1
```

#### Krok 2.3: Aktualizace NDK na r28
```gradle
// android/build.gradle
ext {
    ndkVersion = "28.0.12674087"  // Nebo nejnovější r28+
    // ...
}
```

#### Krok 2.4: Kontrola React Native Firebase
```bash
# Zkontrolovat, zda existuje novější verze kompatibilní s RN 0.77
npm view @react-native-firebase/app versions --json

# Pokud ano, aktualizovat:
npx expo install @react-native-firebase/app@latest
npx expo install @react-native-firebase/crashlytics@latest
npx expo install @react-native-firebase/messaging@latest
npx expo install @react-native-firebase/remote-config@latest
```

#### Krok 2.5: Kontrola ostatních závislostí
```bash
# Spustit expo-doctor pro detekci problémů
npx expo-doctor@latest

# Opravit nalezené problémy
```

#### Krok 2.6: Regenerace nativních projektů
```bash
# Clean regenerace
rm -rf android ios
npx expo prebuild --clean
```

#### Krok 2.7: Otestování
```bash
# Test lokální build
npm run run:android

# Test EAS build
eas build --profile development --platform android

# Ověřit 16 KB compliance
# (viz testovací script)
```

---

## 🧪 TESTING & VALIDATION

### Testovací scripty

#### 1. Test build integrity
```bash
# Vytvořit test build
npm run build:android -- --profile preview

# Ověřit, že build prošel
# Stáhnout AAB z EAS a ověřit
```

#### 2. Ověření 16 KB compliance
```bash
# Použít testovací script (viz TEST_BUILD.md)
./scripts/test-16kb-compliance.sh
```

#### 3. Funkční testování
- ✅ Aplikace se spustí
- ✅ Firebase inicializace funguje
- ✅ Push notifikace fungují
- ✅ Navigation funguje
- ✅ Všechny obrazovky se načítají

---

## 🐛 ŘEŠENÍ PROBLÉMŮ

### Časté problémy při upgrade

#### 1. Inkompatibilní knihovny
**Problém:** Chyby při buildu kvůli nekompatibilním knihovnám  
**Řešení:**
```bash
# Zkontrolovat verze
npx expo-doctor@latest

# Aktualizovat problémové knihovny
npx expo install <package-name>@latest
```

#### 2. Metro bundler chyby
**Problém:** Metro nekompiluje nebo má chyby  
**Řešení:**
```bash
# Vyčistit cache
npm start -- --reset-cache

# Nebo
watchman watch-del-all
rm -rf node_modules
npm install
```

#### 3. Android build chyby
**Problém:** Gradle build selhává  
**Řešení:**
```bash
cd android
./gradlew clean
cd ..
npx expo prebuild --clean
```

#### 4. iOS build chyby
**Problém:** Xcode build selhává  
**Řešení:**
```bash
# Vyčistit build
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..
```

#### 5. React Native 0.77 - Expo Go nefunguje
**Problém:** Aplikace se neotevře v Expo Go  
**Řešení:** ✅ **Očekávané chování!** RN 0.77 vyžaduje development build:
```bash
# Vytvořit development build
eas build --profile development --platform android
```

---

## 📅 DOPORUČENÝ TIMELINE

### Varianta A: Postupný upgrade (doporučeno)
1. **Týden 1:** Fáze 1 (Expo SDK 52 + RN 0.76)
   - Upgrade SDK
   - Testování a fixy
   - Ověření stability

2. **Týden 2:** Fáze 2 (RN 0.77 + NDK r28)
   - Opt-in do RN 0.77
   - Upgrade NDK
   - Testování 16 KB compliance

3. **Týden 3:** Finální testování
   - Funkční testy
   - E2E testy
   - Příprava na produkci

### Varianta B: Rychlý upgrade (pokud máte čas na fixy)
1. **Den 1:** Fáze 1 + Fáze 2 (celý upgrade)
2. **Den 2-3:** Fixy a testování
3. **Den 4:** Produkční build a ověření

---

## ✅ POST-UPGRADE CHECKLIST

Po dokončení upgrade ověřte:

- [ ] Build projde bez chyb (Android i iOS)
- [ ] Aplikace se spustí v development buildu
- [ ] Všechny Firebase funkce fungují
- [ ] Navigation funguje správně
- [ ] Push notifikace fungují
- [ ] 16 KB compliance je ověřená (pro Android)
- [ ] EAS build projde pro production profil
- [ ] Testy procházejí (`npm test`)
- [ ] Expo doctor nehlásí problémy (`npx expo-doctor@latest`)

---

## 🔗 UŽITEČNÉ ODKAZY

- [Expo SDK 52 Changelog](https://expo.dev/changelog/2024-11-12-sdk-52)
- [React Native 0.77 Release Notes](https://reactnative.dev/blog/2025/01/21/version-0.77)
- [Expo Upgrade Guide](https://docs.expo.dev/bare/upgrade/)
- [React Native 0.77 Upgrade Helper](https://react-native-community.github.io/upgrade-helper/)
- [Expo Doctor](https://docs.expo.dev/more/expo-cli/#expo-doctor)

---

## 📝 POZNÁMKY

### Proč nejprve SDK 52 + RN 0.76?
- **Menší riziko:** RN 0.76 je default a lépe otestovaný
- **Snazší debug:** Expo Go podporuje RN 0.76
- **Postupný přechod:** Snazší identifikace problémů

### Proč poté upgrade na RN 0.77?
- **16 KB compliance:** RN 0.77 + NDK r28 = plná compliance
- **Budoucí kompatibilita:** RN 0.77 je budoucnost
- **Performance:** Novější React Native verze mají často vylepšení

### Alternativa: Zůstat na RN 0.76
Pokud RN 0.77 způsobí problémy, můžete zůstat na RN 0.76:
- ✅ SDK 52 podporuje RN 0.76 ve výchozím nastavení
- ⚠️ NDK r28 může fungovat i s RN 0.76 (ověřit)
- ⚠️ 16 KB compliance může být částečná (AGP ZIP alignment)

---

**Datum vytvoření:** 18. ledna 2026  
**Poslední aktualizace:** 18. ledna 2026
