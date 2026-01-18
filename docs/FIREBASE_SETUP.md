# Firebase Setup Guide

Tento dokument popisuje, jak nastavit Firebase pro aplikaci FMCityFest.

## 📋 Požadavky

1. Firebase projekt v [Firebase Console](https://console.firebase.google.com/)
2. Android a iOS aplikace přidané do Firebase projektu
3. Stáhnuté konfigurační soubory

## 🔧 Nastavení

### 1. Vytvoření Firebase projektu

1. Otevřete [Firebase Console](https://console.firebase.google.com/)
2. Klikněte na "Add project"
3. Zadejte název projektu (např. "FMCityFest")
4. Dokončete vytvoření projektu

### 2. Přidání Android aplikace

1. V Firebase Console klikněte na ikonu Android
2. Zadejte:
   - **Package name**: `com.fmcityfest.app` (musí odpovídat `app.json`)
   - **App nickname**: FMCityFest Android (volitelné)
   - **Debug signing certificate SHA-1**: (volitelné pro development)
3. Stáhněte `google-services.json`
4. Umístěte soubor do kořenového adresáře projektu

### 3. Přidání iOS aplikace

1. V Firebase Console klikněte na ikonu iOS
2. Zadejte:
   - **Bundle ID**: `com.fmcityfest.app` (musí odpovídat `app.json`)
   - **App nickname**: FMCityFest iOS (volitelné)
3. Stáhněte `GoogleService-Info.plist`
4. Umístěte soubor do kořenového adresáře projektu

### 4. Nastavení Firebase Cloud Messaging (FCM)

1. V Firebase Console přejděte na **Cloud Messaging**
2. Pro iOS:
   - Nahrajte APNs Authentication Key nebo Certificate
   - Postupujte podle [oficiální dokumentace](https://firebase.google.com/docs/cloud-messaging/ios/certificates)
3. Pro Android: FCM funguje automaticky s `google-services.json`

### 5. Nastavení Remote Config

1. V Firebase Console přejděte na **Remote Config**
2. Klikněte na "Add parameter"
3. Přidejte parametry podle potřeby, např.:
   - `test_key` (String): `default_value`
   - `maintenance_mode` (Boolean): `false`
   - `app_version` (String): `1.0.0`
4. Publikujte změny

### 6. Nastavení Crashlytics

1. V Firebase Console přejděte na **Crashlytics**
2. Crashlytics se aktivuje automaticky po prvním buildu aplikace
3. Pro testování použijte tlačítko "Force Crash" v nastavení aplikace

## 🧪 Testování

### Testování FCM notifikací

1. Spusťte aplikaci na reálném zařízení
2. Otevřete obrazovku **Nastavení**
3. Zkopírujte FCM token
4. V Firebase Console → Cloud Messaging → "Send test message"
5. Vložte token a odešlete testovací notifikaci

### Testování Remote Config

1. V Firebase Console změňte hodnotu parametru
2. Publikujte změny
3. V aplikaci otevřete **Nastavení**
4. Klikněte na "Aktualizovat Remote Config"
5. Ověřte, že se hodnota změnila

### Testování Crashlytics

1. V aplikaci otevřete **Nastavení**
2. Klikněte na "Force Crash (Test)"
3. Restartujte aplikaci
4. V Firebase Console → Crashlytics by se měl objevit crash report

## 📝 Důležité poznámky

- **Konfigurační soubory NESMÍ být commitovány do Gitu** (jsou v `.gitignore`)
- Pro každé prostředí (dev, staging, production) použijte samostatné Firebase projekty nebo podmínky
- FCM token se generuje při prvním spuštění aplikace po instalaci
- Remote Config má cache, změny se projeví po volání `fetchAndActivate()`

## 🔐 Bezpečnost

- Nikdy nesdílejte konfigurační soubory veřejně
- Pro CI/CD použijte EAS Secrets pro citlivé údaje
- Omezte přístup k Firebase Console pouze na oprávněné osoby

## 📚 Další zdroje

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [FCM Setup Guide](https://firebase.google.com/docs/cloud-messaging)

