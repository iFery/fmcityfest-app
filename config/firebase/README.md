# 🔥 Firebase Configuration Files

Tato složka obsahuje Firebase konfigurační soubory pro různá prostředí.

## 📁 Struktura

```
config/firebase/
├── dev/
│   ├── google-services.json          # Android DEV
│   └── GoogleService-Info.plist      # iOS DEV
└── prod/
    ├── google-services.json          # Android PROD
    └── GoogleService-Info.plist      # iOS PROD
```

## 🚀 Použití

### Automatické kopírování (doporučeno)

Build script automaticky zkopíruje správné soubory před buildem:

```bash
# Development build
npm run firebase:dev
npm run android  # nebo npm run ios

# Production build
npm run firebase:prod
eas build --profile production
```

### Manuální kopírování

```bash
# Development
node scripts/copy-firebase-config.js dev

# Production
node scripts/copy-firebase-config.js prod
```

## 📋 Co script dělá

1. Zkopíruje soubory z `config/firebase/{env}/` do standardních umístění:
   - `android/app/google-services.json`
   - `ios/FMCityFest/GoogleService-Info.plist`

2. Native buildy pak používají standardní umístění (jak očekávají)

## 🔐 Bezpečnost

- **Development soubory** mohou být citlivé - zvažte přidání do `.gitignore`
- **Production soubory** obvykle mohou být v gitu (pokud neobsahují citlivé údaje)
- Kopírované soubory v `android/app/` a `ios/FMCityFest/` jsou v `.gitignore`

## 📝 Přidání nového prostředí

1. Vytvořte složku: `config/firebase/{new-env}/`
2. Přidejte Firebase soubory
3. Upravte `scripts/copy-firebase-config.js` - přidejte environment do `ENVIRONMENTS`
4. Přidejte npm script do `package.json` (volitelné)

## ✅ Ověření

Po spuštění build scriptu zkontrolujte:
- `android/app/google-services.json` existuje
- `ios/FMCityFest/GoogleService-Info.plist` existuje
- Soubory obsahují správné Firebase project ID pro dané prostředí


