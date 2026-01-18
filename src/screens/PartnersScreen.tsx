/**
 * Partners Screen
 * Displays all partners grouped by category
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/linking';
import Header from '../components/Header';
import { usePartners } from '../hooks/usePartners';
import type { Partner } from '../types';

type PartnersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function PartnersScreen() {
  const navigation = useNavigation<PartnersScreenNavigationProp>();
  const { partners, loading, error } = usePartners();

  // Group partners by category
  const groupedPartners = useMemo(() => {
    return partners.reduce((acc, partner) => {
      const category = partner.category || 'Ostatní';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(partner);
      return acc;
    }, {} as Record<string, Partner[]>);
  }, [partners]);

  // Preserve category order
  const sortedCategories = useMemo(() => {
    const order = ['Generální partneři', 'Partneři', 'Mediální partneři'];
    return order.filter((category) => groupedPartners[category]?.length > 0);
  }, [groupedPartners]);

  const handlePartnerPress = (partner: Partner) => {
    if (partner.link) {
      const url = partner.link.startsWith('http') ? partner.link : `https://${partner.link}`;
      Linking.openURL(url).catch((err) => {
        console.warn('Nešlo otevřít odkaz:', url, err);
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <ActivityIndicator size="large" color="#EA5178" />
      </View>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView bounces={false} overScrollMode="never" refreshControl={undefined}>
          <Header title="PARTNEŘI" />
          <View style={styles.content}>
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
                        onPress={() => handlePartnerPress(partner)}
                        activeOpacity={0.7}
                      >
                        {partner.logo_url ? (
                          <Image
                            source={{ uri: partner.logo_url }}
                            style={styles.partnerLogo}
                            resizeMode="contain"
                            onError={(e) =>
                              console.error('Chyba při načítání loga:', partner.name, e.nativeEvent.error)
                            }
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

        {/* Floating back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="white" style={styles.backIcon} />
          <Text style={styles.backButtonText}>Zpět</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002239',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002239',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backIcon: {
    marginRight: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});


