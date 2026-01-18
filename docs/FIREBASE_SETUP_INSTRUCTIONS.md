# 📋 Instrukce pro Firebase konfiguraci

## ✅ Co je hotovo

1. ✅ Strukturovaná architektura Firebase configů (`config/firebase/`)
2. ✅ Build script pro automatické kopírování (`scripts/copy-firebase-config.js`)
3. ✅ `app.config.js` - dynamická konfigurace podle environmentu
4. ✅ `src/api/client.ts` - používá environment variables
5. ✅ `eas.json` - environment variables pro build profily
6. ✅ `.gitignore` - kopírované soubory jsou ignorovány
7. ✅ `src/config/environment.ts` - helper pro environment

## 📁 Struktura Firebase konfigurací

```
config/
└── firebase/
    ├── dev/
    │   ├── google-services.json          # Android DEV
    │   └── GoogleService-Info.plist      # iOS DEV
    └── prod/
        ├── google-services.json          # Android PROD
        └── GoogleService-Info.plist      # iOS PROD
```

## 📥 Přidání nových Firebase souborů

### 1. Vytvoř Development Firebase projekt
- Vytvoř nový Firebase projekt (nebo použij existující pro development)
- Nastav stejné služby jako v production projektu:
  - Firebase Cloud Messaging (FCM)
  - Remote Config
  - Crashlytics

### 2. Stáhni Firebase konfigurační soubory

Z Firebase Console stáhni:
- **Android**: `google-services.json`
- **iOS**: `GoogleService-Info.plist`

### 3. Umísti soubory do správné složky

Umísti soubory do **`config/firebase/dev/`**:
```
config/firebase/dev/
├── google-services.json          ← Android DEV (přidej sem)
└── GoogleService-Info.plist      ← iOS DEV (přidej sem)
```

**Poznámka:** Soubory NEPŘEJMENOVÁVEJ - script je automaticky zkopíruje na správné místo.

## 🎯 Jak to funguje

### Development Buildy
- Použijí: `google-services.dev.json`, `GoogleService-Info.dev.plist`
- Spouští se při: `npx expo run:android/ios` nebo `eas build --profile development`

### Production Buildy
- Použijí: `google-services.json`, `GoogleService-Info.plist` (stávající soubory)
- Spouští se při: `eas build --profile production`

## ✅ Po přidání souborů

1. Ověř, že soubory jsou v `config/firebase/dev/`
2. Otestuj build script:
   ```bash
   npm run firebase:dev
   ```
3. Ověř, že soubory byly zkopírované:
   ```bash
   ls android/app/google-services.json
   ls ios/FMCityFest/GoogleService-Info.plist
   ```
4. Otestuj development build:
   ```bash
   npm run android
   # nebo
   npm run ios
   ```

## 📝 Poznámky

- **Source soubory** v `config/firebase/` mohou být v gitu (pokud nejsou citlivé)
- **Kopírované soubory** v `android/app/` a `ios/FMCityFest/` jsou v `.gitignore`
- Build script automaticky kopíruje správné soubory před buildem
- `app.config.js` odkazuje na standardní umístění (kam script kopíruje)

## 🐛 Pokud něco nefunguje

1. Zkontroluj názvy souborů - musí být přesně:
   - `google-services.dev.json` (ne `google-services-dev.json`)
   - `GoogleService-Info.dev.plist` (ne `GoogleService-Info-dev.plist`)

2. Zkontroluj umístění - musí být v kořenovém adresáři projektu

3. Zkontroluj `app.config.js` - logika výběru souborů je na řádcích 20-25

4. Zkontroluj build profil - development vs production

---

**Až přidáš soubory, dej mi vědět a můžeme to otestovat!** 🚀

