import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Header from '../components/Header';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/cs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useNavigation } from '@react-navigation/native';
import { useRemoteConfig } from '../context/RemoteConfigProvider';

import {
  saveToCache,
  loadFromCache,
  getLastUpdate,
  setLastUpdate,
  removeFromCache
} from '../utils/cache';

dayjs.locale('cs');
dayjs.extend(utc);
dayjs.extend(localizedFormat);


console.log('Načtení ProgramScreen.js');
export default function ProgramScreen() {
  const [programData, setProgramData] = useState([]);
  const [day, setDay] = useState('dayOne');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigation = useNavigation();
  const { config: remoteConfig } = useRemoteConfig();
  const PIXELS_PER_HOUR = 80;

  const clearCache = async () => {
    try {
      await removeFromCache('cachedProgramData');
      await removeFromCache('cachedConfig');
      await removeFromCache('lastUpdate_timeline');
      Alert.alert('Cache vymazána', 'Lokální cache byla úspěšně smazána.');
      console.log('🧹 Cache cleared');
    } catch (err) {
      console.error('❌ Error clearing cache:', err);
    }
  };

  useEffect(() => {
    const fetchProgramIfNeeded = async () => {
      try {
        const latestTimelineUpdate = remoteConfig?.last_updates?.timeline;
        console.log('🌐 Last timeline update from config:', latestTimelineUpdate);

        const lastFetched = await getLastUpdate('timeline');
        console.log('📱 Last local timeline update:', lastFetched);

        const shouldFetch = !lastFetched || new Date(latestTimelineUpdate) > new Date(lastFetched);

        if (shouldFetch) {
          console.log('📥 Fetching updated program data...');
          const response = await fetch('https://www.fmcityfest.cz/api/mobile-app/timeline.php');
          const data = await response.json();

          console.log(`📊 Downloaded events count: ${data.events.length}`);

          setProgramData(data.events);
          setConfig(data.config);

          await setLastUpdate('timeline', latestTimelineUpdate);
          await saveToCache('cachedProgramData', data.events);
          await saveToCache('cachedConfig', data.config);
          console.log('💾 Cache saved successfully.');
        } else {
          console.log('✅ Using cached program data');

          const cachedEvents = await loadFromCache('cachedProgramData');
          const cachedConfig = await loadFromCache('cachedConfig');

          if (cachedEvents && cachedConfig) {
            console.log(`📦 Cached events count: ${cachedEvents.length}`);
            console.log('🧪 First 3 cached events:', cachedEvents.slice(0, 3).map(e => ({ name: e.name, start: e.start, end: e.end, photo: e.photo_artist?.url })));
            setProgramData(cachedEvents);
            setConfig(cachedConfig);
          } else {
            console.warn('⚠️ No cached data found, fallback to fetching!');
            const response = await fetch('https://www.fmcityfest.cz/api/mobile-app/timeline.php');
            const data = await response.json();

            setProgramData(data.events);
            setConfig(data.config);

            await setLastUpdate('timeline', latestTimelineUpdate);
            await saveToCache('cachedProgramData', data.events);
            await saveToCache('cachedConfig', data.config);
            console.log('💾 Cache saved after fallback.');
          }
        }
      } catch (error) {
        console.error('❌ Error fetching program data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (remoteConfig?.last_updates?.timeline) {
      fetchProgramIfNeeded();
    }
  }, [remoteConfig]);

  if (loading || !config) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002239' }}>
        <ActivityIndicator size="large" color="#21AAB0" />
      </View>
    );
  }

  const currentDayStart = dayjs(config[day].start);
  const currentDayEnd = dayjs(config[day].end);

  const stages = [...new Set(programData.map((event) => event.stage))];
  const dayEvents = programData.filter(
    (event) => dayjs(event.start).isSame(currentDayStart, 'day')
  );

  console.log(`🕒 Total events in selected day (${day}): ${dayEvents.length}`);

  const timeline = [];
  let timePointer = currentDayStart.clone();
  while (timePointer.isBefore(currentDayEnd)) {
    timeline.push(timePointer.format('HH:mm'));
    timePointer = timePointer.add(1, 'hour');
  }

  const stageColors = {
    'stage-1': '#64B4B8',
    'stage-2': '#D14D75',
  };

  const stageColorsArtist = {
    'stage-1': '#126277',
    'stage-2': '#644161',
  };

  const handleEventPress = (interpretId) => {
    navigation.navigate('ArtistDetail', { id: interpretId });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#002239' }}>
      <Header title="Program" />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 20 }}>
        {['dayOne', 'dayTwo'].map((d, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setDay(d)}
            style={{
              marginHorizontal: 0,
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 0,
              backgroundColor: day === d ? '#D14D75' : '#1A3B5A',
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
              {dayjs(config[d].start).format('dd D. M. YYYY')}
            </Text>
            <Text style={{ color: 'white', fontSize: 12, marginTop: 2, textAlign: 'center' }}>
              {dayjs(config[d].start).format('HH:mm')} - {dayjs(config[d].end).format('HH:mm')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={clearCache}
        style={{ backgroundColor: '#D14D75', marginHorizontal: 20, padding: 10, borderRadius: 5, marginBottom: 20 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Vymazat cache programu</Text>
      </TouchableOpacity>

      <ScrollView horizontal>
        <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>
          <View style={{ width: 60, paddingTop: 45 }}>
            {timeline.map((time, idx) => (
              <View key={idx} style={{ height: PIXELS_PER_HOUR, justifyContent: 'flex-start' }}>
                <Text style={{ fontSize: 12, color: 'white' }}>{time}</Text>
              </View>
            ))}
          </View>

          {stages.map((stage, stageIdx) => (
            <View key={stageIdx} style={{ width: 140, marginRight: 10 }}>
              <View style={{
                backgroundColor: stageColors[stage] || '#ccc',
                borderRadius: 0,
                paddingVertical: 10,
                alignItems: 'center',
                marginBottom: 0
              }}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  {programData.find(e => e.stage === stage)?.stage_name || stage}
                </Text>
                <Text style={{ fontSize: 10, color: 'white' }}>STAGE</Text>
              </View>

              <View style={{ position: 'relative', backgroundColor: '#002239' }}>
                {timeline.map((_, blockIdx) => (
                  <View
                    key={blockIdx}
                    style={{
                      height: PIXELS_PER_HOUR,
                      backgroundColor: '#0A3652',
                      borderBottomWidth: 1,
                      borderBottomColor: '#002239',
                    }}
                  />
                ))}

                {dayEvents
                  .filter(event => event.stage === stage)
                  .map((event, idx) => {
                    const start = dayjs(event.start);
                    const end = dayjs(event.end);

                    const startMinutes = start.diff(currentDayStart, 'minute');
                    const durationMinutes = end.diff(start, 'minute');

                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleEventPress(event.interpret_id)}
                        style={{
                          position: 'absolute',
                          top: (startMinutes / 60) * PIXELS_PER_HOUR,
                          height: (durationMinutes / 60) * PIXELS_PER_HOUR,
                          left: 0,
                          right: 0,
                          backgroundColor: stageColorsArtist[stage] || '#555',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>
                          {event.name}
                        </Text>
                        <Text style={{ color: 'white', fontSize: 9, textAlign: 'center', marginTop: 2 }}>
                          {start.format('HH:mm')} - {end.format('HH:mm')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}
