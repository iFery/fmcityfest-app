import * as Linking from 'expo-linking';

export type RootStackParamList = {
  HomeMain: undefined;
  ProgramMain: undefined;
  ProgramHorizontal: undefined;
  ArtistsMain: undefined;
  FavoritesMain: undefined;
  InfoMain: undefined;
  ArtistDetail: { artistId: string; artistName: string };
  NewsDetail: { newsId: string; newsTitle: string };
  Settings: undefined;
  Partners: undefined;
  News: undefined;
  FAQ: undefined;
  Map: undefined;
  Debug: undefined;
  Notifications: undefined;
};

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'fmcityfest://'],
  config: {
    screens: {
      Home: {
        screens: {
          HomeMain: 'home',
          ArtistDetail: {
            path: 'artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          Partners: 'partners',
          News: 'news',
          FAQ: 'faq',
          Map: 'map',
        },
      },
      Program: {
        screens: {
          ProgramMain: 'program',
          ArtistDetail: {
            path: 'artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          Partners: 'partners',
          News: 'news',
          FAQ: 'faq',
          Map: 'map',
        },
      },
      Artists: {
        screens: {
          ArtistsMain: 'artists',
          ArtistDetail: {
            path: 'artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          Partners: 'partners',
          News: 'news',
          FAQ: 'faq',
          Map: 'map',
        },
      },
      Favorites: {
        screens: {
          FavoritesMain: 'favorites',
          ArtistDetail: {
            path: 'artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          Partners: 'partners',
          News: 'news',
          FAQ: 'faq',
          Map: 'map',
        },
      },
      Info: {
        screens: {
          InfoMain: 'info',
          ArtistDetail: {
            path: 'artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          Partners: 'partners',
          News: 'news',
          FAQ: 'faq',
          Map: 'map',
          Notifications: 'notifications',
        },
      },
    },
  },
};

export function parseNotificationToNavParams(
  data: Record<string, unknown>
): { screen: keyof RootStackParamList; params?: RootStackParamList[keyof RootStackParamList] } | null {
  // If notification has eventId, navigate to ArtistDetail (events are always linked to artists)
  if (data.eventId && typeof data.eventId === 'string') {
    // Try to use artistId if available, otherwise use eventId as fallback
    if (data.artistId && typeof data.artistId === 'string') {
      return {
        screen: 'ArtistDetail',
        params: {
          artistId: data.artistId,
          artistName: (data.artistName as string) || 'Artist',
        },
      };
    }
    // If no artistId, try to navigate using eventId (should not happen in practice)
    // For now, just go to home - events should always have artistId
    return {
      screen: 'HomeMain',
    };
  }

  if (data.artistId && typeof data.artistId === 'string') {
    return {
      screen: 'ArtistDetail',
      params: {
        artistId: data.artistId,
        artistName: (data.artistName as string) || 'Artist',
      },
    };
  }

  return {
    screen: 'HomeMain',
  };
}
