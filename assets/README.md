# Assets

Tento adresář obsahuje statické soubory aplikace.

## ⚠️ Důležité

**Současné obrázky jsou pouze placeholdery!** Pro produkci je nutné je nahradit skutečnými obrázky.

## Požadované soubory

Pro správné fungování aplikace potřebujete následující soubory:

### Ikony a obrázky

- `icon.png` (1024x1024) - Ikona aplikace
- `splash.png` (1284x2778) - Splash screen
- `adaptive-icon.png` (1024x1024) - Android adaptive icon
- `favicon.png` (48x48) - Web favicon
- `notification-icon.png` (96x96) - Ikona pro notifikace

### Generování ikon

Můžete použít online nástroje nebo Expo CLI:

```bash
# Expo má vestavěný nástroj pro generování ikon
npx expo install @expo/image-utils
```

Nebo použijte:
- [App Icon Generator](https://www.appicon.co/)
- [Icon Kitchen](https://icon.kitchen/)
- [Figma](https://www.figma.com/) - pro vlastní design

## Poznámky

- Všechny ikony by měly mít transparentní pozadí (kromě splash screen)
- Splash screen by měl mít bílé pozadí podle `app.json`
- Ikony by měly být ve vysokém rozlišení pro lepší kvalitu na různých zařízeních
- Adaptive icon pro Android by měl mít důležitý obsah ve středu (okraje mohou být oříznuty)

## Aktuální stav

✅ Všechny požadované soubory existují jako placeholdery
⚠️ Pro produkci nahraďte tyto soubory skutečnými obrázky s logem/designem aplikace

