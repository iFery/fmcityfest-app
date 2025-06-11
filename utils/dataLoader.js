// utils/dataLoader.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveToCache, loadFromCache, setLastUpdate, getLastUpdate } from './cache';
import { API_URL, CACHE_CONFIG } from '../config';

const PROGRAM_URL = 'https://www.fmcityfest.cz/api/mobile-app/timeline.php';
const ARTISTS_URL = 'https://www.fmcityfest.cz/api/mobile-app/artists.php';
const FAQ_URL = 'https://www.fmcityfest.cz/api/mobile-app/faq.php';
const NEWS_URL = 'https://www.fmcityfest.cz/api/mobile-app/news.php';
const PARTNERS_URL = 'https://www.fmcityfest.cz/api/mobile-app/partners.php';

const CACHE_EXPIRY_HOURS = 24;
const CACHE_KEYS = {
  PROGRAM: 'cachedProgramData',
  ARTISTS: 'cachedArtists',
  LAST_UPDATED: 'lastDataUpdate',
  artistCategories: 'cachedArtistCategories',
  FESTIVAL_DATA: 'cachedFestivalData',
};

const CACHE_KEYS_EXT = {
  NEWS: 'cachedNews',
  PARTNERS: 'cachedPartners',
  NEWS_DETAIL: 'cachedNewsDetail',
};

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hodin v milisekundách

const validateProgramData = (data) => {
  if (!data) {
    throw new Error('Chybí program data');
  }
  if (!data.events || !Array.isArray(data.events)) {
    throw new Error('Program data nejsou ve správném formátu (chybí pole events)');
  }
  if (data.events.length === 0) {
    throw new Error('Program data jsou prázdná (žádné eventy)');
  }
  return true;
};

const validateArtistsData = (data) => {
  if (!data) {
    throw new Error('Chybí data interpretů');
  }
  // Kontrola, zda data jsou pole nebo objekt s polem records
  if (Array.isArray(data)) {
    return true;
  }
  if (data.records && Array.isArray(data.records)) {
    return true;
  }
  throw new Error('Data interpretů nejsou ve správném formátu (očekáváno pole nebo objekt s polem records)');
};

export async function loadFestivalData(config) {
  try {
    console.log('🔄 Načítám festival data...');
    
    // Načtení dat z cache
    console.log('📂 Načítám data z cache...');
    const cachedData = await loadFromCache(CACHE_KEYS.FESTIVAL_DATA);
    console.log('📦 Cache data:', cachedData ? 'existují' : 'neexistují');
    
    if (cachedData) {
      // Validace dat z cache
      console.log('🔍 Validuji data z cache...');
      console.log('📊 Struktura dat:', {
        hasArtists: !!cachedData.artists,
        hasProgram: !!cachedData.program,
        artistsType: cachedData.artists ? typeof cachedData.artists : 'undefined',
        programType: cachedData.program ? typeof cachedData.program : 'undefined'
      });

      if (!cachedData.artists || !cachedData.program) {
        console.warn('⚠️ Data v cache nejsou validní:', {
          hasArtists: !!cachedData.artists,
          hasProgram: !!cachedData.program
        });
        console.log('🗑️ Čistím cache...');
        await clearCache();
      } else {
        // Validace struktury dat
        if (!Array.isArray(cachedData.artists)) {
          console.warn('⚠️ Interpreti v cache nejsou pole');
          await clearCache();
        } else if (!cachedData.program.events || !Array.isArray(cachedData.program.events)) {
          console.warn('⚠️ Program v cache nemá validní strukturu');
          await clearCache();
        } else {
          console.log('✅ Data byla úspěšně načtena z cache');
          const data = {
            artists: cachedData.artists,
            program: cachedData.program,
            last_update: cachedData.last_update || new Date().toISOString()
          };
          console.log('📊 Návratová data:', {
            artistsCount: data.artists.length,
            programEventsCount: data.program.events.length,
            hasLastUpdate: !!data.last_update
          });
          return data;
        }
      }
    }

    // Pokud nejsou data v cache nebo nejsou validní, načteme je z API
    console.log('🌐 Načítám data z API...');
    
    // Nejdřív zkusíme načíst program
    console.log('📥 Načítám program z API...');
    let programData;
    try {
      const programRes = await fetch(PROGRAM_URL);
      if (!programRes.ok) {
        throw new Error(`Chyba při načítání programu: ${programRes.status}`);
      }
      programData = await programRes.json();
      console.log('✅ Program úspěšně načten z API');
    } catch (error) {
      console.error('❌ Chyba při načítání programu:', error);
      throw new Error('Nepodařilo se načíst program: ' + error.message);
    }

    // Pak načteme interprety
    console.log('📥 Načítám interprety z API...');
    let artistsData;
    try {
      const artistsRes = await fetch(ARTISTS_URL);
      if (!artistsRes.ok) {
        throw new Error(`Chyba při načítání interpretů: ${artistsRes.status}`);
      }
      artistsData = await artistsRes.json();
      console.log('✅ Interpreti úspěšně načteni z API');
    } catch (error) {
      console.error('❌ Chyba při načítání interpretů:', error);
      throw new Error('Nepodařilo se načíst interprety: ' + error.message);
    }

    // Validace dat
    console.log('🔍 Validuji data z API...');
    if (!artistsData) {
      throw new Error('Neplatná data interpretů z API');
    }
    if (!programData || !programData.events || !Array.isArray(programData.events)) {
      throw new Error('Neplatná data programu z API');
    }

    // Sestavení dat pro cache
    console.log('📦 Sestavuji data pro cache...');
    const festivalData = {
      artists: artistsData.records || artistsData,
      program: programData,
      last_update: config?.last_updates?.artists || new Date().toISOString()
    };

    // Validace sestavených dat
    if (!festivalData.artists || !festivalData.program) {
      throw new Error('Neplatná struktura festivalových dat');
    }

    // Uložení do cache
    console.log('💾 Ukládám data do cache...');
    try {
      await saveToCache(CACHE_KEYS.FESTIVAL_DATA, festivalData);
      await setLastUpdate('artists', festivalData.last_update);
      console.log('✅ Data byla úspěšně uložena do cache');
    } catch (error) {
      console.error('❌ Chyba při ukládání do cache:', error);
      // Pokračujeme i když se nepodaří uložit do cache
    }

    console.log('✅ Data byla úspěšně načtena z API');
    const data = {
      artists: festivalData.artists,
      program: festivalData.program,
      last_update: festivalData.last_update
    };
    console.log('📊 Návratová data:', {
      artistsCount: data.artists.length,
      programEventsCount: data.program.events.length,
      hasLastUpdate: !!data.last_update
    });
    return data;
  } catch (error) {
    console.error('❌ Chyba při načítání festivalových dat:', error);
    // Pokud je to chyba síťového připojení, zkusíme načíst z cache
    if (error.message.includes('Network request failed')) {
      console.log('⚠️ Síťová chyba, zkouším načíst data z cache...');
      try {
        const cachedData = await loadFromCache(CACHE_KEYS.FESTIVAL_DATA);
        if (cachedData && cachedData.artists && cachedData.program) {
          console.log('✅ Data byla úspěšně načtena z cache po síťové chybě');
          const data = {
            artists: cachedData.artists,
            program: cachedData.program,
            last_update: cachedData.last_update || new Date().toISOString()
          };
          console.log('📊 Návratová data:', {
            artistsCount: data.artists.length,
            programEventsCount: data.program.events.length,
            hasLastUpdate: !!data.last_update
          });
          return data;
        }
      } catch (cacheError) {
        console.error('❌ Chyba při načítání z cache:', cacheError);
      }
    }
    throw new Error('Nepodařilo se načíst festivalová data: ' + error.message);
  }
}

export const clearCache = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(CACHE_CONFIG.KEYS.PROGRAM),
      AsyncStorage.removeItem(CACHE_CONFIG.KEYS.ARTISTS),
      AsyncStorage.removeItem(CACHE_CONFIG.KEYS.LAST_UPDATED),
    ]);
    console.log('🧹 Cache byla vyčištěna');
  } catch (error) {
    console.error('❌ Chyba při čištění cache:', error);
    throw error;
  }
};

// ✅ Vrací seznam interpretů (cache-first, s fallbackem na API podle config)
export async function getAllArtists(config) {
  try {
    console.log('🔄 getAllArtists: Načítám data z cache...');
    const cached = await loadFromCache(CACHE_KEYS.ARTISTS);
    console.log('📦 getAllArtists: Cache data:', cached ? 'existují' : 'neexistují');
    
    // Kontrola, zda máme validní data v cache
    if (cached && Array.isArray(cached) && cached.length > 0) {
      console.log('✅ getAllArtists: Data byla úspěšně načtena z cache');
      console.log('📊 getAllArtists: Počet interpretů v cache:', cached.length);
      
      // Debug: vypíšeme strukturu prvního interpreta
      if (cached.length > 0) {
        console.log('🔍 getAllArtists: Ukázka struktury interpreta:', JSON.stringify(cached[0], null, 2));
      }
      
      // Filtrujeme pouze interprety s show_on_website = 1
      const filteredArtists = cached.filter(artist => {
        const showOnWebsite = artist.show_on_website;
        console.log('🔍 getAllArtists: show_on_website hodnota:', showOnWebsite, 'typ:', typeof showOnWebsite);
        return showOnWebsite === 1 || showOnWebsite === '1' || showOnWebsite === true;
      });
      console.log('📊 getAllArtists: Počet interpretů po filtrování:', filteredArtists.length);
      return filteredArtists;
    }

    // Pokud nemáme data v cache, zkusíme je načíst z API
    console.log('⚠️ getAllArtists: Data v cache nejsou k dispozici, načítám z API...');
    const res = await fetch(ARTISTS_URL);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    console.log('📦 getAllArtists: Data z API:', json ? 'načtena' : 'není');
    
    // Kontrola formátu dat z API
    if (!json || (!Array.isArray(json) && (!json.records || !Array.isArray(json.records)))) {
      throw new Error('Neplatný formát dat z API');
    }

    // Zpracování dat z API
    const artists = Array.isArray(json) ? json : json.records;
    console.log('📊 getAllArtists: Počet interpretů z API:', artists.length);
    
    // Debug: vypíšeme strukturu prvního interpreta
    if (artists.length > 0) {
      console.log('🔍 getAllArtists: Ukázka struktury interpreta z API:', JSON.stringify(artists[0], null, 2));
    }
    
    // Uložení do cache
    await saveToCache(CACHE_KEYS.ARTISTS, artists);
    console.log('✅ getAllArtists: Data byla úspěšně uložena do cache');
    
    // Filtrujeme pouze interprety s show_on_website = 1
    const filteredArtists = artists.filter(artist => {
      const showOnWebsite = artist.show_on_website;
      console.log('🔍 getAllArtists: show_on_website hodnota:', showOnWebsite, 'typ:', typeof showOnWebsite);
      return showOnWebsite === 1 || showOnWebsite === '1' || showOnWebsite === true;
    });
    console.log('📊 getAllArtists: Počet interpretů po filtrování:', filteredArtists.length);
    return filteredArtists;
  } catch (error) {
    console.error('❌ getAllArtists: Chyba při načítání dat:', error);
    return [];
  }
}

// ✅ Vrací všechny interprety včetně těch skrytých (pro program a detail)
export async function getAllArtistsIncludingHidden() {
  try {
    const cached = await loadFromCache(CACHE_KEYS.ARTISTS);
    if (!cached || !Array.isArray(cached)) {
      console.warn('⚠️ getAllArtistsIncludingHidden: Data v cache nejsou validní');
      return [];
    }
    return cached;
  } catch (error) {
    console.error('❌ getAllArtistsIncludingHidden: Chyba při načítání dat:', error);
    return [];
  }
}

// ✅ Vrací kategorie interpretů z cache
export async function getArtistCategories() {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.artistCategories);
    if (!data) {
      console.log('ℹ️ getArtistCategories: Kategorie nejsou v cache, načítám z API...');
      const res = await fetch(ARTISTS_URL);
      const json = await res.json();
      if (json.categories && Array.isArray(json.categories)) {
        await saveToCache(CACHE_KEYS.artistCategories, json.categories);
        return json.categories.map(cat => ({
          label: cat.name || 'Neznámá',
          value: cat.tag || 'unknown',
        }));
      }
      return [];
    }

    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      console.warn('⚠️ getArtistCategories: Kategorie v cache nejsou pole:', parsed);
      return [];
    }

    // ✅ PŘEMAPOVÁNÍ na label/value, které používáš ve výpisu
    return parsed.map(cat => ({
      label: cat.name || 'Neznámá',
      value: cat.tag || 'unknown',
    }));
  } catch (err) {
    console.error('❌ getArtistCategories: Nelze načíst kategorie:', err);
    return [];
  }
}

export async function getArtistById(id) {
  try {
    console.log('🔍 getArtistById: Hledám interpreta s ID:', id);
    
    // Načtení dat z cache
    const cached = await loadFromCache(CACHE_KEYS.ARTISTS);
    console.log('📦 getArtistById: Data z cache:', cached ? 'existují' : 'neexistují');
    
    if (!cached || !Array.isArray(cached)) {
      console.warn('⚠️ getArtistById: Data v cache nejsou validní');
      return null;
    }

    // Hledání interpreta
    const found = cached.find(a => String(a.id) === String(id));
    console.log('🔎 getArtistById: Nalezený interpret:', found ? 'existuje' : 'neexistuje');

    if (found) {
      // Pokud máme data v fields, vrátíme je
      if (found.fields) {
        console.log('✅ getArtistById: Vracím data z fields');
        return { ...found.fields, id: found.id };
      }
      // Jinak vrátíme celý objekt
      console.log('✅ getArtistById: Vracím celý objekt');
      return found;
    }

    console.warn(`⚠️ getArtistById: Interpret s ID ${id} nebyl nalezen v cache`);
    return null;
  } catch (error) {
    console.error('❌ getArtistById: Chyba při načítání interpreta:', error);
    return null;
  }
}

// ✅ Vrací program festivalu z cache
export async function getProgram() {
  try {
    const festivalData = await loadFromCache(CACHE_KEYS.FESTIVAL_DATA);
    if (!festivalData || !festivalData.program) {
      console.log('ℹ️ getProgram: Program není v cache, načítám z API...');
      const res = await fetch(PROGRAM_URL);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();
      if (!json.events || !Array.isArray(json.events)) {
        throw new Error('Neplatný formát dat z API');
      }
      return json;
    }
    return festivalData.program;
  } catch (err) {
    console.error('❌ getProgram: Nelze načíst program:', err);
    return null;
  }
}

// ✅ Vrací program pro konkrétní den
export async function getProgramForDay(day) {
  try {
    const program = await getProgram();
    if (!program) {
      throw new Error('Nepodařilo se načíst data programu');
    }

    const dayConfig = program.config[day === 1 ? 'dayOne' : 'dayTwo'];
    if (!dayConfig) {
      throw new Error('Nenalezena konfigurace pro den');
    }

    const dayStart = new Date(dayConfig.start);
    const dayEnd = new Date(dayConfig.end);

    // Filtrujeme události pro daný den
    const dayEvents = program.events.filter(event => {
      const eventStart = new Date(event.start);
      return eventStart >= dayStart && eventStart < dayEnd;
    });

    // Seřadíme události podle času
    dayEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

    // Získáme unikátní pódia pro daný den
    const stages = program.stages.filter(stage => {
      if (day === 1) {
        return stage.class.includes('day-one-stage');
      } else {
        return !stage.class.includes('day-one-stage');
      }
    }).sort((a, b) => a.sort - b.sort);

    return {
      events: dayEvents,
      stages: stages,
      config: dayConfig
    };
  } catch (err) {
    console.error('❌ getProgramForDay: Chyba při načítání programu pro den:', err);
    throw err;
  }
}

// ✅ Vrací program pro konkrétní interpreta
export async function getProgramForArtist(artistId) {
  try {
    const program = await getProgram();
    if (!program) {
      throw new Error('Nepodařilo se načíst data');
    }

    // Najdeme všechny události pro daného interpreta
    const artistEvents = program.events.filter(event => event.interpret_id === artistId);
    
    // Pro každou událost přidáme informace o pódiu
    return artistEvents.map(event => {
      const stage = program.stages.find(s => s.stage === event.stage);
      return {
        ...event,
        stage_info: stage || null
      };
    });
  } catch (err) {
    console.error('❌ getProgramForArtist: Chyba při načítání programu pro interpreta:', err);
    return [];
  }
}

export async function getNews() {
  try {
    // Zkusíme načíst z cache
    const cached = await loadFromCache(CACHE_KEYS_EXT.NEWS);
    if (cached && Array.isArray(cached.items) && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.items;
    }

    // Načteme z API
    const response = await fetch('https://www.fmcityfest.cz/api/mobile-app/news.php');
    if (!response.ok) {
      throw new Error('Nepodařilo se načíst novinky');
    }
    const data = await response.json();
    
    // Uložíme do cache
    await saveToCache(CACHE_KEYS_EXT.NEWS, { items: data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('Chyba při načítání novinek:', error);
    // Pokud selže API, zkusíme vrátit z cache i po expiraci
    const cached = await loadFromCache(CACHE_KEYS_EXT.NEWS);
    if (cached && Array.isArray(cached.items)) return cached.items;
    throw error;
  }
}

export async function getNewsDetail(newsId) {
  try {
    // Zkusíme načíst z cache
    const cached = await loadFromCache(`${CACHE_KEYS_EXT.NEWS_DETAIL}_${newsId}`);
    if (cached && cached.item && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.item;
    }

    // Načteme z API
    const response = await fetch('https://www.fmcityfest.cz/api/mobile-app/news.php');
    if (!response.ok) {
      throw new Error('Nepodařilo se načíst detail novinky');
    }
    const data = await response.json();
    const newsDetail = data.find(item => item.id === newsId);
    
    if (!newsDetail) {
      throw new Error('Novinka nebyla nalezena');
    }

    // Uložíme do cache
    await saveToCache(`${CACHE_KEYS_EXT.NEWS_DETAIL}_${newsId}`, { item: newsDetail, timestamp: Date.now() });
    return newsDetail;
  } catch (error) {
    console.error('Chyba při načítání detailu novinky:', error);
    // Pokud selže API, zkusíme vrátit z cache i po expiraci
    const cached = await loadFromCache(`${CACHE_KEYS_EXT.NEWS_DETAIL}_${newsId}`);
    if (cached && cached.item) return cached.item;
    throw error;
  }
}

export async function getPartners() {
  try {
    // Zkusíme načíst z cache
    const cached = await loadFromCache(CACHE_KEYS_EXT.PARTNERS);
    if (cached && Array.isArray(cached.items) && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.items;
    }
    // Načteme z API
    const res = await fetch(PARTNERS_URL);
    if (!res.ok) throw new Error('Chyba při načítání partnerů');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Neplatná data partnerů');
    // Uložíme do cache
    await saveToCache(CACHE_KEYS_EXT.PARTNERS, { items: data, timestamp: Date.now() });
    return data;
  } catch (e) {
    // Pokud selže API, zkusíme vrátit z cache i po expiraci
    const cached = await loadFromCache(CACHE_KEYS_EXT.PARTNERS);
    if (cached && Array.isArray(cached.items)) return cached.items;
    throw e;
  }
}