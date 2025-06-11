import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, StatusBar, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getNewsDetail } from '../utils/dataLoader';
import Header from '../components/Header';
import HTML from 'react-native-render-html';

export default function NewsDetailScreen({ route, navigation }) {
  const { newsId } = route.params;
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNewsDetail = async () => {
      try {
        const data = await getNewsDetail(newsId);
    
        // ✨ Upravíme relativní cesty na absolutní
        if (data?.text) {
          data.text = data.text.replace(/src="\/media/g, 'src="https://www.fmcityfest.cz/media');
        }
    
        setNews(data);
        setError(null);
      } catch (error) {
        console.error('Chyba při načítání detailu novinky:', error);
        setError('Nepodařilo se načíst detail novinky');
      } finally {
        setLoading(false);
      }
    };
    
    loadNewsDetail();
  }, [newsId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002239' }}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  if (error || !news) {
    return (
      <View style={{ flex: 1, backgroundColor: '#002239' }}>
        <Header title="NOVINKY" />
        <View style={{ padding: 20 }}>
          <Text style={styles.errorText}>{error || 'Novinka nebyla nalezena'}</Text>
        </View>
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
            {news.image_url && (
              <Image
                source={{ uri: news.image_url }}
                style={styles.newsImage}
                resizeMode="cover"
              />
            )}
            <Text style={styles.newsTitle}>{news.title}</Text>
            <Text style={styles.newsDate}>{new Date(news.date).toLocaleDateString('cs-CZ')}</Text>
            <View style={styles.newsContent}>
              <HTML
                source={{ html: news.text }}
                contentWidth={Dimensions.get('window').width - 40}
                tagsStyles={{
                  p: { color: 'white', fontSize: 16, lineHeight: 24, marginBottom: 16 },
                  h2: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
                  h3: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
                  strong: { color: 'white', fontWeight: 'bold' },
                  em: { color: 'white', fontStyle: 'italic' },
                  a: { color: '#21AAB0', textDecorationLine: 'underline' },
                  ul: { color: 'white', marginBottom: 16 },
                  li: { color: 'white', marginBottom: 8 },
                  img: { marginVertical: 16, borderRadius: 8 }
                }}
              />
            </View>
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
  newsImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  newsTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  newsDate: {
    color: '#21AAB0',
    fontSize: 14,
    marginBottom: 16,
  },
  newsContent: {
    marginTop: 16,
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