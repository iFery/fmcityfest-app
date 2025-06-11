import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, ImageBackground, ScrollView, ActivityIndicator, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getPartners } from '../utils/dataLoader';

export default function HomeScreen({ navigation }) {
  const backgroundImage = require('../assets/background-hp.png');
  const logoImage = require('../assets/logo.png');
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const data = await getPartners();
        // Filtrujeme pouze Generální partnery
        const generalPartners = data.filter(p => p.category === 'Generální partneři');
        setPartners(generalPartners);
        setError(null);
      } catch (error) {
        console.error('Chyba při načítání partnerů:', error);
        setError('Nepodařilo se načíst partnery');
      } finally {
        setLoading(false);
      }
    };
    
    loadPartners();
  }, []);

  const mainPartners = partners;

  const tiles = [
    { label: 'Program', icon: 'calendar', onPress: () => navigation.navigate('Program') },
    { label: 'Mapa', icon: 'map', onPress: () => navigation.navigate('Map') },
    { label: 'Časté dotazy', icon: 'help-circle', onPress: () => navigation.navigate('FAQ') },
    { label: 'Novinky', icon: 'newspaper', onPress: () => navigation.navigate('News') },
  ];

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ImageBackground source={backgroundImage} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, padding: 20, justifyContent: 'flex-start' }}>
            {/* Logo a nadpis */}
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Image source={logoImage} style={{ width: 180, resizeMode: 'contain' }} />
              <Text style={{ color: 'white', marginTop: 10, fontSize: 18 }}>7. ročník</Text>
            </View>

            {/* Grid 2x2 */}
            <View style={styles.grid}>
              {tiles.map((tile, idx) => (
                <TouchableOpacity
                  key={tile.label}
                  style={styles.tile}
                  onPress={tile.onPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name={tile.icon} size={36} color="#21AAB0" style={{ marginBottom: 10 }} />
                  <Text style={styles.tileText}>{tile.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sekce Partneři */}
            <View style={{ marginTop: 0 }}>
              <Text style={styles.partnersTitle}>Generální partneři</Text>
              {loading ? (
                <ActivityIndicator color="#21AAB0" style={{ marginVertical: 20 }} />
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
                      onPress={() => partner.website_url && Linking.openURL(partner.website_url)}
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
                <Text style={styles.showAllBtnText}>Zobrazit všechny partnery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 0,
  },
  
  tile: {
    width: '48%',
    height: 130, // fixní výška místo aspectRatio
    backgroundColor: '#0A3652',
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 2,
  },
  
  tileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 4,
  },
  partnersTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 16,
    marginLeft: 2,
    textAlign: 'center',
  },
  partnersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 0,
  },
  partnerBox: {
    width: '50%',
    aspectRatio: 2.8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#224259',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
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
    fontWeight: 'bold',
    fontSize: 15,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
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
    fontWeight: '500',
  },
});
