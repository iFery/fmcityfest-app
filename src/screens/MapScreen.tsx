import React, { useState } from 'react';
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

// Type assertion to allow children prop (library types are incomplete)
const ImageZoom = ImageZoomBase as React.ComponentType<
  React.ComponentProps<typeof ImageZoomBase> & { children?: React.ReactNode }
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_URL = 'https://www.fmcityfest.cz';

const mapData = {
  areal: {
    key: 'areal',
    title: 'Areál',
    url: `${BASE_URL}/media/2025/mapa-areal.jpg`,
  },
  parking: {
    key: 'parking',
    title: 'Parkoviště',
    url: `${BASE_URL}/media/2025/mapa-parkoviste.png`,
  },
  stan: {
    key: 'stan',
    title: 'Stanové městečko',
    url: `${BASE_URL}/media/2025/mapa-camp.png`,
  },
};

type MapType = keyof typeof mapData;

const HEADER_HEIGHT = 130;
const MAP_CONTAINER_HEIGHT = SCREEN_HEIGHT - HEADER_HEIGHT - 150;

export default function MapScreen() {
  const { globalStyles } = useTheme();
  const [selectedMap, setSelectedMap] = useState<MapType>('areal');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleMapChange = (mapType: MapType) => {
    setSelectedMap(mapType);
    setImageLoading(true);
    setImageError(false);
  };

  const currentMap = mapData[selectedMap];

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
              {Object.values(mapData).map((map) => (
                <TouchableOpacity
                  key={map.key}
                  style={[
                    styles.filterButton,
                    selectedMap === map.key && styles.activeFilterButton,
                  ]}
                  onPress={() => handleMapChange(map.key as MapType)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterText,
                      globalStyles.bodyStrong,
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
            {imageLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#21AAB0" />
              </View>
            )}
            {imageError ? (
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, globalStyles.text]}>
                  Nepodařilo se načíst mapu
                </Text>
              </View>
            ) : (
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
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
              </ImageZoom>
            )}
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
});