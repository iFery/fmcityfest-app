import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CommonActions, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useTheme } from '../theme/ThemeProvider';
import Header from '../components/Header';
import { sharedProgramApi } from '../api/endpoints';
import { ApiError } from '../api/client';
import { useFavorites } from '../hooks/useFavorites';
import { useTimeline } from '../contexts/TimelineContext';
import { useArtists } from '../hooks/useArtists';
import type { RootStackParamList } from '../navigation/linking';
import { logEvent } from '../services/analytics';
import { useScreenView } from '../hooks/useScreenView';

dayjs.locale('cs');
dayjs.extend(localizedFormat);

const HEADER_HEIGHT = 130;

type SharedProgramRouteProp = RouteProp<RootStackParamList, 'SharedProgram'>;
type SharedProgramNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SharedProgram'>;

interface TimelineEvent {
  id?: string;
  name?: string;
  interpret_id?: number;
  stage_name?: string;
  start?: string;
  end?: string;
  image?: string;
  [key: string]: unknown;
}

export default function SharedProgramScreen() {
  const navigation = useNavigation<SharedProgramNavigationProp>();
  const route = useRoute<SharedProgramRouteProp>();
  const { code } = route.params;
  const { globalStyles } = useTheme();
  const { favoriteEvents, setFavorites } = useFavorites();
  const { timelineData, loading: timelineLoading } = useTimeline();
  const { artists, loading: artistsLoading } = useArtists();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [sharedIds, setSharedIds] = useState<string[]>([]);
  const [loadingShared, setLoadingShared] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useScreenView('SharedProgram');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingShared(true);
      setError(null);
      try {
        const response = await sharedProgramApi.get(code.toUpperCase());
        if (cancelled) return;

        const normalized = Array.from(
          new Set(
            response.data.items
              .map((id) => String(id).trim())
              .filter((id) => id.length > 0)
          )
        );
        setSharedIds(normalized);
        console.log('[SharedProgram] Loaded IDs', {
          code,
          totalFromServer: response.data.items.length,
          normalizedCount: normalized.length,
          sample: normalized.slice(0, 5),
        });
      } catch (err) {
        if (cancelled) return;
        console.error('Shared program fetch failed', err);
        let message = 'Sdílený program se nepodařilo načíst. Zkus to prosím znovu.';
        if (err instanceof ApiError) {
          const data = err.data as Record<string, unknown> | undefined;
          if (data && typeof data.message === 'string' && data.message.trim()) {
            message = data.message;
          }
        }
        setError(message);
        setSharedIds([]);
      } finally {
        if (!cancelled) {
          setLoadingShared(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const eventsMap = useMemo(() => {
    const map = new Map<string, TimelineEvent>();
    if (!timelineData) return map;
    const events = timelineData.events as TimelineEvent[];
    events.forEach((event) => {
      const eventId = event.id ? String(event.id).trim() : null;
      if (eventId) {
        map.set(eventId, event);
      }
    });
    return map;
  }, [timelineData]);

  const sharedEvents = useMemo(() => {
    const mapped = sharedIds
      .map((id) => eventsMap.get(id))
      .filter((event): event is TimelineEvent => Boolean(event && event.start))
      .sort((a, b) => {
        const startA = a.start ? new Date(a.start).getTime() : 0;
        const startB = b.start ? new Date(b.start).getTime() : 0;
        return startA - startB;
      });
    console.log('[SharedProgram] Mapped events', {
      code,
      sharedIdsCount: sharedIds.length,
      matchedEvents: mapped.length,
      haveTimeline: Boolean(timelineData),
      eventsInTimeline: timelineData?.events?.length ?? 0,
    });
    if (sharedIds.length && mapped.length === 0) {
      console.log('[SharedProgram] No events matched', {
        firstId: sharedIds[0],
        timelineSample: Array.from(eventsMap.keys()).slice(0, 5),
      });
    }
    return mapped;
  }, [sharedIds, eventsMap]);

  const eventsByDay = useMemo(() => {
    const byDay: Record<string, TimelineEvent[]> = {};
    sharedEvents.forEach((event) => {
      if (!event.start) return;
      const dayKey = dayjs(event.start).format('YYYY-MM-DD');
      if (!byDay[dayKey]) {
        byDay[dayKey] = [];
      }
      byDay[dayKey].push(event);
    });
    return byDay;
  }, [sharedEvents]);

  const missingCount = Math.max(sharedIds.length - sharedEvents.length, 0);
  const loading = loadingShared || timelineLoading || artistsLoading;
  const disableActions = loading || !!error || sharedIds.length === 0;

  const getArtistName = useCallback(
    (artistId: number | string) =>
      artists.find((a) => String(a.id) === String(artistId))?.name || `Neznámý interpret (${artistId})`,
    [artists]
  );

  const getArtistImage = useCallback(
    (artistId: number | string) =>
      artists.find((a) => String(a.id) === String(artistId))?.image || null,
    [artists]
  );

  const handleImageError = useCallback((artistId: number | string) => {
    setImageErrors((prev) => ({ ...prev, [String(artistId)]: true }));
  }, []);

  const handleEventPress = useCallback(
    (event: TimelineEvent) => {
      if (!event.interpret_id) return;
      navigation.navigate('ArtistDetail', {
        artistId: event.interpret_id.toString(),
        artistName: event.name || getArtistName(event.interpret_id),
      });
    },
    [navigation, getArtistName]
  );

  const exitToFavoritesHome = useCallback(() => {
    const parent = navigation.getParent();
    if (parent) {
      console.log('[SharedProgram] Switching tab to FavoritesMain');
      parent.navigate({
        name: 'Favorites' as never,
        params: {
          screen: 'FavoritesMain',
        },
      } as never);
    }
    console.log('[SharedProgram] Resetting Favorites stack to FavoritesMain');
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'FavoritesMain' as const }],
      })
    );
  }, [navigation]);

  const handleMergeFavorites = useCallback(() => {
    if (!sharedIds.length) return;
    const merged = Array.from(new Set([...favoriteEvents, ...sharedIds]));
    console.log('[SharedProgram] Merge favorites', {
      previousCount: favoriteEvents.length,
      incomingCount: sharedIds.length,
      mergedCount: merged.length,
    });
    setFavorites(merged);
    logEvent('shared_program_action', { action: 'merge', code, shared_count: sharedIds.length });
    exitToFavoritesHome();
  }, [favoriteEvents, setFavorites, sharedIds, exitToFavoritesHome, code]);

  const confirmReplaceFavorites = useCallback(() => {
    if (!sharedIds.length) return;
    Alert.alert(
      'Nahradit můj program?',
      'Tímto smažeš aktuální výběr a nahradíš ho sdíleným programem.',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Nahradit',
          style: 'destructive',
          onPress: () => {
            console.log('[SharedProgram] Replace favorites', {
              previousCount: favoriteEvents.length,
              incomingCount: sharedIds.length,
            });
            setFavorites(sharedIds);
            logEvent('shared_program_action', { action: 'replace', code, shared_count: sharedIds.length });
            exitToFavoritesHome();
          },
        },
      ]
    );
  }, [sharedIds, setFavorites, exitToFavoritesHome, code, favoriteEvents.length]);

  const closeScreen = useCallback(() => {
    exitToFavoritesHome();
  }, [exitToFavoritesHome]);

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.stickyHeader}>
          <Header title="SDÍLENÝ PROGRAM" />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 }]}
          bounces={false}
        >
          <View style={styles.banner}>
            <View style={styles.bannerIconWrapper}>
              <Ionicons name="link-outline" size={20} color="#EA5178" />
            </View>
            <View style={styles.bannerTextWrapper}>
              <Text style={[globalStyles.caption, styles.bannerLabel]}>Sdílený program</Text>
              <Text style={[globalStyles.heading, styles.bannerTitle]}>Tento program není uložen ve tvé aplikaci</Text>
              <Text style={[globalStyles.text, styles.bannerDescription]}>
                Rozhodni se, zda ho přidáš ke svému programu nebo jím nahradíš ten aktuální.
              </Text>
            </View>
            <View style={styles.codeBadge}>
              <Text style={[globalStyles.caption, styles.codeLabel]}>Kód</Text>
              <Text style={[globalStyles.heading, styles.codeValue]}>{code.toUpperCase()}</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.stateContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#EA5178" />
              <Text style={[globalStyles.heading, styles.stateTitle]}>Kód nelze načíst</Text>
              <Text style={[globalStyles.text, styles.stateDescription]}>{error}</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={closeScreen}>
                <Text style={styles.secondaryButtonText}>Zavřít</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#EA5178" />
              <Text style={[globalStyles.text, styles.stateDescription]}>Načítám sdílený program…</Text>
            </View>
          ) : sharedEvents.length === 0 ? (
            <View style={styles.stateContainer}>
              <Ionicons name="hourglass-outline" size={48} color="#EA5178" />
              <Text style={[globalStyles.heading, styles.stateTitle]}>Program je prázdný</Text>
              <Text style={[globalStyles.text, styles.stateDescription]}>
                Vypadá to, že program neobsahuje žádné koncerty. Požádej kamaráda o nový kód.
              </Text>
            </View>
          ) : (
            <>
              {missingCount > 0 && (
                <View style={styles.noticeBox}>
                  <Ionicons name="information-circle-outline" size={18} color="#F4B63F" />
                  <Text style={[globalStyles.caption, styles.noticeText]}>
                    {missingCount} položek se nepodařilo spárovat (možná byly odebrány z programu).
                  </Text>
                </View>
              )}

              {Object.entries(eventsByDay)
                .sort(([a], [b]) => dayjs(a).valueOf() - dayjs(b).valueOf())
                .map(([dayKey, dayEvents]) => {
                  const dayDate = dayjs(dayKey);
                  const dayLabel = dayDate.isSame(dayjs(), 'day')
                    ? 'Dnes'
                    : dayDate.format('dddd D. MMMM');

                  return (
                    <View key={dayKey} style={styles.daySection}>
                      <View style={styles.dayHeader}>
                        <Text style={[globalStyles.heading, styles.dayTitle]}>
                          {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                        </Text>
                        <Text style={[globalStyles.caption, styles.dayCount]}>({dayEvents.length})</Text>
                      </View>

                      {dayEvents.map((event) => {
                        if (!event.id || !event.start || !event.interpret_id) return null;
                        const start = dayjs(event.start);
                        const end = dayjs(event.end || event.start);
                        const artistId = event.interpret_id;
                        const img = getArtistImage(artistId);
                        const hasError = imageErrors[String(artistId)];

                        return (
                          <TouchableOpacity
                            key={event.id}
                            style={styles.eventCard}
                            activeOpacity={0.7}
                            onPress={() => handleEventPress(event)}
                          >
                            {img && !hasError ? (
                              <Image
                                source={{ uri: img }}
                                style={styles.artistPhoto}
                                onError={() => handleImageError(artistId)}
                              />
                            ) : (
                              <View style={styles.artistPhotoPlaceholder}>
                                <Ionicons name="musical-notes" size={18} color="#666" />
                              </View>
                            )}

                            <View style={styles.eventInfo}>
                              <Text style={[globalStyles.heading, styles.artistName]} numberOfLines={2}>
                                {event.name || getArtistName(artistId)}
                              </Text>
                              <View style={styles.eventDetailsRow}>
                                {event.stage_name && (
                                  <Text style={[globalStyles.caption, styles.stage]}>{event.stage_name} stage</Text>
                                )}
                                <Text style={[globalStyles.caption, styles.time]}>
                                  {start.format('HH:mm')} – {end.format('HH:mm')}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
            </>
          )}
        </ScrollView>

        <View style={[styles.actionsWrapper, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <TouchableOpacity
            style={[styles.primaryButton, disableActions && styles.primaryButtonDisabled]}
            disabled={disableActions}
            onPress={handleMergeFavorites}
          >
            <Text style={styles.primaryButtonText}>PŘIDAT DO MÉHO PROGRAMU</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerButton, (disableActions || sharedIds.length === 0) && styles.dangerButtonDisabled]}
            disabled={disableActions || sharedIds.length === 0}
            onPress={confirmReplaceFavorites}
          >
            <Text style={styles.dangerButtonText}>Nahradit můj program</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={closeScreen}>
            <Text style={styles.secondaryButtonText}>Zavřít</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: HEADER_HEIGHT + 16,
    paddingHorizontal: 16,
  },
  banner: {
    backgroundColor: '#0A3652',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E4A6B',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  bannerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#021628',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerTextWrapper: {
    flex: 1,
  },
  bannerLabel: {
    color: '#8AB9D6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  bannerTitle: {
    color: '#fff',
    marginBottom: 6,
  },
  bannerDescription: {
    color: '#9DB5C9',
  },
  codeBadge: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  codeLabel: {
    color: '#8AB9D6',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 1,
  },
  codeValue: {
    color: '#fff',
    fontSize: 20,
    letterSpacing: 2,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  stateTitle: {
    color: '#fff',
    marginTop: 16,
    marginBottom: 6,
  },
  stateDescription: {
    color: '#9DB5C9',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2B12',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#5B4A16',
    marginBottom: 20,
  },
  noticeText: {
    color: '#F4B63F',
    marginLeft: 8,
  },
  daySection: {
    marginBottom: 28,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A3B5A',
    paddingBottom: 6,
  },
  dayTitle: {
    color: '#EA5178',
    marginRight: 8,
  },
  dayCount: {
    color: '#9DB5C9',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#052841',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#0F3A55',
    marginBottom: 12,
  },
  artistPhoto: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 12,
  },
  artistPhotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#0F3049',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  artistName: {
    color: '#fff',
    marginBottom: 6,
  },
  eventDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stage: {
    color: '#9DB5C9',
  },
  time: {
    color: '#fff',
    fontFamily: 'Unbounded_600SemiBold',
  },
  actionsWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00182B',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#0A3652',
  },
  primaryButton: {
    backgroundColor: '#EA5178',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: '#96445B',
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: 'Unbounded_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  dangerButton: {
    borderRadius: 999,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EA5178',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonDisabled: {
    borderColor: '#6D2F42',
    opacity: 0.6,
  },
  dangerButtonText: {
    color: '#EA5178',
    fontFamily: 'Unbounded_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1E4A6B',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#8AB9D6',
    fontFamily: 'Unbounded_500Medium',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
