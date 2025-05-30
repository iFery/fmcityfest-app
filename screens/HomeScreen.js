import { View, Text, ImageBackground, TouchableOpacity, Linking, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useState } from 'react';
import Modal from 'react-native-modal';
import { WebView } from 'react-native-webview';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRemoteConfig } from '../context/RemoteConfigProvider';

export default function HomeScreen({ navigation }) {
  const backgroundImage = require('../assets/background-hp.png');
  const logoImage = require('../assets/logo.png');

  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { config, loading } = useRemoteConfig();

  if (loading || !config) {
    return <ActivityIndicator size="large" color="#21AAB0" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  const videoId = config.after_movie_video_id;
  const buttons = config.home_buttons || [];

  const handleButtonPress = (btn) => {
    if (btn.action === 'screen') {
      navigation.navigate(btn.target, btn.params || {});
    } else if (btn.action === 'url') {
      Linking.openURL(btn.target);
    }
  };

  return (
    <ImageBackground source={backgroundImage} style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>

        {/* Horní část */}
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Image source={logoImage} style={{ width: 180, height: 60, resizeMode: 'contain' }} />
          <Text style={{ color: 'white', marginTop: 10, fontSize: 18 }}>7. ročník</Text>
        </View>

        {/* Střed */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold', textAlign: 'center' }}>
            27.–28. 6. 2025
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
            <Ionicons name="location-outline" size={18} color="#21AAB0" />
            <Text style={{ color: 'white', marginLeft: 5, textAlign: 'center' }}>
              Lembergerova textilní továrna, Frýdek-Místek
            </Text>
          </View>

          <View style={{ marginTop: 30, alignItems: 'center' }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>
              KABÁT · RUDIM3NTAL
            </Text>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginTop: 10 }}>
              X AMBASSADORS · BAKERMAT · CHINASKI
            </Text>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center', marginTop: 5 }}>
              MIRAI · EWA FARNA · WANASTOWI VJECY
            </Text>
          </View>
        </View>

        {/* Dynamická tlačítka */}
        <View style={{ gap: 10, marginTop: 40 }}>
          {buttons.map((button, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleButtonPress(button)}
              style={{
                backgroundColor: '#21AAB0',
                paddingVertical: 20,
                paddingHorizontal: 20,
                borderRadius: 10,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={button.icon || 'ellipse'} size={24} color="white" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{button.label}</Text>
                  {button.subtext && (
                    <Text style={{ color: 'white', fontSize: 12 }}>{button.subtext}</Text>
                  )}
                </View>
              </View>
              <Ionicons name="arrow-forward-outline" size={20} color="white" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Spodní část */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}
            onPress={() => {
              setModalVisible(true);
              setIsLoading(true);
            }}
          >
            <Ionicons name="play-circle-outline" size={24} color="white" />
            <Text style={{ color: 'white', marginLeft: 8, fontSize: 16 }}>Aftermovie 2024</Text>
          </TouchableOpacity>
        </View>

        {/* MODÁL */}
        <Modal 
          isVisible={isModalVisible} 
          onBackdropPress={() => setModalVisible(false)} 
          style={{ margin: 0, justifyContent: 'center', alignItems: 'center' }}
        >
          <View style={{ width: '90%', aspectRatio: 16/9, backgroundColor: 'black', borderRadius: 8, overflow: 'hidden' }}>
            <WebView
              source={{ uri: `https://www.youtube.com/embed/${videoId}?autoplay=1` }}
              allowsFullscreenVideo
              javaScriptEnabled
              onLoadEnd={() => setIsLoading(false)}
            />
            {isLoading && (
              <View style={{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
                <ActivityIndicator size="large" color="#21AAB0" />
              </View>
            )}
            <TouchableOpacity
              style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close-circle" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
}
