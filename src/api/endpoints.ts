/**
 * API endpoint definitions
 * Centralized endpoint management for type safety and easier refactoring
 */

import { apiClient } from './client';
import type { Event, Partner, News, FAQCategory } from '../types';

/**
 * API Response types for artists endpoint
 */
export interface ArtistsApiResponse {
  records: {
    id: number;
    fields: {
      nav_id: number;
      category_id: number;
      category_name: string;
      category_tag: string;
      photo?: {
        url: string;
      };
      name: string;
      description: string;
    };
    show_on_website: number;
  }[];
  categories: {
    name: string;
    tag: string;
  }[];
}

/**
 * API Response type for timeline (events) endpoint
 */
export interface TimelineApiResponse {
  config: {
    dayOne: {
      start: string;
      end: string;
    };
    dayTwo: {
      start: string;
      end: string;
    };
  };
  stages: {
    stage: string;
    stage_name: string;
    class: string;
    stageColors: string;
    stageColorsArtist: string;
    sort: number;
  }[];
  events: {
    id?: string;
    name?: string;
    time?: string;
    artist?: string;
    stage?: string;
    stage_name?: string;
    description?: string;
    image?: string;
    date?: string;
    start?: string;
    end?: string;
    interpret_id?: number;
    [key: string]: unknown;
  }[];
}

/**
 * Partners API Response type
 */
export interface PartnerApiResponse {
  id: number;
  name: string;
  logo_url?: string;
  link?: string;
  category: string;
}

/**
 * Events API (timeline)
 */
export const eventsApi = {
  getAll: () => apiClient.get<TimelineApiResponse>('/timeline.php'),
  getById: (id: string) => apiClient.get<Event>(`/timeline.php?id=${id}`),
};

/**
 * Artists API
 */
export const artistsApi = {
  getAll: () => apiClient.get<ArtistsApiResponse>('/artists.php'),
  getById: (id: string) => apiClient.get<ArtistsApiResponse>(`/artists.php?id=${id}`),
};

/**
 * Transform partners API response to our format
 */
function transformPartners(response: PartnerApiResponse[]): Partner[] {
  return response.map((partner) => ({
    id: partner.id.toString(),
    name: partner.name,
    logo_url: partner.logo_url,
    link: partner.link,
    category: partner.category,
  }));
}

/**
 * Partners API
 */
export const partnersApi = {
  getAll: () =>
    apiClient.get<PartnerApiResponse[]>('/partners.php').then((response) => ({
      ...response,
      data: transformPartners(response.data),
    })),
  getByCategory: (category: string) =>
    apiClient
      .get<PartnerApiResponse[]>(`/partners.php?category=${encodeURIComponent(category)}`)
      .then((response) => ({
        ...response,
        data: transformPartners(response.data),
      })),
};

/**
 * News API
 */
export const newsApi = {
  getAll: () => apiClient.get<News[]>('/news.php'),
  getById: (id: string) => 
    apiClient.get<News[]>('/news.php').then((response) => {
      const news = response.data.find((item) => item.id === id);
      if (!news) {
        throw new Error('News not found');
      }
      return { ...response, data: news };
    }),
};

/**
 * FAQ API
 */
export const faqApi = {
  getAll: () => apiClient.get<FAQCategory[]>('/faq.php'),
};
