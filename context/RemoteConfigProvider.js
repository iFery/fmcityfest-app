// context/RemoteConfigProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import {
  loadFromCache,
  saveToCache,
  getLastUpdate,
  setLastUpdate,
} from '../utils/cache';

const RemoteConfigContext = createContext();
export const useRemoteConfig = () => useContext(RemoteConfigContext);

export const RemoteConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const CONFIG_URL = 'https://www.fmcityfest.cz/api/mobile-app/mobile-remote-config.php';
  const CACHE_KEY = 'mobileRemoteConfig';
  const LAST_UPDATE_KEY = 'mobileRemoteConfig';

  const fallbackConfig = {
    home_buttons: [],
    after_movie_video_id: '',
  };

  useEffect(() => {
    const loadRemoteConfig = async () => {
      try {
        //console.log("🌐 Fetching from", CONFIG_URL);

        const response = await axios.get(CONFIG_URL, {
          params: { _: Date.now() },
          timeout: 10000, // 10s timeout pro jistotu
          validateStatus: () => true, // vrací všechny odpovědi, i chybové
        });

        //console.log('📶 Axios status:', response.status);
        //console.log('🧪 Axios data:', JSON.stringify(response.data).slice(0, 300));

        const data = response.data;
        const remoteUpdatedAt = data.updated_at;
        const localUpdatedAt = await getLastUpdate(LAST_UPDATE_KEY);

        const shouldFetch = true; // můžeš změnit dle aktualizační logiky

        if (shouldFetch && data) {
          setConfig(data);
          await saveToCache(CACHE_KEY, data);
          await setLastUpdate(LAST_UPDATE_KEY, remoteUpdatedAt);
          //console.log('✅ Remote config updated from server');
        }
      } catch (error) {
        console.warn('⚠️ Axios fetch failed:', error?.message || error);
        console.warn('🧨 Axios full error:', error.toJSON());
        if (error.response) {
          console.warn('📛 Server responded with status:', error.response.status);
          console.warn('📥 Response data:', JSON.stringify(error.response.data));
        } else if (error.request) {
          console.warn('📡 No response received:', error.request);
        } else {
          console.warn('💥 Unexpected error:', error.message);
        }

        const cached = await loadFromCache(CACHE_KEY);
        if (cached) {
          //console.log('📦 Using cached config');
          setConfig(cached);
        } else {
          console.warn('⚠️ No cache found, using fallback');
          setConfig(fallbackConfig);
        }
      } finally {
        setLoading(false);
      }
    };

    loadRemoteConfig();
  }, []);

  return (
    <RemoteConfigContext.Provider value={{ config, loading }}>
      {children}
    </RemoteConfigContext.Provider>
  );
};
