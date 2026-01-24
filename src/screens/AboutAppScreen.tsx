import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import Header from '../components/Header';
import { useTheme, typography } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../navigation/linking';

const HEADER_HEIGHT = 130;
const LOGO = require('../../assets/icon.png');
const SUPPORT_EMAIL = 'info@fmcityfest.cz';

interface InfoRowProps {
  label: string;
  value: string;
}

type AboutAppScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatDate(value?: string | number | Date | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long' }).format(date);
  } catch {
    return date.toLocaleDateString('cs-CZ');
  }
}

export default function AboutAppScreen() {
  const navigation = useNavigation<AboutAppScreenNavigationProp>();
  const { globalStyles } = useTheme();

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ||
    Constants.expoConfig?.android?.versionCode ||
    undefined;

  const lastUpdateLabel = useMemo(() => {
    const manifest2 = Constants.manifest2 as { createdAt?: string } | null;
    const legacyManifest = Constants.manifest as { publishedTime?: string } | null;
    const extras = (Constants.expoConfig?.extra as { lastUpdated?: string | number }) || {};

    return (
      formatDate(manifest2?.createdAt) ||
      formatDate(legacyManifest?.publishedTime) ||
      formatDate(extras.lastUpdated || undefined)
    );
  }, []);

  const versionLabel = buildNumber ? `${appVersion} (${buildNumber})` : appVersion;

  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.warn('Cannot open url', url, error);
    }
  };

  const handleAuthorPress = () => openLink('https://www.janfranc.cz');
  const handlePrivacyPress = () =>
    openLink('https://www.fmcityfest.cz/media/mobilni-aplikace-gdpr.pdf');

  const InfoRow = ({ label, value }: InfoRowProps) => (
    <View style={styles.infoRow}>
      <Text style={[globalStyles.subtitle, styles.infoLabel]}>{label}</Text>
      <Text style={[globalStyles.heading, styles.infoValue]}>{value}</Text>
    </View>
  );

  const LinkRow = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.linkRow} onPress={onPress} activeOpacity={0.85}>
      <Text style={[globalStyles.heading, styles.linkLabel]}>{label}</Text>
      <Ionicons name="open-outline" size={20} color="#8BE0FF" />
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="O APLIKACI" />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
          refreshControl={undefined}
        >
          <View style={styles.heroCard}>
            <Image source={LOGO} style={styles.logo} />
            <View style={styles.heroTextWrapper}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>OFICIÁLNÍ PRŮVODCE</Text>
              </View>
              <Text style={[globalStyles.title, styles.heroTitle]}>O aplikaci</Text>
              <Text style={[globalStyles.text, styles.heroSubtitle]}>
                Vše, co potřebuješ k FM CITY FEST — program, interpreti i praktické tipy v jedné appce.
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={[globalStyles.heading, styles.sectionTitle]}>Co je FM CITY FEST?</Text>
            <Text style={[globalStyles.text, styles.sectionText]}>
              Oficiální mobilní průvodce festivalem FM CITY FEST. Sleduj program, interprety a praktické informace
              na jednom místě.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={[globalStyles.heading, styles.sectionTitle]}>Pro koho je aplikace</Text>
            <Text style={[globalStyles.text, styles.sectionText]}>
              Pro všechny návštěvníky FM CITY FEST — ať už jsi tu poprvé nebo patříš mezi pravidelné účastníky.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={[globalStyles.heading, styles.sectionTitle]}>Kdo aplikaci vytvořil</Text>
            <Text style={[globalStyles.text, styles.sectionText]}>Aplikaci vytvořil Jan Franc.</Text>
            <LinkRow label="www.janfranc.cz" onPress={handleAuthorPress} />
          </View>

          <View style={styles.sectionCard}>
            <Text style={[globalStyles.heading, styles.sectionTitle]}>Verze aplikace</Text>
            <InfoRow label="Verze" value={versionLabel} />
            <InfoRow label="Poslední aktualizace" value={lastUpdateLabel || 'Bude doplněno po vydání'} />
          </View>

          <View style={styles.sectionCard}>
            <Text style={[globalStyles.heading, styles.sectionTitle]}>Kontakt & Podpora</Text>
            <Text style={[globalStyles.text, styles.sectionText]}>Podpora aplikace: {SUPPORT_EMAIL}</Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => navigation.navigate('Feedback')}
              activeOpacity={0.9}
            >
              <Ionicons name="chatbox" size={18} color="white" style={styles.ctaIcon} />
              <Text style={[globalStyles.button, styles.ctaLabel]}>Napsat zpětnou vazbu</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={[globalStyles.heading, styles.sectionTitle]}>Právní informace</Text>
            <LinkRow
              label="Zásady ochrany osobních údajů"
              onPress={handlePrivacyPress}
            />
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
            <Text style={[globalStyles.button, styles.backButtonText]}>Zpět na Více</Text>
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
    paddingBottom: 60,
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: '#0A3652',
    padding: 20,
    borderWidth: 1,
    borderColor: '#14486B',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: 16,
  },
  heroTextWrapper: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EA5178',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: '#E0EFFA',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#042640',
    padding: 20,
    borderWidth: 1,
    borderColor: '#0F3A58',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#8BE0FF',
    marginBottom: 8,
  },
  sectionText: {
    color: '#F5FBFF',
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  infoLabel: {
    color: '#A8C4D9',
  },
  infoValue: {
    color: '#FFFFFF',
  },
  linkRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  linkLabel: {
    color: '#FFFFFF',
  },
  ctaButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA5178',
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  ctaIcon: {
    marginRight: 8,
  },
  ctaLabel: {
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  backButton: {
    marginTop: 12,
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
