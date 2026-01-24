import analytics from '@react-native-firebase/analytics';
import { isFirebaseReady } from './firebase';

type AnalyticsParamValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsParamValue>;

const sanitizeParams = (params?: AnalyticsParams): Record<string, string | number | boolean> => {
  if (!params) return {};

  return Object.entries(params).reduce<Record<string, string | number | boolean>>(
    (acc, [key, value]) => {
      if (value === undefined || value === null) return acc;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        acc[key] = value;
      } else {
        acc[key] = String(value);
      }
      return acc;
    },
    {}
  );
};

export const logEvent = async (name: string, params?: AnalyticsParams) => {
  if (!isFirebaseReady()) return;
  try {
    await analytics().logEvent(name, sanitizeParams(params));
  } catch (error) {
    console.warn('[analytics] logEvent failed:', name, error);
  }
};

export const logScreenView = async (screenName: string, screenClass?: string) => {
  if (!isFirebaseReady()) return;
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  } catch (error) {
    console.warn('[analytics] logScreenView failed:', screenName, error);
  }
};

