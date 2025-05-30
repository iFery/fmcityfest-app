import React, { useState } from 'react';
import {
  View,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDecay,
  runOnJS,
} from 'react-native-reanimated';
import { clamp } from 'react-native-redash'; // add this helper or write your own
import Ionicons from 'react-native-vector-icons/Ionicons';
import Header from '../components/Header';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const IMAGE_URL = 'https://www.fmcityfest.cz/media/mapa-areal-2024.png';

export default function MapScreen() {
  const [loading, setLoading] = useState(true);

  // shared values for transformations
  const scale = useSharedValue(1);
  const baseScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const onLoadEnd = () => runOnJS(setLoading)(false);

  // pinch gesture
  const pinch = Gesture.Pinch()
    .onStart(() => {
      baseScale.value = scale.value;
    })
    .onUpdate(e => {
      scale.value = baseScale.value * e.scale;
      focalX.value = e.focalX - SCREEN_W / 2;
      focalY.value = e.focalY - SCREEN_H / 2;
    })
    .onEnd(() => {
      // clamp scale between 1 and 4
      scale.value = withTiming(
        Math.max(1, Math.min(scale.value, 4)),
        { duration: 200 }
      );
    });

  const getBoundaries = () => {
    'worklet';
    const scaledWidth = SCREEN_W * scale.value;
    const scaledHeight = (SCREEN_H - 100) * scale.value;

    const maxX = Math.max((scaledWidth - SCREEN_W) / 2, 0);
    const maxY = Math.max((scaledHeight - (SCREEN_H - 100)) / 2, 0);

    return { maxX, maxY };
  };

  // pan gesture
const pan = Gesture.Pan()
  .onUpdate(e => {
    const { maxX, maxY } = getBoundaries();

    const dx = typeof e.changeX === 'number' ? e.changeX : 0;
    const dy = typeof e.changeY === 'number' ? e.changeY : 0;

    translateX.value = clamp(translateX.value + dx, -maxX, maxX);
    translateY.value = clamp(translateY.value + dy, -maxY, maxY);
  })
  .onEnd(e => {
    const { maxX, maxY } = getBoundaries();

    // Apply decay but clamp result after
    translateX.value = withDecay({
      velocity: e.velocityX,
      clamp: [-maxX, maxX],
    });
    translateY.value = withDecay({
      velocity: e.velocityY,
      clamp: [-maxY, maxY],
    });
  });

  // combine gestures
  const gesture = Gesture.Simultaneous(pan, pinch);

  // animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { translateX: focalX.value },
      { translateY: focalY.value },
      { scale: scale.value },
      { translateX: -focalX.value },
      { translateY: -focalY.value },
    ],
  }));

  // zoom buttons
  const zoomIn = () => {
    scale.value = withTiming(Math.min(scale.value * 1.2, 4), { duration: 200 });
    baseScale.value = scale.value;
  };
  const zoomOut = () => {
    scale.value = withTiming(Math.max(scale.value / 1.2, 1), { duration: 200 });
    baseScale.value = scale.value;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Header title="Mapa areálu" />

        {loading && (
          <ActivityIndicator
            size="large"
            color="#EA5178"
            style={StyleSheet.absoluteFill}
          />
        )}

        <GestureDetector gesture={gesture}>
          <Animated.Image
            source={{ uri: IMAGE_URL }}
            style={[styles.image, animatedStyle]}
            onLoadEnd={onLoadEnd}
            resizeMode="contain"
          />
        </GestureDetector>

        <View style={styles.buttons}>
          <TouchableOpacity onPress={zoomIn} style={styles.zoomBtn}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={zoomOut}
            style={[styles.zoomBtn, { marginTop: 8 }]}
          >
            <Ionicons name="remove" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  headerBackground: {
    width: '100%',
    height: 100, // <-- přidáno
  },
  container: { flex: 1, backgroundColor: '#002239' },
  image: {
    width: SCREEN_W,
    height: SCREEN_H - 100, // reserve space for header
  },
  buttons: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    backgroundColor: '#0A3652',
    padding: 8,
    borderRadius: 8,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
