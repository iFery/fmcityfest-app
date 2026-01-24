import * as Linking from 'expo-linking';

export type RootStackParamList = {
  HomeMain: undefined;
  ProgramMain: undefined;
  ProgramHorizontal: undefined;
  ArtistsMain: undefined;
  FavoritesMain: undefined;
  InfoMain: undefined;
  AboutApp: undefined;
  Feedback: undefined;
  ArtistDetail: { artistId: string; artistName: string };
  NewsDetail: { newsId: string; newsTitle: string };
  Settings: undefined;
  Partners: undefined;
  News: undefined;
  FAQ: undefined;
  Map: undefined;
  Debug: undefined;
  Notifications: undefined;
  SharedProgram: { code: string };
};

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'fmcityfest://', 'https://www.fmcityfest.cz', 'https://fmcityfest.cz'],
  config: {
    screens: {
      Home: {
        screens: {
          HomeMain: 'home',
          ArtistDetail: {
            path: 'home/artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'home/news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'home/settings',
          Partners: 'home/partners',
          News: 'home/news',
          FAQ: 'home/faq',
          Map: 'home/map',
        },
      },
      Program: {
        screens: {
          ProgramMain: 'program',
          ProgramHorizontal: 'program/horizontal',
          ArtistDetail: {
            path: 'program/artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'program/news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'program/settings',
          Partners: 'program/partners',
          News: 'program/news',
          FAQ: 'program/faq',
          Map: 'program/map',
        },
      },
      Artists: {
        screens: {
          ArtistsMain: 'artists',
          ArtistDetail: {
            path: 'artists/profile/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'artists/news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'artists/settings',
          Partners: 'artists/partners',
          News: 'artists/news',
          FAQ: 'artists/faq',
          Map: 'artists/map',
        },
      },
      Favorites: {
        screens: {
          FavoritesMain: 'favorites',
          SharedProgram: {
            path: 'p/:code',
            parse: {
              code: (code: string) => code.toUpperCase(),
            },
          },
          ArtistDetail: {
            path: 'favorites/artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'favorites/news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'favorites/settings',
          Partners: 'favorites/partners',
          News: 'favorites/news',
          FAQ: 'favorites/faq',
          Map: 'favorites/map',
        },
      },
      Info: {
        screens: {
          InfoMain: 'info',
          ArtistDetail: {
            path: 'info/artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
            },
          },
          NewsDetail: {
            path: 'info/news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'info/settings',
          Partners: 'info/partners',
          News: 'info/news',
          FAQ: 'info/faq',
          Map: 'info/map',
          Notifications: 'info/notifications',
          Feedback: 'info/feedback',
          AboutApp: 'info/about-app',
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
