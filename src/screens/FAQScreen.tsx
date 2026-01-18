import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/linking';
import Header from '../components/Header';
import { useFAQ } from '../hooks/useFAQ';
import type { FAQCategory } from '../types';

const HEADER_HEIGHT = 130;

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableFAQItemProps {
  item: FAQCategory['faqs'][0];
  isExpanded: boolean;
  onToggle: () => void;
}

function ExpandableFAQItem({ item, isExpanded, onToggle }: ExpandableFAQItemProps) {
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onToggle();
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.faqQuestionText}>{item.otazka}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#21AAB0"
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.faqAnswerText}>{item.odpoved}</Text>
        </View>
      )}
    </View>
  );
}

type FAQScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function FAQScreen() {
  const navigation = useNavigation<FAQScreenNavigationProp>();
  const { faq, loading, error } = useFAQ();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
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
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <Header title="ČASTÉ DOTAZY" />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          bounces={false} 
          overScrollMode="never"
          refreshControl={undefined}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          <View style={styles.content}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : faq.length === 0 ? (
              <Text style={styles.errorText}>Žádné FAQ nejsou k dispozici</Text>
            ) : (
              faq.map((category) => (
                <View key={category.id} style={styles.category}>
                  <Text style={styles.categoryTitle}>{category.name}</Text>
                  {category.faqs.map((item) => (
                    <ExpandableFAQItem
                      key={item.id}
                      item={item}
                      isExpanded={expandedItems.has(item.id)}
                      onToggle={() => toggleItem(item.id)}
                    />
                  ))}
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
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#002239',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  category: {
    marginBottom: 22,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 12,
    backgroundColor: '#0A3652',
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#224259',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#224259',
    backgroundColor: '#0A3652',
  },
  faqAnswerText: {
    fontSize: 15,
    color: '#CCC',
    lineHeight: 22,
    paddingTop: 12,
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
