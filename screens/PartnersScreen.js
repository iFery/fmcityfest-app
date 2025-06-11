import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, ScrollView, ActivityIndicator, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getPartners } from '../utils/dataLoader';
import Header from '../components/Header';

export default function PartnersScreen({ navigation }) {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const data = await getPartners();
        setPartners(data);
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

  // Seskupení partnerů podle kategorií z API
  const groupedPartners = partners.reduce((acc, partner) => {
    const category = partner.category || 'Ostatní';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(partner);
    return acc;
  }, {});

  // Zachováme pořadí kategorií podle API
  const sortedCategories = ['Generální partneři', 'Partneři', 'Mediální partneři'].filter(
    category => groupedPartners[category]?.length > 0
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002239' }}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={{ flex: 1, backgroundColor: '#002239' }}>
        <ScrollView>
          <Header title="PARTNEŘI" />
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : partners.length === 0 ? (
              <Text style={styles.errorText}>Nebyli nalezeni žádní partneři</Text>
            ) : (
              sortedCategories.map((category) => (
                <View key={category} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{category}</Text>
                  </View>
                  <View style={styles.partnersGrid}>
                    {groupedPartners[category].map((partner) => (
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
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Floatovací tlačítko zpět */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Zpět</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 0,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
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
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: '#EA5178',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
  },
}); 