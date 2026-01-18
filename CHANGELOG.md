# Changelog

## [1.0.0] - 2026-01-03

### Přidáno
- ✅ Firebase konfigurační soubory (`google-services.json`, `GoogleService-Info.plist`)
- ✅ Aktualizace Remote Config služby se skutečnými parametry z Firebase:
  - `update_message` - Zpráva o aktualizaci aplikace
  - `min_required_version` - Minimální požadovaná verze
  - `min_app_version` - Minimální verze aplikace
  - `latest_app_version` - Nejnovější verze aplikace
  - `force_update_enabled` - Povolení vynucené aktualizace
  - `update_required_message` - Zpráva o nutnosti aktualizace
  - `update_button_label` - Text tlačítka aktualizace
  - `app_update_url_android` - URL pro stažení APK
  - `chat_icon_allowed` - Povolení ikony chatu
  - `chat_url` - URL chatu (Smartsupp)
- ✅ Rozšířená obrazovka Nastavení s zobrazením Remote Config hodnot pro testování

### Změněno
- Remote Config defaultní hodnoty aktualizovány podle produkčního Firebase projektu

### Poznámky
- Všechny Remote Config parametry jsou nyní správně nakonfigurovány
- Firebase konfigurační soubory jsou připraveny pro build
- Obrazovka Nastavení nyní zobrazuje více Remote Config hodnot pro snadné testování






