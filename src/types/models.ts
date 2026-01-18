/**
 * Shared type definitions for the application
 */

export interface Event {
  id: string;
  name: string;
  time: string;
  artist: string;
  stage?: string;
  description?: string;
  image?: string;
  date?: string;
}

export interface TimelineConfig {
  dayOne: {
    start: string;
    end: string;
  };
  dayTwo: {
    start: string;
    end: string;
  };
}

export interface Stage {
  stage: string;
  stage_name: string;
  class: string;
  stageColors: string;
  stageColorsArtist: string;
  sort: number;
}

export interface TimelineData {
  config: TimelineConfig;
  stages: Stage[];
  events: Event[];
}

export interface Artist {
  id: string;
  name: string;
  genre: string;
  image: string | null;
  bio?: string;
  website?: string;
  category_tag?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    spotify?: string;
  };
}

export interface ArtistCategory {
  label: string;
  value: string;
}

export interface Partner {
  id: string;
  name: string;
  logo_url?: string;
  link?: string;
  category: string;
}

export interface NotificationData {
  eventId?: string;
  artistId?: string;
  type?: 'event' | 'artist' | 'general';
  [key: string]: unknown;
}

export interface AppConfig {
  latestAppVersion: string;
  minRequiredVersion: string;
  forceUpdateEnabled: boolean;
  chatIconAllowed: boolean;
  updateMessage: string;
}

export interface News {
  id: string;
  title: string;
  date: string;
  image_url?: string;
  text?: string;
}

export interface FAQItem {
  id: string;
  otazka: string;
  odpoved: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  icon?: string;
  faqs: FAQItem[];
}

