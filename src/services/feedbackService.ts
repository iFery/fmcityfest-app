import Constants from 'expo-constants';

export interface SubmitFeedbackPayload {
  feedbackType: string;
  comment: string;
  email?: string;
  photos?: {
    uri: string;
    mimeType?: string;
    fileName?: string;
  }[];
  appVersion?: string;
  buildNumber?: string;
  platform?: string;
  deviceModel?: string;
  systemVersion?: string;
}

interface FeedbackResponse {
  id: string;
  message: string;
}

const DEFAULT_FEEDBACK_ENDPOINT = 'https://www.fmcityfest.cz/api/mobile-app/feedback-form.php';
const DEFAULT_FEEDBACK_API_KEY = 'dev-feedback-key';

function getFeedbackEndpoint(): string {
  const configured = (Constants.expoConfig?.extra?.feedbackApiUrl as string | undefined) || DEFAULT_FEEDBACK_ENDPOINT;
  // If config already points to a PHP file (or any explicit file path), use as-is
  if (configured.includes('.php')) {
    return configured;
  }

  const trimmed = configured.endsWith('/') ? configured.slice(0, -1) : configured;
  return `${trimmed}/feedback`;
}

function getFeedbackApiKey(): string {
  return (Constants.expoConfig?.extra?.feedbackApiKey as string | undefined) || DEFAULT_FEEDBACK_API_KEY;
}

export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<FeedbackResponse> {
  const url = getFeedbackEndpoint();
  const formData = new FormData();
  formData.append('feedbackType', payload.feedbackType);
  formData.append('comment', payload.comment);
  if (payload.email) {
    formData.append('email', payload.email);
  }
  if (payload.photos?.length) {
    payload.photos.forEach((photo, index) => {
      const file: any = {
        uri: photo.uri,
        name: photo.fileName || `feedback-photo-${index + 1}.jpg`,
        type: photo.mimeType || 'image/jpeg',
      };
      formData.append('photos[]', file);
    });
  }

  if (payload.appVersion) {
    formData.append('appVersion', payload.appVersion);
  }
  if (payload.buildNumber) {
    formData.append('buildNumber', payload.buildNumber);
  }
  if (payload.platform) {
    formData.append('platform', payload.platform);
  }
  if (payload.deviceModel) {
    formData.append('deviceModel', payload.deviceModel);
  }
  if (payload.systemVersion) {
    formData.append('systemVersion', payload.systemVersion);
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'FMFeedbackClient/1.0 (FM CITY FEST); PostmanRuntime/7.37.0',
      'X-FMC-Feedback-Key': getFeedbackApiKey(),
    },
  });

  if (!response.ok) {
    const rawBody = await response.text().catch(() => '');
    let message = 'Odeslání zpětné vazby selhalo.';

    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody);
        const parsedMessage =
          (typeof parsed.message === 'string' && parsed.message.trim()) ||
          (typeof parsed.error === 'string' && parsed.error.trim());
        if (parsedMessage) {
          message = parsedMessage;
        }
      } catch {
        const trimmed = rawBody.replace(/<[^>]+>/g, '').trim();
        if (trimmed) {
          message = trimmed;
        }
      }
    }

    throw new Error(message);
  }

  return response.json();
}
