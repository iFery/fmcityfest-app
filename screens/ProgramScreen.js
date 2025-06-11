import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, StatusBar } from 'react-native';
import Header from '../components/Header';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/cs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { useNavigation } from '@react-navigation/native';
import { useRemoteConfig } from '../context/RemoteConfigProvider';
import { loadFromCache } from '../utils/cache';
import { loadFestivalData } from '../utils/dataLoader';

dayjs.locale('cs');
dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.extend(isSameOrAfter);

export default function ProgramScreen() {
  const [programData, setProgramData] = useState([]);
  const [stagesConfig, setStagesConfig] = useState([]);
  const [day, setDay] = useState('dayOne');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const navigation = useNavigation();
  const { config: remoteConfig } = useRemoteConfig();
  const PIXELS_PER_HOUR = 80;

  const loadData = async (forceRefresh = false) => {
    try {
      setError(null);
      const result = await loadFestivalData({ forceRefresh });
      
      if (!result || !result.program) {
        throw new Error('Nepodařilo se načíst data');
      }

      const { program } = result;
      
      if (!program.events || !program.config || !program.stages) {
        throw new Error('Neplatná struktura dat');
      }

      setProgramData(program.events);
      setConfig(program.config);
      setStagesConfig(program.stages);
    } catch (err) {
      console.error('❌ Error loading program data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002239' }}>
        <ActivityIndicator size="large" color="#21AAB0" />
        <Text style={{ color: '#ffffff', marginTop: 20 }}>
          Načítám program...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002239' }}>
        <Text style={{ color: '#ffffff', textAlign: 'center', padding: 20 }}>
          {error}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#21AAB0',
            padding: 15,
          }}
          onPress={() => {
            setLoading(true);
            setError(null);
            loadData(true);
          }}
        >
          <Text style={{ color: '#ffffff' }}>Zkusit znovu</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!config) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002239' }}>
        <Text style={{ color: '#ffffff', textAlign: 'center', padding: 20 }}>
          Program není momentálně dostupný
        </Text>
      </View>
    );
  }

  const currentDayStart = dayjs(config[day].start);
  const currentDayEnd = dayjs(config[day].end);

  // uděláme si mapu stage → její data
  const stageMap = stagesConfig.reduce((acc, s) => {
    acc[s.stage] = s;
    return acc;
  }, {});

  // eventy jen v intervalu dne
  const dayEvents = programData.filter(ev => {
    const start = dayjs(ev.start);
    return start.isSameOrAfter(currentDayStart) && start.isBefore(currentDayEnd);
  });

  // timeline hodin
  const timeline = [];
  let p = currentDayStart.clone();
  while (p.isBefore(currentDayEnd)) {
    timeline.push(p.format('HH:mm'));
    p = p.add(1, 'hour');
  }

  const handleEventPress = id => {
    navigation.navigate('ArtistDetail', { id });
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ScrollView 
        style={{ flex: 1, backgroundColor: '#002239' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#21AAB0']}
            tintColor="#21AAB0"
          />
        }
      >
        <Header title="Program" />

        {/* přepínání dnů */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 20 }}>
          {['dayOne','dayTwo'].map(key => (
            <TouchableOpacity
              key={key}
              onPress={() => setDay(key)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                backgroundColor: day === key ? '#D14D75' : '#1A3B5A'
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600', textAlign: 'center' }}>
                {dayjs(config[key].start).format('dd D. M. YYYY')}
              </Text>
              <Text style={{ color: 'white', fontSize: 12, marginTop: 2, textAlign: 'center' }}>
                {dayjs(config[key].start).format('HH:mm')} – {dayjs(config[key].end).format('HH:mm')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* timeline */}
        <ScrollView horizontal>
          <View style={{ flexDirection: 'row', paddingHorizontal: 10 }}>

            {/* sloupec hodin */}
            <View style={{ width: 60, paddingTop: 45 }}>
              {timeline.map((t, i) => (
                <View key={i} style={{ height: PIXELS_PER_HOUR, justifyContent: 'flex-start' }}>
                  <Text style={{ fontSize: 12, color: 'white' }}>{t}</Text>
                </View>
              ))}
            </View>

            {/* pro každou stage z API */}
            {stagesConfig.map((s, idx) => (
              <View key={idx} style={{ width: 140, marginRight: 10 }}>
                {/* hlavička stage */}
                <View style={{
                  backgroundColor: s.stageColors,
                  paddingVertical: 10,
                  alignItems: 'center'
                }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                    {s.stage_name}
                  </Text>
                  <Text style={{ fontSize: 10, color: 'white' }}>STAGE</Text>
                </View>

                {/* časová osa + eventy */}
                <View style={{ position: 'relative', backgroundColor: '#002239' }}>
                  {timeline.map((_, bi) => (
                    <View
                      key={bi}
                      style={{
                        height: PIXELS_PER_HOUR,
                        backgroundColor: '#0A3652',
                        borderBottomWidth: 1,
                        borderBottomColor: '#002239'
                      }}
                    />
                  ))}

                  {dayEvents
                    .filter(ev => ev.stage === s.stage)
                    .map((ev, i) => {
                      const start = dayjs(ev.start);
                      const end = dayjs(ev.end);
                      const top = (start.diff(currentDayStart, 'minute') / 60) * PIXELS_PER_HOUR;
                      const height = (end.diff(start, 'minute') / 60) * PIXELS_PER_HOUR;

                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => handleEventPress(ev.interpret_id)}
                          style={{
                            position: 'absolute',
                            top,
                            left: 0, right: 0,
                            height,
                            backgroundColor: s.stageColorsArtist,
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>
                            {ev.name}
                          </Text>
                          <Text style={{ color: 'white', fontSize: 9, marginTop: 2 }}>
                            {start.format('HH:mm')} – {end.format('HH:mm')}
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
    </>
  );
}
