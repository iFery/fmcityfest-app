import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import ImageZoomBase from 'react-native-image-pan-zoom';
import Header from '../components/Header';
import { useTheme } from '../theme/ThemeProvider';
import { useMaps } from '../hooks/useMaps';
import { logEvent } from '../services/analytics';
import { useScreenView } from '../hooks/useScreenView';
import type { MapItem } from '../types';

// Type assertion to allow children prop (library types are incomplete)
const ImageZoom = ImageZoomBase as React.ComponentType<
  React.ComponentProps<typeof ImageZoomBase> & { children?: React.ReactNode }
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type MapKey = string;

const HEADER_HEIGHT = 130;
const MAP_CONTAINER_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - 150;

export default function MapScreen() {
  const { globalStyles } = useTheme();
  const { maps, loading: mapsLoading, error: mapsError, refetch } = useMaps();
  const [selectedMap, setSelectedMap] = useState<MapKey | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  useScreenView('Map');

  const mapList = useMemo(() => Object.values(maps), [maps]);
  const currentMap = useMemo<MapItem | null>(() => {
    if (selectedMap && maps[selectedMap]) {
      return maps[selectedMap];
    }
    return mapList.length > 0 ? mapList[0] : null;
  }, [mapList, maps, selectedMap]);

  useEffect(() => {
    if (mapList.length === 0 || selectedMap) return;
    const preferredKey = maps.areal?.key;
    const firstKey = mapList[0]?.key;
    const initialKey = preferredKey || firstKey;
    if (initialKey) {
      logEvent('map_select', { map_key: initialKey, source: 'auto' });
      setSelectedMap(initialKey);
      setImageLoading(true);
      setImageError(false);
    }
  }, [mapList, maps, selectedMap]);

  const handleMapChange = (mapKey: MapKey) => {
    logEvent('map_select', { map_key: mapKey, source: 'user' });
    setSelectedMap(mapKey);
    setImageLoading(true);
    setImageError(false);
  };

  const handleMapRetry = () => {
    logEvent('map_retry', { map_key: selectedMap || undefined });
    setImageError(false);
    setImageLoading(true);
    refetch();
  };

  useEffect(() => {
    if (mapsError && mapList.length === 0) {
      logEvent('content_load', { content_type: 'maps', status: 'error' });
    }
  }, [mapList.length, mapsError]);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="MAPA" />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
        >
          {/* Map Type Selector */}
          <View style={styles.filterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              {mapList.map((map) => (
                <TouchableOpacity
                  key={map.key}
                  style={[
                    styles.filterButton,
                    selectedMap === map.key && styles.activeFilterButton,
                  ]}
                  onPress={() => handleMapChange(map.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterText,
                      globalStyles.subtitle,
                      selectedMap === map.key && styles.activeFilterText,
                    ]}
                  >
                    {map.title.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Map Image Container with Zoom */}
          <View style={styles.mapContainer}>
            {(mapsLoading && mapList.length === 0) || (imageLoading && currentMap) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#21AAB0" />
              </View>
            ) : null}
            {mapsError && mapList.length === 0 ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, globalStyles.text]}>
                  Nepodařilo se načíst mapy
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleMapRetry}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.retryButtonText, globalStyles.text]}>
                    Zkusit znovu
                  </Text>
                </TouchableOpacity>
              </View>
            ) : imageError ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, globalStyles.text]}>
                  Nepodařilo se načíst mapu
                </Text>
              </View>
            ) : currentMap ? (
              <ImageZoom
                cropWidth={SCREEN_WIDTH - 40}
                cropHeight={MAP_CONTAINER_HEIGHT}
                imageWidth={SCREEN_WIDTH - 40}
                imageHeight={MAP_CONTAINER_HEIGHT}
                minScale={1}
                maxScale={4}
                enableSwipeDown={false}
                enableCenterFocus={true}
              >
                <Image
                  source={{ uri: currentMap.url }}
                  style={styles.mapImage}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => {
                    setImageLoading(false);
                    if (currentMap?.key) {
                      logEvent('map_load', { map_key: currentMap.key, status: 'success' });
                    }
                  }}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                    if (currentMap?.key) {
                      logEvent('map_load', { map_key: currentMap.key, status: 'error' });
                    }
                  }}
                />
              </ImageZoom>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002239',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT + 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  filterContainer: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  filterList: {
    alignItems: 'center',
  },
  filterButton: {
    borderColor: '#FFFFFF',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 0,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#EA5178',
    borderColor: '#EA5178',
  },
  filterText: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  mapContainer: {
    width: '100%',
    height: MAP_CONTAINER_HEIGHT,
    borderRadius: 0,
    overflow: 'hidden',
  },
  mapImage: {
    width: SCREEN_WIDTH - 40,
    height: MAP_CONTAINER_HEIGHT,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A3652',
    zIndex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 12,
    borderColor: '#21AAB0',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#21AAB0',
    textTransform: 'uppercase',
  },
});
