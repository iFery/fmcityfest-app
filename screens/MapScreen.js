import React from 'react';
import { View, Image, Dimensions } from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import Header from '../components/Header';

const ZoomImageScreen = () => {
  return (
      <View style={{ flex: 1, backgroundColor: '#002239' }}>
          <Header title="ČASTÉ DOTAZY" />
      <ImageZoom
        cropWidth={Dimensions.get('window').width}
        cropHeight={Dimensions.get('window').height}
        imageWidth={300}
        imageHeight={400}
      >
        <Image
          style={{ width: 300, height: 400 }}
          source={{ uri: 'https://www.fmcityfest.cz/media/mapa-areal-2024.png' }}
          resizeMode="contain"
        />
      </ImageZoom>
    </View>
  );
};

export default ZoomImageScreen;

