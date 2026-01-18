# 🏗️ Navrhovaná architektura Firebase konfigurace

## 📋 Problém

Současné řešení má Firebase soubory v kořenovém adresáři, což není ideální z hlediska:
- **Přehlednosti** - kořenový adresář je přeplněný
- **Organizace** - soubory nejsou logicky strukturované
- **Škálovatelnosti** - při přidání dalších prostředí (staging, QA) bude chaos
- **Best practices** - neodpovídá standardním konvencím

## ✅ Navrhované řešení

### Varianta A: Centralizovaná konfigurace (DOPORUČENO)

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

**Výhody:**
- ✅ Všechny Firebase konfigurace na jednom místě
- ✅ Snadné přidání dalších prostředí (staging, QA)
- ✅ Čistý kořenový adresář
- ✅ Jasná struktura podle environmentu

**Implementace:**
- `app.config.js` kopíruje správné soubory do správných míst před buildem
- Nebo upraví cesty v konfiguraci

---

### Varianta B: Platform-specific s variants (PROFESIONÁLNÍ)

```
android/
└── app/
    └── src/
        ├── dev/
        │   └── google-services.json      # DEV variant
        └── prod/
            └── google-services.json      # PROD variant

ios/
└── FMCityFest/
    ├── Config/
    │   ├── Dev/
    │   │   └── GoogleService-Info.plist # DEV config
    │   └── Prod/
    │       └── GoogleService-Info.plist  # PROD config
    └── GoogleService-Info.plist          # Default (odkazuje na správný)
```

**Výhody:**
- ✅ Respektuje platform-specific konvence
- ✅ Android build variants mohou automaticky vybrat správný soubor
- ✅ iOS build configurations mohou vybrat správný soubor
- ✅ Nejblíže k native best practices

**Nevýhody:**
- ⚠️ Vyžaduje úpravu native build konfigurací
- ⚠️ Složitější implementace v Expo managed workflow

---

### Varianta C: Hybridní přístup (KOMPROMIS)

```
config/
└── firebase/
    ├── dev/
    │   ├── android/
    │   │   └── google-services.json
    │   └── ios/
    │       └── GoogleService-Info.plist
    └── prod/
        ├── android/
        │   └── google-services.json
        └── ios/
            └── GoogleService-Info.plist
```

**Výhody:**
- ✅ Strukturované podle environmentu i platformy
- ✅ Snadné rozšíření
- ✅ Přehledné

---

## 🎯 DOPORUČENÉ ŘEŠENÍ: Varianta A + Build Script

### Struktura:
```
config/
└── firebase/
    ├── dev/
    │   ├── google-services.json
    │   └── GoogleService-Info.plist
    └── prod/
        ├── google-services.json
        └── GoogleService-Info.plist
```

### Implementace:

1. **Build script** (`scripts/copy-firebase-config.js`) kopíruje správné soubory před buildem
2. **app.config.js** odkazuje na kopírované soubory
3. **Native buildy** používají standardní umístění:
   - Android: `android/app/google-services.json`
   - iOS: `ios/FMCityFest/GoogleService-Info.plist`

### Workflow:
```bash
# Development build
npm run build:dev
# → Kopíruje config/firebase/dev/* do android/app/ a ios/FMCityFest/

# Production build  
npm run build:prod
# → Kopíruje config/firebase/prod/* do android/app/ a ios/FMCityFest/
```

---

## 📊 Srovnání variant

| Aspekt | Varianta A | Varianta B | Varianta C |
|--------|-----------|-----------|-----------|
| **Přehlednost** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Implementace** | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **Škálovatelnost** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Best Practices** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Expo Compat** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 Doporučení

**Pro tento projekt doporučuji Variantu A** z těchto důvodů:

1. ✅ **Nejjednodušší implementace** - nevyžaduje změny native konfigurací
2. ✅ **Expo-friendly** - funguje s Expo managed workflow
3. ✅ **Snadné rozšíření** - přidání staging/QA je triviální
4. ✅ **Čistá struktura** - všechny konfigurace na jednom místě
5. ✅ **Build script** - automatizace kopírování před buildem

**Implementace bude:**
- Vytvořit `config/firebase/dev/` a `config/firebase/prod/` složky
- Přesunout soubory do správných složek
- Vytvořit build script pro kopírování
- Upravit `app.config.js` pro správné cesty
- Aktualizovat `.gitignore`

---

## 📝 Další kroky

1. Schválit variantu
2. Implementovat strukturu
3. Vytvořit build script
4. Upravit konfigurace
5. Otestovat buildy

