# ✅ Status Environment Setup

## 📁 Firebase Soubory

### ✅ Production (PROD)
- `google-services.json` - Android PROD ✅
- `GoogleService-Info.plist` - iOS PROD ✅

### ✅ Development (DEV)
- `google-services.dev.json` - Android DEV ✅ (právě přidáno)
- `GoogleService-Info.dev.plist` - iOS DEV ✅ (právě přidáno)

## 🔍 Ověření

### 1. Soubory jsou na správném místě
```
/Users/janfranc/Development/fmcityfest-app/
├── google-services.json          ✅ PROD
├── GoogleService-Info.plist     ✅ PROD
├── google-services.dev.json      ✅ DEV (nový)
└── GoogleService-Info.dev.plist  ✅ DEV (nový)
```

### 2. .gitignore je správně nastaven
- ✅ `google-services.dev.json` je v `.gitignore`
- ✅ `GoogleService-Info.dev.plist` je v `.gitignore`
- ✅ Production soubory mohou být v gitu

### 3. app.config.js správně vybírá soubory
- ✅ Development build → použije `.dev.json` a `.dev.plist`
- ✅ Production build → použije standardní soubory

## 🧪 Testování

### Lokální Development Build
```bash
# Android
npx expo run:android
# Mělo by použít: google-services.dev.json

# iOS
npx expo run:ios
# Mělo by použít: GoogleService-Info.dev.plist
```

### EAS Build
```bash
# Development build
eas build --profile development --platform android
# Použije DEV Firebase soubory

# Production build
eas build --profile production --platform android
# Použije PROD Firebase soubory
```

## 📊 Firebase Projekty

### Development
- **Project ID**: `fm-city-fest---dev`
- **Project Number**: `33187317594`
- **Soubory**: `google-services.dev.json`, `GoogleService-Info.dev.plist`

### Production
- **Project ID**: (z původních souborů)
- **Soubory**: `google-services.json`, `GoogleService-Info.plist`

## ✅ Checklist

- [x] DEV Firebase soubory přidány
- [x] Soubory správně pojmenované (`.dev.json`, `.dev.plist`)
- [x] Soubory v kořenovém adresáři
- [x] `.gitignore` správně nastaven
- [x] `app.config.js` správně konfigurován
- [x] `src/api/client.ts` používá environment variables
- [x] `eas.json` má environment variables
- [ ] **Test lokálního development buildu** (doporučeno)
- [ ] **Test EAS development buildu** (volitelné)

## 🚀 Další kroky

1. **Otestuj lokální development build:**
   ```bash
   npx expo run:android
   # nebo
   npx expo run:ios
   ```

2. **Ověř, že Firebase se inicializuje správně:**
   - Zkontroluj logy při startu aplikace
   - Mělo by se zobrazit: "Firebase initialized with X app(s)"
   - Project ID by měl být: `fm-city-fest---dev`

3. **Otestuj Firebase služby:**
   - Push notifikace (FCM token)
   - Remote Config
   - Crashlytics

## 📝 Poznámky

- Development soubory jsou v `.gitignore` - **nebudou commitovány** ✅
- Production soubory zůstávají v projektu
- `app.config.js` automaticky vybere správné soubory podle build profilu
- Environment variables jsou dostupné přes `Constants.expoConfig?.extra`

---

**Status: ✅ PŘIPRAVENO K TESTOVÁNÍ**

