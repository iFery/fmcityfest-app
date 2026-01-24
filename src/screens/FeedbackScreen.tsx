import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import Header from '../components/Header';
import { useTheme, typography } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../navigation/linking';
import { submitFeedback } from '../services/feedbackService';

const HEADER_HEIGHT = 130;

const feedbackOptions = [
  { id: 'bug', label: 'Chyba (bug)' },
  { id: 'improvement', label: 'Návrh na vylepšení' },
  { id: 'other', label: 'Jiná zpětná vazba' },
];

const MAX_PHOTOS = 3;

type FeedbackScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const getFeedbackMetadata = () => {
  const fallbackSystemVersion =
    typeof Platform.Version === 'string'
      ? Platform.Version
      : Platform.Version != null
        ? String(Platform.Version)
        : undefined;

  const androidVersionCode = Constants.expoConfig?.android?.versionCode;
  const buildNumber =
    Constants.nativeBuildVersion ||
    (Platform.OS === 'ios'
      ? Constants.expoConfig?.ios?.buildNumber
      : androidVersionCode != null
        ? String(androidVersionCode)
        : undefined);

  return {
    appVersion: Constants.nativeAppVersion || Constants.expoConfig?.version || undefined,
    buildNumber: buildNumber || undefined,
    platform: Platform.OS,
    deviceModel: Device.modelName ?? Device.productName ?? undefined,
    systemVersion: Device.osVersion ?? fallbackSystemVersion,
  };
};

export default function FeedbackScreen() {
  const navigation = useNavigation<FeedbackScreenNavigationProp>();
  const { globalStyles } = useTheme();

  const [feedbackType, setFeedbackType] = useState(feedbackOptions[0].id);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitDisabled = useMemo(() => submitting || comment.trim().length === 0, [comment, submitting]);
  const feedbackMetadata = useMemo(() => getFeedbackMetadata(), []);

  const addPhotos = (newAssets: ImagePicker.ImagePickerAsset[]) => {
    if (newAssets.length === 0) return;
    setPhotos((prev) => {
      const available = MAX_PHOTOS - prev.length;
      if (available <= 0) {
        setErrorMessage(`Lze nahrát maximálně ${MAX_PHOTOS} fotek.`);
        return prev;
      }
      const allowedAssets = newAssets.slice(0, available);
      if (allowedAssets.length < newAssets.length) {
        setErrorMessage(`Lze nahrát maximálně ${MAX_PHOTOS} fotek.`);
      } else {
        setErrorMessage(null);
      }
      return [...prev, ...allowedAssets];
    });
  };

  const pickAsset = async (mode: 'camera' | 'library') => {
    try {
      if (mode === 'library') {
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryPermission.status !== 'granted') {
          setErrorMessage('Potřebujeme povolit přístup do galerie.');
          return;
        }
        if (photos.length >= MAX_PHOTOS) {
          setErrorMessage(`Lze nahrát maximálně ${MAX_PHOTOS} fotek.`);
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          allowsMultipleSelection: true,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        if (!result.canceled && result.assets.length > 0) {
          addPhotos(result.assets);
        }
      } else {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status !== 'granted') {
          setErrorMessage('Potřebujeme povolit přístup ke kameře.');
          return;
        }
        if (photos.length >= MAX_PHOTOS) {
          setErrorMessage(`Lze nahrát maximálně ${MAX_PHOTOS} fotek.`);
          return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (!result.canceled && result.assets?.length) {
          addPhotos(result.assets);
        }
      }
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Výběr fotky selhal. Zkus to prosím znovu.');
    }
  };

  const removePhoto = (uri: string) => {
    setPhotos((prev) => prev.filter((item) => item.uri !== uri));
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setErrorMessage('Komentář je povinný.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await submitFeedback({
        feedbackType,
        comment: comment.trim(),
        email: email.trim() || undefined,
        photos: photos.map((asset) => ({
          uri: asset.uri,
          mimeType: asset.mimeType,
          fileName: asset.fileName || asset.uri?.split('/').pop(),
        })),
        ...feedbackMetadata,
      });

      setSuccessMessage('Díky! Tvoji zpětnou vazbu jsme přijali.');
      setComment('');
      setEmail('');
      setPhotos([]);
    } catch (error) {
      console.log('[FeedbackScreen] Failed to submit feedback', error);
      const fallbackMessage = 'Odeslání selhalo. Zkus to prosím znovu.';
      if (error instanceof Error && error.message?.trim()) {
        setErrorMessage(error.message.trim());
      } else {
        setErrorMessage(fallbackMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="ZPĚTNÁ VAZBA" />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          overScrollMode="never"
        >
          <View style={styles.card}>
            <Text style={[globalStyles.heading, styles.sectionLabel]}>Typ zpětné vazby</Text>
            <View style={styles.optionsWrapper}>
              {feedbackOptions.map((option) => {
                const isActive = feedbackType === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.option, isActive && styles.optionActive]}
                    onPress={() => setFeedbackType(option.id)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isActive ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={isActive ? '#EA5178' : '#7EA2C4'}
                    />
                    <Text style={[globalStyles.text, styles.optionLabel]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={[globalStyles.heading, styles.sectionLabel]}>Tvůj komentář *</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Popiš prosím, s čím ti můžeme pomoct..."
              placeholderTextColor="#7A92A8"
              multiline
              textAlignVertical="top"
              style={[globalStyles.text, styles.textArea]}
            />
          </View>

          <View style={styles.card}>
            <Text style={[globalStyles.heading, styles.sectionLabel]}>E-mail (nepovinné)</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Pokud se máme ozvat zpět"
              placeholderTextColor="#7A92A8"
              keyboardType="email-address"
              autoCapitalize="none"
              style={[globalStyles.text, styles.textInput]}
            />
          </View>

          <View style={styles.card}>
            <Text style={[globalStyles.heading, styles.sectionLabel]}>Fotky (volitelné)</Text>
            {photos.length > 0 ? (
              <View style={styles.photoGrid}>
                {photos.map((item) => (
                  <View key={item.uri} style={styles.photoPreview}>
                    <Image source={{ uri: item.uri }} style={styles.photo} />
                    <TouchableOpacity
                      style={styles.removePhoto}
                      onPress={() => removePhoto(item.uri)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[globalStyles.caption, styles.photoHint]}>
                Přidej až {MAX_PHOTOS} screenshoty nebo fotky situace.
              </Text>
            )}
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => pickAsset('library')}
                activeOpacity={0.85}
              >
                <Ionicons name="image" size={18} color="#8BE0FF" style={styles.buttonIcon} />
                <Text style={[globalStyles.button, styles.secondaryButtonLabel]}>Vybrat z galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => pickAsset('camera')}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={18} color="#8BE0FF" style={styles.buttonIcon} />
                <Text style={[globalStyles.button, styles.secondaryButtonLabel]}>Vyfotit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {errorMessage && (
            <Text style={[globalStyles.text, styles.errorText]}>{errorMessage}</Text>
          )}

          {successMessage && (
            <Text style={[globalStyles.text, styles.successText]}>{successMessage}</Text>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isSubmitDisabled && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color="#FFF" style={styles.buttonIcon} />
                <Text style={[globalStyles.button, styles.submitLabel]}>Odeslat zpětnou vazbu</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            <Text style={[globalStyles.button, styles.backButtonText]}>Zpět</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#042640',
    padding: 20,
    borderWidth: 1,
    borderColor: '#0F3A58',
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#8BE0FF',
    marginBottom: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#063150',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  optionsWrapper: {
    marginTop: 4,
  },
  optionActive: {
    borderColor: '#EA5178',
    backgroundColor: '#0C3B5F',
  },
  optionLabel: {
    marginLeft: 12,
    color: '#FFFFFF',
  },
  textArea: {
    minHeight: 140,
    backgroundColor: '#063150',
    padding: 16,
    borderWidth: 1,
    borderColor: '#0F3A58',
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#063150',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#0F3A58',
    color: '#FFFFFF',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  photoPreview: {
    width: '48%',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 12,
  },
  photo: {
    width: '100%',
    height: 140,
  },
  removePhoto: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#00000080',
    padding: 6,
  },
  photoHint: {
    marginBottom: 14,
    color: '#8EA9C1',
  },
  photoActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1B4E72',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 12,
    marginBottom: 12,
  },
  secondaryButtonLabel: {
    color: '#FFFFFF',
    fontFamily: typography.fontFamily.medium,
  },
  buttonIcon: {
    marginRight: 8,
  },
  errorText: {
    color: '#FF9BB0',
    marginTop: 4,
    marginBottom: 4,
  },
  successText: {
    color: '#7AD1B6',
    marginTop: 4,
    marginBottom: 4,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#EA5178',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitLabel: {
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#214261',
  },
  backButtonText: {
    marginLeft: 8,
    color: '#FFFFFF',
  },
});
