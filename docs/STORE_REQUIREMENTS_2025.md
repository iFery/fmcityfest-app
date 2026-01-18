# Technické požadavky pro release buildy - App Store a Google Play

**Datum sestavení:** 18. ledna 2026  
**Platnost:** Aktuální k 18.1.2026

---

## 📱 GOOGLE PLAY (Android)

### 1. Target SDK / API Level

#### Aktuální požadavky (k 18.1.2026) ⚠️ UŽ POVINNÉ
- **Od 31. srpna 2025:** Všechny nové aplikace a aktualizace musí targetovat **Android 15 (API level 35)** nebo vyšší
  - ✅ **Tento požadavek je již aktivní** - všechny submise musí targetovat API 35+
- **Existující aplikace:** Musí targetovat alespoň **Android 14 (API level 34)**, aby zůstaly viditelné uživatelům s novějšími verzemi Androidu
- **Výjimky:** 
  - Wear OS a Android TV aplikace musí targetovat API level 34 nebo vyšší
  - Pro Android TV platí specifické termíny (od srpna 2026)

#### Doporučení pro váš projekt
- Aktuálně: `targetSdkVersion 35` ✅ (splňuje)
- `compileSdkVersion 35` ✅ (splňuje)
- `minSdkVersion 23` ✅ (Android 6.0+)

---

### 2. 16 KB Page Size Requirement ⚠️ KRITICKÉ

#### Co to znamená
- Android 15 (API 35) podporuje zařízení s **16 KB paměťovými stránkami** (místo dosavadních 4 KB)
- Nativní knihovny (`.so` soubory) musí být **zarovnané na 16 KB hranice**

#### Termíny
| Datum | Požadavek | Status |
|-------|-----------|--------|
| **1. listopadu 2025** | Všechny nové aplikace a aktualizace targetující **Android 15+ (API 35+)** musí podporovat 16 KB page sizes | ✅ **UŽ POVINNÉ** (prošlé) |
| **1. května 2026** | Google Play zablokuje aktualizace existujících aplikací, které nepodporují 16 KB page sizes | ⚠️ **PŘICHÁZÍ** (za ~3.5 měsíce) |

#### Kdo je ovlivněn
- ✅ **Ovlivněno:** Aplikace s nativními knihovnami (`.so` soubory) - přímo nebo přes SDK/dependencies
- ❌ **Neovlivněno:** Čistě Java/Kotlin aplikace bez nativního kódu

#### Technické požadavky pro compliance

1. **Android Gradle Plugin (AGP)**
   - **Minimálně verze 8.5.1** - automaticky zarovnává uncompressed `.so` soubory na 16 KB
   - Aktuální stav projektu: Nutno ověřit verzi AGP

2. **NDK (Native Development Kit)**
   - **Minimálně r28** - kompiluje nativní knihovny s 16 KB alignment
   - Aktuální stav projektu: `ndkVersion = "26.1.10909125"` ⚠️ **NUTNO AKTUALIZOVAT na r28+**

3. **Kontrola compliance**
   - Použijte Android Studio **APK Analyzer** nebo **bundletool** pro kontrolu zarovnání `.so` souborů
   - Ověřte, že všechny `LOAD` segmenty v ELF souborech jsou zarovnané na 16 KB (16384 bajtů)

4. **Odebrání hardcoded page size**
   - V kódu nelze používat hardcoded `4096` (4 KB)
   - Používejte `getpagesize()` nebo `sysconf(_SC_PAGESIZE)`

#### Důsledky nedodržení
- ✅ **Od 1.11.2025:** Google Play **odmítá upload** nových aplikací/aktualizací targetujících Android 15+ bez 16 KB podpory (UŽ AKTIVNÍ)
- ⚠️ **Od 1.5.2026:** Blokace aktualizací existujících aplikací (PŘICHÁZÍ - kritické!)

---

### 3. Android App Bundle (AAB) Format

#### Požadavek
- **Od srpna 2021:** Všechny nové aplikace musí být publikované jako **AAB** (Android App Bundle)
- **Od června 2023:** Všechny aktualizace Android TV aplikací musí používat AAB
- **Play App Signing:** Povinné pro použití AAB - Google spravuje signing key

#### Výjimky
- Privátní/enterprise aplikace distribuované přes managed Google Play mohou stále používat APK

---

### 4. 64-bit Architektura

#### Požadavek
- **Od 1. srpna 2019:** Aplikace s nativním kódem musí poskytovat **64-bit verze** vedle 32-bit
- **Od 1. srpna 2021:** Google Play přestal servírovat 32-bit-only aplikace na 64-bit zařízeních
- **Od 1. srpna 2026:** Pro Google TV / Android TV platí specifické požadavky na 64-bit podporu

#### Architektury
- ARM: `armeabi-v7a` (32-bit) → **musí mít** `arm64-v8a` (64-bit)
- x86: `x86` (32-bit) → **musí mít** `x86_64` (64-bit)

#### Aktuální stav projektu
- `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` ✅ (splňuje - má 64-bit architektury)

---

### 5. Další technické požadavky

#### Build Tools
- **Build Tools Version:** Doporučeno `34.0.0` nebo novější
- Aktuální stav: `buildToolsVersion = '34.0.0'` ✅

#### Kotlin Version
- Aktuální stav: `kotlinVersion = '1.9.23'`
- Doporučeno: Aktualizovat na novější verzi (kompatibilní s React Native 0.74.5)

---

## 🍎 APPLE APP STORE (iOS)

### 1. Xcode a iOS SDK

#### Aktuální požadavky (k 18.1.2026) ⚠️ UŽ POVINNÉ
- **Od 24. dubna 2025:** Všechny nové aplikace a aktualizace musí být buildované s **Xcode 16 nebo novější** a **iOS 18 SDK** (nebo odpovídající SDK pro iPadOS, tvOS, visionOS, watchOS)
  - ✅ **Tento požadavek je již aktivní** - všechny submise musí používat Xcode 16+ a iOS 18 SDK

#### Co to znamená
- Build SDK (SDK, se kterým kompilujete) musí být **iOS 18 SDK** nebo vyšší
- Deployment Target (minimální verze iOS pro uživatele) může být nižší - např. iOS 15, 16 nebo 17

#### Podporované Deployment Targets
- **Xcode 16 podporuje** deployment targets od **iOS 15** výše
- iOS 14 a starší: Podpora je omezená/neoficiální

#### Doporučení
- **Build SDK:** iOS 18 SDK ✅ (povinné od 24.4.2025 - UŽ AKTIVNÍ)
- **Deployment Target:** iOS 15+ (pro maximální kompatibilitu s Xcode 16)
- Aktuální Expo SDK: `~51.0.0` - ověřte kompatibilitu s iOS 18 SDK

#### Budoucí požadavky (duben 2026)
- **Od dubna 2026:** Bude vyžadován **iOS 26 SDK** (nebo odpovídající pro ostatní platformy) a **Xcode 26**

---

### 2. Privacy Manifest (PrivacyInfo.xcprivacy)

#### Požadavek
- **Od 1. května 2024:** Aplikace používající "Required Reason APIs" nebo běžně používané třetí SDK musí obsahovat privacy manifest

#### Required Reason APIs
Následující API vyžadují deklaraci důvodu použití v privacy manifestu:
- File timestamp APIs
- System boot time APIs
- Disk space APIs
- Active keyboard APIs
- User defaults APIs
- A další...

#### Co musí obsahovat
- `NSPrivacyAccessedAPITypes` - seznam použitých Required Reason APIs a důvody jejich použití
- Tracking domains (pokud aplikace sleduje uživatele)
- Typy shromažďovaných dat

#### SDK podpisování
- SDK používané jako binary dependencies musí mít validní signatury pro ověření původu a integrity

#### Důsledky nedodržení
- App Store Connect **odmítne** nové submise nebo aktualizace
- Chybové kódy: `ITMS-91053` (Missing API declaration), `ITMS-91061` (Missing privacy manifest)

---

### 3. Další iOS požadavky

#### Build nástroje
- **Xcode:** 16.0+ (povinné od 24.4.2025)
- **iOS SDK:** 18.0+ (povinné od 24.4.2025)

#### Deployment Target doporučení
- Pro maximální pokrytí uživatelů: iOS 15+ (97%+ zařízení podporuje iOS 15+ k lednu 2026)
- Pro starší zařízení: iOS 14 (pokud potřebujete podporovat starší iPhony)

---

## 📋 KONTROLNÍ SEZNAM PRO VÁŠ PROJEKT

### Android - Co zkontrolovat/aktualizovat

- [x] **Target SDK:** 35 ✅ (splňuje)
- [x] **Compile SDK:** 35 ✅ (splňuje)
- [x] **64-bit architektury:** arm64-v8a, x86_64 ✅ (splňuje)
- [ ] **AGP verze:** ⚠️ **Nutno ověřit a aktualizovat na 8.5.1+** 🚨 KRITICKÉ (UŽ POVINNÉ)
- [ ] **NDK verze:** ⚠️ **Aktuálně 26.1.10909125, nutno aktualizovat na r28+** 🚨 KRITICKÉ (UŽ POVINNÉ)
- [ ] **16 KB page size compliance:** ⚠️ **Nutno ověřit po aktualizaci NDK a AGP** 🚨 KRITICKÉ (UŽ POVINNÉ)
- [ ] **Kontrola nativních knihoven:** ⚠️ **Ověřit, že všechny `.so` soubory jsou 16 KB aligned**
- [ ] **AAB format:** ✅ (Expo/EAS Build automaticky generuje AAB)

### iOS - Co zkontrolovat/aktualizovat

- [ ] **Xcode verze:** ⚠️ **Ověřit, že CI/build systém používá Xcode 16+** ✅ (UŽ POVINNÉ od 24.4.2025)
- [ ] **iOS SDK:** ⚠️ **Ověřit, že build používá iOS 18 SDK** ✅ (UŽ POVINNÉ od 24.4.2025)
- [ ] **Deployment Target:** ⚠️ **Ověřit nastavení** (doporučeno iOS 15+)
- [ ] **Privacy Manifest:** ⚠️ **Vytvořit a zkontrolovat `PrivacyInfo.xcprivacy`**
- [ ] **Expo SDK kompatibilita:** ⚠️ **Ověřit, že Expo SDK 51 podporuje iOS 18 SDK**

---

## 🔧 AKČNÍ KROKY PRO VÁŠ PROJEKT

### ⚠️ KRITICKÉ - Okamžitě (Android 16 KB - deadline 1.5.2026)

**16 KB page size podpora je již povinná pro nové submise od 1.11.2025!**

1. **Aktualizovat NDK na r28+** ⚠️ NUTNÉ
   ```gradle
   // android/build.gradle
   ndkVersion = "28.0.12674087" // nebo nejnovější r28+
   ```

2. **Aktualizovat Android Gradle Plugin na 8.5.1+** ⚠️ NUTNÉ
   - Ověřit aktuální verzi AGP
   - Aktualizovat v `android/build.gradle`

3. **Ověřit 16 KB compliance** ⚠️ NUTNÉ
   - Zbuildovat release AAB
   - Zkontrolovat pomocí APK Analyzer nebo bundletool
   - Testovat na Android 15 emulátoru s 16 KB page size
   - **Bez této compliance nelze publikovat nové verze targetující API 35+**

4. **Aktualizovat závislosti** ⚠️ NUTNÉ
   - Ověřit, že všechny nativní SDK/dependencies podporují 16 KB alignment
   - Aktualizovat na nejnovější verze, které tuto podporu mají

### ✅ iOS - Už povinné (od 24.4.2025)

1. **Aktualizovat build prostředí** ✅ OVĚŘIT
   - EAS Build: Ověřit, že používá Xcode 16+
   - Lokální build: Aktualizovat Xcode na verzi 16+
   - **Bez Xcode 16+ a iOS 18 SDK nelze submitovat do App Store**

2. **Vytvořit/aktualizovat Privacy Manifest** ⚠️ NUTNÉ
   - Identifikovat použité Required Reason APIs
   - Vytvořit `PrivacyInfo.xcprivacy` soubor
   - Ověřit compliance před submitem
   - **Bez privacy manifestu bude submise odmítnuta**

3. **Otestovat s iOS 18 SDK** ✅ OVĚŘIT
   - Build a test aplikace s iOS 18 SDK
   - Ověřit kompatibilitu všech funkcí

---

## 📚 ZDROJE A ODKAZY

### Google Play
- [Target API Level Requirements](https://developer.android.com/google/play/requirements/target-sdk)
- [16 KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)
- [64-bit Requirement](https://developer.android.com/games/optimize/64-bit)
- [App Bundle Overview](https://developer.android.com/appbundle)

### Apple App Store
- [Xcode Requirements](https://developer.apple.com/support/xcode/)
- [Privacy Manifest Documentation](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- [Required Reason API Categories](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files/describing_use_of_required_reason_apis)

---

## ⚠️ DŮLEŽITÉ TERMÍNY - SHRNUTÍ

| Datum | Platforma | Požadavek | Status |
|-------|-----------|-----------|--------|
| **24. dubna 2025** | iOS | Xcode 16 + iOS 18 SDK povinné | ✅ **UŽ POVINNÉ** |
| **31. srpna 2025** | Android | Target SDK 35+ povinné | ✅ **UŽ POVINNÉ** |
| **1. listopadu 2025** | Android | 16 KB page size pro nové apps/updates targetující API 35+ | ✅ **UŽ POVINNÉ** |
| **1. května 2026** | Android | 16 KB page size blokuje všechny updates | ⚠️ **PŘICHÁZÍ** (za ~3.5 měsíce) |
| **Duben 2026** | iOS | iOS 26 SDK + Xcode 26 povinné | 🔜 **BUDOUCÍ** |

---

## 🚨 KRITICKÉ POŽADAVKY K 18.1.2026

### Android - Co je již povinné:
- ✅ Target SDK 35+ (od 31.8.2025)
- ✅ 16 KB page size podpora pro nové submise targetující API 35+ (od 1.11.2025)
- ⚠️ **Do 1.5.2026:** Musíte mít 16 KB compliance, jinak nebudete moci publikovat aktualizace

### iOS - Co je již povinné:
- ✅ Xcode 16+ a iOS 18 SDK (od 24.4.2025)
- ✅ Privacy Manifest pro Required Reason APIs (od 1.5.2024)

### Co je kritické teď:
1. **Android 16 KB compliance** - bez toho nelze publikovat nové verze
2. **NDK r28+ a AGP 8.5.1+** - nutné pro 16 KB podporu
3. **iOS Privacy Manifest** - bez něj bude submise odmítnuta

---

**Poznámka:** Tento dokument reflektuje požadavky k datu 18.1.2026. Pro nejaktuálnější informace vždy konzultujte oficiální dokumentaci Google Play a Apple App Store.
