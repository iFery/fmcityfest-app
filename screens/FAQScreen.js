import { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const iconMap = {
  'stage.png': require('../assets/icons/stage.png'),
  'tickets.png': require('../assets/icons/tickets.png'),
  'food.png': require('../assets/icons/food.png'),
  'parking.png': require('../assets/icons/parking.png'),
  'safety.png': require('../assets/icons/safety.png'),
  'ostatni.png': require('../assets/icons/ostatni.png'),
};

export default function FAQScreen() {
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openQuestion, setOpenQuestion] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const response = await fetch('https://www.fmcityfest.cz/api/mobile-app/faq.php');
        const data = await response.json();
        setFaqData(data);
      } catch (error) {
        console.error('❌ Error fetching FAQ:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaq();
  }, []);

  const toggleQuestion = (questionId) => {
    setOpenQuestion(openQuestion === questionId ? null : questionId);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002239' }}>
        <ActivityIndicator size="large" color="#2e86de" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#002239' }}>
      <ScrollView>
        <Header title="ČASTÉ DOTAZY" />
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }}>
          {faqData.map((category) => {
            const iconFileName = category.icon.replace('.svg', '.png');

            return (
              <View key={category.id} style={{ marginBottom: 32 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 10, marginBottom: 0, borderBottomWidth: 1, borderBottomColor: '#264E64' }}>
                  {iconMap[iconFileName] && (
                    <Image
                      source={iconMap[iconFileName]}
                      style={{ width: 30, height: 30, marginRight: 10 }}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>
                    {category.name}
                  </Text>
                </View>

                {category.faqs.map((faq) => (
                  <View key={faq.id} style={{ marginBottom: 0 }}>
                    <TouchableOpacity
                      onPress={() => toggleQuestion(faq.id)}
                      style={{
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#264E64',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: openQuestion === faq.id ? '#EA5178' : 'white'
                      }}>
                        {faq.otazka}
                      </Text>
                      <Ionicons
                        name={openQuestion === faq.id ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color={openQuestion === faq.id ? '#EA5178' : 'white'}
                      />
                    </TouchableOpacity>

                    {openQuestion === faq.id && (
                      <View style={{
                        marginTop: 8,
                        padding: 12,
                        backgroundColor: '#ffffff10',
                        borderRadius: 8,
                      }}>
                        <Text style={{ fontSize: 15, lineHeight: 22, color: 'white' }}>
                          {faq.odpoved}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floatovací tlačítko zpět */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          position: 'absolute',
          bottom: 60,
          left: 20,
          backgroundColor: '#EA5178',
          borderRadius: 30,
          paddingVertical: 10,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          elevation: 5,
        }}
      >
        <Ionicons name="arrow-back" size={20} color="white" style={{ marginRight: 8 }} />
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Zpět</Text>
      </TouchableOpacity>
    </View>
  );
}
