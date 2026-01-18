# NDK r28 Kompatibilita s React Native 0.74.5

**Datum:** 18. ledna 2026  
**Status:** ⚠️ NDK r28 není kompatibilní s React Native 0.74.5

---

## Problém

Při aktualizaci NDK na r28.0.12674087 (pro 16 KB page size compliance) build selhává s chybou:

```
error: implicit instantiation of undefined template 'std::char_traits<unsigned char>'
```

**Příčina:** NDK r28 obsahuje Clang 19 s novým libc++, které odstranilo fallback template pro `std::char_traits<unsigned char>`. React Native 0.74.5 a Expo SDK 51 používají Folly knihovnu, která na tento fallback spoléhá.

---

## Řešení

### ✅ Aktuální stav (vráceno zpět)

**NDK verze:** `26.1.10909125` (kompatibilní s React Native 0.74.5)  
**AGP verze:** `8.5.1` (zachováno - podporuje ZIP alignment pro 16 KB)  
**Build status:** ✅ Funguje

### ⚠️ Omezení

- **16 KB page size compliance:** ČÁSTEČNÁ
  - AGP 8.5.1 zajišťuje ZIP alignment uncompressed `.so` souborů
  - NDK r26 NEVYTVÁŘÍ nativní knihovny s 16 KB alignment automaticky
  - Některé prebuilt knihovny (např. `libc++_shared.so`) mohou být stále 4 KB aligned

### 🔄 Pro plnou 16 KB compliance

**Nutný upgrade:**
1. **React Native:** 0.77+ (má opravu pro NDK r28)
2. **Expo SDK:** 52+ (podporuje React Native 0.77)
3. **NDK:** r28+ (automatické 16 KB alignment)

**Alternativně:**
- Zůstat na NDK r26 a přidat manuální linker flags pro 16 KB alignment
- Toto NENÍ doporučeno, protože neřeší všechny prebuilt knihovny

---

## Doporučení

### Krátkodobě (okamžitě)
✅ **Zůstat na NDK r26.1.10909125** - build funguje

### Střednědobě (do 1.5.2026 - deadline 16 KB compliance)
⚠️ **Naplánovat upgrade na React Native 0.77+ / Expo SDK 52+**
- Tím získáte podporu pro NDK r28
- Plnou 16 KB page size compliance
- Budoucí kompatibilitu

### Postup upgrade
```bash
# 1. Upgrade Expo SDK
npx expo install expo@~52.0.27

# 2. Upgrade React Native
npx expo install react-native@~0.77.1

# 3. Aktualizovat NDK na r28
# V android/build.gradle:
ndkVersion = "28.0.12674087"

# 4. Regenerovat native projekty
npx expo prebuild --clean
```

---

## Technické detaily

### Proč NDK r28 selhává
- NDK r28 používá Clang 19 s novým libc++
- `std::char_traits<T>` fallback pro nestandardní typy (jako `unsigned char`) byl odstraněn
- React Native 0.74.5 / Folly používá tyto nestandardní typy

### Proč NDK r26 funguje
- NDK r26 používá starší libc++, které má fallback pro `std::char_traits<unsigned char>`
- React Native 0.74.5 je testován a podporuje NDK r26

### Co React Native 0.77+ opravuje
- Aktualizovaná Folly knihovna bez závislosti na nestandardních `char_traits`
- Podpora pro NDK r28+ a Clang 19
- Výchozí 16 KB alignment pro nativní knihovny

---

## Současná konfigurace

```gradle
// android/build.gradle
ndkVersion = "26.1.10909125"  // ✅ Kompatibilní s RN 0.74.5
buildToolsVersion = '35.0.0'  // ✅ Aktuální
targetSdkVersion = 35         // ✅ Splňuje požadavek
compileSdkVersion = 35        // ✅ Splňuje požadavek
// AGP 8.5.1 - explicitně specifikováno ✅
```

**Status:**
- ✅ Build funguje
- ✅ Target SDK 35 (splňuje požadavek)
- ⚠️ 16 KB compliance - částečná (AGP ZIP alignment, ale ne NDK ELF alignment)

---

## Timeline

| Datum | Požadavek | Status |
|-------|-----------|--------|
| 18.1.2026 | Build funguje | ✅ NDK r26 |
| 1.11.2025 | 16 KB pro nové submise | ⚠️ Částečně (AGP 8.5.1) |
| 1.5.2026 | 16 KB blokuje updates | ⚠️ Nutný upgrade na RN 0.77+ |

---

**Závěr:** Aktuální konfigurace (NDK r26 + AGP 8.5.1) umožňuje build, ale pro plnou 16 KB compliance je nutný upgrade na React Native 0.77+ / Expo SDK 52+.
