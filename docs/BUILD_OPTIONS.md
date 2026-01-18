# 🔨 Možnosti buildů aplikace

## Krátká odpověď

**NE, nemusíte dělat všechny buildy přes Expo/EAS.** Máte několik možností:

1. ✅ **Lokální buildy** (pomocí `npx expo run:android/ios`)
2. ✅ **EAS Build** (cloud build přes Expo)
3. ✅ **Přímý React Native build** (pokud byste přešli na bare workflow)

---

## 📋 Detailní vysvětlení

### Co znamená "Expo Go nefunguje"

- ❌ **Expo Go** = univerzální aplikace, která nepodporuje nativní moduly
- ✅ **Custom build** = vaše vlastní aplikace s nativními moduly (Firebase)

**To ale NENÍ totéž jako "musíte používat EAS Build"!**

---

## 🛠️ Možnost 1: Lokální buildy (doporučeno pro vývoj)

### Development buildy

```bash
# Android - vytvoří APK lokálně
npx expo run:android

# iOS - vytvoří app lokálně (pouze macOS)
npx expo run:ios
```

**Výhody:**
- ✅ Rychlé (buildujete na svém počítači)
- ✅ Žádné cloud služby
- ✅ Plná kontrola nad procesem
- ✅ Ideální pro vývoj

**Nevýhody:**
- ❌ Potřebujete Android Studio / Xcode
- ❌ Pro iOS potřebujete macOS
- ❌ Musíte řešit podpisy a certifikáty sami

### Production buildy (lokálně)

```bash
# Android - vytvoří release APK/AAB
cd android
./gradlew assembleRelease  # nebo bundleRelease pro AAB

# iOS - vytvoří IPA (pouze macOS)
cd ios
xcodebuild -workspace YourApp.xcworkspace -scheme YourApp -configuration Release
```

**Poznámka**: Expo Managed workflow automaticky generuje `android/` a `ios/` složky při prvním buildu pomocí `npx expo run:android/ios`.

---

## ☁️ Možnost 2: EAS Build (cloud build)

### Development buildy

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Production buildy

```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

**Výhody:**
- ✅ Nemusíte mít Android Studio / Xcode
- ✅ Automatické podpisy a certifikáty
- ✅ Buildy na cloudu (nevyčerpává váš počítač)
- ✅ Snadné pro CI/CD

**Nevýhody:**
- ❌ Vyžaduje Expo účet (zdarma pro development, placené pro production)
- ❌ Buildy trvají déle (cloud processing)
- ❌ Závislost na Expo službách

---

## 🔄 Kdy použít co?

### Pro vývoj (development)
```bash
# Lokální build - rychlé a pohodlné
npx expo run:android
npx expo run:ios
```

### Pro testování (preview/staging)
```bash
# EAS Build - snadné sdílení s týmem
eas build --profile preview --platform android
```

### Pro produkci (store release)
```bash
# EAS Build - doporučeno (automatické podpisy)
eas build --profile production --platform all

# NEBO lokální build (pokud máte certifikáty)
cd android && ./gradlew bundleRelease
cd ios && xcodebuild ...
```

---

## 🎯 Doporučený workflow

### Během vývoje:
1. **První build**: `npx expo run:android` (vytvoří lokální build)
2. **Další spuštění**: `npm start` (pouze Metro bundler, build už je nainstalovaný)
3. **Po změnách v nativním kódu**: znovu `npx expo run:android`

### Pro testování:
- **Interní testování**: EAS Build preview profile
- **Beta testování**: EAS Build + TestFlight (iOS) / Internal Testing (Android)

### Pro produkci:
- **Doporučeno**: EAS Build (automatické podpisy, jednodušší)
- **Pokud preferujete kontrolu**: lokální buildy

---

## 📊 Srovnání

| Aspekt | Lokální build | EAS Build |
|--------|---------------|-----------|
| **Rychlost** | Rychlé | Pomalejší (cloud) |
| **Náklady** | Zdarma | Zdarma (dev), placené (prod) |
| **Požadavky** | Android Studio / Xcode | Expo účet |
| **Podpisy** | Ruční nastavení | Automatické |
| **CI/CD** | Vlastní setup | Integrované |
| **Kontrola** | Plná | Omezená |

---

## 🔧 Hybridní přístup

Můžete kombinovat oba přístupy:

```bash
# Vývoj: lokální buildy
npx expo run:android

# Testování: EAS Build
eas build --profile preview

# Produkce: EAS Build (nebo lokální, podle preferencí)
eas build --profile production
```

---

## ❓ Časté otázky

### Musím používat EAS Build?
**Ne.** Můžete buildovat lokálně pomocí `npx expo run:android/ios`.

### Můžu buildovat produkční APK/IPA lokálně?
**Ano.** Po prvním `npx expo run:android/ios` se vytvoří `android/` a `ios/` složky, které můžete použít pro standardní React Native buildy.

### Co když nechci používat Expo vůbec?
Můžete přejít na **bare workflow** (eject), ale pak ztratíte výhody Expo Managed workflow. Pro Firebase moduly to není nutné.

### Jsou EAS Buildy zdarma?
- **Development buildy**: zdarma (s limity)
- **Production buildy**: placené (ale můžete buildovat lokálně zdarma)

---

## 📚 Shrnutí

**NEMUSÍTE** dělat všechny buildy přes Expo/EAS. Máte volbu:

1. ✅ **Lokální buildy** - rychlé, zdarma, plná kontrola
2. ✅ **EAS Build** - pohodlné, automatické, cloud-based

**Doporučení**: 
- Pro vývoj: lokální buildy (`npx expo run:android/ios`)
- Pro produkci: podle preferencí (EAS Build je jednodušší, lokální buildy dávají více kontroly)

