# 🔧 Environment Variables & Firebase Configuration

Tento dokument popisuje, jak nastavit environment variables a Firebase konfiguraci pro různé prostředí (development, production).

## 📁 Struktura Firebase souborů

### Production (PROD)
Tyto soubory jsou již v projektu a používají se pro **production buildy**:
- `google-services.json` (Android)
- `GoogleService-Info.plist` (iOS)

### Development (DEV)
Tyto soubory vytvoříte z nového Firebase projektu a použijí se pro **development buildy**:
- `google-services.dev.json` (Android)
- `GoogleService-Info.dev.plist` (iOS)

## 🚀 Nastavení

### 1. Přidání Development Firebase souborů

1. Vytvořte nový Firebase projekt pro development (nebo použijte existující)
2. Stáhněte Firebase konfigurační soubory:
   - Android: `google-services.json` → přejmenujte na `google-services.dev.json`
   - iOS: `GoogleService-Info.plist` → přejmenujte na `GoogleService-Info.dev.plist`
3. Umístěte soubory do **kořenového adresáře** projektu:
   ```
   /Users/janfranc/Development/fmcityfest-app/
   ├── google-services.json          # PROD (už existuje)
   ├── GoogleService-Info.plist      # PROD (už existuje)
   ├── google-services.dev.json      # DEV (nový - přidáte)
   └── GoogleService-Info.dev.plist  # DEV (nový - přidáte)
   ```

### 2. Ověření .gitignore

Ujistěte se, že development soubory jsou v `.gitignore`:
```gitignore
# Development Firebase config files (should not be committed)
google-services.dev.json
GoogleService-Info.dev.plist
```

**Poznámka:** Production soubory (`google-services.json`, `GoogleService-Info.plist`) mohou být v gitu, pokud neobsahují citlivé údaje.

### 3. Environment Variables

Environment variables jsou automaticky nastaveny podle build profilu:

#### Development Build
```bash
eas build --profile development --platform android
```
- Použije: `google-services.dev.json`, `GoogleService-Info.dev.plist`
- Environment: `development`
- API URL: z `eas.json` nebo default

#### Preview Build
```bash
eas build --profile preview --platform android
```
- Použije: `google-services.json`, `GoogleService-Info.plist` (PROD)
- Environment: `production`
- API URL: z `eas.json` nebo default

#### Production Build
```bash
eas build --profile production --platform android
```
- Použije: `google-services.json`, `GoogleService-Info.plist` (PROD)
- Environment: `production`
- API URL: z `eas.json` nebo default

## 🔍 Jak to funguje

### app.config.js
Soubor `app.config.js` automaticky vybere správné Firebase soubory podle environmentu:

```javascript
const isProduction = environment === 'production';
const androidGoogleServicesFile = isProduction
  ? './google-services.json'           // PROD
  : './google-services.dev.json';      // DEV
```

### API Client
API client automaticky načte API URL z environment variables:

```typescript
// src/api/client.ts
const Constants = require('expo-constants').default;
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

### Environment Helper
Použijte helper pro přístup k environment konfiguraci:

```typescript
import { getAppConfig, isProduction, getApiUrl } from '@/config/environment';

const config = getAppConfig();
console.log(config.apiUrl);      // API URL
console.log(config.environment);  // 'development' | 'production'
console.log(isProduction());      // true/false
```

## 🧪 Testování

### Lokální Development Build
```bash
# Android
npx expo run:android
# Použije DEV Firebase soubory

# iOS
npx expo run:ios
# Použije DEV Firebase soubory
```

### EAS Build
```bash
# Development build (použije DEV Firebase)
eas build --profile development --platform android

# Production build (použije PROD Firebase)
eas build --profile production --platform android
```

## ⚙️ Přizpůsobení API URL

Pokud potřebujete změnit API URL pro konkrétní build profil, upravte `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "API_URL": "https://dev-api.fmcityfest.cz/api/mobile-app"
      }
    },
    "production": {
      "env": {
        "API_URL": "https://www.fmcityfest.cz/api/mobile-app"
      }
    }
  }
}
```

Nebo použijte EAS Secrets pro citlivé hodnoty:
```bash
eas secret:create --scope project --name API_URL --value "https://..."
```

## 🔐 Bezpečnost

1. **Development Firebase soubory** jsou v `.gitignore` - nebudou commitovány
2. **Production Firebase soubory** mohou být v gitu (pokud neobsahují citlivé údaje)
3. **API URL** může být v `eas.json` nebo jako EAS Secret
4. **EAS Secrets** jsou doporučené pro citlivé hodnoty

## 📝 Checklist

- [ ] Vytvořen development Firebase projekt
- [ ] Stáhnuty `google-services.dev.json` a `GoogleService-Info.dev.plist`
- [ ] Soubory umístěny do kořenového adresáře
- [ ] Ověřeno, že development soubory jsou v `.gitignore`
- [ ] Otestován development build s DEV Firebase
- [ ] Otestován production build s PROD Firebase
- [ ] API URL nastaveno v `eas.json` nebo jako EAS Secret

## 🐛 Řešení problémů

### Firebase se neinicializuje správně
- Zkontrolujte, že správné soubory jsou v kořenovém adresáři
- Ověřte, že názvy souborů odpovídají (`google-services.dev.json`, ne `google-services-dev.json`)
- Zkontrolujte `app.config.js` - správné cesty k souborům

### Špatný API URL
- Zkontrolujte `eas.json` - hodnoty v `env.API_URL`
- Ověřte, že `app.config.js` správně předává hodnoty do `extra`
- Použijte `getAppConfig()` helper pro debug

### Build používá špatné Firebase soubory
- Zkontrolujte build profil (`development` vs `production`)
- Ověřte logiku v `app.config.js` (řádky 20-25)
- Zkontrolujte, že EAS_BUILD_PROFILE je správně nastaven


