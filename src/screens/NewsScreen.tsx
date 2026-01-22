/**
 * News Screen
 * Displays list of all news articles
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/linking';
import Header from '../components/Header';
import { useNews } from '../hooks/useNews';
import type { News } from '../types';
import { useTheme } from '../theme/ThemeProvider';

type NewsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function NewsScreen() {
  const { globalStyles } = useTheme();
  const navigation = useNavigation<NewsScreenNavigationProp>();
  const { news, loading, error } = useNews();

  const handleNewsPress = (newsItem: News) => {
    navigation.navigate('NewsDetail', {
      newsId: newsItem.id,
      newsTitle: newsItem.title,
    });
  };

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }, []);

  const renderNewsItem = useCallback(
    ({ item }: { item: News }) => (
      <TouchableOpacity
        style={styles.newsItem}
        onPress={() => handleNewsPress(item)}
        activeOpacity={0.8}
      >
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            style={styles.newsImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.newsContent}>
          <Text style={[globalStyles.heading, styles.newsTitle, ]}>{item.title}</Text>
          <Text style={[globalStyles.subtitle, styles.newsDate, ]}>
            {formatDate(item.date)}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [handleNewsPress, formatDate, globalStyles]
  );

  const keyExtractor = useCallback((item: News) => item.id, []);

  const listHeaderComponent = useMemo(() => <Header title="NOVINKY" />, []);

  const listEmptyComponent = useMemo(() => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={[globalStyles.text, styles.errorText]}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={[globalStyles.text, styles.errorText]}>
          Žádné novinky nejsou k dispozici
        </Text>
      </View>
    );
  }, [error, globalStyles]);

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
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeaderComponent}
          ListEmptyComponent={listEmptyComponent}
          contentContainerStyle={styles.content}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={10}
          bounces={false}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="white" style={styles.backIcon} />
          <Text style={[globalStyles.heading, styles.backButtonText, ]}>Zpět</Text>
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
    paddingTop: 0,
    paddingBottom: 50,
    flexGrow: 1,
  },
  emptyContainer: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  newsItem: {
    backgroundColor: '#0A3652',
    marginHorizontal: 20,
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
    marginBottom: 8,
  },
  newsDate: {
    color: '#21AAB0',
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