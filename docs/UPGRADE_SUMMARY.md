# 📚 Upgrade Summary - Quick Reference

**Datum:** 18. ledna 2026  
**Quick reference pro upgrade Expo SDK 51 → SDK 52 / React Native 0.77**

---

## 🎯 Cíl

Upgrade na Expo SDK 52+ / React Native 0.77+ pro:
- ✅ Plnou 16 KB page size compliance (deadline 1.5.2026)
- ✅ Podporu NDK r28+
- ✅ Budoucí kompatibilitu

---

## 📋 Rychlý přehled

### Dokumentace
1. **[UPGRADE_CHECKLIST.md](./UPGRADE_CHECKLIST.md)** - Pre-upgrade checklist
2. **[UPGRADE_PLAN.md](./UPGRADE_PLAN.md)** - Detailní upgrade postup
3. **[TEST_BUILD.md](./TEST_BUILD.md)** - Testovací postup
4. **[NDK_COMPATIBILITY_ISSUE.md](./NDK_COMPATIBILITY_ISSUE.md)** - Kontext problému

### Scripty
1. **`scripts/test-build.sh`** - Testovací script pro build

---

## 🚀 Rychlý Start

### Před upgrade
```bash
# 1. Otestovat aktuální build
./scripts/test-build.sh

# 2. Zkontrolovat kompatibilitu
npx expo-doctor@latest

# 3. Vytvořit backup
git checkout -b backup-pre-upgrade-$(date +%Y%m%d)
git add .
git commit -m "Backup before upgrade"
```

### Postupný upgrade (doporučeno)

#### Fáze 1: Expo SDK 52 + RN 0.76
```bash
# Upgrade Expo SDK
npx expo install expo@~52.0.27 --fix

# Aktualizace závislostí
npx expo install --fix

# Regenerace nativních projektů
npx expo prebuild --clean

# Testování
npm run run:android
eas build --profile development --platform android
```

#### Fáze 2: RN 0.77 + NDK r28
```bash
# Upgrade React Native 0.77
npx expo install react-native@~0.77.1

# Aktualizace kritických závislostí
npx expo install \
  react-native-reanimated@~3.16.7 \
  react-native-gesture-handler@~2.22.0 \
  react-native-screens@~4.8.0 \
  react-native-safe-area-context@~5.1.0

# Aktualizace NDK na r28
# V android/build.gradle změnit:
# ndkVersion = "28.0.12674087"

# Regenerace nativních projektů
rm -rf android ios
npx expo prebuild --clean

# Testování
npm run run:android
eas build --profile production --platform android
```

---

## ⚠️ DŮLEŽITÉ UPOZORNĚNÍ

### Expo Go
- ❌ **RN 0.77 NEPODPORUJE Expo Go!**
- ✅ Použijte development build (už máte `expo-dev-client`)

### Breaking Changes
- iOS minimum deployment target: **13.4 → 15.1**
- Android minSdkVersion: **23 → 24**
- Metro logging: RN 0.77 odstraňuje console.log streaming

---

## 🔧 Testování

### Build test
```bash
# Lokální build
npm run run:android

# EAS build
eas build --profile development --platform android

# Production build
eas build --profile production --platform android
```

### 16 KB Compliance test (po NDK r28)
```bash
# Vytvořit release AAB
eas build --profile production --platform android

# Ověřit compliance (viz TEST_BUILD.md)
```

---

## 📊 Aktuální vs Cílový stav

| Parametr | Aktuální | Cíl | Status |
|----------|----------|-----|--------|
| Expo SDK | 51.0.0 | 52.0.27+ | 🔄 |
| React Native | 0.74.5 | 0.77.1 | 🔄 |
| NDK | r26.1.10909125 | r28.0.12674087 | 🔄 |
| AGP | 8.5.1 | 8.5.1+ | ✅ |
| Target SDK | 35 | 35 | ✅ |
| 16 KB compliance | ⚠️ Částečná | ✅ Plná | 🔄 |

---

## 🐛 Troubleshooting

### Časté problémy

1. **Build selže**
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx expo prebuild --clean
   ```

2. **Metro bundler chyby**
   ```bash
   npm start -- --reset-cache
   ```

3. **Inkompatibilní knihovny**
   ```bash
   npx expo-doctor@latest
   npx expo install <package>@latest
   ```

4. **Expo Go nefunguje (RN 0.77)**
   - ✅ Očekávané! Použijte development build.

Více v [UPGRADE_PLAN.md](./UPGRADE_PLAN.md) - sekce "ŘEŠENÍ PROBLÉMŮ".

---

## ✅ Post-Upgrade Checklist

Po dokončení upgrade ověřte:
- [ ] Build projde bez chyb
- [ ] Aplikace se spustí
- [ ] Firebase funguje
- [ ] Navigation funguje
- [ ] Push notifikace fungují
- [ ] 16 KB compliance ověřena (pro NDK r28)
- [ ] Testy procházejí
- [ ] Expo doctor nehlásí problémy

---

## 📅 Doporučený timeline

### Postupný upgrade (bezpečnější)
- **Týden 1:** Fáze 1 (SDK 52 + RN 0.76) - testování
- **Týden 2:** Fáze 2 (RN 0.77 + NDK r28) - testování
- **Týden 3:** Finální testování a produkční build

### Rychlý upgrade (pokud máte čas)
- **Den 1:** Fáze 1 + Fáze 2
- **Den 2-3:** Fixy a testování
- **Den 4:** Produkční build

---

## 🔗 Užitečné odkazy

- [Expo SDK 52 Changelog](https://expo.dev/changelog/2024-11-12-sdk-52)
- [React Native 0.77 Release Notes](https://reactnative.dev/blog/2025/01/21/version-0.77)
- [Expo Upgrade Guide](https://docs.expo.dev/bare/upgrade/)
- [Android 16 KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)

---

## 📝 Poznámky

- Postupný upgrade je **bezpečnější** - doporučeno
- RN 0.77 vyžaduje **development build** (ne Expo Go)
- Testujte každou fázi před pokračováním
- Vždy mějte **backup** před začátkem upgrade

---

**Datum vytvoření:** 18. ledna 2026  
**Verze:** 1.0
