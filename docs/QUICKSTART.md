# 🚀 Rychlý start

Tento průvodce vám pomůže rychle začít s vývojem aplikace FMCityFest.

## ⚡ Rychlá instalace

```bash
# 1. Nainstalujte závislosti
npm install

# 2. Nastavte Firebase (viz FIREBASE_SETUP.md)
# - Stáhněte google-services.json a GoogleService-Info.plist
# - Umístěte je do kořenového adresáře

# 3. Vytvořte development build a spusťte v emulátoru
# Pro Android:
npx expo run:android

# Pro iOS (pouze macOS):
npx expo run:ios

# ⚠️ POZOR: Aplikace NEMŮŽE běžet v Expo Go!
# Viz EMULATOR_SETUP.md pro detailní návod
```

## 📱 První build

**Důležité**: Tato aplikace vyžaduje custom build (expo-dev-client), protože používá nativní Firebase moduly.

```bash
# 1. Přihlaste se do EAS
eas login

# 2. Nakonfigurujte projekt
eas build:configure

# 3. Vytvořte development build
eas build --profile development --platform android
# nebo
eas build --profile development --platform ios
```

## 🧪 Testování funkcionalit

### Push notifikace
1. Spusťte aplikaci na reálném zařízení
2. Otevřete **Nastavení**
3. Zkontrolujte FCM token
4. Použijte "Odeslat testovací notifikaci"

### Remote Config
1. V Firebase Console nastavte parametry
2. V aplikaci: **Nastavení** → "Aktualizovat Remote Config"

### Crashlytics
1. V aplikaci: **Nastavení** → "Force Crash (Test)"
2. Restartujte aplikaci
3. Zkontrolujte Firebase Console → Crashlytics

## 📁 Struktura projektu

```
src/
├── navigation/     # Navigační struktura
├── screens/        # Obrazovky aplikace
├── components/     # Znovupoužitelné komponenty
├── services/       # Firebase a další služby
└── utils/          # Pomocné funkce
```

## 🔧 Časté problémy

### "Firebase not initialized"
- Zkontrolujte, že máte `google-services.json` (Android) a `GoogleService-Info.plist` (iOS) v kořenovém adresáři
- Ujistěte se, že bundle ID / package name odpovídá Firebase konfiguraci

### "Notifications not working"
- Notifikace fungují pouze na reálných zařízeních, ne v emulátorech
- Zkontrolujte oprávnění k notifikacím v nastavení zařízení
- Pro iOS: Ujistěte se, že máte nakonfigurovaný APNs v Firebase Console

### "Build fails"
- Ujistěte se, že používáte `expo-dev-client` (custom build)
- Zkontrolujte, že všechny závislosti jsou nainstalované
- Zkontrolujte EAS Build logy pro detaily

## 📚 Další dokumentace

- [README.md](./README.md) - Kompletní dokumentace
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Nastavení Firebase
- [Expo Docs](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)

## 💡 Tipy

- Pro vývoj použijte development build, ne Expo Go
- Testujte notifikace vždy na reálných zařízeních
- Remote Config změny se projeví po volání `fetchAndActivate()`
- Crashlytics reporty se objeví v Firebase Console po restartu aplikace

---

**Potřebujete pomoc?** Zkontrolujte README.md nebo Firebase Setup Guide.

