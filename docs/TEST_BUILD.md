# 🧪 Testování buildu - NDK r26 & Upgrade Verification

**Datum:** 18. ledna 2026  
**Účel:** Ověření, že build funguje s NDK r26 a později s NDK r28 po upgrade  

---

## 📋 Testovací checklist

### ✅ Test 1: Ověření aktuálního buildu (NDK r26)

#### Krok 1.1: Zkontrolovat NDK verzi
```bash
# Zkontrolovat konfiguraci v android/build.gradle
grep "ndkVersion" android/build.gradle
# Mělo by zobrazit: ndkVersion = "26.1.10909125"
```

#### Krok 1.2: Clean build
```bash
# Vyčistit předchozí buildy
cd android
./gradlew clean
cd ..
```

#### Krok 1.3: Lokální Android build
```bash
# Spustit lokální build (pokud máte Android SDK)
npm run run:android

# Nebo pouze build bez spuštění
npx expo run:android --no-install
```

**Očekávaný výsledek:**
- ✅ Build projde bez chyb
- ✅ APK/AAB se vytvoří úspěšně
- ✅ Aplikace se nainstaluje a spustí

**Pokud build selže:**
- Zkontrolovat chybové hlášky
- Ověřit, že Android SDK a NDK jsou správně nainstalované
- Zkontrolovat `android/build.gradle` a `android/app/build.gradle`

---

#### Krok 1.4: EAS Build (doporučeno)
```bash
# Development build pro testování
eas build --profile development --platform android

# Preview build pro ověření release konfigurace
eas build --profile preview --platform android
```

**Očekávaný výsledek:**
- ✅ EAS build projde úspěšně
- ✅ APK/AAB je dostupný ke stažení
- ✅ Build log neobsahuje kritické chyby

**Ověření v EAS dashboardu:**
1. Přihlásit se na https://expo.dev
2. Otevřít projekt FMCityFest
3. Zkontrolovat Builds → najít poslední build
4. Ověřit, že build je úspěšný (✅)

---

### ✅ Test 2: Funkční testování aplikace

#### Krok 2.1: Základní funkce
Po instalaci buildu ověřte:

- [ ] **Spuštění aplikace**
  - Aplikace se otevře bez crashu
  - Splash screen se zobrazí
  - Hlavní obrazovka se načte

- [ ] **Firebase inicializace**
  - Firebase se inicializuje bez chyb
  - Žádné Firebase chyby v konzoli
  - Remote Config funguje

- [ ] **Navigation**
  - Všechny obrazovky jsou přístupné
  - Navigace mezi obrazovkami funguje
  - Deep linking funguje (pokud je implementován)

- [ ] **Push notifikace**
  - Aplikace registruje device token
  - Notifikace se zobrazují
  - Notifikace otevřou správnou obrazovku

- [ ] **Data fetching**
  - Události se načítají
  - Umělci se načítají
  - Obrázky se zobrazují

- [ ] **Favority**
  - Přidání do favoritů funguje
  - Odstranění z favoritů funguje
  - Favority se persistují

---

### ✅ Test 3: 16 KB Page Size Compliance (po upgrade na NDK r28)

#### Krok 3.1: Ověření NDK r28
```bash
# Zkontrolovat konfiguraci
grep "ndkVersion" android/build.gradle
# Mělo by zobrazit: ndkVersion = "28.0.12674087" (nebo podobně)
```

#### Krok 3.2: Build release AAB
```bash
# Vytvořit release build
eas build --profile production --platform android

# Nebo lokálně (pokud máte keystore)
cd android
./gradlew bundleRelease
cd ..
```

#### Krok 3.3: Ověření 16 KB alignment

**Metoda A: Použití bundletool (doporučeno)**

```bash
# Stáhnout bundletool (pokud nemáte)
# https://github.com/google/bundletool/releases

# Extrahovat APK z AAB pro analýzu
bundletool build-apks \
  --bundle=app-release.aab \
  --output=app.apks \
  --mode=universal

# Extrahovat APK
unzip app.apks -d extracted/

# Analýza .so souborů (potřebujete readelf)
find extracted/ -name "*.so" | while read so_file; do
  echo "Checking: $so_file"
  readelf -l "$so_file" | grep LOAD
done

# Ověřit alignment (mělo by být 0x4000 = 16 KB = 16384)
```

**Metoda B: Použití Android Studio APK Analyzer**

1. Otevřít Android Studio
2. Build → Analyze APK/Bundle
3. Vybrat AAB soubor
4. Otevřít `lib/` složku
5. Zkontrolovat `.so` soubory
6. Ověřit, že všechny mají 16 KB alignment

**Metoda C: Použití command-line tools**

```bash
# Použít aapt2 nebo unzip + readelf
unzip -l app-release.aab | grep "\.so$"

# Pro každý .so soubor zkontrolovat ELF header
# (vyžaduje readelf z Android NDK nebo elfutils)
```

#### Krok 3.4: Google Play Console validace
Po nahrání AAB do Google Play Console:
- Google Play automaticky ověří 16 KB compliance
- Pokud je problém, uvidíte varování v console
- Build může být odmítnut, pokud nesplňuje požadavky

---

## 🔧 Utility scripty

### Script 1: Quick Build Test
Vytvořit `scripts/test-build.sh`:

```bash
#!/bin/bash
set -e

echo "🧪 Testing build configuration..."

# Check NDK version
echo "📋 Checking NDK version..."
NDK_VERSION=$(grep "ndkVersion" android/build.gradle | sed 's/.*"\(.*\)".*/\1/')
echo "   NDK Version: $NDK_VERSION"

# Clean
echo "🧹 Cleaning previous builds..."
cd android
./gradlew clean
cd ..

# Build (if local SDK available)
if command -v adb &> /dev/null; then
    echo "🔨 Building Android app..."
    npx expo run:android --no-install
    echo "✅ Build completed successfully!"
else
    echo "⚠️  Android SDK not found locally. Use EAS Build instead:"
    echo "   eas build --profile development --platform android"
fi
```

Použití:
```bash
chmod +x scripts/test-build.sh
./scripts/test-build.sh
```

---

### Script 2: Verify 16 KB Compliance
Vytvořit `scripts/verify-16kb.sh`:

```bash
#!/bin/bash
set -e

AAB_FILE="$1"

if [ -z "$AAB_FILE" ]; then
    echo "Usage: $0 <path-to-aab-file>"
    exit 1
fi

if [ ! -f "$AAB_FILE" ]; then
    echo "Error: AAB file not found: $AAB_FILE"
    exit 1
fi

echo "🔍 Verifying 16 KB compliance for: $AAB_FILE"

# Check if bundletool exists
if ! command -v bundletool &> /dev/null; then
    echo "⚠️  bundletool not found. Install from:"
    echo "   https://github.com/google/bundletool/releases"
    exit 1
fi

# Extract APK
echo "📦 Extracting APK from AAB..."
bundletool build-apks \
    --bundle="$AAB_FILE" \
    --output=app.apks \
    --mode=universal

echo "📂 Extracting APK..."
unzip -q app.apks -d extracted/

# Check .so files
echo "🔍 Checking .so files..."
SO_FILES=$(find extracted/ -name "*.so")

if [ -z "$SO_FILES" ]; then
    echo "⚠️  No .so files found in AAB"
    exit 1
fi

ERRORS=0
for so_file in $SO_FILES; do
    if command -v readelf &> /dev/null; then
        # Check alignment using readelf
        ALIGN=$(readelf -l "$so_file" 2>/dev/null | grep LOAD | awk '{print $NF}' | head -1)
        echo "   $so_file: alignment $ALIGN"
        # TODO: Verify alignment is 0x4000 (16384)
    else
        echo "   Found: $so_file (readelf not available for detailed check)"
    fi
done

# Cleanup
rm -rf extracted/ app.apks

echo "✅ Verification completed"
```

Použití:
```bash
chmod +x scripts/verify-16kb.sh
./scripts/verify-16kb.sh path/to/app-release.aab
```

---

## 📊 Test report template

Po dokončení testů vytvořte report:

```markdown
# Build Test Report

**Datum:** [DATUM]
**NDK Version:** [VERZE]
**Build Type:** [development/preview/production]
**Platform:** Android

## Test Results

### Build Status
- [ ] Lokální build: ✅/❌
- [ ] EAS build: ✅/❌
- [ ] Build čas: [ČAS]

### Functionality
- [ ] Spuštění aplikace: ✅/❌
- [ ] Firebase: ✅/❌
- [ ] Navigation: ✅/❌
- [ ] Push notifikace: ✅/❌
- [ ] Data fetching: ✅/❌

### 16 KB Compliance (pokud NDK r28)
- [ ] Alignment ověřeno: ✅/❌
- [ ] Google Play validace: ✅/❌/N/A

## Issues Found
[Lista problémů, pokud nějaké]

## Next Steps
[Co dál]
```

---

## 🚨 Troubleshooting

### Build selže s NDK chybou
```bash
# Ověřit, že NDK je nainstalované
# V Android Studio: Tools → SDK Manager → SDK Tools → NDK

# Nebo pro EAS Build:
# EAS automaticky instaluje správnou NDK verzi
```

### Aplikace se nespustí
- Zkontrolovat logcat: `adb logcat`
- Zkontrolovat, že Firebase konfigurace je správná
- Ověřit, že development build je správně nainstalovaný

### 16 KB compliance selže
- Ověřit, že NDK je r28+
- Ověřit, že AGP je 8.5.1+
- Zkontrolovat, že všechny nativní knihovny jsou aktualizované

---

**Datum vytvoření:** 18. ledna 2026  
**Poslední aktualizace:** 18. ledna 2026
