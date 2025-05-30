// context/RemoteConfigProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const CONFIG_URL = 'https://www.fmcityfest.cz/api/mobile-app/mobile-remote-config.json';
  const CACHE_KEY = 'mobileRemoteConfig';
  const LAST_UPDATE_KEY = 'mobileRemoteConfig';

  useEffect(() => {
    const loadRemoteConfig = async () => {
      try {
        const response = await fetch(CONFIG_URL + '?_=' + Date.now());
        const data = await response.json();

        const remoteUpdatedAt = data.updated_at;
        const localUpdatedAt = await getLastUpdate(LAST_UPDATE_KEY);

        //const shouldFetch = !localUpdatedAt || new Date(remoteUpdatedAt) > new Date(localUpdatedAt);
        const shouldFetch = true;

        if (shouldFetch) {
          setConfig(data);
          await saveToCache(CACHE_KEY, data);
          await setLastUpdate(LAST_UPDATE_KEY, remoteUpdatedAt);
          console.log('✅ Remote config updated from server');
        } else {
          const cached = await loadFromCache(CACHE_KEY);
          if (cached) {
            setConfig(cached);
            console.log('✅ Remote config loaded from cache');
          } else {
            setConfig(data); // fallback na data i když nejsou cache
          }
        }
      } catch (e) {
        console.warn('⚠️ Failed to fetch config, using cache if available');
        const cached = await loadFromCache(CACHE_KEY);
        if (cached) {
          setConfig(cached);
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
