import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Uloží JSON data do cache
 */
export const saveToCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Data saved to cache [${key}]`);
  } catch (e) {
    console.error(`❌ Failed to save to cache [${key}]`, e);
  }
};

/**
 * Načte JSON data z cache
 */
export const loadFromCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error(`❌ Failed to load from cache [${key}]`, e);
    return null;
  }
};

/**
 * Získá timestamp poslední aktualizace
 */
export const getLastUpdate = async (key) => {
  try {
    return await AsyncStorage.getItem(`lastUpdate_${key}`);
  } catch (e) {
    console.error(`❌ Failed to load last update [${key}]`, e);
    return null;
  }
};

/**
 * Uloží timestamp poslední aktualizace
 */
export const setLastUpdate = async (key, timestamp) => {
  try {
    await AsyncStorage.setItem(`lastUpdate_${key}`, timestamp);
    console.log(`🕒 Last update saved [${key}] => ${timestamp}`);
  } catch (e) {
    console.error(`❌ Failed to save last update [${key}]`, e);
  }
};

export const removeFromCache = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`🗑️ Removed ${key} from cache`);
  } catch (error) {
    console.error(`❌ Error removing ${key} from cache:`, error);
  }
};

const toggleFavorite = async (artistId) => {
  try {
    const favorites = (await loadFromCache('myArtists')) || [];

    let updatedFavorites;
    if (favorites.includes(artistId)) {
      updatedFavorites = favorites.filter(id => id !== artistId);
      setIsFavorite(false);
    } else {
      updatedFavorites = [...favorites, artistId];
      setIsFavorite(true);
    }

    await saveToCache('myArtists', updatedFavorites);
  } catch (error) {
    console.error('❌ Error toggling favorite:', error);
  }
};