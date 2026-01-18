# 🏗️ Firebase Configuration Architecture

## ✅ Implementované řešení

### Struktura souborů

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

### Standardní umístění (pro native buildy)

```
android/app/
└── google-services.json                  # Kopírováno z config/firebase/{env}/

ios/FMCityFest/
└── GoogleService-Info.plist              # Kopírováno z config/firebase/{env}/
```

## 🚀 Jak to funguje

### 1. Build Script

Script `scripts/copy-firebase-config.js` automaticky kopíruje správné soubory:

```bash
# Development
node scripts/copy-firebase-config.js dev
# → Kopíruje config/firebase/dev/* → android/app/ a ios/FMCityFest/

# Production
node scripts/copy-firebase-config.js prod
# → Kopíruje config/firebase/prod/* → android/app/ a ios/FMCityFest/
```

### 2. NPM Scripts

Automaticky se spouští před buildem:

```bash
# Development build (automaticky kopíruje DEV config)
npm run android
npm run ios

# Manuální kopírování
npm run firebase:dev
npm run firebase:prod
```

### 3. app.config.js

Odkazuje na standardní umístění (kam script kopíruje):

```javascript
const androidGoogleServicesFile = './android/app/google-services.json';
const iosGoogleServicesFile = './ios/FMCityFest/GoogleService-Info.plist';
```

## 📋 Workflow

### Development Build

```bash
# 1. Automaticky se spustí před buildem
npm run firebase:dev

# 2. Build používá zkopírované soubory
npm run android
# nebo
npm run ios
```

### Production Build (EAS)

```bash
# 1. Před EAS buildem zkopírujte PROD config
npm run firebase:prod

# 2. EAS build používá zkopírované soubory
eas build --profile production --platform android
```

**Poznámka:** Pro EAS buildy můžete také přidat pre-build hook do `eas.json`:

```json
{
  "build": {
    "production": {
      "prebuildCommand": "npm run firebase:prod"
    }
  }
}
```

## ✅ Výhody tohoto řešení

1. **Přehledná struktura** - všechny Firebase configy na jednom místě
2. **Čistý kořenový adresář** - žádné konfigurační soubory v rootu
3. **Snadné rozšíření** - přidání staging/QA je triviální
4. **Standardní umístění** - native buildy používají standardní cesty
5. **Automatizace** - build script zajišťuje správné kopírování
6. **Git-friendly** - kopírované soubory jsou v `.gitignore`

## 🔐 Bezpečnost

### Co je v gitu:
- ✅ `config/firebase/prod/` - production soubory (pokud nejsou citlivé)
- ✅ `scripts/copy-firebase-config.js` - build script
- ✅ `config/firebase/README.md` - dokumentace

### Co NENÍ v gitu:
- ❌ `android/app/google-services.json` - kopírovaný soubor
- ❌ `ios/FMCityFest/GoogleService-Info.plist` - kopírovaný soubor
- ⚠️ `config/firebase/dev/` - může být v gitu, ale zvažte `.gitignore` pokud obsahuje citlivé údaje

## 📝 Přidání nového prostředí (např. staging)

1. **Vytvořte složku:**
   ```bash
   mkdir -p config/firebase/staging
   ```

2. **Přidejte Firebase soubory:**
   - `config/firebase/staging/google-services.json`
   - `config/firebase/staging/GoogleService-Info.plist`

3. **Upravte build script:**
   ```javascript
   // scripts/copy-firebase-config.js
   const ENVIRONMENTS = ['dev', 'prod', 'staging'];
   ```

4. **Přidejte npm script (volitelné):**
   ```json
   {
     "scripts": {
       "firebase:staging": "node scripts/copy-firebase-config.js staging"
     }
   }
   ```

## 🧪 Testování

### Ověření správného kopírování

```bash
# 1. Zkopírujte DEV config
npm run firebase:dev

# 2. Ověřte, že soubory jsou na správném místě
ls android/app/google-services.json
ls ios/FMCityFest/GoogleService-Info.plist

# 3. Ověřte obsah (mělo by být DEV project ID)
cat android/app/google-services.json | grep project_id
# Mělo by být: "fm-city-fest---dev"
```

### Ověření v aplikaci

1. Spusťte development build
2. Zkontrolujte logy při startu:
   ```
   Firebase initialized with X app(s)
   ```
3. Ověřte Firebase Project ID v logách nebo Debug screen

## 🐛 Řešení problémů

### Script nekopíruje soubory

- Zkontrolujte, že soubory existují v `config/firebase/{env}/`
- Ověřte oprávnění: `chmod +x scripts/copy-firebase-config.js`
- Spusťte manuálně: `node scripts/copy-firebase-config.js dev`

### Build používá špatné Firebase soubory

- Zkontrolujte, že script se spustil před buildem
- Ověřte obsah zkopírovaných souborů
- Zkontrolujte `app.config.js` - cesty musí odpovídat standardním umístěním

### Firebase se neinicializuje

- Ověřte, že správné soubory jsou zkopírované
- Zkontrolujte bundle ID / package name v Firebase souborech
- Ověřte, že Firebase projekt má správné služby nastavené

---

**Status: ✅ IMPLEMENTOVÁNO A FUNGUJE**


