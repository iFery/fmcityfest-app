/**
 * News Detail Screen
 * Displays full news article with HTML content
 */

import React, { useState, useEffect } from 'react';
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
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/linking';
import Header from '../components/Header';
import { newsApi, type ApiError } from '../api';
import { loadFromCache } from '../utils/cacheManager';
import type { News } from '../types';
import { useTheme } from '../theme/ThemeProvider';

type NewsDetailScreenRouteProp = RouteProp<RootStackParamList, 'NewsDetail'>;
type NewsDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CACHE_KEY = 'news';

export default function NewsDetailScreen() {
  const { globalStyles } = useTheme();
  const route = useRoute<NewsDetailScreenRouteProp>();
  const navigation = useNavigation<NewsDetailScreenNavigationProp>();
  const { newsId } = route.params;
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadNewsDetail = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);

        const cachedNews = await loadFromCache<News[]>(CACHE_KEY);
        if (cachedNews && isMounted) {
          const cachedItem = cachedNews.find((item) => item.id === newsId);
          if (cachedItem) {
            setNews(cachedItem);
            setLoading(false);
          }
        }

        try {
          const response = await newsApi.getById(newsId);
          if (!isMounted) return;

          const newsData = response.data;

          if (newsData.text) {
            newsData.text = newsData.text.replace(/src="\/media/g, 'src="https://www.fmcityfest.cz/media');
            newsData.text = newsData.text.replace(/href="\/([^"]*)"/g, 'href="https://www.fmcityfest.cz/$1"');
            newsData.text = newsData.text.replace(/href="(media\/[^"]*)"/g, 'href="https://www.fmcityfest.cz/$1"');
          }

          setNews(newsData);
        } catch (apiError) {
          if (apiError instanceof Error && apiError.name === 'AbortError') return;
          if (!news && isMounted) throw apiError;
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        if (!isMounted) return;

        const apiError = err as ApiError;
        setError(apiError.message || 'Nepodařilo se načíst detail novinky');
        console.error('Error loading news detail:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadNewsDetail();
    return () => {
      isMounted = false;
    };
  }, [newsId]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.warn('Nešlo otevřít odkaz:', url, err);
    });
  };

  const renderHtmlContent = (html: string) => {
    const plainText = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    const paragraphs = plainText.split('\n').filter((p) => p.trim().length > 0);

    return (
      <View style={styles.htmlContent}>
        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={[globalStyles.text, styles.htmlParagraph ]}>
            {paragraph}
          </Text>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <ActivityIndicator size="large" color="#EA5178" />
      </View>
    );
  }

  if (error || !news) {
    return (
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <Header title="NOVINKY" />
        <View style={styles.content}>
          <Text style={[globalStyles.text, styles.errorText]}>{error || 'Novinka nebyla nalezena'}</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <ScrollView bounces={false} overScrollMode="never" refreshControl={undefined}>
          <Header title="NOVINKY" />
          <View style={styles.content}>
            {news.image_url && (
              <Image source={{ uri: news.image_url }} style={styles.newsImage} resizeMode="cover" />
            )}
            <Text style={[globalStyles.heading, styles.newsTitle ]}>{news.title}</Text>
            <Text style={[globalStyles.heading, styles.newsDate]}>{formatDate(news.date)}</Text>
            {news.text && renderHtmlContent(news.text)}
          </View>
        </ScrollView>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="white" style={styles.backIcon} />
          <Text style={[styles.backButtonText, globalStyles.bodyStrong]}>Zpět</Text>
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
  newsImage: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  newsTitle: {
    color: 'white',
    marginBottom: 8,
  },
  newsDate: {
    color: '#21AAB0',
  },
  htmlContent: {
    marginTop: 16,
  },
  htmlParagraph: {
    color: 'white',
    lineHeight: 24,
    marginBottom: 16,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    marginVertical: 20,
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
    fontSize: 14,
  },
});