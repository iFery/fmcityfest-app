# 🚨 Kritické úkoly před spuštěním do testování

## ⚠️ BLOKUJÍCÍ - Musí být hotovo před externím testováním

### 1. Android Release Signing (KRITICKÉ)
**Problém:** Release buildy používají debug keystore - bezpečnostní riziko  
**Řešení:**
- [ ] Vytvořit production keystore:
  ```bash
  keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore \
    -alias fmcityfest-release -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Upravit `android/app/build.gradle` - přidat release signing config
- [ ] Přidat keystore do `.gitignore` (nesmí být v gitu!)
- [ ] Nastavit EAS Secrets pro keystore credentials
- [ ] Otestovat release build lokálně

**Soubor:** `android/app/build.gradle` (řádky 120-140)

---

### 2. iOS Push Notifications - Production Entitlements (KRITICKÉ)
**Problém:** Entitlements nastavené na `development` - notifikace nebudou fungovat v produkci  
**Řešení:**
- [ ] Vytvořit production entitlements soubor nebo upravit stávající
- [ ] Změnit `aps-environment` z `development` na `production` pro release buildy
- [ ] Nastavit build configurations (Debug vs Release) s různými entitlements
- [ ] Otestovat push notifikace v release buildu

**Soubor:** `ios/FMCityFest/FMCityFest.entitlements` (řádek 6)

---

### 3. Environment Variables / Konfigurace (KRITICKÉ)
**Problém:** API URL a další hodnoty jsou hardcodované v kódu  
**Řešení:**
- [ ] Vytvořit `app.config.js` místo `app.json` pro dynamickou konfiguraci
- [ ] Přesunout API URL do environment variables
- [ ] Nastavit EAS Secrets pro production hodnoty
- [ ] Vytvořit `.env.example` jako template
- [ ] Upravit `src/api/client.ts` - použít `Constants.expoConfig?.extra?.apiUrl`

**Soubory:**
- `app.json` → převést na `app.config.js`
- `src/api/client.ts` (řádek 36-37)

---

### 4. Firebase Production Setup (KRITICKÉ)
**Problém:** Stejný Firebase projekt pro dev i production  
**Řešení:**
- [ ] Vytvořit samostatný Firebase projekt pro production
- [ ] Stáhnout production `google-services.json` a `GoogleService-Info.plist`
- [ ] Nastavit podmíněné načítání podle environmentu
- [ ] Otestovat Firebase služby (FCM, Remote Config, Crashlytics) v production buildu

**Soubory:**
- `google-services.json` (production verze)
- `GoogleService-Info.plist` (production verze)
- `src/services/firebase.ts`

---

### 5. ProGuard/R8 Obfuskace (DŮLEŽITÉ)
**Problém:** ProGuard je vypnutý - kód není obfuskovaný  
**Řešení:**
- [ ] Zapnout ProGuard pro release buildy v `build.gradle`
- [ ] Otestovat, že aplikace funguje s obfuskovaným kódem
- [ ] Přidat ProGuard rules pro Firebase a další knihovny

**Soubor:** `android/app/build.gradle` (řádek 137)

---

## 📋 DŮLEŽITÉ - Mělo by být hotovo před produkčním spuštěním

### 6. Test Coverage
- [ ] Rozšířit unit testy (cíl: 60%+ coverage)
- [ ] Přidat E2E testy pro kritické flow (Detox je už nakonfigurovaný)
- [ ] Otestovat offline funkcionalitu
- [ ] Otestovat update flow (forced/optional)

### 7. CI/CD Pipeline
- [ ] Nastavit GitHub Actions / GitLab CI
- [ ] Automatizovat testy na PR
- [ ] Automatizovat buildy na tag
- [ ] Nastavit automatické uploady do TestFlight/Play Store

### 8. Code Quality
- [ ] Přidat ESLint + Prettier konfiguraci
- [ ] Opravit všechny linting errory
- [ ] Nastavit pre-commit hooks (Husky)
- [ ] Přidat `.editorconfig`

### 9. App Store / Play Store Setup
- [ ] Vytvořit App Store Connect listing
- [ ] Připravit screenshots a popisky
- [ ] Nastavit TestFlight
- [ ] Nastavit Google Play Console (Internal Testing track)
- [ ] Otestovat buildy v TestFlight a Play Store

---

## ⏱️ Prioritizace

### Týden 1 (BLOKUJÍCÍ):
1. ✅ Android Release Signing
2. ✅ iOS Production Entitlements  
3. ✅ Environment Variables
4. ✅ Firebase Production Setup

### Týden 2 (DŮLEŽITÉ):
5. ✅ ProGuard
6. ✅ Test Coverage
7. ✅ CI/CD

### Týden 3 (PŘED SPUŠTĚNÍM):
8. ✅ Code Quality
9. ✅ Store Setup
10. ✅ Final Testing

---

## 🔗 Odkazy na konkrétní soubory

**Android Build:**
- `android/app/build.gradle` - řádky 120-140 (signing), 137 (ProGuard)

**iOS Config:**
- `ios/FMCityFest/FMCityFest.entitlements` - řádek 6
- `ios/FMCityFest/Info.plist` - version numbers

**API Client:**
- `src/api/client.ts` - řádek 36-37 (API URL)

**Firebase:**
- `src/services/firebase.ts` - inicializace
- `google-services.json` (root)
- `GoogleService-Info.plist` (root)

**EAS Config:**
- `eas.json` - přidat environment variables

---

## 📝 Rychlý checklist před prvním testováním

- [ ] Android release build funguje s production keystore
- [ ] iOS release build má production entitlements
- [ ] Push notifikace fungují v release buildu
- [ ] API URL je v environment variables
- [ ] Firebase production projekt je nastaven
- [ ] Buildy jsou otestované lokálně
- [ ] Aplikace se spustí offline (cache funguje)
- [ ] Update flow funguje (forced/optional)
- [ ] Crashlytics reportuje errory
- [ ] Remote Config funguje

**Po splnění těchto bodů je aplikace připravena pro interní testování!**

