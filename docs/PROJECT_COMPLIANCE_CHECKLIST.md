# Kontrolní seznam compliance pro FMCityFest App

**Datum kontroly:** 18. ledna 2026  
**Projekt:** FMCityFest App (Expo SDK 51, React Native 0.74.5)

---

## 📊 SOUČASNÝ STAV PROJEKTU

### Android konfigurace
- ✅ **Target SDK:** 35 (splňuje požadavek)
- ✅ **Compile SDK:** 35 (splňuje požadavek)
- ✅ **Min SDK:** 23 (splňuje požadavek)
- ✅ **64-bit architektury:** armeabi-v7a, arm64-v8a, x86, x86_64 (splňuje)
- ✅ **Gradle:** 8.8 (kompatibilní)
- ❌ **NDK:** 26.1.10909125 → **NUTNO AKTUALIZOVAT na r28+**
- ❌ **AGP verze:** 8.2.1 (z React Native 0.74.5) → **NUTNO AKTUALIZOVAT na 8.5.1+** 🚨 KRITICKÉ
- ⚠️ **Build Tools:** 34.0.0 → doporučeno aktualizovat na 35.0.0

### iOS konfigurace
- ⚠️ **Expo SDK:** 51.0.0 → podporuje Xcode 15.4-16.2
- ⚠️ **EAS Build:** Nutno ověřit, jaký Xcode/iOS SDK image používá
- ❌ **Privacy Manifest:** Chybí → **NUTNO VYTVOŘIT**

### Nativní knihovny v projektu
Projekt **DEFINITIVNĚ obsahuje nativní knihovny**:
- ✅ Hermes engine (hermesEnabled=true)
- ✅ React Native Firebase (@react-native-firebase/*)
- ✅ SoLoader (načítá nativní .so soubory)
- ✅ React Native core (obsahuje nativní kód)

**Závěr: Projekt potřebuje 16 KB page size compliance pro Android!**

---

## 🚨 KRITICKÉ AKCE - ANDROID

### 1. Aktualizovat NDK na r28+ ⚠️ KRITICKÉ

**Současný stav:** `ndkVersion = "26.1.10909125"`  
**Požadavek:** NDK r28 nebo novější

**Akce:**
```gradle
// android/build.gradle - řádek 11
ndkVersion = "28.0.12674087"  // nebo nejnovější r28+
```

**Kde:** `/Users/janfranc/Development/fmcityfest-app/android/build.gradle`

**Ověření:**
- Po aktualizaci zbuildovat release AAB
- Zkontrolovat, že build projde bez chyb

---

### 2. Aktualizovat Android Gradle Plugin (AGP) na 8.5.1+ 🚨 KRITICKÉ

**Současný stav:** AGP 8.2.1 (z React Native 0.74.5)  
**Požadavek:** AGP 8.5.1 nebo novější (pro 16 KB podporu)  
**Problém:** Aktuální verze 8.2.1 NEPODPORUJE 16 KB page size!

**Akce:**
Explicitně specifikovat AGP verzi 8.5.1 nebo novější v `android/build.gradle`:

```gradle
// android/build.gradle - v dependencies sekci (řádek 18)
classpath('com.android.tools.build:gradle:8.5.1')  // nebo 8.6.0, 8.7.0, atd.
```

**Alternativně můžete použít nejnovější stabilní verzi:**
```gradle
classpath('com.android.tools.build:gradle:8.7.0')  // nebo nejnovější
```

**Kde:** `/Users/janfranc/Development/fmcityfest-app/android/build.gradle` - řádek 18

**Důležité:** 
- Po změně je nutné znovu zbuildovat projekt
- Ověřit kompatibilitu s React Native 0.74.5
- Pokud budou problémy, zvážit upgrade React Native na 0.75+ (který používá novější AGP)

**Ověření:**
```bash
cd android
./gradlew --version
# Mělo by ukázat AGP 8.5.1 nebo vyšší
```

---

### 3. Ověřit 16 KB Page Size Compliance ⚠️ KRITICKÉ

**Po aktualizaci NDK a AGP:**

1. **Zbuildovat release AAB:**
   ```bash
   npm run build:android -- --profile production
   ```

2. **Zkontrolovat compliance pomocí bundletool:**
   ```bash
   # Stáhnout bundletool (pokud nemáte)
   # https://github.com/google/bundletool/releases
   
   # Zkontrolovat AAB
   bundletool build-apks --bundle=app-release.aab --output=app.apks --mode=universal
   bundletool validate --bundle=app-release.aab
   ```

3. **Nebo použít Android Studio APK Analyzer:**
   - Otevřít Android Studio
   - Build → Analyze APK/Bundle
   - Zkontrolovat, že všechny `.so` soubory jsou zarovnané na 16 KB (16384 bajtů)

4. **Testovat na Android 15 emulátoru s 16 KB page size:**
   - Vytvořit emulátor s Android 15 (API 35)
   - Ověřit, že aplikace funguje správně

**Kde:** Po build procesu

---

### 4. Aktualizovat Build Tools (volitelné, doporučeno)

**Současný stav:** `buildToolsVersion = '34.0.0'`  
**Doporučení:** Aktualizovat na 35.0.0

**Akce:**
```gradle
// android/build.gradle - řádek 5
buildToolsVersion = findProperty('android.buildToolsVersion') ?: '35.0.0'
```

**Kde:** `/Users/janfranc/Development/fmcityfest-app/android/build.gradle`

---

### 5. Ověřit závislosti s nativním kódem

**Zkontrolovat, že všechny nativní SDK podporují 16 KB:**

1. **React Native Firebase** - ověřit nejnovější verzi (aktuálně 20.0.0)
2. **Hermes** - součást React Native, mělo by být OK s novým NDK
3. **Ostatní nativní moduly** - zkontrolovat dokumentaci

**Akce:**
- Aktualizovat všechny závislosti na nejnovější verze
- Otestovat po aktualizaci

---

## 🍎 KRITICKÉ AKCE - iOS

### 1. Ověřit EAS Build konfiguraci ⚠️ KRITICKÉ

**Současný stav:** EAS Build používá default image  
**Požadavek:** Xcode 16+ s iOS 18 SDK

**Akce:**
1. Zkontrolovat, jaký build image používá EAS:
   ```bash
   eas build:configure
   ```

2. V `eas.json` explicitně specifikovat image s Xcode 16:
   ```json
   {
     "build": {
       "production": {
         "ios": {
           "image": "latest"  // nebo explicitně "macos-14-ventura"
         }
       }
     }
   }
   ```

3. Ověřit v EAS dashboard, že build používá Xcode 16+

**Kde:** `/Users/janfranc/Development/fmcityfest-app/eas.json`

**Poznámka:** Expo SDK 51 podporuje Xcode 15.4-16.2. Pokud EAS používá Xcode 16.3+, může být problém.

---

### 2. Vytvořit Privacy Manifest ⚠️ KRITICKÉ

**Současný stav:** Privacy Manifest chybí  
**Požadavek:** Privacy Manifest je povinný od 1.5.2024

**Akce:**
1. Vytvořit soubor `ios/FMCityFest/PrivacyInfo.xcprivacy` (nebo v hlavním iOS projektu)

2. Identifikovat použité "Required Reason APIs":
   - Zkontrolovat, které API používá aplikace
   - React Native Firebase může používat některá API
   - Expo moduly mohou používat některá API

3. Vytvořit privacy manifest s deklaracemi:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>NSPrivacyTracking</key>
     <false/>
     <key>NSPrivacyTrackingDomains</key>
     <array/>
     <key>NSPrivacyCollectedDataTypes</key>
     <array/>
     <key>NSPrivacyAccessedAPITypes</key>
     <array>
       <!-- Přidat použité Required Reason APIs -->
     </array>
   </dict>
   </plist>
   ```

4. Pro Expo projekty může být potřeba přidat do `app.json`:
   ```json
   {
     "expo": {
       "ios": {
         "privacyManifests": {
           "NSPrivacyAccessedAPITypes": []
         }
       }
     }
   }
   ```

**Kde:** `ios/FMCityFest/PrivacyInfo.xcprivacy` nebo v Expo konfiguraci

**Důležité:** Bez privacy manifestu bude submise do App Store odmítnuta!

---

### 3. Ověřit iOS Deployment Target

**Současný stav:** Není explicitně specifikováno v `app.json`  
**Doporučení:** iOS 15+ (pro maximální kompatibilitu s Xcode 16)

**Akce:**
V `app.json` přidat:
```json
{
  "expo": {
    "ios": {
      "deploymentTarget": "15.0"
    }
  }
}
```

**Kde:** `/Users/janfranc/Development/fmcityfest-app/app.json`

---

### 4. Zvážit upgrade na Expo SDK 52+ (volitelné)

**Důvod:** Expo SDK 51 má omezenou podporu pro Xcode 16.3+  
**SDK 52+** má lepší kompatibilitu s novějšími verzemi Xcode

**Akce:**
- Zvážit upgrade na Expo SDK 52 nebo novější
- Ověřit breaking changes
- Otestovat aplikaci po upgrade

**Poznámka:** Toto není nutné, pokud EAS používá Xcode 16.0-16.2.

---

## 📋 PRIORITIZOVANÝ SEZNAM ÚKOLŮ

### 🔴 Kritické (nutné pro publikaci)

1. ✅ **Android NDK aktualizace** → r28+ (aktuálně 26.1.10909125)
2. ✅ **Android AGP aktualizace** → 8.5.1+ (aktuálně 8.2.1) 🚨 KRITICKÉ
3. ✅ **Android 16 KB compliance ověření** → po aktualizaci NDK/AGP
4. ✅ **iOS Privacy Manifest** → vytvořit
5. ✅ **EAS Build iOS image** → ověřit Xcode 16+

### 🟡 Důležité (doporučeno)

6. ⚠️ **Android Build Tools** → aktualizovat na 35.0.0
7. ⚠️ **iOS Deployment Target** → nastavit na iOS 15+
8. ⚠️ **Závislosti aktualizace** → ověřit kompatibilitu s 16 KB

### 🟢 Volitelné (pro budoucí kompatibilitu)

9. 💡 **Expo SDK upgrade** → zvážit upgrade na SDK 52+
10. 💡 **Kotlin verze** → aktualizovat z 1.9.23 na novější

---

## ✅ OVĚŘOVACÍ KROKY PO ZMĚNÁCH

### Android
1. ✅ Build release AAB projde bez chyb
2. ✅ Bundletool/APK Analyzer potvrdí 16 KB alignment
3. ✅ Aplikace funguje na Android 15 emulátoru s 16 KB page size
4. ✅ Google Play přijme AAB upload

### iOS
1. ✅ EAS Build projde s Xcode 16+
2. ✅ Privacy Manifest je přítomen a validní
3. ✅ App Store Connect přijme build
4. ✅ Aplikace funguje na iOS 15+ zařízeních

---

## 📝 POZNÁMKY

- **16 KB compliance je již povinná** pro nové submise od 1.11.2025
- **Do 1.5.2026** musí být compliance hotová, jinak nebudete moci publikovat aktualizace
- **iOS Privacy Manifest** je povinný - bez něj bude submise odmítnuta
- **Expo SDK 51** má omezení s Xcode 16.3+ - ověřte verzi Xcode v EAS

---

## 🔗 UŽITEČNÉ ODKAZY

- [Android 16 KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)
- [Expo SDK 51 Documentation](https://docs.expo.dev/versions/v51.0.0/)
- [Apple Privacy Manifest Guide](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- [EAS Build Images](https://docs.expo.dev/build-reference/infrastructure/)

---

**Poslední aktualizace:** 18. ledna 2026
