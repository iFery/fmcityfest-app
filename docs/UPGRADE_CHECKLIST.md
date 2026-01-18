# ✅ Pre-Upgrade Checklist

**Datum:** 18. ledna 2026  
**Cíl:** Expo SDK 51 → SDK 52 / React Native 0.77  
**Status:** 🔴 Před začátkem upgrade  

---

## 📋 CHECKLIST PŘED UPGRADE

### 1. Backup a Git
- [ ] Všechny změny jsou commitnuty do git
- [ ] Vytvořena backup branch: `git branch backup-pre-upgrade-$(date +%Y%m%d)`
- [ ] Aktuální stav je tagován: `git tag pre-upgrade-sdk51`

### 2. Testování aktuálního stavu
- [ ] Lokální build funguje: `npm run run:android`
- [ ] EAS build funguje: `eas build --profile development --platform android`
- [ ] Aplikace se spustí bez problémů
- [ ] Všechny funkce fungují (Firebase, Navigation, Notifications)
- [ ] Testy procházejí: `npm test`

### 3. Dependency kontrola
- [ ] Spuštěn `npx expo-doctor@latest` - žádné kritické problémy
- [ ] Ověřena kompatibilita React Native Firebase s RN 0.77
- [ ] Ověřena kompatibilita všech nativních knihoven
- [ ] Zkontrolovány breaking changes v závislostech

### 4. Dokumentace
- [ ] Přečten [UPGRADE_PLAN.md](./UPGRADE_PLAN.md)
- [ ] Přečten [TEST_BUILD.md](./TEST_BUILD.md)
- [ ] Přečten [NDK_COMPATIBILITY_ISSUE.md](./NDK_COMPATIBILITY_ISSUE.md)
- [ ] Rozumím rizikům a postupu

### 5. Časový plán
- [ ] Naplánován čas na upgrade (min. 2-4 hodiny)
- [ ] Máte čas na testování po upgrade
- [ ] Máte čas na řešení případných problémů

---

## 🚨 KRITICKÉ OVĚŘENÍ

### Expo Go vs Development Build
- [ ] ⚠️ **DŮLEŽITÉ:** RN 0.77 NEPODPORUJE Expo Go!
- [ ] ✅ Projekt už používá `expo-dev-client` (OK)
- [ ] ✅ Používáte development build (OK)

### Breaking Changes
- [ ] iOS minimum deployment target: 13.4 → **15.1** (budete upgradovat)
- [ ] Android minSdkVersion: 23 → **24** (budete upgradovat)
- [ ] Android compileSdkVersion: 34 → **35** (✅ už máte)

---

## 📊 AKTUÁLNÍ STAV

Vyplňte před začátkem upgrade:

### Verze
- **Expo SDK:** `51.0.0` → cíl: `52.0.27+`
- **React Native:** `0.74.5` → cíl: `0.77.1`
- **NDK:** `26.1.10909125` → cíl: `28.0.12674087`
- **AGP:** `8.5.1` → cíl: `8.5.1+` (zachováno)

### Build Status
- **Lokální build:** ✅ / ❌
- **EAS build:** ✅ / ❌
- **Aplikace funguje:** ✅ / ❌

### Testy
- **Unit testy:** ✅ / ❌ (`npm test`)
- **Expo doctor:** ✅ / ❌ (`npx expo-doctor@latest`)

---

## 🔄 VARIANTY UPGRADE

### Varianta A: Postupný upgrade (DOPORUČENO)
1. **Fáze 1:** Expo SDK 52 + RN 0.76
2. **Fáze 2:** RN 0.77 + NDK r28

**Výhody:**
- ✅ Menší riziko
- ✅ Snazší debug
- ✅ Postupný přechod

### Varianta B: Přímý upgrade
1. **Fáze 1:** Expo SDK 52 + RN 0.77 + NDK r28 najednou

**Výhody:**
- ✅ Rychlejší
- ❌ Větší riziko problémů

---

## 📝 POZNÁMKY

### Kdy NEPOKRAČOVAT
- ❌ Pokud máte nestabilní build před upgrade
- ❌ Pokud máte kritické problémy s aktuální verzí
- ❌ Pokud nemáte čas na testování
- ❌ Pokud nemáte backup

### Kdy POKRAČOVAT
- ✅ Všechny checky jsou splněny
- ✅ Máte dostatek času
- ✅ Máte backup
- ✅ Rozumíte postupu

---

## 🎯 START UPGRADE

Když jsou všechny checky splněny:

1. **Fáze 1 (SDK 52 + RN 0.76):**
   ```bash
   # Vytvořit branch pro upgrade
   git checkout -b upgrade/expo-sdk-52-rn-0.76
   
   # Postupovat podle UPGRADE_PLAN.md - Fáze 1
   ```

2. **Fáze 2 (RN 0.77 + NDK r28):**
   ```bash
   # Po úspěšném dokončení Fáze 1
   git checkout -b upgrade/rn-0.77-ndk-r28
   
   # Postupovat podle UPGRADE_PLAN.md - Fáze 2
   ```

---

## 📞 PODPORA

Pokud narazíte na problémy:
1. Zkontrolujte [UPGRADE_PLAN.md](./UPGRADE_PLAN.md) - sekce "ŘEŠENÍ PROBLÉMŮ"
2. Zkontrolujte [Expo upgrade docs](https://docs.expo.dev/bare/upgrade/)
3. Spusťte `npx expo-doctor@latest` pro detekci problémů

---

**Datum vytvoření:** 18. ledna 2026  
**Status:** 🔴 Před upgrade
