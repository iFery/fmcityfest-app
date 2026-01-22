import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ImageBackground,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/linking';
import { TabParamList } from '../navigation/TabNavigator';
import { usePartners } from '../hooks/usePartners';
import { useNews } from '../hooks/useNews';
import { remoteConfigService } from '../services/remoteConfig';
import { useTheme } from '../theme/ThemeProvider';
import type { News } from '../types';

type HomeScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { partners, loading, error } = usePartners();
  const { news, loading: newsLoading, error: newsError } = useNews();
  const [festivalEdition, setFestivalEdition] = useState<string>('7. ročník');
  const [festivalDate, setFestivalDate] = useState<string>('');
  const { globalStyles } = useTheme();

  useEffect(() => {
    // Načtení ročníku z Remote Config
    const editionRaw = remoteConfigService.getString('festival_edition', '7');
    // Pokud je to jen číslo, přidáme ". ročník"
    const edition = editionRaw.includes('ročník') ? editionRaw : `${editionRaw}. ročník`;
    setFestivalEdition(edition);

    // Načtení a formátování datumu z Remote Config
    const dateFrom = remoteConfigService.getString('festival_date_from', '');
    const dateTo = remoteConfigService.getString('festival_date_to', '');
    
    if (dateFrom && dateTo) {
      const formattedDate = formatFestivalDate(dateFrom, dateTo);
      setFestivalDate(formattedDate);
    }
  }, []);

  const formatFestivalDate = (dateFrom: string, dateTo: string): string => {
    try {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      const fromDay = fromDate.getDate();
      const toDay = toDate.getDate();
      const month = toDate.getMonth() + 1; // getMonth() vrací 0-11
      const year = toDate.getFullYear();
      
      // Formát: "19.—20. 6. 2026"
      return `${fromDay}.—${toDay}. ${month}. ${year}`;
    } catch (error) {
      console.error('Error formatting festival date:', error);
      return '';
    }
  };

  const handleLongPress = () => {
    // TODO: Navigace na debug obrazovku, pokud bude potřeba
    console.log('Long press detected');
  };

  // Filtrujeme pouze Generální partnery
  const mainPartners = useMemo(() => {
    return partners.filter(p => p.category === 'Generální partneři');
  }, [partners]);

  const latestNews = useMemo(() => {
    return [...news]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [news]);

  const formatNewsDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleNewsPress = (newsItem: News) => {
    navigation.navigate('NewsDetail', {
      newsId: newsItem.id,
      newsTitle: newsItem.title,
    });
  };

  const tiles = [
    { label: 'Program', icon: 'calendar' as const, onPress: () => {
      const parent = navigation.getParent();
      if (parent) {
        (parent as BottomTabNavigationProp<TabParamList>).navigate('Program');
      }
    }},
    { label: 'Mapa', icon: 'map' as const, onPress: () => {
      navigation.navigate('Map');
    }},
    { label: 'Časté dotazy', icon: 'help-circle' as const, onPress: () => {
      navigation.navigate('FAQ');
    }},
    { label: 'Novinky', icon: 'newspaper' as const, onPress: () => navigation.navigate('News') },
  ];

  const backgroundImage = require('../../assets/background-hp.png');
  const logoImage = require('../../assets/logo.png');

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={handleLongPress}
        delayLongPress={3000}
        style={styles.container}
      >
        <ImageBackground source={backgroundImage} style={styles.backgroundImage}>
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} overScrollMode="never" refreshControl={undefined}>
            <View style={styles.content}>
              {/* Logo a nadpis */}
              <View style={styles.logoContainer}>
                <Image source={logoImage} style={styles.logo} resizeMode="contain" />
                <Text style={[ globalStyles.title, styles.festivalEdition]}>
                  {festivalEdition}
                </Text>
                {festivalDate ? (
                  <Text style={[globalStyles.heading, styles.festivalDate ]}>
                    {festivalDate}
                  </Text>
                ) : null}
              </View>

              {/* Grid 2x2 */}
              <View style={styles.grid}>
                {tiles.map((tile) => (
                  <TouchableOpacity
                    key={tile.label}
                    style={styles.tile}
                    onPress={tile.onPress}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={tile.icon} size={36} color="#21AAB0" style={styles.tileIcon} />
                    <Text style={[globalStyles.heading, styles.tileText]}>{tile.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sekce Partneři */}
              <View style={styles.partnersSection}>
                <Text style={[globalStyles.heading, styles.partnersTitle]}>Generální partneři</Text>
                {loading ? (
                  <ActivityIndicator color="#21AAB0" style={styles.loadingIndicator} />
                ) : error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : mainPartners.length === 0 ? (
                  <Text style={styles.errorText}>Nebyli nalezeni žádní partneři</Text>
                ) : (
                  <View style={styles.partnersGrid}>
                    {mainPartners.map((partner) => (
                      <TouchableOpacity 
                        key={partner.id} 
                        style={styles.partnerBox}
                        onPress={() => {
                          if (partner.link) {
                            const url = partner.link.startsWith('http') ? partner.link : `https://${partner.link}`;
                            Linking.openURL(url).catch(err => {
                              console.warn('Nešlo otevřít odkaz:', url, err);
                            });
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        {partner.logo_url ? (
                          <Image
                            source={{ uri: partner.logo_url }}
                            style={styles.partnerLogo}
                            resizeMode="contain"
                            onError={(e) => console.error('Chyba při načítání loga:', partner.name, e.nativeEvent.error)}
                          />
                        ) : (
                          <View style={styles.placeholderContainer}>
                            <Text style={styles.placeholderText}>{partner.name}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.showAllBtn}
                  onPress={() => navigation.navigate('Partners')}
                >
                  <Text style={[globalStyles.heading, styles.showAllBtnText]}>Zobrazit všechny partnery</Text>
                </TouchableOpacity>
              </View>

              {/* Sekce Novinky */}
              <View style={styles.newsSection}>
                <Text style={[globalStyles.heading, styles.newsTitle]}>Nejnovější novinky</Text>
                {newsLoading ? (
                  <ActivityIndicator color="#21AAB0" style={styles.loadingIndicator} />
                ) : newsError ? (
                  <Text style={styles.errorText}>{newsError}</Text>
                ) : latestNews.length === 0 ? (
                  <Text style={styles.errorText}>Žádné novinky nejsou k dispozici</Text>
                ) : (
                  <View style={styles.newsList}>
                    {latestNews.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.newsCard}
                        onPress={() => handleNewsPress(item)}
                        activeOpacity={0.85}
                      >
                        {item.image_url ? (
                          <Image
                            source={{ uri: item.image_url }}
                            style={styles.newsImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.newsImagePlaceholder} />
                        )}
                        <View style={styles.newsCardContent}>
                          <Text
                            style={[globalStyles.heading, styles.newsCardTitle]}
                            numberOfLines={2}
                          >
                            {item.title}
                          </Text>
                          <Text style={[globalStyles.subtitle, styles.newsCardDate]}>
                            {formatNewsDate(item.date)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.showAllBtn}
                  onPress={() => navigation.navigate('News')}
                >
                  <Text style={[globalStyles.heading, styles.showAllBtnText]}>Zobrazit všechny novinky</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </ImageBackground>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 180,
    resizeMode: 'contain',
  },
  festivalEdition: {
    color: 'white',
    marginTop: 0,
    fontSize: 20,
  },
  festivalDate: {
    color: 'white',
    marginTop: 4,
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 0,
  },
  tile: {
    width: '48%',
    height: 130,
    backgroundColor: '#0A3652',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  tileIcon: {
    marginBottom: 10,
  },
  tileText: {
    color: 'white',
    fontSize: 16,
    marginTop: 4,
  },
  partnersSection: {
    marginTop: 0,
  },
  partnersTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 16,
    marginLeft: 2,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  partnersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 0,
  },
  partnerBox: {
    width: '50%',
    aspectRatio: 2.8,
    borderWidth: 1,
    borderColor: '#224259',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    backgroundColor: '#0A3652',
  },
  partnerLogo: {
    width: '90%',
    height: '90%',
  },
  showAllBtn: {
    backgroundColor: '#21AAB0',
    paddingVertical: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  showAllBtnText: {
    color: 'white',
    fontSize: 15,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  newsSection: {
    marginTop: 30,
    marginBottom: 10,
  },
  newsTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 16,
    marginLeft: 2,
    textAlign: 'center',
  },
  newsList: {
    gap: 12,
  },
  newsCard: {
    backgroundColor: '#0A3652',
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#163F59',
  },
  newsImage: {
    width: 110,
    height: 90,
  },
  newsImagePlaceholder: {
    width: 110,
    height: 90,
    backgroundColor: '#0F2F44',
  },
  newsCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  newsCardTitle: {
    color: 'white',
    fontSize: 15,
    marginBottom: 6,
  },
  newsCardDate: {
    color: '#21AAB0',
    fontSize: 12,
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0A3652',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  placeholderText: {
    color: '#21AAB0',
    fontSize: 12,
    textAlign: 'center',
  },
});
