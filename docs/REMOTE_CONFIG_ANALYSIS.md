# Analýza práce s Remote Config v aplikaci

## Přehled

Aplikace používá Firebase Remote Config pro dynamickou konfiguraci bez nutnosti aktualizace aplikace. Tento dokument popisuje, jak přesně funguje načítání, cache a použití Remote Config hodnot.

## 1. Inicializace

### 1.1 Nastavení fetch intervalu

V `src/services/firebase.ts` se při inicializaci Firebase nastavuje minimální interval pro fetch:

```33:35:src/services/firebase.ts
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: 3600000, // 1 hodina
      });
```

**Význam:** Toto nastavení říká Firebase SDK, že mezi jednotlivými fetch operacemi musí být minimálně 1 hodina. Pokud aplikace zavolá `fetch()` dříve, SDK automaticky vrátí cacheované hodnoty místo skutečného fetchu ze serveru.

### 1.2 Inicializace v BootstrapProvider

Remote Config se inicializuje při startu aplikace v `BootstrapProvider`:

```104:111:src/providers/BootstrapProvider.tsx
        // Initialize Remote Config (skip fetch if no internet)
        try {
          await remoteConfigService.initialize(!isInternetReachable);
          if (!isMounted || abortController.signal.aborted) return;
          crashlyticsService.log('Remote Config initialized');
        } catch (rcError) {
          console.warn('Remote Config initialization failed:', rcError);
        }
```

**Logika:**
- Pokud **NENÍ** internet → `initialize(true)` → pouze nastaví defaultní hodnoty, **NEfetchuje** ze serveru
- Pokud **JE** internet → `initialize(false)` → nastaví defaultní hodnoty a **fetchne** ze serveru

### 1.3 Proces inicializace

```31:48:src/services/remoteConfig.ts
  async initialize(skipFetch: boolean = false): Promise<void> {
    try {
      await remoteConfig().setDefaults(this.defaultConfig);
      if (!skipFetch) {
        await this.fetchAndActivate();
      } else {
        console.log('Remote Config initialized with defaults only (skipping fetch)');
      }
    } catch (error) {
      console.error('Error initializing Remote Config:', error);
      try {
        crashlytics().recordError(error as Error);
      } catch (e) {
        // Crashlytics možná ještě není inicializován
        console.error('Could not record error to Crashlytics:', e);
      }
    }
  }
```

**Kroky:**
1. Nastaví defaultní hodnoty pomocí `setDefaults()` - tyto hodnoty jsou vždy dostupné, i když není internet
2. Pokud `skipFetch = false`, zavolá `fetchAndActivate()`

## 2. Fetch a aktivace

### 2.1 Metoda fetchAndActivate()

```53:64:src/services/remoteConfig.ts
  async fetchAndActivate(): Promise<boolean> {
    try {
      await remoteConfig().fetch();
      const activated = await remoteConfig().activate();
      console.log('Remote Config activated:', activated);
      return activated;
    } catch (error) {
      console.error('Error fetching Remote Config:', error);
      crashlytics().recordError(error as Error);
      return false;
    }
  }
```

**Co se děje:**
1. `fetch()` - Stáhne nejnovější hodnoty ze serveru Firebase Remote Config
   - Pokud od posledního fetchu uběhlo méně než 1 hodina (díky `minimumFetchIntervalMillis`), SDK automaticky použije cache
   - Pokud není internet, fetch selže (ale aplikace to zvládne díky defaultním hodnotám)
2. `activate()` - Aktivuje stažené hodnoty, aby byly k dispozici pro čtení
   - Vrací `boolean` - `true` pokud byly aktivovány nové hodnoty, `false` pokud už byly aktivovány dříve

### 2.2 Kdy se fetchuje?

**Pouze při startu aplikace:**
- Remote Config se fetchuje **JEDNOU** při inicializaci aplikace (v `BootstrapProvider`)
- **NEexistuje** žádné periodické refreshování nebo background fetch
- Pokud uživatel neukončí aplikaci, hodnoty zůstanou stejné po celou dobu běhu aplikace

**Respektování fetch intervalu:**
- I když by aplikace zavolala `fetch()` vícekrát, Firebase SDK automaticky použije cache, pokud od posledního fetchu neuplynula 1 hodina
- Toto je řízeno `minimumFetchIntervalMillis: 3600000` nastavením

## 3. Cache mechanismus

### 3.1 Jak Firebase Remote Config cacheuje

Firebase Remote Config SDK má **vlastní interní cache mechanismus**:

1. **Lokální cache na zařízení:**
   - Po úspěšném `fetch()` a `activate()` se hodnoty uloží lokálně na zařízení
   - Tyto hodnoty jsou dostupné i při dalším spuštění aplikace (před novým fetch)

2. **Defaultní hodnoty:**
   - Vždy dostupné díky `setDefaults()`
   - Použijí se, pokud:
     - Není internet (a cache ještě neexistuje)
     - Fetch selže
     - Hodnota neexistuje v Remote Config

3. **Respektování fetch intervalu:**
   - Pokud aplikace zavolá `fetch()` více než jednou za hodinu, SDK vrátí cache místo skutečného fetchu

### 3.2 Priority hodnot

Při čtení hodnot se používá následující priorita:

1. **Remote hodnoty** (z fetch + activate) - pokud existují a jsou aktivované
2. **Cacheované hodnoty** - pokud existují lokální cacheované hodnoty
3. **Defaultní hodnoty** - pokud žádná z výše uvedených není dostupná

## 4. Čtení hodnot

### 4.1 Synchronní metody

Všechny metody pro čtení hodnot jsou **synchronní** (nejsou async):

```69:76:src/services/remoteConfig.ts
  getString(key: string, defaultValue: string = ''): string {
    try {
      return remoteConfig().getValue(key).asString();
    } catch (error) {
      console.error(`Error getting Remote Config string for key ${key}:`, error);
      return defaultValue;
    }
  }
```

**Dostupné metody:**
- `getString(key, defaultValue)` - pro string hodnoty
- `getBoolean(key, defaultValue)` - pro boolean hodnoty (podporuje i string "true"/"false")
- `getNumber(key, defaultValue)` - pro number hodnoty
- `getAll()` - vrátí všechny remote hodnoty (ne defaultní)

### 4.2 Místa použití

Remote Config se používá v následujících místech:

1. **UpdateService** (`src/services/updateService.ts`):
   - `latest_app_version`
   - `min_required_version`
   - `force_update_enabled`
   - `update_whats_new`

2. **HomeScreen** (`src/screens/HomeScreen.tsx`):
   - `festival_edition`
   - `festival_date_from`
   - `festival_date_to`

3. **DebugScreen** (`src/screens/DebugScreen.tsx`):
   - Zobrazení všech remote hodnot pro testování

## 5. Offline chování

### 5.1 Scénář: Aplikace spuštěna bez internetu

1. `BootstrapProvider` zjistí, že není internet
2. Zavolá `remoteConfigService.initialize(true)` (skipFetch = true)
3. Nastaví pouze defaultní hodnoty, **NEfetchuje** ze serveru
4. Aplikace pokračuje s defaultními hodnotami
5. Všechny `getString()`, `getBoolean()` atd. vrací defaultní hodnoty

### 5.2 Scénář: Aplikace spuštěna s internetem, pak ztratí internet

1. Při startu se fetchne a aktivují hodnoty ze serveru
2. Hodnoty jsou cacheované lokálně
3. Pokud aplikace ztratí internet během běhu:
   - Hodnoty zůstávají dostupné (jsou v cache)
   - Všechny čtení hodnot fungují normálně
   - Nové fetch by selhalo, ale žádné se neprovádí

### 5.3 Scénář: Aplikace restartována s cache, ale bez internetu

1. Při předchozím spuštění se úspěšně fetchlo a aktivovaly hodnoty
2. Tyto hodnoty jsou cacheované lokálně na zařízení
3. Při novém spuštění bez internetu:
   - Firebase SDK automaticky použije cacheované hodnoty (pokud existují)
   - Pokud cache neexistuje, použijí se defaultní hodnoty

## 6. Shrnutí - Klíčové body

### ✅ Kdy a jak často se načítá:

- **Kdy:** Pouze při startu aplikace (v `BootstrapProvider`)
- **Jak často:** JEDNOU při inicializaci, pak už se nenačítá během běhu aplikace
- **Respektování intervalu:** Firebase SDK automaticky použije cache, pokud by fetch probíhal více než jednou za hodinu

### ✅ Logika s načítáním:

1. **Při startu s internetem:**
   - Nastaví defaultní hodnoty
   - Fetchne hodnoty ze serveru
   - Aktivuje je pro použití

2. **Při startu bez internetu:**
   - Nastaví pouze defaultní hodnoty
   - Skipuje fetch (není internet)
   - Použije defaultní hodnoty

3. **Během běhu aplikace:**
   - Žádné další fetch operace
   - Hodnoty zůstávají stejné jako při inicializaci

### ✅ Cache:

1. **Firebase SDK interní cache:**
   - Automaticky cacheuje hodnoty po `fetch()` + `activate()`
   - Persistuje mezi restartami aplikace
   - Respektuje `minimumFetchIntervalMillis` (1 hodina)

2. **Defaultní hodnoty:**
   - Vždy dostupné díky `setDefaults()`
   - Fallback pokud není internet nebo fetch selže

3. **Priorita:**
   - Remote hodnoty (pokud aktivované) > Cache > Defaultní hodnoty

### ⚠️ Důležité poznámky:

1. **Žádné background refreshování:** Hodnoty se neaktualizují automaticky během běhu aplikace
2. **Nutnost restartu:** Pro získání nových hodnot z Remote Config je nutné restartovat aplikaci
3. **Fetch interval:** I kdyby se fetch volal vícekrát, SDK použije cache pokud neuplynula 1 hodina
4. **Offline-first:** Aplikace funguje i offline díky defaultním hodnotám a cache

## 7. Možná vylepšení (pouze návrhy)

Pokud by bylo potřeba v budoucnu:

1. **Background fetch:** Přidat listener na změny internetového připojení a fetchovat při obnovení
2. **Periodické refresh:** Přidat mechanismus pro pravidelné fetch (např. každé 4 hodiny)
3. **Manual refresh:** Přidat tlačítko v nastavení pro manuální aktualizaci Remote Config
4. **Foreground fetch:** Fetchovat při návratu aplikace z pozadí (AppState listener)

**Aktuálně ale žádné z těchto vylepšení není implementováno.**
