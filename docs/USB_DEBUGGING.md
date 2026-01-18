# 📱 Spuštění aplikace na Android zařízení přes USB

Tento návod popisuje, jak spustit aplikaci na fyzickém Android zařízení připojeném přes USB kabel.

## 🔧 Krok 1: Příprava zařízení

### 1.1 Povolení USB Debuggingu

1. **Otevřete Nastavení** na Android zařízení
2. Přejděte na **O telefonu** (About phone)
3. Najděte **Číslo sestavení** (Build number)
4. **Klepejte 7x** na "Číslo sestavení" dokud se nezobrazí zpráva "Jste nyní vývojář"
5. Vraťte se do **Nastavení**
6. Otevřete **Možnosti pro vývojáře** (Developer options)
7. Zapněte **USB ladění** (USB debugging)
8. (Volitelné) Zapněte **Zůstat vzhůru** (Stay awake) - užitečné pro vývoj

### 1.2 Připojení zařízení

1. Připojte Android zařízení k počítači pomocí **USB kabelu**
2. Na zařízení se zobrazí dialog "Povolit USB ladění?"
3. Zaškrtněte **"Vždy povolit z tohoto počítače"**
4. Klikněte na **"Povolit"**

## 🔍 Krok 2: Ověření připojení

Otevřete terminál a zkontrolujte, že je zařízení rozpoznáno:

```bash
adb devices
```

Měli byste vidět něco jako:
```
List of devices attached
ABC123XYZ    device
```

Pokud vidíte `unauthorized`, klikněte na zařízení a povolte USB debugging znovu.

## 🚀 Krok 3: Spuštění aplikace

### Možnost A: První build (vytvoří a nainstaluje aplikaci)

```bash
# Z kořenového adresáře projektu
npx expo run:android
```

Tento příkaz:
- Vytvoří development build
- Nainstaluje aplikaci na připojené zařízení
- Spustí Metro bundler
- Otevře aplikaci

### Možnost B: Pokud už máte build nainstalovaný

```bash
# Spusťte Metro bundler
npm start

# V jiném terminálu nebo po spuštění Metro:
# Otevřete aplikaci na zařízení ručně
# Nebo použijte:
adb shell am start -n com.fmcityfest.app/.MainActivity
```

## 🔄 Krok 4: Práce s aplikací

### Reload aplikace

- **Zatřeste zařízením** → zobrazí se dev menu
- Vyberte **"Reload"**
- Nebo stiskněte `R` v terminálu s Metro bundlerem

### Zobrazení logů

```bash
# Všechny logy
adb logcat

# Pouze React Native logy
adb logcat | grep -i "react\|error\|exception"

# Pouze logy vaší aplikace
adb logcat | grep "com.fmcityfest.app"
```

### Zastavení aplikace

```bash
# Zastavte Metro bundler: Ctrl+C v terminálu
# Nebo ukončete aplikaci na zařízení
```

## 🐛 Řešení problémů

### Zařízení není rozpoznáno

```bash
# Restart ADB serveru
adb kill-server
adb start-server
adb devices
```

### "Device unauthorized"

1. Odpojte a znovu připojte USB kabel
2. Na zařízení znovu povolte USB debugging
3. Zkontrolujte: `adb devices`

### Aplikace se nespustí

```bash
# Zkontrolujte, zda je aplikace nainstalovaná
adb shell pm list packages | grep fmcityfest

# Pokud není, vytvořte build znovu
npx expo run:android

# Zkontrolujte logy pro chyby
adb logcat | grep -i "error\|exception\|crash"
```

### "INSTALL_FAILED_VERSION_DOWNGRADE" chyba

Pokud vidíte chybu `Downgrade detected: Update version code X is older than current Y`:

```bash
# Odinstalujte starou aplikaci
adb uninstall com.fmcityfest.app

# Nebo pro konkrétní zařízení
adb -s <DEVICE_ID> uninstall com.fmcityfest.app

# Pak znovu spusťte build
npx expo run:android
```

**Příčina**: Na zařízení je nainstalovaná novější verze aplikace (vyšší version code) než ta, kterou se snažíte nainstalovat. Android neumožňuje downgrade bez explicitního povolení.

### Metro bundler se nepřipojí

```bash
# Zkontrolujte, že Metro běží na portu 8081
lsof -i :8081

# Pokud ne, restartujte Metro
npm start

# Na zařízení zkontrolujte, že je správná IP adresa
# V dev menu: Settings → Debug server host & port
# Mělo by být: localhost:8081 nebo IP vašeho počítače:8081
```

### Forward portu (pokud je potřeba)

```bash
# Forward portu Metro bundleru
adb reverse tcp:8081 tcp:8081
```

## 📋 Rychlý checklist

- [ ] USB debugging povolen na zařízení
- [ ] Zařízení připojeno přes USB
- [ ] `adb devices` zobrazuje zařízení jako "device"
- [ ] Development build vytvořen a nainstalován (`npx expo run:android`)
- [ ] Metro bundler běží (`npm start`)
- [ ] Aplikace se otevře na zařízení

## 💡 Tipy

1. **První build trvá déle** - může to trvat 5-10 minut
2. **Použijte kvalitní USB kabel** - některé kabely podporují pouze nabíjení
3. **Zkontrolujte USB režim** - na zařízení by měl být "File Transfer" nebo "MTP"
4. **Wi-Fi debugging** (Android 11+):
   ```bash
   # Po prvním USB připojení můžete přepnout na Wi-Fi
   adb tcpip 5555
   adb connect <IP_ADRESA_ZAŘÍZENÍ>:5555
   ```

## 🔗 Užitečné příkazy

```bash
# Seznam všech zařízení
adb devices

# Restart ADB
adb kill-server && adb start-server

# Instalace APK (pokud máte APK soubor)
adb install path/to/app.apk

# Odinstalace aplikace
adb uninstall com.fmcityfest.app

# Zobrazení logů v reálném čase
adb logcat -c && adb logcat

# Screenshot zařízení
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

---

**Poznámka**: Pro první spuštění musíte vytvořit development build (`npx expo run:android`), protože aplikace používá nativní Firebase moduly, které nejsou podporovány v Expo Go.

