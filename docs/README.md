# FMCityFest - Mobilní aplikace pro hudební festival

Mobilní aplikace pro hudební festival vyvinutá v React Native s Expo. Aplikace poskytuje program festivalu, informace o interpretech, osobní plán návštěvníka a push notifikace.

## 🚀 Technologie

- **Framework**: React Native s Expo (Managed workflow)
- **Build**: Expo EAS Build
- **Navigace**: React Navigation (Tab + Stack)
- **Push notifikace**: expo-notifications + Firebase Cloud Messaging (FCM)
- **Firebase**: Remote Config, Crashlytics
- **Jazyk**: TypeScript

## 📋 Požadavky

- Node.js (v18 nebo novější)
- npm nebo yarn
- Expo CLI (`npm install -g expo-cli`)
- EAS CLI (`npm install -g eas-cli`)
- Firebase projekt s nakonfigurovanými službami:
  - Firebase Cloud Messaging (FCM)
  - Remote Config
  - Crashlytics

## 🔧 Instalace

1. **Nainstalujte závislosti:**
```bash
npm install
```

2. **Nastavte Firebase konfiguraci:**
   - Stáhněte `google-services.json` z Firebase Console pro Android
   - Stáhněte `GoogleService-Info.plist` z Firebase Console pro iOS
   - Umístěte tyto soubory do kořenového adresáře projektu

3. **Nastavte EAS projekt:**
```bash
eas login
eas build:configure
```

4. **Vytvořte development build a spusťte aplikaci:**
```bash
# Pro Android emulátor nebo USB připojené zařízení
npx expo run:android

# Pro iOS simulátor (pouze macOS)
npx expo run:ios

# Nebo vytvořte build přes EAS (viz EMULATOR_SETUP.md)
eas build --profile development --platform android
```

**⚠️ Důležité**: Aplikace NEMŮŽE běžet v Expo Go kvůli nativním Firebase modulům. 
Musíte vytvořit custom development build. 

**📱 Pro spuštění na fyzickém Android zařízení přes USB:** Viz [USB_DEBUGGING.md](./USB_DEBUGGING.md)

Viz také [EMULATOR_SETUP.md](./EMULATOR_SETUP.md) pro detailní návod pro emulátory.

## 📱 Build aplikace

### Development build (lokálně - doporučeno)
```bash
# Android
npx expo run:android

# iOS (pouze macOS)
npx expo run:ios
```

### Development build (EAS Build - cloud)
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Production build
```bash
# EAS Build (doporučeno)
eas build --profile production --platform all

# NEBO lokálně (po prvním npx expo run:android/ios)
cd android && ./gradlew bundleRelease
cd ios && xcodebuild ...
```

**Poznámka**: Firebase integrace vyžaduje custom build (expo-dev-client), protože Expo Go nepodporuje nativní Firebase moduly. **Nemusíte ale používat EAS Build** - můžete buildovat lokálně. Viz [BUILD_OPTIONS.md](./BUILD_OPTIONS.md) pro detailní vysvětlení všech možností.

## 🏗️ Struktura projektu

```
src/
├── navigation/
│   ├── AppNavigator.tsx      # Hlavní stack navigace
│   └── TabNavigator.tsx      # Tab bar navigace
├── screens/
│   ├── ProgramScreen.tsx     # Program festivalu
│   ├── ArtistsScreen.tsx     # Seznam interpretů
│   ├── FavoritesScreen.tsx   # Můj program / Oblíbené
│   ├── InfoScreen.tsx        # Informace a mapy
│   ├── SettingsScreen.tsx    # Nastavení aplikace
│   ├── EventDetailScreen.tsx # Detail události
│   └── ArtistDetailScreen.tsx # Detail interpreta
├── components/
│   ├── EventCard.tsx         # Karta události
│   └── ArtistCard.tsx        # Karta interpreta
├── services/
│   ├── firebase.ts           # Firebase inicializace
│   ├── notifications.ts      # Push notifikace (FCM)
│   ├── remoteConfig.ts       # Remote Config služba
│   └── crashlytics.ts        # Crashlytics služba
└── utils/
    └── helpers.ts            # Pomocné funkce
```

## 🔔 Push notifikace

Aplikace podporuje push notifikace přes Firebase Cloud Messaging (FCM) fungující:
- ✅ Když je aplikace na popředí
- ✅ Když je aplikace na pozadí
- ✅ Když je aplikace úplně ukončena

### Testování notifikací

1. Otevřete obrazovku **Nastavení** v aplikaci
2. Zkontrolujte, že je zobrazen FCM token
3. Použijte tlačítko "Odeslat testovací notifikaci" pro lokální test
4. Pro testování FCM notifikací z Firebase Console:
   - Zkopírujte FCM token z obrazovky Nastavení
   - Odešlete testovací notifikaci z Firebase Console pomocí tohoto tokenu

## ☁️ Firebase Remote Config

Aplikace je připojena k Firebase Remote Config, což umožňuje měnit texty, flagy a feature toggles bez nového releasu.

### Použití

```typescript
import { remoteConfigService } from './services/remoteConfig';

// Získání hodnoty
const value = remoteConfigService.getString('test_key', 'default');
const flag = remoteConfigService.getBoolean('feature_enabled', false);

// Aktualizace hodnot
await remoteConfigService.fetchAndActivate();
```

### Nastavení v Firebase Console

1. Otevřete Firebase Console → Remote Config
2. Přidejte parametry (např. `test_key`, `maintenance_mode`)
3. Nastavte hodnoty pro různé podmínky
4. Publikujte změny

## 🐛 Firebase Crashlytics

Aplikace automaticky reportuje chyby do Firebase Crashlytics.

### Testování Crashlytics

1. Otevřete obrazovku **Nastavení**
2. Klikněte na tlačítko "Force Crash (Test)"
3. Po restartu aplikace se crash objeví v Firebase Console → Crashlytics

### Manuální reportování chyb

```typescript
import { crashlyticsService } from './services/crashlytics';

try {
  // Váš kód
} catch (error) {
  crashlyticsService.recordError(error);
}
```

## 🧪 Testování

### Na reálných zařízeních

**Důležité**: Notifikace se v emulátorech chovají jinak než na reálných zařízeních. Pro testování notifikací použijte reálné zařízení.

### Ověření funkcionalit

- ✅ Push notifikace fungují i když je app vypnutá
- ✅ Remote Config změny se aplikují bez releasu
- ✅ Crashlytics zaznamenává chyby
- ✅ Navigace mezi obrazovkami funguje správně

## 📝 Konfigurace

### app.json

Hlavní konfigurační soubor Expo projektu. Obsahuje:
- Název a slug aplikace
- Bundle identifiers (iOS/Android)
- Cesty k Firebase konfiguračním souborům
- Expo pluginy

### eas.json

Konfigurace pro EAS Build s profily:
- `development`: Development build s expo-dev-client
- `preview`: Preview build pro testování
- `production`: Production build pro store

## 🔐 Bezpečnost

- Firebase konfigurační soubory (`google-services.json`, `GoogleService-Info.plist`) jsou v `.gitignore`
- Tyto soubory musí být přidány do projektu před buildu
- Pro CI/CD použijte EAS Secrets pro citlivé údaje

## 🚧 Vývoj

### Přidání nové obrazovky

1. Vytvořte komponentu v `src/screens/`
2. Přidejte route do `AppNavigator.tsx` nebo `TabNavigator.tsx`
3. Definujte typy v `RootStackParamList` nebo `TabParamList`

### Přidání nové služby

1. Vytvořte soubor v `src/services/`
2. Exportujte singleton instanci služby
3. Importujte a použijte v komponentách

## 📚 Další zdroje

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [EAS Build](https://docs.expo.dev/build/introduction/)

## 📄 Licence

Tento projekt je soukromý a určen pouze pro interní použití.

## 👥 Kontakt

Pro dotazy a podporu kontaktujte vývojový tým.

---

**Poznámka**: Toto je skeleton aplikace. Pro produkční použití je nutné:
- Přidat skutečná data z API
- Implementovat autentizaci uživatelů
- Přidat další funkcionality podle požadavků
- Nastavit CI/CD pipeline
- Přidat automatické testy


