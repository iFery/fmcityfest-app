import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getNews } from '../utils/dataLoader';
import Header from '../components/Header';

export default function NewsScreen({ navigation }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await getNews();
        setNews(data);
        setError(null);
      } catch (error) {
        console.error('Chyba při načítání novinek:', error);
        setError('Nepodařilo se načíst novinky');
      } finally {
        setLoading(false);
      }
    };
    
    loadNews();
  }, []);

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
          <Header title="NOVINKY" />
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : news.length === 0 ? (
              <Text style={styles.errorText}>Žádné novinky nejsou k dispozici</Text>
            ) : (
              news.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.newsItem}
                  onPress={() => navigation.navigate('NewsDetail', { newsId: item.id })}
                >
                  {item.image_url && (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.newsImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.newsContent}>
                    <Text style={styles.newsTitle}>{item.title}</Text>
                    <Text style={styles.newsDate}>{new Date(item.date).toLocaleDateString('cs-CZ')}</Text>
                  </View>
                </TouchableOpacity>
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
  newsItem: {
    backgroundColor: '#0A3652',
    marginBottom: 16,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 200,
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  newsDate: {
    color: '#21AAB0',
    fontSize: 14,
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